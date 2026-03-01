import { computeIoU, maxDrift, type Box } from "./WhisperXIoUEngine";

export class WhisperXAnalyzer {
  verifyLayout(actual: Box, expected: Box, minIoU: number, maxDriftPx: number): { success: boolean; iou: number; drift: number } {
    const iou = computeIoU(actual, expected);
    const drift = maxDrift(actual, expected);
    return { success: iou >= minIoU && drift <= maxDriftPx, iou, drift };
  }
}
