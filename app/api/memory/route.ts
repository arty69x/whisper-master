import { NextResponse } from "next/server";
import { engine } from "../../../core/runtime";

export async function GET(): Promise<NextResponse> {
  try {
    return NextResponse.json(engine.readAllMemory());
  } catch {
    return NextResponse.json([], { status: 500 });
  }
}
