import { SanitizationService } from "@services/SanitizationService";

export interface VisionRequest {
  imageUrl: string;
}

export interface VisionRawResponse {
  classes: string[];
  jsx: string;
}

export class VisionGatewayService {
  private readonly sanitizer = new SanitizationService();

  public async parse(request: VisionRequest): Promise<VisionRawResponse> {
    const host = new URL(request.imageUrl).host;
    this.sanitizer.sanitizeHost(host);
    return {
      classes: ["flex", "min-h-[44px]", "px-4"],
      jsx: "<button className=\"flex min-h-[44px] px-4\">Vision</button>"
    };
  }
}
