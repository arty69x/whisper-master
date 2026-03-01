import { BaseAgent } from "./BaseAgent";
import type { Candidate } from "./CodeGenerationAgentA";

export class ReviewAgent extends BaseAgent<Candidate, { approved: boolean; notes: string }> {
  name = "ReviewAgent";
  async run(input: Candidate): Promise<{ approved: boolean; notes: string }> {
    return { approved: input.code.length > 10, notes: `Reviewed ${input.id}` };
  }
}
