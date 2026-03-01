import { NextResponse } from "next/server";
import { WorkspaceIndex } from "@core/WorkspaceIndex";

export async function GET(): Promise<NextResponse> {
  const projects = await new WorkspaceIndex().listProjects("workspace");
  return NextResponse.json({ projects });
}
