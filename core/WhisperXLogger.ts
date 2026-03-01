import fs from "node:fs";

export type EventRecord = {
  runId: string;
  timestamp: string;
  state: string;
  agent: string;
  durationMs: number;
  outcome: string;
};

export class WhisperXLogger {
  constructor(private readonly eventFile: string) {}

  log(event: EventRecord): void {
    fs.appendFileSync(this.eventFile, `${JSON.stringify(event)}\n`, "utf8");
  }
}
