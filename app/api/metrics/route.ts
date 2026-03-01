import { NextResponse } from "next/server";
import { engine } from "../../../core/runtime";

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode");
    if (mode === "timeline") {
      return NextResponse.json(engine.readRecentEvents());
    }
    return NextResponse.json(engine.getHealth());
  } catch {
    return NextResponse.json({ avgLatencyMs: 0, failureRate: 1, last10SuccessRatio: 0, healingTriggerRate: 0 }, { status: 500 });
  }
}
