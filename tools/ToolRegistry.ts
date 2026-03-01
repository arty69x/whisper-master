import type { Proposal } from "@core/Schema";

export interface Tool {
  name: string;
  run(workspaceRoot: string): Promise<Proposal>;
}

export class ToolRegistry {
  private readonly tools = new Map<string, Tool>();

  public register(tool: Tool): void {
    this.tools.set(tool.name, tool);
  }

  public get(name: string): Tool {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Unknown tool: ${name}`);
    }
    return tool;
  }
}
