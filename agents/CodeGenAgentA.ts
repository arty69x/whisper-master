import { BaseAgent } from "@agents/BaseAgent";
import type { Candidate } from "@core/Schema";
import type { PlanningOutput } from "@agents/PlanningAgent";

export class CodeGenAgentA extends BaseAgent<PlanningOutput, Candidate> {
  public run(_input: PlanningOutput): Candidate {
    return {
      id: "candidate-a",
      files: [{ path: "README.md", content: "# Project A\n" }],
      reviewScore: 0,
      compileScore: 0,
      securityScore: 0,
      stabilityScore: 0,
      finalScore: 0
    };
  }
}
