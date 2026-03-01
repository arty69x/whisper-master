export class ReputationEngine {
  public score(accepted: number, rejected: number): number {
    const total = accepted + rejected;
    if (total === 0) {
      return 0;
    }
    return Math.round((accepted / total) * 1000000) / 1000000;
  }
}
