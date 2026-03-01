import { NextResponse } from "next/server";
import { tailwindGlobalTools } from "../../../services/TailwindGlobalTools";

type Action =
  | "full"
  | "hint"
  | "ghost"
  | "snippet"
  | "suggestion"
  | "autocomplete"
  | "combo"
  | "class-mapping"
  | "data";

interface ToolRequestBody {
  action?: Action;
  query?: string;
  prefix?: string;
  snippet?: string;
  combo?: string;
  className?: string;
  line?: string;
  limit?: number;
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body: ToolRequestBody = await request.json();
    const action: Action = body.action ?? "full";
    const limit = typeof body.limit === "number" ? body.limit : 20;

    switch (action) {
      case "hint":
        return NextResponse.json({ action, result: tailwindGlobalTools.getHints(body.query ?? "", limit) });
      case "ghost":
        return NextResponse.json({ action, result: tailwindGlobalTools.getGhostInline(body.line ?? body.query ?? "") });
      case "snippet":
        return NextResponse.json({ action, result: tailwindGlobalTools.getLineSnippet(body.snippet ?? body.query ?? "") });
      case "suggestion":
        return NextResponse.json({ action, result: tailwindGlobalTools.getSuggestion(body.query ?? "", limit) });
      case "autocomplete":
        return NextResponse.json({ action, result: tailwindGlobalTools.getAutocomplete(body.prefix ?? body.query ?? "", limit) });
      case "combo":
        return NextResponse.json({ action, result: tailwindGlobalTools.getCombo(body.combo ?? body.query ?? "") });
      case "class-mapping":
        return NextResponse.json({
          action,
          result: tailwindGlobalTools.getClassMapping(body.className ?? body.prefix ?? body.query ?? "", limit),
        });
      case "data":
        return NextResponse.json({ action, result: tailwindGlobalTools.getDataHits(body.query ?? "", limit) });
      case "full":
      default:
        return NextResponse.json({
          action: "full",
          source: tailwindGlobalTools.source,
          version: tailwindGlobalTools.version,
          result: tailwindGlobalTools.getFullFeatureBundle({
            query: body.query,
            prefix: body.prefix,
            snippet: body.snippet,
            combo: body.combo,
            className: body.className,
            limit,
          }),
        });
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "unknown" }, { status: 500 });
  }
}
