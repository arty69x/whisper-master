export interface ClassnameSuggestion {
  suggestion: string;
  confidence: number;
  alternatives: string[];
}

export class ClassnameEngine {
  public suggest(base: string): ClassnameSuggestion {
    const normalized = base.replace(/\s+/g, " ").trim();
    const safe = normalized.includes("min-h-") ? normalized : `${normalized} min-h-[44px]`;
    const alternatives = [safe.replace("gap-7", "gap-6"), safe.replace("py-5", "py-4")].filter(
      (item, index, arr) => item !== safe && arr.indexOf(item) === index
    );
    return {
      suggestion: safe,
      confidence: 0.95,
      alternatives
    };
  }
}
