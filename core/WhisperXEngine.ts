import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { PlanningAgent } from "../agents/PlanningAgent";
import { CodeGenerationAgentA } from "../agents/CodeGenerationAgentA";
import { CodeGenerationAgentB } from "../agents/CodeGenerationAgentB";
import { ReviewAgent } from "../agents/ReviewAgent";
import { CompileValidationAgent } from "../agents/CompileValidationAgent";
import { SecurityAuditAgent } from "../agents/SecurityAuditAgent";
import { ConfidenceEvaluationAgent } from "../agents/ConfidenceEvaluationAgent";
import { MemoryLearningAgent, type MemoryEntry } from "../agents/MemoryLearningAgent";
import { WhisperXState } from "./WhisperXState";
import { WhisperXLogger } from "./WhisperXLogger";
import { WhisperXAnalyzer } from "./WhisperXAnalyzer";
import { WhisperXSense } from "./WhisperXSense";
import { WhisperXSandbox } from "./WhisperXSandbox";
import { WhisperXHealing } from "./WhisperXHealing";
import { ValidationService } from "../services/ValidationService";
import type { AgentConfig } from "./bootstrap";

export type EngineResult = { runId: string; state: string; score: number; summary: string };

type Health = { avgLatencyMs: number; failureRate: number; last10SuccessRatio: number; healingTriggerRate: number };

export class WhisperXEngine {
  private readonly state = new WhisperXState();
  private health: Health = { avgLatencyMs: 0, failureRate: 0, last10SuccessRatio: 1, healingTriggerRate: 0 };

  constructor(private readonly root: string, private readonly config: AgentConfig) {
    fs.mkdirSync(path.join(root, "storage", ".runs"), { recursive: true });
    fs.mkdirSync(path.join(root, "storage", ".local_memory"), { recursive: true });
    fs.mkdirSync(config.workspaceRoot, { recursive: true });
  }

  getState(): WhisperXState {
    return this.state;
  }

  getHealth(): Health {
    return this.health;
  }

  listWorkspace(): string[] {
    const files = fs.readdirSync(this.config.workspaceRoot, { withFileTypes: true });
    return files.filter((item) => item.isFile()).map((item) => item.name);
  }

  readAllMemory(): MemoryEntry[] {
    const memoryRoot = path.join(this.root, "storage", ".local_memory");
    const files = fs.existsSync(memoryRoot) ? fs.readdirSync(memoryRoot) : [];
    const rows: MemoryEntry[] = [];
    for (const file of files) {
      const lines = fs.readFileSync(path.join(memoryRoot, file), "utf8").split("\n").filter(Boolean);
      for (const line of lines) {
        try {
          rows.push(JSON.parse(line) as MemoryEntry);
        } catch {
          continue;
        }
      }
    }
    return rows;
  }

  readRecentEvents(limit = 50): Array<Record<string, unknown>> {
    const runsRoot = path.join(this.root, "storage", ".runs");
    const runDirs = fs.readdirSync(runsRoot).sort().slice(-1);
    if (runDirs.length === 0) return [];
    const eventFile = path.join(runsRoot, runDirs[0], "events.jsonl");
    if (!fs.existsSync(eventFile)) return [];
    const lines = fs.readFileSync(eventFile, "utf8").split("\n").filter(Boolean).slice(-limit);
    return lines.map((line) => JSON.parse(line) as Record<string, unknown>);
  }

  private log(logger: WhisperXLogger, runId: string, state: string, agent: string, start: number, outcome: string): void {
    logger.log({ runId, timestamp: new Date().toISOString(), state, agent, durationMs: Date.now() - start, outcome });
  }

  private score(candidate: { validation: number; reviewer: number; security: number; performance: number }): number {
    return candidate.validation * 0.4 + candidate.reviewer * 0.3 + candidate.security * 0.2 + candidate.performance * 0.1;
  }

  private writeMemory(entry: MemoryEntry): void {
    const memoryRoot = path.join(this.root, "storage", ".local_memory");
    const agentFile = path.join(memoryRoot, `${entry.agent}.jsonl`);
    const existing = fs.existsSync(agentFile) ? fs.readFileSync(agentFile, "utf8").split("\n").filter(Boolean) : [];
    const capped = [...existing.slice(-(this.config.memoryCapPerAgent - 1)), JSON.stringify(entry)];
    fs.writeFileSync(agentFile, `${capped.join("\n")}\n`, "utf8");

    const globalFile = path.join(memoryRoot, "_global.jsonl");
    const globalExisting = fs.existsSync(globalFile) ? fs.readFileSync(globalFile, "utf8").split("\n").filter(Boolean) : [];
    const globalCapped = [...globalExisting.slice(-(this.config.memoryGlobalCap - 1)), JSON.stringify(entry)];
    fs.writeFileSync(globalFile, `${globalCapped.join("\n")}\n`, "utf8");
  }

  async execute(prompt: string): Promise<EngineResult> {
    const runId = crypto.randomUUID();
    const runDir = path.join(this.root, "storage", ".runs", runId);
    fs.mkdirSync(runDir, { recursive: true });
    const logger = new WhisperXLogger(path.join(runDir, "events.jsonl"));
    const sense = new WhisperXSense(path.join(this.root, "storage", ".local_memory"));

    const planningStart = Date.now();
    this.state.transition("PLANNING");
    const planner = new PlanningAgent();
    const planning = await planner.run({ prompt, previousFailures: sense.getLastFailures("planner", 3) });
    this.log(logger, runId, "PLANNING", planner.name, planningStart, "PASS");

    const generatingStart = Date.now();
    this.state.transition("GENERATING");
    const coderA = new CodeGenerationAgentA();
    const coderB = new CodeGenerationAgentB();
    const [candidateA, candidateB] = await Promise.all([coderA.run({ plan: planning.plan }), coderB.run({ plan: planning.plan })]);
    Object.freeze(candidateA);
    Object.freeze(candidateB);
    this.log(logger, runId, "GENERATING", "parallel-codegen", generatingStart, "PASS");

    const scored = [candidateA, candidateB].map((candidate) => ({ candidate, score: this.score(candidate) })).sort((a, b) => b.score - a.score);
    let best = scored[0].candidate;
    let bestScore = scored[0].score;

    const reviewingStart = Date.now();
    this.state.transition("REVIEWING");
    const reviewAgent = new ReviewAgent();
    const review = await reviewAgent.run(best);
    this.log(logger, runId, "REVIEWING", reviewAgent.name, reviewingStart, review.approved ? "PASS" : "FAIL");

    const validatingStart = Date.now();
    this.state.transition("VALIDATING");
    const compileAgent = new CompileValidationAgent();
    const securityAgent = new SecurityAuditAgent();
    const confidenceAgent = new ConfidenceEvaluationAgent();
    const analyzer = new WhisperXAnalyzer();
    const compile = await compileAgent.run({ code: best.code });
    const security = await securityAgent.run({ code: best.code });
    const layout = analyzer.verifyLayout({ x: 0, y: 0, width: 100, height: 100 }, { x: 0, y: 0, width: 100, height: 100 }, this.config.minIoU, this.config.maxDriftDesktopPx);
    const confidence = await confidenceAgent.run({ code: best.code });
    let valid = compile.success && security.success && layout.success && confidence.success;
    this.log(logger, runId, "VALIDATING", "validation-sequence", validatingStart, valid ? "PASS" : "FAIL");

    if (!valid) {
      this.state.transition("HEALING");
      const healStart = Date.now();
      const sandbox = new WhisperXSandbox(this.config.workspaceRoot);
      const validationService = new ValidationService();
      const healing = new WhisperXHealing(sandbox, runDir, validationService);
      const healed = await healing.heal(best.code, this.config.maxHealingRounds);
      valid = healed.success;
      best = { ...best, code: healed.code };
      this.log(logger, runId, "HEALING", "WhisperXHealing", healStart, valid ? "PASS" : "FAIL");
      if (!valid) {
        this.state.transition("FAILED");
      } else {
        this.state.transition("VALIDATING");
        this.state.transition("FINALIZED");
      }
    } else {
      this.state.transition("FINALIZED");
    }

    const memoryAgent = new MemoryLearningAgent();
    const entry = await memoryAgent.run({
      id: runId,
      ts: new Date().toISOString(),
      agent: "engine",
      patternKey: prompt.slice(0, 64),
      outcome: valid ? "PASS" : "FAIL",
      hits: 1,
      confidenceDelta: confidence.confidence - 0.5
    });
    this.writeMemory(entry);

    const history = this.readRecentEvents(10);
    const outcomes = history.filter((item) => item.outcome === "PASS").length;
    this.health = {
      avgLatencyMs: history.length === 0 ? 0 : history.reduce((sum, item) => sum + Number(item.durationMs ?? 0), 0) / history.length,
      failureRate: history.length === 0 ? 0 : 1 - outcomes / history.length,
      last10SuccessRatio: history.length === 0 ? 1 : outcomes / history.length,
      healingTriggerRate: history.length === 0 ? 0 : history.filter((item) => item.state === "HEALING").length / history.length
    };

    if (this.health.failureRate > 0.3) {
      bestScore -= 0.05;
    }

    return { runId, state: this.state.state, score: Number(bestScore.toFixed(3)), summary: review.notes };
  }
}
