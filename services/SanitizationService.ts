export class SanitizationService {
  public sanitizePath(input: string): string {
    if (input.includes("..") || input.startsWith("/")) {
      throw new Error("Invalid path");
    }
    return input;
  }

  public sanitizeHost(input: string): string {
    const allowed = process.env.VISION_ALLOWLIST_HOST;
    if (!allowed || input !== allowed) {
      throw new Error("Host rejected");
    }
    return input;
  }
}
