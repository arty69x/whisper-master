import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

export class HashEngine {
  public round(value: number): number {
    return Math.round(value * 1e6) / 1e6;
  }

  public stableStringify(input: unknown): string {
    return this.stringifyInternal(input);
  }

  public sha256(input: string): string {
    const normalized = input.replace(/\r\n/g, "\n");
    return createHash("sha256").update(Buffer.from(normalized, "utf8")).digest("hex");
  }

  public async hashWorkspace(rootDir: string): Promise<string> {
    const files = await this.collectFiles(rootDir);
    const sorted = files.sort((a, b) => a.localeCompare(b));
    const payload: string[] = [];
    for (const file of sorted) {
      const content = await fs.readFile(path.join(rootDir, file), "utf8");
      payload.push(`${file}\n${content.replace(/\r\n/g, "\n")}`);
    }
    return this.sha256(payload.join("\n---\n"));
  }

  private stringifyInternal(input: unknown): string {
    if (input === null || typeof input !== "object") {
      return JSON.stringify(input);
    }
    if (Array.isArray(input)) {
      return `[${input.map((item) => this.stringifyInternal(item)).join(",")}]`;
    }
    const entries = Object.entries(input as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b));
    return `{${entries.map(([key, value]) => `${JSON.stringify(key)}:${this.stringifyInternal(value)}`).join(",")}}`;
  }

  private async collectFiles(rootDir: string): Promise<string[]> {
    const output: string[] = [];
    const walk = async (relDir: string): Promise<void> => {
      const absDir = path.join(rootDir, relDir);
      const items = await fs.readdir(absDir, { withFileTypes: true });
      for (const item of items) {
        if (item.name === "node_modules" || item.name === ".next") {
          continue;
        }
        const relPath = path.join(relDir, item.name);
        if (item.isDirectory()) {
          await walk(relPath);
        } else if (item.isFile()) {
          output.push(relPath);
        }
      }
    };
    await walk("");
    return output;
  }
}
