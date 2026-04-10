"use client";

import { useMemo, useRef, useState } from "react";
import { buses } from "@/data/buses";
import type { Garage, Severity } from "@/data/types";
import {
  BRAND_COLOR,
  ISSUE_TEMPLATES,
  SEVERITY_COLORS,
  SEVERITY_LABELS,
  SEVERITY_ICONS,
} from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface LogRepairDraft {
  busId: number;
  busNumber: string;
  issue: string;
  severity: Severity;
}

interface LogRepairFormProps {
  garage: Garage;
  recentBusNumbers: string[];
  onCancel: () => void;
  onSubmit: (draft: LogRepairDraft) => void;
}

const SEVERITY_ORDER: Severity[] = ["critical", "high", "routine"];

export function LogRepairForm({
  garage,
  recentBusNumbers,
  onCancel,
  onSubmit,
}: LogRepairFormProps) {
  const [busId, setBusId] = useState<number | null>(null);
  const [busQuery, setBusQuery] = useState("");
  const [issue, setIssue] = useState("");
  const [severity, setSeverity] = useState<Severity | null>(null);

  const issueInputRef = useRef<HTMLInputElement>(null);

  // Buses in the current garage, for both the prefix filter and recent chips.
  const garageBuses = useMemo(
    () => buses.filter((b) => b.garage === garage),
    [garage]
  );

  const selectedBus = useMemo(
    () => (busId ? garageBuses.find((b) => b.id === busId) ?? null : null),
    [busId, garageBuses]
  );

  const recentBuses = useMemo(() => {
    if (recentBusNumbers.length === 0) return [];
    const byNumber = new Map(garageBuses.map((b) => [b.busNumber, b]));
    return recentBusNumbers
      .map((n) => byNumber.get(n))
      .filter((b): b is (typeof garageBuses)[number] => Boolean(b))
      .slice(0, 4);
  }, [recentBusNumbers, garageBuses]);

  const matchingBuses = useMemo(() => {
    if (selectedBus) return [];
    const q = busQuery.trim();
    if (!q) return [];
    return garageBuses
      .filter((b) => b.busNumber.startsWith(q.padStart(Math.min(q.length, 3), "0")) || b.busNumber.startsWith(q))
      .slice(0, 12);
  }, [busQuery, selectedBus, garageBuses]);

  const canSubmit = Boolean(busId && issue.trim() && severity);

  const handleBusQueryChange = (value: string) => {
    // Digits only, max 3 chars
    const cleaned = value.replace(/[^0-9]/g, "").slice(0, 3);
    setBusQuery(cleaned);
    if (busId) setBusId(null);
  };

  const handlePickBus = (id: number) => {
    const b = garageBuses.find((x) => x.id === id);
    if (!b) return;
    setBusId(id);
    setBusQuery(b.busNumber);
  };

  const handleClearBus = () => {
    setBusId(null);
    setBusQuery("");
  };

  const handlePickIssue = (template: (typeof ISSUE_TEMPLATES)[number]) => {
    setIssue(template.defaultIssue);
    if (template.label === "Other") {
      // Focus the field so the mechanic can type their own.
      requestAnimationFrame(() => issueInputRef.current?.focus());
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !selectedBus || !severity) return;
    onSubmit({
      busId: selectedBus.id,
      busNumber: selectedBus.busNumber,
      issue: issue.trim(),
      severity,
    });
  };

  const garageLabel = garage === "north" ? "North Garage" : "South Garage";

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-[22px] p-7 pb-6"
    >
      {/* Header */}
      <div>
        <h2
          id="log-repair-title"
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: "#222222",
            letterSpacing: "-0.03em",
            margin: 0,
            marginBottom: 4,
          }}
        >
          Log new repair
        </h2>
        <p
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: "#929292",
            margin: 0,
          }}
        >
          {garageLabel} · Adds to Intake
        </p>
      </div>

      {/* Field 1: Bus */}
      <div>
        <FieldLabel htmlFor="bus-number-input">Which bus?</FieldLabel>

        {recentBuses.length > 0 && !selectedBus && (
          <div className="mb-2.5 flex flex-wrap items-center gap-1.5">
            <span className="mr-0.5 self-center text-[11px] font-semibold uppercase tracking-[0.04em] text-[#b5b5b5]">
              Recent
            </span>
            {recentBuses.map((b) => (
              <RecentChip
                key={b.id}
                label={`#${b.busNumber}`}
                onClick={() => handlePickBus(b.id)}
              />
            ))}
          </div>
        )}

        {selectedBus ? (
          <div
            className="flex items-center justify-between rounded-[12px] border-[1.5px] px-4 py-3.5"
            style={{
              background: "#fdf0ed",
              borderColor: BRAND_COLOR,
            }}
          >
            <div className="flex flex-col gap-0.5">
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#222222",
                  letterSpacing: "-0.02em",
                }}
              >
                Bus #{selectedBus.busNumber}
              </span>
              <span style={{ fontSize: 12, fontWeight: 500, color: "#6a6a6a" }}>
                {selectedBus.model} · {selectedBus.mileage.toLocaleString()} mi
              </span>
            </div>
            <Button
              type="button"
              variant="link"
              size="sm"
              onClick={handleClearBus}
              className="text-[13px] text-[var(--primary)] no-underline hover:underline-offset-4 px-2"
            >
              Change
            </Button>
          </div>
        ) : (
          <>
            <Input
              id="bus-number-input"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Type bus number (e.g. 147)"
              value={busQuery}
              onChange={(e) => handleBusQueryChange(e.target.value)}
              autoComplete="off"
              className="h-12 text-[15px]"
            />
            {matchingBuses.length > 0 && (
              <div className="mt-2.5 grid grid-cols-4 gap-1.5">
                {matchingBuses.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => handlePickBus(b.id)}
                    className="rounded-[10px] border-[1.5px] border-transparent bg-[#f7f7f7] px-2 py-2.5 text-sm font-bold text-[#222222] transition-colors hover:border-[var(--primary)] hover:bg-[#fdf0ed] cursor-pointer"
                  >
                    #{b.busNumber}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Field 2: Issue */}
      <div>
        <FieldLabel htmlFor="issue-input">What&rsquo;s wrong?</FieldLabel>
        <div className="mb-2.5 grid grid-cols-3 gap-1.5">
          {ISSUE_TEMPLATES.map((t) => {
            const isActive = issue === t.defaultIssue && t.label !== "Other";
            return (
              <button
                key={t.label}
                type="button"
                aria-pressed={isActive}
                onClick={() => handlePickIssue(t)}
                className="rounded-[10px] border-[1.5px] px-2.5 py-2.5 text-[13px] font-semibold transition-colors cursor-pointer"
                style={{
                  color: isActive ? BRAND_COLOR : "#6a6a6a",
                  background: isActive ? "#fdf0ed" : "#f7f7f7",
                  borderColor: isActive ? BRAND_COLOR : "transparent",
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>
        <Input
          id="issue-input"
          ref={issueInputRef}
          type="text"
          placeholder="Describe the issue (or tap a chip above)"
          value={issue}
          onChange={(e) => setIssue(e.target.value)}
          maxLength={120}
        />
      </div>

      {/* Field 3: Severity */}
      <div>
        <FieldLabel>How urgent?</FieldLabel>
        <div
          role="radiogroup"
          aria-label="Severity"
          className="grid grid-cols-3 gap-2"
        >
          {SEVERITY_ORDER.map((sev) => {
            const sc = SEVERITY_COLORS[sev];
            const isActive = severity === sev;
            return (
              <button
                key={sev}
                type="button"
                role="radio"
                aria-checked={isActive}
                onClick={() => setSeverity(sev)}
                className="inline-flex min-h-14 items-center justify-center gap-1.5 rounded-[12px] border-2 px-3 py-3.5 text-sm font-bold transition-colors cursor-pointer"
                style={{
                  color: isActive ? sc.text : "#6a6a6a",
                  background: isActive ? sc.bg : "#f7f7f7",
                  borderColor: isActive ? sc.border : "transparent",
                }}
              >
                <span
                  style={{
                    display: "flex",
                    color: isActive ? sc.dot : "#b5b5b5",
                    width: 16,
                    height: 16,
                  }}
                >
                  {SEVERITY_ICONS[sev]}
                </span>
                {SEVERITY_LABELS[sev]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-1.5 flex items-center justify-end gap-2.5">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!canSubmit} size="lg">
          Add to Intake
          <span aria-hidden="true">&rarr;</span>
        </Button>
      </div>
    </form>
  );
}

function FieldLabel({
  children,
  htmlFor,
}: {
  children: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-2.5 block text-[13px] font-semibold text-[#222222]"
    >
      {children}
    </label>
  );
}

function RecentChip({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border-[1.5px] border-transparent bg-[#f2f2f2] px-3 py-1.5 text-[13px] font-semibold text-[#222222] transition-colors hover:border-[var(--primary)] hover:bg-[#fdf0ed] cursor-pointer"
    >
      {label}
    </button>
  );
}
