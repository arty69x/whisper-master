import { BaseAgent } from "@agents/BaseAgent";
import type { CandidateFile } from "@core/Schema";
import { TSProgramValidator } from "@services/TSProgramValidator";

export class CompileValidationAgent extends BaseAgent<{ workspaceRoot: string; files: CandidateFile[] }, number> {
  private readonly validator = new TSProgramValidator();

  public async runInput(input: { workspaceRoot: string; files: CandidateFile[] }): Promise<number> {
    const diagnostics = await this.validator.validateInMemory(input.workspaceRoot, input.files);
    return diagnostics.length === 0 ? 1 : 0;
  }

  public run(input: { workspaceRoot: string; files: CandidateFile[] }): Promise<number> {
    return this.runInput(input);
  }
}
