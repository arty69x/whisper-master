import { BaseAgent } from "@agents/BaseAgent";

export interface PlanningOutput {
  steps: string[];
}

export class PlanningAgent extends BaseAgent<string, PlanningOutput> {
  public run(input: string): PlanningOutput {
    return {
      steps: [
        `snapshot:${input}`,
        "generate:candidateA",
        "generate:candidateB",
        "review:deterministic",
        "validate:compile-security",
        "simulate:workspace"
      ]
    };
  }
}
