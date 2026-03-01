import { promises as fs } from "node:fs";
import path from "node:path";
import type { CandidateFile } from "@core/Schema";

export class TSProgramValidator {
  public async validate(workspaceRoot: string): Promise<string[]> {
    const tsconfigPath = path.join(workspaceRoot, "tsconfig.json");
    try {
      await fs.access(tsconfigPath);
      return [];
    } catch {
      return ["tsconfig.json missing"];
    }
  }

  public async validateInMemory(workspaceRoot: string, files: CandidateFile[]): Promise<string[]> {
    const hasForbiddenAny = files.some((file) => /\bany\b/.test(file.content));
    const base = await this.validate(workspaceRoot);
    if (hasForbiddenAny) {
      return [...base, "forbidden any detected"];
    }
    return base;
  }
}
