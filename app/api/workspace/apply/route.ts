import path from "node:path";
import { NextResponse } from "next/server";
import { WorkspaceFS } from "@core/WorkspaceFS";

function isSafeProjectPath(project: string): boolean {
  if (!project || path.isAbsolute(project)) {
    return false;
  }
  const normalized = project.replaceAll("\\", "/");
  if (normalized.startsWith("/") || normalized.includes("//")) {
    return false;
  }
  return normalized.split("/").every((segment: string) => segment.length > 0 && segment !== "." && segment !== "..");
}

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as { project: string; path: string; content: string; confirm: boolean };
  if (!body.confirm) {
    return NextResponse.json({ error: "confirmation required" }, { status: 400 });
  }
  if (!isSafeProjectPath(body.project)) {
    return NextResponse.json({ error: "invalid project path" }, { status: 400 });
  }
  await new WorkspaceFS().writeFile(path.join("workspace", body.project), body.path, body.content);
  return NextResponse.json({ ok: true });
}
