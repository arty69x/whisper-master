import { BaseAgent } from "@agents/BaseAgent";
import type { Candidate } from "@core/Schema";
import type { PlanningOutput } from "@agents/PlanningAgent";

export class CodeGenAgentB extends BaseAgent<PlanningOutput, Candidate> {
  public run(_input: PlanningOutput): Candidate {
    return {
      id: "candidate-b",
      files: [{ path: "README.md", content: "# Project B\n" }],
      reviewScore: 0,
      compileScore: 0,
      securityScore: 0,
      stabilityScore: 0,
      finalScore: 0
    };
  }
}
