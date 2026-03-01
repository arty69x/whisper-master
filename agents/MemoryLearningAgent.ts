import { BaseAgent } from "./BaseAgent";

export type MemoryEntry = {
  id: string;
  ts: string;
  agent: string;
  patternKey: string;
  outcome: "PASS" | "FAIL";
  hits: number;
  confidenceDelta: number;
};

export class MemoryLearningAgent extends BaseAgent<MemoryEntry, MemoryEntry> {
  name = "MemoryLearningAgent";
  async run(input: MemoryEntry): Promise<MemoryEntry> {
    return input;
  }
}
