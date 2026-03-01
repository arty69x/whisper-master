export type WhisperXStateName =
  | "IDLE"
  | "PLANNING"
  | "GENERATING"
  | "REVIEWING"
  | "VALIDATING"
  | "HEALING"
  | "FINALIZED"
  | "FAILED";

const allowed: Record<WhisperXStateName, WhisperXStateName[]> = {
  IDLE: ["PLANNING"],
  PLANNING: ["GENERATING"],
  GENERATING: ["REVIEWING"],
  REVIEWING: ["VALIDATING"],
  VALIDATING: ["FINALIZED", "HEALING"],
  HEALING: ["VALIDATING", "FAILED"],
  FINALIZED: [],
  FAILED: []
};

export class WhisperXState {
  public state: WhisperXStateName = "IDLE";
  public healingRounds = 0;
  public retryCount = 0;

  transition(next: WhisperXStateName): void {
    if (!allowed[this.state].includes(next)) {
      throw new Error(`ILLEGAL_TRANSITION:${this.state}->${next}`);
    }
    if (next === "HEALING") this.healingRounds += 1;
    if (next === "FAILED") this.retryCount += 1;
    this.state = next;
  }
}
