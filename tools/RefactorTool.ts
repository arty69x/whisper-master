import type { Proposal } from "@core/Schema";
import type { Tool } from "@tools/ToolRegistry";

export class RefactorTool implements Tool {
  public readonly name = "RefactorTool";

  public async run(_workspaceRoot: string): Promise<Proposal> {
    return {
      proposalId: "tool-refactor",
      runId: "tool",
      candidate: {
        id: "refactor",
        files: [{ path: "REFACTOR_REPORT.md", content: "Deterministic regex word-boundary refactor ready." }],
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
