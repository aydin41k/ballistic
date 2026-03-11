import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";

export const metadata: Metadata = {
  title: "Ballistic – Bullet Journal",
  description: "Simplest bullet journal",
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
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-[var(--page-bg)] text-[var(--text)]">
        <ServiceWorkerRegistration />
        <AuthProvider>
          <div className="mx-auto w-full max-w-screen-sm p-4">{children}</div>
        </AuthProvider>
      </body>
    </html>
  );
}
