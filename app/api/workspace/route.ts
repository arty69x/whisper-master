import { NextResponse } from "next/server";
import { engine } from "../../../core/runtime";

export async function GET(): Promise<NextResponse> {
  try {
    return NextResponse.json(engine.listWorkspace());
  } catch {
    return NextResponse.json([], { status: 500 });
  }
}
