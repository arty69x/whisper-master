import { promises as fs } from "node:fs";
import path from "node:path";

export class WorkspaceFS {
  public validateRelativePath(relativePath: string): void {
    if (relativePath.includes("..") || path.isAbsolute(relativePath)) {
      throw new Error("Path traversal rejected");
    }
  }

  public async readFile(root: string, relativePath: string): Promise<string> {
    this.validateRelativePath(relativePath);
    const fullPath = path.join(root, relativePath);
    const stat = await fs.lstat(fullPath);
    if (stat.isSymbolicLink()) {
      throw new Error("Symlink escape rejected");
    }
    return fs.readFile(fullPath, "utf8");
  }

  public async writeFile(root: string, relativePath: string, content: string): Promise<void> {
    this.validateRelativePath(relativePath);
    const fullPath = path.join(root, relativePath);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, content, "utf8");
  }
}
