import { NextResponse } from "next/server";
import { engine } from "@core/bootstrap";

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as { proposalId: string };

  try {
    const proposal = engine.confirm(body.proposalId);
    return NextResponse.json({ proposal });
  } catch (error) {
    if (error instanceof Error && error.message === "Proposal not found") {
      return NextResponse.json({ error: "proposal not found" }, { status: 404 });
    }
    throw error;
  }
}
