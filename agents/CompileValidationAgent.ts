import { BaseAgent } from "./BaseAgent";

export class CompileValidationAgent extends BaseAgent<{ code: string }, { success: boolean; errors: number }> {
  name = "CompileValidationAgent";
  async run(input: { code: string }): Promise<{ success: boolean; errors: number }> {
    const errors = input.code.includes("syntax_error") ? 1 : 0;
    return { success: errors === 0, errors };
  }
}
