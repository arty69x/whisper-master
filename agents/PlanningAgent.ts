import { BaseAgent } from "./BaseAgent";

export type PlanningInput = { prompt: string; previousFailures: string[] };
export type PlanningOutput = { plan: string; tasks: string[] };

export class PlanningAgent extends BaseAgent<PlanningInput, PlanningOutput> {
  name = "PlanningAgent";
  async run(input: PlanningInput): Promise<PlanningOutput> {
    const base = await this.ollama.generate("llama3", `${input.prompt} | failures:${input.previousFailures.join(",")}`);
    return { plan: base, tasks: ["analyze", "generate", "validate"] };
  }
}
