import type { VisionRawResponse } from "@services/VisionGatewayService";

export interface VisionNormalized {
  classes: string[];
  jsx: string;
}

export class VisionResponseNormalizer {
  public normalize(raw: VisionRawResponse): VisionNormalized {
    const classes = raw.classes.slice().sort((a, b) => a.localeCompare(b));
    return {
      classes,
      jsx: raw.jsx
    };
  }
}
