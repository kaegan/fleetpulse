import type { Metadata } from "next";
import { DriverView } from "@/components/driver/driver-view";

export const metadata: Metadata = {
  title: "Spare Driver · Your day",
  description:
    "Mobile-first driver prototype — current trip, full schedule, fleet context, and shift progress.",
};

export default function DriverPage() {
  return <DriverView />;
}
