import fs from "node:fs";
import path from "node:path";

export class WhisperXSense {
  constructor(private readonly memoryDir: string) {}

  getLastFailures(agent: string, count: number): string[] {
    const file = path.join(this.memoryDir, `${agent}.jsonl`);
    if (!fs.existsSync(file)) return [];
    const lines = fs.readFileSync(file, "utf8").trim().split("\n").filter(Boolean);
    const failures = lines
      .map((line) => {
        try {
          return JSON.parse(line) as { outcome?: string; patternKey?: string };
        } catch {
          return null;
        }
      })
      .filter((item): item is { outcome?: string; patternKey?: string } => item !== null && item.outcome === "FAIL" && typeof item.patternKey === "string")
      .slice(-count)
      .map((item) => item.patternKey as string);
    return failures;
  }
}
