import type { Metadata } from "next";
import "./globals.css";
import { Nunito } from "next/font/google";

const nunito = Nunito({ subsets: ["latin"], weight: ["300", "400", "600", "700", "800"] });

export const metadata: Metadata = {
  title: "Ballistic – Bullet Journal",
  description: "Minimal mobile-first bullet journalling app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`min-h-dvh bg-[var(--page-bg)] text-[var(--text)] ${nunito.className}`}>
        <div className="mx-auto w-full max-w-screen-sm p-4">
          {children}
        </div>
      </body>
    </html>
  );
}
