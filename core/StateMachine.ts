import type { EngineState, RunContext } from "@core/Schema";

const transitions: Record<EngineState, EngineState[]> = {
  IDLE: ["DEV_READY"],
  DEV_READY: ["AGENT_PLANNING", "SAFE_MODE"],
  AGENT_PLANNING: ["AGENT_GENERATING", "FAILED", "SAFE_MODE"],
  AGENT_GENERATING: ["AGENT_VALIDATING", "FAILED", "SAFE_MODE"],
  AGENT_VALIDATING: ["AGENT_SIMULATING", "FAILED", "SAFE_MODE"],
  AGENT_SIMULATING: ["AGENT_PREVIEW", "AGENT_GENERATING", "FAILED", "SAFE_MODE"],
  AGENT_PREVIEW: ["AGENT_APPLYING", "FAILED", "SAFE_MODE"],
  AGENT_APPLYING: ["FINALIZED", "FAILED", "SAFE_MODE"],
  FINALIZED: ["IDLE"],
  FAILED: ["SAFE_MODE", "IDLE"],
  SAFE_MODE: ["IDLE", "DEV_READY"]
};

export class StateMachine {
  private state: EngineState = "IDLE";

  public transition(next: EngineState): EngineState {
    const allowed = transitions[this.state];
    if (!allowed.includes(next)) {
      throw new Error(`Illegal transition ${this.state} -> ${next}`);
    }
    this.state = next;
    return this.state;
  }

  public getState(): EngineState {
    return this.state;
  }

  public validateHealing(context: RunContext): void {
    if (context.healingRounds > 1) {
      throw new Error("Healing rounds exceeded");
    }
  }
}
