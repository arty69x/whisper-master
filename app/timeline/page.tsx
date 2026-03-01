"use client";

import { useEffect, useState } from "react";

type MetricEvent = { runId: string; timestamp: string; state: string; agent: string; durationMs: number; outcome: string };

export default function TimelinePage(): JSX.Element {
  const [events, setEvents] = useState<MetricEvent[]>([]);

  useEffect(() => {
    const load = async (): Promise<void> => {
      try {
        const response = await fetch("/api/metrics?mode=timeline");
        const raw: unknown = await response.json();
        if (Array.isArray(raw)) {
          setEvents(raw.filter((item): item is MetricEvent => typeof item === "object" && item !== null && "runId" in item && "state" in item && "agent" in item && "durationMs" in item && "outcome" in item && "timestamp" in item));
        }
      } catch {
        setEvents([]);
      }
    };
    void load();
  }, []);

  return (
    <main><section><div className="container mx-auto px-4 py-8"><h1 className="text-2xl font-semibold">Timeline</h1><div className="mt-4 space-y-2">{events.map((event) => <div key={`${event.runId}-${event.timestamp}`} className="rounded bg-slate-900 p-3 text-sm">{event.timestamp} • {event.state} • {event.agent} • {event.outcome}</div>)}</div></div></section></main>
  );
}
