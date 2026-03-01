const blocked = ["eval(", "Function(", "child_process", "exec(", "spawn(", "<script>", "javascript:", "data:", "../", "/"];

export class SanitizationService {
  ensureSafePatch(content: string): void {
    for (const token of blocked) {
      if (content.includes(token)) {
        throw new Error(`SANDBOX_REJECTION:${token}`);
      }
    }
  }
}
