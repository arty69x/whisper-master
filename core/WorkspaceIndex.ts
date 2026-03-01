import { promises as fs } from "node:fs";

export class WorkspaceIndex {
  public async listProjects(workspaceRoot: string): Promise<string[]> {
    const entries = await fs.readdir(workspaceRoot, { withFileTypes: true });
    return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort((a, b) => a.localeCompare(b));
  }
}
