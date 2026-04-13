import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Inter, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { AppShell } from "@/components/app-shell";
import { PHProvider } from "@/providers/posthog";
import { PostHogPageView } from "@/components/posthog-page-view";
import { Analytics } from "@vercel/analytics/next";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "FleetPulse — Transitland Fleet Management",
  description:
    "Real-time fleet visibility for Transitland's 300-bus paratransit operation. Role-based views for mechanics and ops managers.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const sidebarState = cookieStore.get("sidebar_state")?.value;
  const defaultOpen = sidebarState === undefined ? true : sidebarState === "true";

  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <PHProvider>
          <Suspense fallback={null}>
            <PostHogPageView />
          </Suspense>
          <AppShell defaultOpen={defaultOpen}>{children}</AppShell>
          <Toaster />
        </PHProvider>
        <Analytics />
      </body>
    </html>
  );
}
