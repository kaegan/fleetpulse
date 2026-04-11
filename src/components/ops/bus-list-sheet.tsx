"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { SectionPill } from "@/components/section-pill";
import { buses } from "@/data/buses";
import { workOrders } from "@/data/work-orders";
import type { Bus } from "@/data/types";
import { KPI_PILLS, PM_INTERVAL_MILES, STAGES } from "@/lib/constants";
import { formatNumber, formatTimeInStatus, milesUntilPm } from "@/lib/utils";
import {
  IconWrenchFillDuo18,
  IconGearsFillDuo18,
  IconSirenFillDuo18,
} from "nucleo-ui-fill-duo-18";

/**
 * Categories that drill down from the KPI strip into a filtered bus list.
 *
 * Scoped to the three KPIs where an Ops Manager has a real decisioning job:
 * schedule + rebalance PM, unstick the in-shop pipeline, and dispatch tows
 * for stranded buses. Running and Fleet Availability stay unwired — they're
 * positive/aggregate states with no actionable verbs at this level.
 */
export type DrillDownCategory = "pm-due" | "in-maintenance" | "road-call";

interface BusListSheetProps {
  category: DrillDownCategory | null;
  onClose: () => void;
  onBusClick: (bus: Bus) => void;
}

type CategoryDisplay = {
  title: string;
  subtitle: (count: number) => string;
  pillColor: string;
  pillBg: string;
  icon: ReactNode;
  /** Sort order for the list — most-urgent-first per category. */
  sort: (a: Bus, b: Bus) => number;
  /** The contextual line under the bus number — different per category. */
  renderRowMeta: (bus: Bus) => ReactNode;
};

const displayByCategory: Record<DrillDownCategory, CategoryDisplay> = {
  "pm-due": {
    title: "PM Due",
    subtitle: (n) =>
      `${n} ${n === 1 ? "bus" : "buses"} overdue for A-Service (every ${formatNumber(PM_INTERVAL_MILES)} mi)`,
    pillColor: KPI_PILLS["PM Due"].color,
    pillBg: KPI_PILLS["PM Due"].bg,
    icon: <IconWrenchFillDuo18 />,
    // Most overdue first — milesUntilPm is most-negative for the worst offenders.
    sort: (a, b) => milesUntilPm(a) - milesUntilPm(b),
    renderRowMeta: (bus) => {
      const overdue = Math.abs(milesUntilPm(bus));
      return (
        <span
          style={{ fontSize: 13, fontWeight: 600, color: "#ef4444" }}
        >
          {formatNumber(overdue)} mi overdue
        </span>
      );
    },
  },
  "in-maintenance": {
    title: "In Maintenance",
    subtitle: (n) =>
      `${n} ${n === 1 ? "bus" : "buses"} currently in the shop across both garages`,
    pillColor: KPI_PILLS["In Maintenance"].color,
    pillBg: KPI_PILLS["In Maintenance"].bg,
    icon: <IconGearsFillDuo18 />,
    sort: (a, b) => {
      // Buses with an active WO sort by stale-stage-first;
      // buses without a WO (in shop, no featured ticket) drop to the bottom.
      const woA = workOrders.find((wo) => wo.busId === a.id);
      const woB = workOrders.find((wo) => wo.busId === b.id);
      if (!woA && !woB) return a.id - b.id;
      if (!woA) return 1;
      if (!woB) return -1;
      return (
        new Date(woA.stageEnteredAt).getTime() -
        new Date(woB.stageEnteredAt).getTime()
      );
    },
    renderRowMeta: (bus) => {
      const wo = workOrders.find((w) => w.busId === bus.id);
      if (!wo) {
        return (
          <span style={{ fontSize: 13, fontWeight: 500, color: "#929292" }}>
            In shop &middot; no active WO
          </span>
        );
      }
      return (
        <span style={{ fontSize: 13, fontWeight: 500, color: "#6a6a6a" }}>
          {STAGES[wo.stage]}{" "}
          <span style={{ color: "#b5b5b5" }}>
            &middot; {formatTimeInStatus(wo.stageEnteredAt)} in stage
          </span>
        </span>
      );
    },
  },
  "road-call": {
    title: "Road Calls",
    subtitle: (n) =>
      `${n} ${n === 1 ? "bus" : "buses"} currently stranded — dispatch needed`,
    pillColor: KPI_PILLS["Road Calls"].color,
    pillBg: KPI_PILLS["Road Calls"].bg,
    icon: <IconSirenFillDuo18 />,
    // Group dispatch by depot — deterministic, scannable. Real-life sort
    // would be by time-since-incident, which the seed data doesn't carry.
    sort: (a, b) => {
      if (a.garage !== b.garage) return a.garage === "north" ? -1 : 1;
      return a.id - b.id;
    },
    renderRowMeta: () => (
      <span style={{ fontSize: 13, fontWeight: 600, color: "#ef4444" }}>
        Awaiting tow dispatch
      </span>
    ),
  },
};

export function BusListSheet({
  category,
  onClose,
  onBusClick,
}: BusListSheetProps) {
  // Snapshot the last non-null category so the sheet keeps rendering its
  // contents through the close animation after the parent clears `category`.
  // (Same trick as BusDetailPanel.)
  const [displayCategory, setDisplayCategory] =
    useState<DrillDownCategory | null>(category);
  useEffect(() => {
    if (category) setDisplayCategory(category);
  }, [category]);

  return (
    <Sheet
      open={Boolean(category)}
      onOpenChange={(open) => !open && onClose()}
    >
      <SheetContent side="right" className="p-0">
        <SheetTitle className="sr-only">
          {displayCategory
            ? displayByCategory[displayCategory].title
            : "Fleet list"}
        </SheetTitle>
        <SheetDescription className="sr-only">
          Filtered list of buses for Ops Manager triage and drill-down.
        </SheetDescription>
        {displayCategory && (
          <ListContent
            category={displayCategory}
            onBusClick={onBusClick}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function ListContent({
  category,
  onBusClick,
}: {
  category: DrillDownCategory;
  onBusClick: (bus: Bus) => void;
}) {
  const cfg = displayByCategory[category];
  const filtered = useMemo(() => {
    return buses
      .filter((b) => b.status === category)
      .slice()
      .sort(cfg.sort);
  }, [category, cfg.sort]);

  const northCount = filtered.filter((b) => b.garage === "north").length;
  const southCount = filtered.filter((b) => b.garage === "south").length;

  return (
    <div className="p-5 sm:p-7">
      {/* Section pill */}
      <div style={{ marginBottom: 10 }}>
        <SectionPill
          label={cfg.title}
          color={cfg.pillColor}
          bgColor={cfg.pillBg}
          icon={cfg.icon}
        />
      </div>

      {/* Title */}
      <h2
        style={{
          fontSize: 28,
          fontWeight: 700,
          color: "#222222",
          letterSpacing: "-0.03em",
          marginBottom: 6,
        }}
      >
        {filtered.length} {filtered.length === 1 ? "bus" : "buses"}
      </h2>

      {/* Subtitle */}
      <p
        style={{
          fontSize: 13,
          fontWeight: 500,
          color: "#929292",
          marginBottom: 4,
        }}
      >
        {cfg.subtitle(filtered.length)}
      </p>

      {/* Garage split */}
      <p
        style={{
          fontSize: 12,
          fontWeight: 500,
          color: "#b5b5b5",
          marginBottom: 24,
        }}
      >
        North Garage: {northCount} &middot; South Garage: {southCount}
      </p>

      {/* Bus list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.map((bus) => (
          <BusRow
            key={bus.id}
            bus={bus}
            renderMeta={cfg.renderRowMeta}
            onClick={() => onBusClick(bus)}
          />
        ))}
      </div>
    </div>
  );
}

function BusRow({
  bus,
  renderMeta,
  onClick,
}: {
  bus: Bus;
  renderMeta: (bus: Bus) => ReactNode;
  onClick: () => void;
}) {
  const garageLabel = bus.garage === "north" ? "North" : "South";
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left bg-[#fafaf9] rounded-[14px] p-[14px] border border-black/[0.06] transition hover:border-black/[0.12] hover:shadow-card cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4654a]/40"
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 6,
        }}
      >
        <span
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: "#222222",
            letterSpacing: "-0.01em",
          }}
        >
          Bus #{bus.busNumber}
        </span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            padding: "2px 8px",
            borderRadius: 999,
            background: "#f1f5f9",
            color: "#64748b",
          }}
        >
          {garageLabel} Garage
        </span>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 12,
        }}
      >
        {renderMeta(bus)}
        <span style={{ fontWeight: 500, color: "#b5b5b5" }}>
          {bus.model.split(" ").slice(0, 2).join(" ")} &middot; {bus.year}
        </span>
      </div>
    </button>
  );
}
