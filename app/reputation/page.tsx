export default function Page(): JSX.Element {
  return (
    <main>
      <section>
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-semibold">Reputation</h1>
          <div className="mt-4 grid gap-4">
            <button className="rounded border border-slate-700 px-3 py-2 min-h-[44px] text-left">Primary action</button>
            <textarea className="rounded border border-slate-700 bg-slate-900 p-3 min-h-[44px] w-full" defaultValue="UI-driven operation" />
          </div>
        </div>
      </section>
    </main>
  );
}
