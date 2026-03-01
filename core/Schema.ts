export type EngineState =
  | "IDLE"
  | "DEV_READY"
  | "AGENT_PLANNING"
  | "AGENT_GENERATING"
  | "AGENT_VALIDATING"
  | "AGENT_SIMULATING"
  | "AGENT_PREVIEW"
  | "AGENT_APPLYING"
  | "FINALIZED"
  | "FAILED"
  | "SAFE_MODE";

export interface RunContext {
  runId: string;
  activeProject: string;
  healingRounds: number;
  safeMode: boolean;
}

export interface CandidateFile {
  path: string;
  content: string;
}

export interface Candidate {
  id: string;
  files: CandidateFile[];
  reviewScore: number;
  compileScore: number;
  securityScore: number;
  stabilityScore: number;
  finalScore: number;
}

export interface SimulationResult {
  ok: boolean;
  workspaceHashBefore: string;
  workspaceHashAfter: string;
  riskScore: number;
  regression: boolean;
  diagnostics: string[];
}

export interface Proposal {
  proposalId: string;
  runId: string;
  candidate: Candidate;
  simulation: SimulationResult;
  status: "queued" | "confirmed" | "applied" | "rejected";
}

export interface StateSnapshot {
  state: EngineState;
  context: RunContext;
  proposals: Proposal[];
}
