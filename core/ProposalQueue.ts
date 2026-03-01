import type { Proposal } from "@core/Schema";

export class ProposalQueue {
  private proposals: Proposal[] = [];

  public enqueue(proposal: Proposal): void {
    this.proposals = [...this.proposals, proposal].sort((a, b) => a.proposalId.localeCompare(b.proposalId));
  }

  public list(): Proposal[] {
    return [...this.proposals];
  }

  public confirm(proposalId: string): Proposal {
    const current = this.proposals.find((item) => item.proposalId === proposalId);
    if (!current) {
      throw new Error("Proposal not found");
    }
    const confirmed: Proposal = { ...current, status: "confirmed" };
    this.proposals = this.proposals.map((item) => (item.proposalId === proposalId ? confirmed : item));
    return confirmed;
  }
}
