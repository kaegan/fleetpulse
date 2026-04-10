"use client";

import { GaragePanel } from "./garage-panel";
import { buses } from "@/data/buses";
import type { Bus } from "@/data/types";

interface FleetWallProps {
  onBusClick: (bus: Bus) => void;
}

export function FleetWall({ onBusClick }: FleetWallProps) {
  const northBuses = buses.filter((b) => b.garage === "north");
  const southBuses = buses.filter((b) => b.garage === "south");

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 16,
        marginBottom: 24,
      }}
    >
      <GaragePanel
        garageName="North Garage"
        buses={northBuses}
        onBusClick={onBusClick}
      />
      <GaragePanel
        garageName="South Garage"
        buses={southBuses}
        onBusClick={onBusClick}
      />
    </div>
  );
}
