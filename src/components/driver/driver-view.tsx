"use client";

import { useEffect, useState } from "react";
import { CURRENT_DRIVER_ID } from "@/lib/constants";
import { drivers } from "@/data/drivers";
import { tripsForDriver } from "@/data/trips";
import { useFleet } from "@/contexts/fleet-context";
import { VehicleCard } from "./vehicle-card";
import { ScheduleList } from "./schedule-list";
import { FleetSnapshot } from "./fleet-snapshot";

/**
 * Driver view — mobile-optimized dashboard rendered at `/my-shift`.
 *
 * Three stacked sections in a single-column, narrow-width layout:
 *   1. Vehicle card — the bus I'm driving today, its readiness and next PM
 *   2. Schedule list — today's paratransit manifest, chronological
 *   3. Fleet snapshot — my garage's availability picture at a glance
 *
 * The driver's garage is fixed (it's *my* shift, not a fleet-wide view) so
 * this page deliberately ignores the top-bar depot switcher — the fleet
 * snapshot always shows the driver's own garage.
 */
export function DriverView() {
  const { buses } = useFleet();
  const driver = drivers.find((d) => d.id === CURRENT_DRIVER_ID);
  if (!driver) throw new Error(`Driver ${CURRENT_DRIVER_ID} not found`);

  const assignedBus = buses.find((b) => b.id === driver.assignedBusId);
  if (!assignedBus) throw new Error(`Bus ${driver.assignedBusId} not found`);

  const trips = tripsForDriver(driver.id);
  const greeting = useGreeting();

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-xl">
        <header className="mb-6">
          <p className="text-[12px] font-medium text-[#929292]">
            {greeting}
          </p>
          <h1 className="mt-0.5 text-[26px] font-bold leading-tight tracking-[-0.02em] text-[#222222]">
            {driver.name}
          </h1>
          <p className="mt-1 text-[13px] text-[#6a6a6a]">
            {driver.garage === "north" ? "North" : "South"} Garage ·{" "}
            Shift {formatShiftTime(driver.shiftStart)} – {formatShiftTime(driver.shiftEnd)}
          </p>
        </header>

        <section className="mb-5">
          <VehicleCard bus={assignedBus} />
        </section>

        <section className="mb-5">
          <ScheduleList trips={trips} />
        </section>

        <section>
          <FleetSnapshot garage={driver.garage} />
        </section>
      </div>
    </div>
  );
}

/** Pick a greeting from the current local hour. Hydration-safe: renders the
 *  same generic greeting on the server and swaps to the hour-aware one after
 *  mount so the HTML never mismatches. */
function useGreeting(): string {
  const [greeting, setGreeting] = useState("Good day,");
  useEffect(() => {
    const h = new Date().getHours();
    if (h < 12) setGreeting("Good morning,");
    else if (h < 18) setGreeting("Good afternoon,");
    else setGreeting("Good evening,");
  }, []);
  return greeting;
}

/** Convert "HH:MM" 24h to "H:MM AM/PM" for display. */
function formatShiftTime(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}
