import type { CandidateFile } from "@core/Schema";

export interface DiffMetric {
  path: string;
  addedLines: number;
  removedLines: number;
  risk: number;
}

export class DiffEngine {
  public computeRisk(files: CandidateFile[]): DiffMetric[] {
    return files
      .slice()
      .sort((a, b) => a.path.localeCompare(b.path))
      .map((file) => {
        const lines = file.content.split("\n");
        const addedLines = lines.filter((line) => line.trim().length > 0).length;
        const removedLines = 0;
        const risk = Math.min(1, addedLines / 200);
        return { path: file.path, addedLines, removedLines, risk };
      });
  }
}
