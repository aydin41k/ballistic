import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Inter, Source_Sans_3 } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-ui",
});

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-reading",
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "Ballistic: The Simplest Bullet List",
  description:
    "A beautifully simple mobile bullet list your AI can add to, organise, update and keep moving for you.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Ballistic",
  },
};

// Export viewport separately (Next.js 15 requirement)
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#111b3f",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${sourceSans.variable} min-h-dvh bg-[var(--page-bg)] text-[var(--text)] font-ui`}
      >
        <ServiceWorkerRegistration />
        <AuthProvider>
          <div className="mx-auto w-full max-w-screen-sm p-4 lg:max-w-none lg:p-0">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
