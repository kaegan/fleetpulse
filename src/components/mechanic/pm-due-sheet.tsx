"use client";

import { useState, type ReactNode } from "react";
import {
  ResponsiveSheet,
  ResponsiveSheetContent,
  ResponsiveSheetTitle,
  ResponsiveSheetDescription,
} from "@/components/ui/responsive-sheet";
import { SectionPill } from "@/components/section-pill";
import { Card } from "@/components/ui/card";
import { formatNumber } from "@/lib/utils";
import { useOverdueCandidates } from "@/hooks/use-overdue-candidates";
import type { Bus } from "@/data/types";
import {
  IconWrenchFillDuo18,
  IconClockFillDuo18,
} from "nucleo-ui-fill-duo-18";

interface PmDueSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBusClick: (bus: Bus) => void;
}

/**
 * Right-side drawer for the mechanic's "Pull In Next" planning surface
 * (JTBD M-3). Two sections: buses already overdue, and buses coming due
 * within 500 mi. Click any row to open the Bus Detail Panel so the
 * mechanic can eyeball service history before pulling the bus in.
 */
export function PmDueSheet({ open, onOpenChange, onBusClick }: PmDueSheetProps) {
  const { overdue, comingDue } = useOverdueCandidates();
  const isEmpty = overdue.length === 0 && comingDue.length === 0;

  return (
    <ResponsiveSheet open={open} onOpenChange={onOpenChange}>
      <ResponsiveSheetContent side="right" className="p-0">
        <ResponsiveSheetTitle className="sr-only">Pull In Next</ResponsiveSheetTitle>
        <ResponsiveSheetDescription className="sr-only">
          Buses overdue for preventive maintenance and buses coming due soon.
        </ResponsiveSheetDescription>

        <div className="p-5 sm:p-7">
          {/* Header */}
          <div style={{ marginBottom: 22 }}>
            <div style={{ marginBottom: 10 }}>
              <SectionPill
                label="Pull In Next"
                color="var(--color-brand)"
                bgColor="var(--color-brand-light)"
                icon={<IconWrenchFillDuo18 />}
              />
            </div>
            <h2
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: "var(--color-text-primary)",
                letterSpacing: "-0.03em",
                marginBottom: 4,
              }}
            >
              Grab these next
            </h2>
            <p
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "var(--color-text-muted)",
                margin: 0,
              }}
            >
              {isEmpty
                ? "Nothing to plan — queue is clear."
                : overdueCountLine(overdue.length, comingDue.length)}
            </p>
          </div>

          {isEmpty && <EmptyState />}

          {overdue.length > 0 && (
            <Section
              label="Overdue for PM"
              color="var(--color-brand)"
              bgColor="var(--color-brand-light)"
              icon={<IconWrenchFillDuo18 />}
              helperText="Not yet in the queue. Grab these before they break down on route."
            >
              {overdue.map(({ bus, milesOverdue }, idx) => (
                <PmRow
                  key={bus.id}
                  bus={bus}
                  urgencyNumber={milesOverdue}
                  urgencyLabel="mi overdue"
                  urgencyColor="var(--color-brand)"
                  isLast={idx === overdue.length - 1}
                  onClick={() => onBusClick(bus)}
                />
              ))}
            </Section>
          )}

          {comingDue.length > 0 && (
            <Section
              label="Coming Due Soon"
              color="var(--color-severity-high-text)"
              bgColor="var(--color-severity-high-bg)"
              icon={<IconClockFillDuo18 />}
              helperText="Approaching PM interval. Plan these into the next shift."
            >
              {comingDue.map(({ bus, milesRemaining }, idx) => (
                <PmRow
                  key={bus.id}
                  bus={bus}
                  urgencyNumber={milesRemaining}
                  urgencyLabel="mi left"
                  urgencyColor="var(--color-severity-high-text)"
                  isLast={idx === comingDue.length - 1}
                  onClick={() => onBusClick(bus)}
                />
              ))}
            </Section>
          )}
        </div>
      </ResponsiveSheetContent>
    </ResponsiveSheet>
  );
}

function overdueCountLine(overdue: number, comingDue: number): string {
  const parts: string[] = [];
  if (overdue > 0) {
    parts.push(`${overdue} overdue`);
  }
  if (comingDue > 0) {
    parts.push(`${comingDue} coming due`);
  }
  return parts.join(" · ");
}

function Section({
  label,
  color,
  bgColor,
  icon,
  helperText,
  children,
}: {
  label: string;
  color: string;
  bgColor: string;
  icon: ReactNode;
  helperText: string;
  children: ReactNode;
}) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ marginBottom: 8 }}>
        <SectionPill label={label} color={color} bgColor={bgColor} icon={icon} />
      </div>
      <p
        style={{
          fontSize: 12,
          fontWeight: 500,
          color: "var(--color-text-muted)",
          margin: "0 0 12px 0",
        }}
      >
        {helperText}
      </p>
      <div
        style={{
          border: "1px solid var(--color-border)",
          borderRadius: 14,
          overflow: "hidden",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function PmRow({
  bus,
  urgencyNumber,
  urgencyLabel,
  urgencyColor,
  isLast,
  onClick,
}: {
  bus: Bus;
  urgencyNumber: number;
  urgencyLabel: string;
  urgencyColor: string;
  isLast: boolean;
  onClick: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const garageColor = bus.garage === "north" ? "var(--color-stage-diagnosing)" : "var(--color-kpi-availability)";
  const garageBg = bus.garage === "north" ? "var(--color-stage-diagnosing-bg)" : "var(--color-kpi-availability-bg)";

  return (
    <button
      type="button"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      className="grid w-full grid-cols-[auto_auto_1fr_16px] items-center gap-3 p-[12px_16px]"
      style={{
        border: "none",
        borderBottom: isLast ? "none" : "1px solid var(--color-border)",
        background: isHovered ? "var(--color-card-hover)" : "var(--color-surface)",
        cursor: "pointer",
        transition: "background 0.12s ease-out",
        fontFamily: "inherit",
        textAlign: "left",
      }}
    >
      {/* Bus number */}
      <span
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: "var(--color-text-primary)",
          letterSpacing: "-0.01em",
        }}
      >
        Bus #{bus.busNumber}
      </span>

      {/* Garage badge */}
      <span
        style={{
          display: "inline-flex",
          padding: "3px 10px",
          borderRadius: 999,
          background: garageBg,
          color: garageColor,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.03em",
          textTransform: "uppercase",
          justifySelf: "start",
        }}
      >
        {bus.garage}
      </span>

      {/* Urgency number */}
      <span
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 5,
          justifySelf: "end",
        }}
      >
        <span
          style={{
            fontSize: 15,
            fontWeight: 800,
            color: urgencyColor,
            letterSpacing: "-0.01em",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {formatNumber(urgencyNumber)}
        </span>
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: urgencyColor,
            letterSpacing: "0.03em",
            textTransform: "uppercase",
          }}
        >
          {urgencyLabel}
        </span>
      </span>

      {/* Arrow affordance */}
      <span
        aria-hidden
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 16,
          height: 16,
          color: isHovered ? urgencyColor : "var(--color-text-faint)",
          fontSize: 16,
          fontWeight: 500,
          transition: "color 0.12s, transform 0.12s",
          transform: isHovered ? "translateX(2px)" : "translateX(0)",
        }}
      >
        →
      </span>
    </button>
  );
}

function EmptyState() {
  return (
    <Card className="flex flex-col items-start gap-3 rounded-[20px] p-5 shadow-[0px_0px_0px_1px_rgba(0,0,0,0.02),0px_2px_6px_rgba(0,0,0,0.03),0px_4px_8px_rgba(0,0,0,0.04)]">
      <SectionPill
        label="Queue Clear"
        color="var(--color-status-running)"
        bgColor="var(--color-status-running-bg)"
        icon={<IconWrenchFillDuo18 />}
      />
      <p
        style={{
          fontSize: 13,
          fontWeight: 500,
          color: "var(--color-text-secondary)",
          margin: 0,
        }}
      >
        Nothing overdue or coming due in this garage. Keep working your active
        queue.
      </p>
    </Card>
  );
}
