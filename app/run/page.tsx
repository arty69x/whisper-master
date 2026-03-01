"use client";

import { useState } from "react";

type ExecuteResponse = {
  runId: string;
  state: string;
  score: number;
  summary: string;
};

export default function RunPage(): JSX.Element {
  const [prompt, setPrompt] = useState("Build a safe deterministic component");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ExecuteResponse | null>(null);
  const [error, setError] = useState<string>("");

  const handleRun = async (): Promise<void> => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt })
      });
      const data: unknown = await response.json();
      if (!response.ok) {
        setError("Execution failed");
      }
      if (typeof data === "object" && data !== null && "runId" in data && "state" in data && "score" in data && "summary" in data) {
        setResult(data as ExecuteResponse);
      } else {
        setError("Invalid API response shape");
      }
    } catch {
      setError("Network or server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main>
      <section>
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl font-semibold">Run Pipeline</h1>
          <textarea
            className="mt-4 min-h-[120px] w-full rounded border border-slate-700 bg-slate-900 p-3"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
          />
          <button
            onClick={handleRun}
            className="mt-4 min-h-[44px] rounded bg-indigo-600 px-4 py-2 hover:bg-indigo-500"
            disabled={loading}
          >
            {loading ? "Running..." : "Execute"}
          </button>
          {error ? <p className="mt-3 text-red-400">{error}</p> : null}
          {result ? (
            <pre className="mt-4 overflow-x-auto rounded bg-slate-900 p-3 text-sm">{JSON.stringify(result, null, 2)}</pre>
          ) : null}
        </div>
      </section>
    </main>
  );
}
