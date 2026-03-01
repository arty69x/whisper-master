import { NextResponse } from "next/server";
import { engine } from "@core/bootstrap";

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ proposals: engine.proposals() });
}
