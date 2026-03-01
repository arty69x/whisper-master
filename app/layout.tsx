import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "SOVEREIGN-CORE",
  description: "Deterministic Dev OS"
};

const navItems: Array<{ href: string; label: string }> = [
  { href: "/", label: "Control Center" },
  { href: "/workspace", label: "Workspace" },
  { href: "/proposals", label: "Proposals" },
  { href: "/diff", label: "Diff" },
  { href: "/vision", label: "Vision" },
  { href: "/reputation", label: "Reputation" },
  { href: "/settings", label: "Settings" }
];

export default function RootLayout({ children }: { children: ReactNode }): JSX.Element {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100">
        <header className="border-b border-slate-800">
          <div className="container mx-auto px-4 py-4">
            <nav className="flex flex-wrap gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  className="rounded border border-slate-700 px-3 py-2 text-sm min-h-[44px] flex items-center"
                  href={item.href}
                >
                  {item.label}
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
