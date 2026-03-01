import { ToolRegistry } from "@tools/ToolRegistry";
import { FileSearchTool } from "@tools/FileSearchTool";
import { DependencyGraphTool } from "@tools/DependencyGraphTool";
import { RefactorTool } from "@tools/RefactorTool";
import { DeadCodeDetectionTool } from "@tools/DeadCodeDetectionTool";
import { CircularDependencyTool } from "@tools/CircularDependencyTool";
import { TailwindLintTool } from "@tools/TailwindLintTool";
import { FormatTool } from "@tools/FormatTool";
import type { Proposal } from "@core/Schema";

export class ToolExecutor {
  private readonly registry = new ToolRegistry();

  public constructor() {
    [
      new FileSearchTool(),
      new DependencyGraphTool(),
      new RefactorTool(),
      new DeadCodeDetectionTool(),
      new CircularDependencyTool(),
      new TailwindLintTool(),
      new FormatTool()
    ].forEach((tool) => this.registry.register(tool));
  }

  public async run(toolName: string, workspaceRoot: string): Promise<Proposal> {
    return this.registry.get(toolName).run(workspaceRoot);
  }
}
