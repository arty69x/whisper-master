import { BaseAgent } from "./BaseAgent";

export class SecurityAuditAgent extends BaseAgent<{ code: string }, { success: boolean; severity: number }> {
  name = "SecurityAuditAgent";
  async run(input: { code: string }): Promise<{ success: boolean; severity: number }> {
    const severity = input.code.includes("unsafe") ? 2 : 0;
    return { success: severity === 0, severity };
  }
}
