import { BaseAgent } from "./BaseAgent";

export type Candidate = { id: "A" | "B"; code: string; validation: number; reviewer: number; security: number; performance: number };

export class CodeGenerationAgentA extends BaseAgent<{ plan: string }, Candidate> {
  name = "CodeGenerationAgentA";
  async run(input: { plan: string }): Promise<Candidate> {
    const output = await this.ollama.generate("llama3", `A:${input.plan}`);
    return { id: "A", code: `export const candidateA = ${JSON.stringify(output)};`, validation: 0.7, reviewer: 0.7, security: 0.9, performance: 0.6 };
  }
}
