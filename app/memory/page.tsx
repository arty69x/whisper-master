"use client";

import { useEffect, useState } from "react";

type MemoryRecord = { id: string; ts: string; agent: string; patternKey: string; outcome: "PASS" | "FAIL"; hits: number; confidenceDelta: number };

export default function MemoryPage(): JSX.Element {
  const [records, setRecords] = useState<MemoryRecord[]>([]);

  useEffect(() => {
    const load = async (): Promise<void> => {
      try {
        const response = await fetch("/api/memory");
        const raw: unknown = await response.json();
        if (Array.isArray(raw)) {
          setRecords(raw.filter((item): item is MemoryRecord => typeof item === "object" && item !== null && "id" in item && "agent" in item));
        }
      } catch {
        setRecords([]);
      }
    };
    void load();
  }, []);

  return (
    <main><section><div className="container mx-auto px-4 py-8"><h1 className="text-2xl font-semibold">Memory</h1><pre className="mt-4 overflow-x-auto rounded bg-slate-900 p-3 text-sm">{JSON.stringify(records, null, 2)}</pre></div></section></main>
  );
}
