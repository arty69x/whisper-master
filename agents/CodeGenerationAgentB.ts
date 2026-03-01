import { BaseAgent } from "./BaseAgent";
import type { Candidate } from "./CodeGenerationAgentA";

export class CodeGenerationAgentB extends BaseAgent<{ plan: string }, Candidate> {
  name = "CodeGenerationAgentB";
  async run(input: { plan: string }): Promise<Candidate> {
    const output = await this.ollama.generate("llama3", `B:${input.plan}`);
    return { id: "B", code: `export const candidateB = ${JSON.stringify(output)};`, validation: 0.8, reviewer: 0.8, security: 0.85, performance: 0.7 };
  }
}
