import fs from "node:fs";
import path from "node:path";
import { SanitizationService } from "../services/SanitizationService";

export type PatchFile = { filePath: string; content: string };

export class WhisperXSandbox {
  private readonly sanitizer = new SanitizationService();

  constructor(private readonly workspaceRoot: string) {}

  applyPatch(files: PatchFile[]): void {
    for (const file of files) {
      this.sanitizer.ensureSafePatch(file.content);
      const resolved = path.resolve(this.workspaceRoot, file.filePath);
      const root = path.resolve(this.workspaceRoot);
      if (!resolved.startsWith(root)) {
        throw new Error("SANDBOX_WORKSPACE_ESCAPE");
      }
      fs.mkdirSync(path.dirname(resolved), { recursive: true });
      fs.writeFileSync(resolved, file.content, "utf8");
    }
  }
}
