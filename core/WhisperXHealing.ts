import fs from "node:fs";
import path from "node:path";
import { DebugAnalysisAgent } from "../agents/DebugAnalysisAgent";
import { PatchGenerationAgent } from "../agents/PatchGenerationAgent";
import { ValidationService, type ValidationResult } from "../services/ValidationService";
import { WhisperXSandbox } from "./WhisperXSandbox";

const snapshotFile = (runDir: string, id: string): string => path.join(runDir, `${id}.snapshot`);

export class WhisperXHealing {
  constructor(
    private readonly sandbox: WhisperXSandbox,
    private readonly runDir: string,
    private readonly validationService: ValidationService
  ) {}

  private createSnapshot(id: string, content: string): void {
    fs.writeFileSync(snapshotFile(this.runDir, id), content, "utf8");
  }

  private restoreSnapshot(id: string): string {
    return fs.readFileSync(snapshotFile(this.runDir, id), "utf8");
  }

  async heal(code: string, rounds: number): Promise<{ success: boolean; code: string; validation: ValidationResult }> {
    const debugAgent = new DebugAnalysisAgent();
    const patchAgent = new PatchGenerationAgent();
    let current = code;
    let previous = this.validationService.validateContent(current);

    for (let round = 1; round <= rounds; round += 1) {
      const snapshotId = `round-${round}`;
      this.createSnapshot(snapshotId, current);
      const debug = await debugAgent.run({ code: current });
      const patch = await patchAgent.run({ issue: debug.issue });
      this.sandbox.applyPatch(patch.files);
      current = `${current}\n${patch.files.map((f) => f.content).join("\n")}`;
      const validation = this.validationService.validateContent(current);
      if (this.validationService.regressionDetected(previous.metrics, validation.metrics)) {
        current = this.restoreSnapshot(snapshotId);
        continue;
      }
      if (validation.success) {
        return { success: true, code: current, validation };
      }
      previous = validation;
    }

    return { success: false, code: current, validation: this.validationService.validateContent(current) };
  }
}
