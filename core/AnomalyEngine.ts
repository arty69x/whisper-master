export class AnomalyEngine {
  public detect(repeatedRegression: boolean, snapshotFailure: boolean, hashMismatch: boolean): boolean {
    return repeatedRegression || snapshotFailure || hashMismatch;
  }
}
