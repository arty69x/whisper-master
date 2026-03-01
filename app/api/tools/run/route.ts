import { NextResponse } from "next/server";
import { ToolExecutor } from "@tools/ToolExecutor";

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as { tool: string; project: string };
  const proposal = await new ToolExecutor().run(body.tool, `workspace/${body.project}`);
  return NextResponse.json({ proposal });
}
