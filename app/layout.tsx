import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "WhisperX",
  description: "Deterministic autonomous engine"
};

const navItems = [
  ["/", "Home"],
  ["/run", "Run"],
  ["/dashboard", "Dashboard"],
  ["/timeline", "Timeline"],
  ["/memory", "Memory"],
  ["/workspace", "Workspace"],
  ["/metrics", "Metrics"]
] as const;

export default function RootLayout({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-100">
        <header className="border-b border-slate-800">
          <div className="container mx-auto px-4 py-4">
            <nav className="flex flex-wrap items-center gap-2">
              {navItems.map(([href, label]) => (
                <Link
                  key={href}
                  href={href}
                  className="min-h-[44px] rounded bg-slate-800 px-3 py-2 text-sm hover:bg-slate-700"
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
