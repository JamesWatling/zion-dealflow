import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Zion Dealflow",
  description: "Acquisitions pipeline — source, analyze, draft, approve, send.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-cream text-ink">
        <header className="border-b border-line bg-cream/90 backdrop-blur sticky top-0 z-20">
          <div className="mx-auto max-w-6xl px-5 h-14 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 font-semibold">
              <span className="grid place-items-center w-8 h-8 rounded-lg bg-canyon text-white font-bold">Z</span>
              <span>Zion Dealflow</span>
            </Link>
            <span className="text-xs text-ink-soft">Zion Property Acquisitions</span>
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
