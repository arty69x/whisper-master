import { NextResponse } from "next/server";
import { engine } from "@core/bootstrap";

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as { proposalId: string };
  const proposal = engine.proposals().find((item) => item.proposalId === body.proposalId);
  if (!proposal) {
    return NextResponse.json({ error: "proposal not found" }, { status: 404 });
  }
  return NextResponse.json({ proposal: { ...proposal, status: "confirmed" } });
}
