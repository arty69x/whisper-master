"use client";

import { useEffect, useState } from "react";

type StateResponse = {
  state: string;
  healingRounds: number;
  retryCount: number;
};

export default function DashboardPage(): JSX.Element {
  const [data, setData] = useState<StateResponse | null>(null);

  useEffect(() => {
    const load = async (): Promise<void> => {
      try {
        const response = await fetch("/api/state");
        const raw: unknown = await response.json();
        if (typeof raw === "object" && raw !== null && "state" in raw && "healingRounds" in raw && "retryCount" in raw) {
          setData(raw as StateResponse);
        }
      } catch {
        setData(null);
      }
    };
    void load();
  }, []);

  return (
    <main><section><div className="container mx-auto px-4 py-8"><h1 className="text-2xl font-semibold">Dashboard</h1><pre className="mt-4 rounded bg-slate-900 p-3">{JSON.stringify(data, null, 2)}</pre></div></section></main>
  );
}
