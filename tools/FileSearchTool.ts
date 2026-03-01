import { promises as fs } from "node:fs";
import path from "node:path";
import type { Proposal } from "@core/Schema";
import type { Tool } from "@tools/ToolRegistry";

export class FileSearchTool implements Tool {
  public readonly name = "FileSearchTool";

  public async run(workspaceRoot: string): Promise<Proposal> {
    const entries = (await fs.readdir(workspaceRoot, { withFileTypes: true }))
      .map((entry) => entry.name)
      .sort((a, b) => a.localeCompare(b));
    return {
      proposalId: "tool-file-search",
      runId: "tool",
      candidate: {
        id: "tool",
        files: [{ path: "TOOL_REPORT.md", content: entries.join("\n") }],
        reviewScore: 1,
        compileScore: 1,
        securityScore: 1,
        stabilityScore: 1,
        finalScore: 1
      },
      simulation: {
        ok: true,
        workspaceHashBefore: path.basename(workspaceRoot),
        workspaceHashAfter: path.basename(workspaceRoot),
        riskScore: 0,
        regression: false,
        diagnostics: []
      },
      status: "queued"
    };
  }
}
