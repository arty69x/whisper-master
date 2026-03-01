import path from "node:path";
import { bootstrap } from "./bootstrap";
import { WhisperXEngine } from "./WhisperXEngine";

const root = process.cwd();
const config = bootstrap(root);

export const engine = new WhisperXEngine(root, {
  ...config,
  workspaceRoot: path.resolve(root, config.workspaceRoot)
});
