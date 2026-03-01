import crypto from "node:crypto";

const stable = (input: unknown): unknown => {
  if (Array.isArray(input)) {
    return input.map((item) => stable(item));
  }
  if (input !== null && typeof input === "object") {
    const entries = Object.entries(input as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b));
    const out: Record<string, unknown> = {};
    for (const [key, value] of entries) {
      out[key] = stable(value);
    }
    return out;
  }
  return input;
};

export const stableStringify = (input: unknown): string => JSON.stringify(stable(input));

export const sha256 = (value: string): string => crypto.createHash("sha256").update(value).digest("hex");
