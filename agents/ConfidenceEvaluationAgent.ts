import { BaseAgent } from "./BaseAgent";

export class ConfidenceEvaluationAgent extends BaseAgent<{ code: string }, { success: boolean; confidence: number }> {
  name = "ConfidenceEvaluationAgent";
  async run(input: { code: string }): Promise<{ success: boolean; confidence: number }> {
    const confidence = input.code.length > 20 ? 0.85 : 0.4;
    return { success: confidence >= 0.5, confidence };
  }
}
