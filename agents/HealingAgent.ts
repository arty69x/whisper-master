import { BaseAgent } from "@agents/BaseAgent";
import type { Candidate } from "@core/Schema";

export class HealingAgent extends BaseAgent<Candidate, Candidate> {
  public run(candidate: Candidate): Candidate {
    return {
      ...candidate,
      files: candidate.files.map((file) => ({ ...file, content: file.content.replace(/\bany\b/g, "unknown") }))
    };
  }
}
