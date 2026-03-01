import fs from "node:fs";
import path from "node:path";
import { sha256, stableStringify } from "./WhisperXHashEngine";

export type AgentConfig = {
  workspaceRoot: string;
  maxHealingRounds: number;
  memoryCapPerAgent: number;
  memoryGlobalCap: number;
  minIoU: number;
  maxDriftMobilePx: number;
  maxDriftDesktopPx: number;
  expectedMasterHash: string;
};

const requiredKeys: Array<keyof AgentConfig> = [
  "workspaceRoot",
  "maxHealingRounds",
  "memoryCapPerAgent",
  "memoryGlobalCap",
  "minIoU",
  "maxDriftMobilePx",
  "maxDriftDesktopPx",
  "expectedMasterHash"
];

export const bootstrap = (root: string): AgentConfig => {
  const configPath = path.join(root, "agent.config.json");
  const raw = JSON.parse(fs.readFileSync(configPath, "utf8")) as Partial<AgentConfig>;
  for (const key of requiredKeys) {
    if (raw[key] === undefined) {
      throw new Error(`CONFIG_MISSING:${key}`);
    }
  }
  const config = raw as AgentConfig;
  const contractPath = path.join(root, "config", "visual-master-contract.json");
  const contract = JSON.parse(fs.readFileSync(contractPath, "utf8")) as unknown;
  const hash = sha256(stableStringify(contract));
  if (hash !== config.expectedMasterHash) {
    throw new Error("MASTER_CONTRACT_INTEGRITY_FAILURE");
  }
  return config;
};
