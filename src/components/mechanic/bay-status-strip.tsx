"use client";

import { BayCard } from "./bay-card";
import { bays } from "@/data/bays";
import { workOrders } from "@/data/work-orders";
import type { Garage } from "@/data/types";

interface BayStatusStripProps {
  garage: Garage;
}

export function BayStatusStrip({ garage }: BayStatusStripProps) {
  const garageBays = bays.filter((b) => b.garage === garage);

  return (
    <div style={{ display: "flex", gap: 10, marginBottom: 24, overflowX: "auto" }}>
      {garageBays.map((bay) => {
        const occupant = bay.workOrderId
          ? workOrders.find((wo) => wo.id === bay.workOrderId) ?? null
          : null;

        return (
          <BayCard
            key={bay.number}
            bayNumber={bay.number}
            occupant={occupant}
          />
        );
      })}
    </div>
  );
}
