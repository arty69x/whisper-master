export interface DesignProfile {
  spacingY: string[];
  gapScale: string[];
  typography: string[];
}

export class DesignProfileEngine {
  public build(classes: string[]): DesignProfile {
    const spacingY = classes.filter((token) => token.startsWith("space-y-")).sort((a, b) => a.localeCompare(b));
    const gapScale = classes.filter((token) => token.startsWith("gap-")).sort((a, b) => a.localeCompare(b));
    const typography = classes.filter((token) => token.startsWith("text-")).sort((a, b) => a.localeCompare(b));
    return { spacingY, gapScale, typography };
  }
}
