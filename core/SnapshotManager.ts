import { promises as fs } from "node:fs";
import path from "node:path";
import { WorkspaceFS } from "@core/WorkspaceFS";

export class SnapshotManager {
  private readonly workspaceFs = new WorkspaceFS();

  public async snapshot(sourceRoot: string, snapshotRoot: string): Promise<void> {
    await fs.rm(snapshotRoot, { recursive: true, force: true });
    await fs.mkdir(snapshotRoot, { recursive: true });
    await this.copyRecursive(sourceRoot, snapshotRoot);
  }

  public async restore(snapshotRoot: string, targetRoot: string): Promise<void> {
    const tempTarget = `${targetRoot}.restore.tmp`;
    await fs.rm(tempTarget, { recursive: true, force: true });
    await fs.mkdir(tempTarget, { recursive: true });
    await this.copyRecursive(snapshotRoot, tempTarget);
    await fs.rm(targetRoot, { recursive: true, force: true });
    await fs.rename(tempTarget, targetRoot);
  }

  private async copyRecursive(source: string, target: string): Promise<void> {
    const entries = await fs.readdir(source, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === "node_modules" || entry.name === ".next") {
        continue;
      }
      this.workspaceFs.validateRelativePath(entry.name);
      const sourcePath = path.join(source, entry.name);
      const targetPath = path.join(target, entry.name);
      const stat = await fs.lstat(sourcePath);
      if (stat.isSymbolicLink()) {
        throw new Error("Symlink escape rejected");
      }
      if (entry.isDirectory()) {
        await fs.mkdir(targetPath, { recursive: true });
        await this.copyRecursive(sourcePath, targetPath);
      } else {
        await fs.copyFile(sourcePath, targetPath);
      }
    }
  }
}
