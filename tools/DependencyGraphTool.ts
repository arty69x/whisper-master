import type { Proposal } from "@core/Schema";
import type { Tool } from "@tools/ToolRegistry";

export class DependencyGraphTool implements Tool {
  public readonly name = "DependencyGraphTool";

  public async run(_workspaceRoot: string): Promise<Proposal> {
    return Promise.resolve({
      proposalId: "tool-deps",
      runId: "tool",
      candidate: {
        id: "deps",
        files: [{ path: "DEPENDENCY_GRAPH.json", content: "{}" }],
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
    });
  }
}
