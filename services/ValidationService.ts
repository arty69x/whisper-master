export type ValidationMetrics = {
  compileErrors: number;
  severity: number;
  confidence: number;
};

export type ValidationResult = {
  success: boolean;
  metrics: ValidationMetrics;
};

export class ValidationService {
  validateContent(content: string): ValidationResult {
    const compileErrors = content.includes("undefined") ? 1 : 0;
    const severity = content.includes("danger") ? 2 : 0;
    const confidence = content.length > 10 ? 0.8 : 0.2;
    return { success: compileErrors === 0 && severity === 0, metrics: { compileErrors, severity, confidence } };
  }

  regressionDetected(previous: ValidationMetrics, current: ValidationMetrics): boolean {
    return current.compileErrors > previous.compileErrors || current.severity > previous.severity || current.confidence < previous.confidence;
  }
}
