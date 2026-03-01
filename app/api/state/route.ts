import { NextResponse } from "next/server";
import { engine } from "../../../core/runtime";

export async function GET(): Promise<NextResponse> {
  try {
    const state = engine.getState();
    return NextResponse.json({ state: state.state, healingRounds: state.healingRounds, retryCount: state.retryCount });
  } catch {
    return NextResponse.json({ state: "FAILED", healingRounds: 0, retryCount: 0 }, { status: 500 });
  }
}
