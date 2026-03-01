import path from "node:path";
import { StateMachine } from "@core/StateMachine";
import { SnapshotManager } from "@core/SnapshotManager";
import { ProposalQueue } from "@core/ProposalQueue";
import { SimulationEngine } from "@core/SimulationEngine";
import { HashEngine } from "@core/HashEngine";
import { AnomalyEngine } from "@core/AnomalyEngine";
import { PlanningAgent } from "@agents/PlanningAgent";
import { CodeGenAgentA } from "@agents/CodeGenAgentA";
import { CodeGenAgentB } from "@agents/CodeGenAgentB";
import { ReviewAgent } from "@agents/ReviewAgent";
import { CompileValidationAgent } from "@agents/CompileValidationAgent";
import { SecurityAuditAgent } from "@agents/SecurityAuditAgent";
import { HealingAgent } from "@agents/HealingAgent";
import type { Candidate, Proposal, RunContext, StateSnapshot } from "@core/Schema";

export class Orchestrator {
  private readonly stateMachine = new StateMachine();
  private readonly snapshotManager = new SnapshotManager();
  private readonly proposalQueue = new ProposalQueue();
  private readonly simulation = new SimulationEngine();
  private readonly hashEngine = new HashEngine();
  private readonly anomalyEngine = new AnomalyEngine();

  public async run(project: string): Promise<StateSnapshot> {
    const context: RunContext = { runId: this.hashEngine.sha256(project).slice(0, 12), activeProject: project, healingRounds: 0, safeMode: false };
    const workspaceRoot = path.join(process.cwd(), "workspace", project);
    const snapshotRoot = path.join(process.cwd(), "storage", ".runs", `${context.runId}-snapshot`);

    this.stateMachine.transition("DEV_READY");
    await this.snapshotManager.snapshot(workspaceRoot, snapshotRoot);

    this.stateMachine.transition("AGENT_PLANNING");
    const plan = new PlanningAgent().run("deterministic plan");

    this.stateMachine.transition("AGENT_GENERATING");
    const candidateA = new CodeGenAgentA().run(plan);
    const candidateB = new CodeGenAgentB().run(plan);

    this.stateMachine.transition("AGENT_VALIDATING");
    const scored = await this.scoreCandidates([candidateA, candidateB], workspaceRoot);
    const winner = scored.sort((a, b) => b.finalScore - a.finalScore || a.id.localeCompare(b.id))[0];
    if (!winner) {
      throw new Error("No candidate generated");
    }

    this.stateMachine.transition("AGENT_SIMULATING");
    let simulation = await this.simulation.run(workspaceRoot, winner.files);
    if (!simulation.ok) {
      context.healingRounds += 1;
      this.stateMachine.validateHealing(context);
      const healed = new HealingAgent().run(winner);
      simulation = await this.simulation.run(workspaceRoot, healed.files);
      if (!simulation.ok) {
        context.safeMode = this.anomalyEngine.detect(true, false, false);
        this.stateMachine.transition(context.safeMode ? "SAFE_MODE" : "FAILED");
        return { state: this.stateMachine.getState(), context, proposals: this.proposalQueue.list() };
      }
    }

    this.stateMachine.transition("AGENT_PREVIEW");
    const proposal: Proposal = {
      proposalId: `${context.runId}-proposal`,
      runId: context.runId,
      candidate: winner,
      simulation,
      status: "queued"
    };
    this.proposalQueue.enqueue(proposal);
    return { state: this.stateMachine.getState(), context, proposals: this.proposalQueue.list() };
  }

  public confirm(proposalId: string): Proposal {
    this.stateMachine.transition("AGENT_APPLYING");
    const proposal = this.proposalQueue.confirm(proposalId);
    this.stateMachine.transition("FINALIZED");
    this.stateMachine.transition("IDLE");
    return proposal;
  }

  public getProposals(): Proposal[] {
    return this.proposalQueue.list();
  }

  private async scoreCandidates(candidates: Candidate[], workspaceRoot: string): Promise<Candidate[]> {
    const review = new ReviewAgent();
    const compile = new CompileValidationAgent();
    const security = new SecurityAuditAgent();
    return Promise.all(
      candidates.map(async (candidate) => {
        const reviewScore = review.run(candidate.files);
        const compileScore = await compile.run({ workspaceRoot, files: candidate.files });
        const securityScore = security.run(candidate.files);
        const stabilityScore = this.hashEngine.round(1 - Math.min(1, candidate.files.length / 20));
        const finalScore = this.hashEngine.round(0.4 * compileScore + 0.3 * reviewScore + 0.2 * securityScore + 0.1 * stabilityScore);
        return { ...candidate, reviewScore, compileScore, securityScore, stabilityScore, finalScore };
      })
    );
  }
}
