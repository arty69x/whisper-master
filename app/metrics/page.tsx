"use client";

import { useEffect, useState } from "react";

type Health = { avgLatencyMs: number; failureRate: number; last10SuccessRatio: number; healingTriggerRate: number };

export default function MetricsPage(): JSX.Element {
  const [health, setHealth] = useState<Health | null>(null);

  useEffect(() => {
    const load = async (): Promise<void> => {
      try {
        const response = await fetch("/api/metrics");
        const raw: unknown = await response.json();
        if (typeof raw === "object" && raw !== null && "avgLatencyMs" in raw) {
          setHealth(raw as Health);
        }
      } catch {
        setHealth(null);
      }
    };
    void load();
  }, []);

  return (
    <main><section><div className="container mx-auto px-4 py-8"><h1 className="text-2xl font-semibold">Metrics</h1><pre className="mt-4 rounded bg-slate-900 p-3 text-sm">{JSON.stringify(health, null, 2)}</pre></div></section></main>
  );
}
