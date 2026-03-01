import { BaseAgent } from "./BaseAgent";
import type { PatchFile } from "../core/WhisperXSandbox";

export class PatchGenerationAgent extends BaseAgent<{ issue: string }, { files: PatchFile[] }> {
  name = "PatchGenerationAgent";
  async run(input: { issue: string }): Promise<{ files: PatchFile[] }> {
    const content = `export const healed = ${JSON.stringify(input.issue)};`;
    return { files: [{ filePath: "healed.ts", content }] };
  }
}
