import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Nunito } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";
import { GlobalFeatureFlagsProvider } from "@/contexts/GlobalFeatureFlagsContext";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import { getGlobalFeatureFlags } from "@/lib/server/featureFlags";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["300", "400", "600", "700", "800"],
});

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

// Opt the whole app into time-based ISR for the feature-flag payload.
//
// Without this, if API_BASE_URL happens to be unset at `next build` time,
// getGlobalFeatureFlags() returns `{}` without ever calling fetch() — Next
// then sees no data dependency and fully static-renders the page, baking the
// empty flag map into the HTML forever. An explicit `revalidate` here keeps
// the route on the ISR path regardless: serve the cached shell, revalidate
// in the background every 5 min. Mirrors the Laravel cache TTL so we never
// generate more than ~12 backend hits/hour from SSR no matter how busy the
// site gets.
export const revalidate = 300;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fetch site-wide feature flags on the server so the initial HTML already
  // reflects the correct gated-UI state. The provider seeds from this payload
  // and renders gated features (or their absence) from the first paint — no
  // client-side round trip, no post-hydration pop-in. Backed by a 5-min
  // Next data cache (`revalidate: 300`) mirroring the Laravel cache TTL so
  // repeat navigations stay cheap.
  const initialFlags = await getGlobalFeatureFlags();

  return (
    <html lang="en">
      <body
        className={`min-h-dvh bg-[var(--page-bg)] text-[var(--text)] ${nunito.className}`}
      >
        <ServiceWorkerRegistration />
        <GlobalFeatureFlagsProvider initialFlags={initialFlags}>
          <AuthProvider>
            <div className="mx-auto w-full max-w-screen-sm p-4">{children}</div>
          </AuthProvider>
        </GlobalFeatureFlagsProvider>
      </body>
    </html>
  );
}
