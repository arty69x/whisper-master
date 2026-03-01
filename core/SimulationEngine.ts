import { promises as fs } from "node:fs";
import path from "node:path";
import type { CandidateFile, SimulationResult } from "@core/Schema";
import { HashEngine } from "@core/HashEngine";
import { SnapshotManager } from "@core/SnapshotManager";
import { TSProgramValidator } from "@services/TSProgramValidator";
import { DiffEngine } from "@core/DiffEngine";

export class SimulationEngine {
  private readonly hashEngine = new HashEngine();
  private readonly snapshotManager = new SnapshotManager();
  private readonly validator = new TSProgramValidator();
  private readonly diffEngine = new DiffEngine();

  public async run(workspaceRoot: string, files: CandidateFile[]): Promise<SimulationResult> {
    const tempRoot = `${workspaceRoot}.simulation`;
    await this.snapshotManager.snapshot(workspaceRoot, tempRoot);
    for (const file of files) {
      const target = path.join(tempRoot, file.path);
      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.writeFile(target, file.content, "utf8");
    }
    const beforeHash = await this.hashEngine.hashWorkspace(workspaceRoot);
    const afterHash = await this.hashEngine.hashWorkspace(tempRoot);
    const diagnostics = await this.validator.validate(tempRoot);
    const risks = this.diffEngine.computeRisk(files);
    const riskScore = this.hashEngine.round(risks.reduce((acc, item) => acc + item.risk, 0) / Math.max(1, risks.length));
    const regression = diagnostics.length > 0;
    const ok = !regression;
    await fs.rm(tempRoot, { recursive: true, force: true });
    return {
      ok,
      workspaceHashBefore: beforeHash,
      workspaceHashAfter: afterHash,
      riskScore,
      regression,
      diagnostics
    };
  }
}
