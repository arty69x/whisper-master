import { BaseAgent } from "./BaseAgent";

export class DebugAnalysisAgent extends BaseAgent<{ code: string }, { issue: string }> {
  name = "DebugAnalysisAgent";
  async run(input: { code: string }): Promise<{ issue: string }> {
    return { issue: input.code.includes("fallback") ? "low confidence" : "compile issue" };
  }
}
