export interface CursorContext {
  startLine: number;
  endLine: number;
  jsxBoundaryDetected: boolean;
  layoutHints: string[];
}

export class CursorContextEngine {
  public analyze(document: string, line: number): CursorContext {
    const lines = document.split("\n");
    const startLine = Math.max(1, line - 10);
    const endLine = Math.min(lines.length, line + 10);
    const window = lines.slice(startLine - 1, endLine);
    const joined = window.join("\n");
    const jsxBoundaryDetected = /<\w+/.test(joined) && /<\/\w+>/.test(joined);
    const layoutHints: string[] = [];
    if (joined.includes("flex")) layoutHints.push("flex");
    if (joined.includes("grid")) layoutHints.push("grid");
    if (joined.includes("button")) layoutHints.push("button");
    return { startLine, endLine, jsxBoundaryDetected, layoutHints };
  }
}
