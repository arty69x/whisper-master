import { BaseAgent } from "@agents/BaseAgent";
import type { CandidateFile } from "@core/Schema";

export class SecurityAuditAgent extends BaseAgent<CandidateFile[], number> {
  public run(files: CandidateFile[]): number {
    const forbidden = ["eval(", "Function(", "child_process", "spawn(", "exec(", "WebSocket"];
    const hasViolation = files.some((file) => forbidden.some((token) => file.content.includes(token)));
    return hasViolation ? 0 : 1;
  }
}
