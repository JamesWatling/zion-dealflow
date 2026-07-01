import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import { cookies } from "next/headers";
import { SESSION_COOKIE, authEnabled, verifySession } from "@/lib/auth";
import { LogoutButton } from "@/components/logout-button";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Zion Dealflow",
  description: "Acquisitions pipeline — source, analyze, draft, approve, send.",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const authed = authEnabled() ? await verifySession((await cookies()).get(SESSION_COOKIE)?.value) : false;

  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-cream text-ink">
        <header className="border-b border-line bg-cream/90 backdrop-blur sticky top-0 z-20">
          <div className="mx-auto max-w-6xl px-5 h-14 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 font-semibold">
              <span className="grid place-items-center w-8 h-8 rounded-lg bg-canyon text-white font-bold">Z</span>
              <span>Zion Dealflow</span>
            </Link>
            {authed ? (
              <nav className="flex items-center gap-5 text-sm">
                <Link href="/" className="text-ink-soft hover:text-canyon">Pipeline</Link>
                <Link href="/analytics" className="text-ink-soft hover:text-canyon">Analytics</Link>
                <LogoutButton />
              </nav>
            ) : (
              <span className="text-xs text-ink-soft">Zion Property Acquisitions</span>
            )}
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
