import type { Metadata, Viewport } from "next";
import { DriverView } from "@/components/driver/driver-view";

export const metadata: Metadata = {
  title: "Spare Driver · Your day",
  description:
    "Mobile-first driver prototype — current trip, full schedule, fleet context, and shift progress.",
  appleWebApp: {
    capable: true,
    title: "Spare Driver",
    statusBarStyle: "default",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export default function DriverPage() {
  return <DriverView />;
}
