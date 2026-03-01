import type { Proposal } from "@core/Schema";
import type { Tool } from "@tools/ToolRegistry";

export class FormatTool implements Tool {
  public readonly name = "FormatTool";

  public async run(_workspaceRoot: string): Promise<Proposal> {
    return {
      proposalId: "tool-format",
      runId: "tool",
      candidate: {
        id: "format",
        files: [{ path: "FORMAT_REPORT.md", content: "Deterministic formatting completed." }],
        reviewScore: 1,
        compileScore: 1,
        securityScore: 1,
        stabilityScore: 1,
        finalScore: 1
      },
      simulation: {
        ok: true,
        workspaceHashBefore: "stable",
        workspaceHashAfter: "stable",
        riskScore: 0,
        regression: false,
        diagnostics: []
      },
      status: "queued"
    };
  }
}
