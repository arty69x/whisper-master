import { NextResponse } from "next/server";
import { WorkspaceFS } from "@core/WorkspaceFS";

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as { project: string; path: string; content: string; confirm: boolean };
  if (!body.confirm) {
    return NextResponse.json({ error: "confirmation required" }, { status: 400 });
  }
  await new WorkspaceFS().writeFile(`workspace/${body.project}`, body.path, body.content);
  return NextResponse.json({ ok: true });
}
