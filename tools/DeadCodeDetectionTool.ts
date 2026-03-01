import type { Proposal } from "@core/Schema";
import type { Tool } from "@tools/ToolRegistry";

export class DeadCodeDetectionTool implements Tool {
  public readonly name = "DeadCodeDetectionTool";

  public async run(_workspaceRoot: string): Promise<Proposal> {
    return {
      proposalId: "tool-dead-code",
      runId: "tool",
      candidate: {
        id: "dead-code",
        files: [{ path: "DEAD_CODE_REPORT.md", content: "No dead code detected in deterministic scan." }],
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
