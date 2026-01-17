import type { Metadata } from "next";
import "./globals.css";
import { Nunito } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";

const nunito = Nunito({ subsets: ["latin"], weight: ["300", "400", "600", "700", "800"] });

export const metadata: Metadata = {
  title: "Ballistic – Bullet Journal",
  description: "Minimal mobile-first bullet journalling app",
  manifest: "/manifest.json",
  themeColor: "#000000",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Ballistic",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
       <head>
        {/* Add service worker registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').catch(() => {});
                });
              }
            `,
          }}
        />
      </head>
      <body className={`min-h-dvh bg-[var(--page-bg)] text-[var(--text)] ${nunito.className}`}>
        <AuthProvider>
          <div className="mx-auto w-full max-w-screen-sm p-4">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
