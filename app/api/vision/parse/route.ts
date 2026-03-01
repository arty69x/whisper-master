import { NextResponse } from "next/server";
import { VisionGatewayService } from "@services/VisionGatewayService";
import { VisionResponseNormalizer } from "@services/VisionResponseNormalizer";

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as { imageUrl: string };
  const raw = await new VisionGatewayService().parse({ imageUrl: body.imageUrl });
  const normalized = new VisionResponseNormalizer().normalize(raw);
  return NextResponse.json({ proposal: normalized, autoApply: false });
}
