import { Orchestrator } from "@core/Orchestrator";
import type { Proposal, StateSnapshot } from "@core/Schema";

export class SxEngine {
  private readonly orchestrator = new Orchestrator();

  public async run(project: string): Promise<StateSnapshot> {
    return this.orchestrator.run(project);
  }

  public proposals(): Proposal[] {
    return this.orchestrator.getProposals();
  }
}
