"use client";

import { useEffect, useState } from "react";

export default function WorkspacePage(): JSX.Element {
  const [files, setFiles] = useState<string[]>([]);

  useEffect(() => {
    const load = async (): Promise<void> => {
      try {
        const response = await fetch("/api/workspace");
        const raw: unknown = await response.json();
        if (Array.isArray(raw)) {
          setFiles(raw.filter((item): item is string => typeof item === "string"));
        }
      } catch {
        setFiles([]);
      }
    };
    void load();
  }, []);

  return (
    <main><section><div className="container mx-auto px-4 py-8"><h1 className="text-2xl font-semibold">Workspace</h1><ul className="mt-4 space-y-2">{files.map((filePath) => <li key={filePath} className="rounded bg-slate-900 p-2 text-sm">{filePath}</li>)}</ul></div></section></main>
  );
}
