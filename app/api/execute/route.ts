import { NextResponse } from "next/server";
import { engine } from "../../../core/runtime";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body: unknown = await request.json();
    const prompt = typeof body === "object" && body !== null && "prompt" in body && typeof body.prompt === "string" ? body.prompt : "";
    if (!prompt.trim()) {
      return NextResponse.json({ error: "prompt required" }, { status: 400 });
    }
    const result = await engine.execute(prompt);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "unknown" }, { status: 500 });
  }
}
