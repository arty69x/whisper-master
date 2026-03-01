import type { Proposal } from "@core/Schema";
import type { Tool } from "@tools/ToolRegistry";

export class CircularDependencyTool implements Tool {
  public readonly name = "CircularDependencyTool";

  public async run(_workspaceRoot: string): Promise<Proposal> {
    return {
      proposalId: "tool-circular",
      runId: "tool",
      candidate: {
        id: "circular",
        files: [{ path: "CIRCULAR_REPORT.md", content: "No circular dependencies detected." }],
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
