import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Boxoffice — Track theatrical releases",
  description:
    "Search The Numbers, validate a domestic theatrical release, and track eligible movies.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 sm:px-6">
          <header className="flex items-center justify-between py-5">
            <Link href="/" className="group flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-blue-500 to-fuchsia-500 text-sm font-black text-white shadow-lg shadow-blue-500/20">
                B
              </span>
              <span className="text-lg font-semibold tracking-tight">
                Boxoffice
              </span>
            </Link>
            <nav className="flex items-center gap-1 text-sm">
              <Link
                href="/"
                className="rounded-md px-3 py-1.5 text-zinc-300 transition hover:bg-white/5 hover:text-white"
              >
                Add movie
              </Link>
              <Link
                href="/movies"
                className="rounded-md px-3 py-1.5 text-zinc-300 transition hover:bg-white/5 hover:text-white"
              >
                Tracked
              </Link>
            </nav>
          </header>
          <main className="flex-1 pb-16">{children}</main>
          <footer className="border-t border-white/5 py-6 text-center text-xs text-zinc-500">
            Data from The Numbers. For personal use only.
          </footer>
        </div>
      </body>
    </html>
  );
}
