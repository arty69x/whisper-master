import { NextResponse } from "next/server";
import { engine } from "@core/bootstrap";

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as { project: string };
  const state = await engine.run(body.project);
  return NextResponse.json(state);
}
