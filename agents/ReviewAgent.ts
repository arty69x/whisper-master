import { BaseAgent } from "@agents/BaseAgent";
import type { CandidateFile } from "@core/Schema";

export class ReviewAgent extends BaseAgent<CandidateFile[], number> {
  public run(files: CandidateFile[]): number {
    const normalized = files.slice().sort((a, b) => a.path.localeCompare(b.path));
    const score = normalized.reduce((acc, item) => acc + Math.min(1, item.content.length / 1000), 0);
    return Math.round((score / Math.max(1, normalized.length)) * 1000000) / 1000000;
  }
}
