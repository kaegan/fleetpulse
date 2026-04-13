"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFleet } from "@/contexts/fleet-context";
import { getBusHistory } from "@/data/bus-history";
import { MECHANICS } from "@/data/mechanics";
import type {
  Bus,
  BusHistoryEntry,
  Garage,
  HistoryOutcome,
  Severity,
} from "@/data/types";
import {
  isAccessibilityIssue,
  ACCESSIBILITY_ESCALATION_NOTICE,
} from "@/lib/accessibility";
import { IconAccessibilityFillDuo18 } from "nucleo-ui-fill-duo-18";
import {
  BRAND_COLOR,
  CURRENT_MECHANIC,
  ISSUE_TEMPLATES,
  SEVERITY_COLORS,
  SEVERITY_LABELS,
  SEVERITY_ICONS,
} from "@/lib/constants";
import {
  getCrossGarageCallout,
  getSimilarRecentIssues,
  type SimilarIssueMatch,
} from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface LogRepairDraft {
  busId: number;
  busNumber: string;
  issue: string;
  severity: Severity;
  assignedTo: string | null;
}

/** In-progress form state, saved when the mechanic navigates away (e.g. to
 *  peek at a similar bus) so it can be restored when they come back. */
export interface LogRepairFormSnapshot {
  busId: number | null;
  busQuery: string;
  issue: string;
  severity: Severity | null;
  assignedTo: string | null;
}

interface LogRepairFormProps {
  garage: Garage;
  recentBusNumbers: string[];
  /** Restore a previously saved form snapshot (e.g. after returning from a
   *  similar-bus detail drill-down). */
  initialSnapshot?: LogRepairFormSnapshot | null;
  onCancel: () => void;
  onSubmit: (draft: LogRepairDraft) => void;
  /** Called when the mechanic taps into a related bus from the similarity
   *  peek. Parent should close the form and open the bus detail panel.
   *  The snapshot contains the current form state so it can be restored. */
  onViewBus?: (bus: Bus, snapshot: LogRepairFormSnapshot) => void;
}

const SEVERITY_ORDER: Severity[] = ["critical", "high", "routine"];

export function LogRepairForm({
  garage,
  recentBusNumbers,
  initialSnapshot,
  onCancel,
  onSubmit,
  onViewBus,
}: LogRepairFormProps) {
  const [busId, setBusId] = useState<number | null>(initialSnapshot?.busId ?? null);
  const [busQuery, setBusQuery] = useState(initialSnapshot?.busQuery ?? "");
  const [issue, setIssue] = useState(initialSnapshot?.issue ?? "");
  const [severity, setSeverity] = useState<Severity | null>(initialSnapshot?.severity ?? null);
  const [assignedTo, setAssignedTo] = useState<string | null>(initialSnapshot?.assignedTo ?? CURRENT_MECHANIC);

  const issueInputRef = useRef<HTMLInputElement>(null);
  const { buses } = useFleet();

  // Buses in the current garage, for both the prefix filter and recent chips.
  const garageBuses = useMemo(
    () => buses.filter((b) => b.garage === garage),
    [buses, garage]
  );

  const selectedBus = useMemo(
    () => (busId ? garageBuses.find((b) => b.id === busId) ?? null : null),
    [busId, garageBuses]
  );

  // M-2: if the selected bus was recently worked on at the *other* garage,
  // surface that the moment the mechanic picks the bus — before they start
  // triaging. Reuses the same 14-day window the BusDetailPanel uses.
  const crossGarageCallout = useMemo(() => {
    if (!selectedBus) return null;
    return getCrossGarageCallout(selectedBus, getBusHistory(selectedBus.id));
  }, [selectedBus]);

  // M-4: once a bus is selected and a symptom entered, look at that bus's own
  // service history for recent jobs matching the same keyword. Surfaces "did
  // this bus just have this work done?" before the mechanic commits.
  const similarIssues = useMemo<SimilarIssueMatch[]>(() => {
    if (!selectedBus) return [];
    const trimmed = issue.trim();
    if (trimmed.length < 3) return [];
    const busOnlyHistory = { [selectedBus.id]: getBusHistory(selectedBus.id) };
    return getSimilarRecentIssues(trimmed, busOnlyHistory, {
      withinDays: 30,
    }).slice(0, 3);
  }, [issue, selectedBus]);

  // Auto-escalate severity to Critical when the issue involves accessibility equipment.
  const accessibilityDetected = useMemo(
    () => issue.trim().length >= 3 && isAccessibilityIssue(issue),
    [issue]
  );

  useEffect(() => {
    if (accessibilityDetected) setSeverity("critical");
  }, [accessibilityDetected]);

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
      .filter((b) => b.busNumber.startsWith(q.padStart(3, "0")) || b.busNumber.startsWith(q))
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
      assignedTo,
    });
  };

  const garageLabel = garage === "north" ? "North Garage" : "South Garage";

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-2.5 p-5 sm:gap-[22px] sm:p-7 sm:pb-6"
    >
      {/* Header */}
      <div>
        <h2
          id="log-repair-title"
          className="text-[19px] sm:text-[22px]"
          style={{
            fontWeight: 600,
            color: "#222222",
            letterSpacing: "-0.03em",
            margin: 0,
            marginBottom: 2,
            lineHeight: 1.2,
          }}
        >
          Log new repair
        </h2>
        <p
          className="hidden sm:block text-[13px] sm:text-[14px]"
          style={{
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
          <div className="mb-2.5 hidden flex-wrap items-center gap-1.5 sm:flex">
            <span className="mr-0.5 self-center text-[12px] font-medium text-[#929292]">
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
          <>
            <div
              className="flex items-center justify-between rounded-[12px] border-[1.5px] px-3.5 py-2.5 sm:px-4 sm:py-3.5"
              style={{
                background: "#fdf0ed",
                borderColor: BRAND_COLOR,
              }}
            >
              <div className="flex flex-col gap-0.5">
                <span
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
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
            {crossGarageCallout && (
              <CrossGarageInlineWarning
                entry={crossGarageCallout.entry}
                daysAgo={crossGarageCallout.daysAgo}
              />
            )}
          </>
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
              className="h-11 text-[15px] sm:h-12"
            />
            {matchingBuses.length > 0 && (
              <div className="mt-2.5 grid grid-cols-4 gap-1.5">
                {matchingBuses.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => handlePickBus(b.id)}
                    className="rounded-[10px] border-[1.5px] border-transparent bg-[#f7f7f7] px-2 py-2.5 text-sm font-semibold text-[#222222] transition-colors hover:border-[var(--primary)] hover:bg-[#fdf0ed] cursor-pointer"
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
        <div className="mb-2 grid grid-cols-3 gap-1.5 sm:mb-2.5">
          {ISSUE_TEMPLATES.map((t) => {
            const isActive = issue === t.defaultIssue && t.label !== "Other";
            return (
              <button
                key={t.label}
                type="button"
                aria-pressed={isActive}
                onClick={() => handlePickIssue(t)}
                className="overflow-hidden rounded-[10px] border-[1.5px] px-2 py-2 text-ellipsis whitespace-nowrap text-[13px] font-semibold transition-colors cursor-pointer sm:px-2.5 sm:py-2.5"
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
        {similarIssues.length > 0 && (
          <SimilarIssuesPeek
            matches={similarIssues}
            currentGarage={garage}
          />
        )}
        {accessibilityDetected && (
          <AccessibilityEscalationCallout />
        )}
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
                className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-[12px] border-2 px-3 py-2.5 text-sm font-semibold transition-colors cursor-pointer sm:min-h-14 sm:py-3.5"
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

      {/* Field 4: Assigned to */}
      <div>
        <FieldLabel htmlFor="assigned-to-select">Assigned Mechanic</FieldLabel>
        <select
          id="assigned-to-select"
          value={assignedTo ?? ""}
          onChange={(e) => setAssignedTo(e.target.value === "" ? null : e.target.value)}
          className="px-3.5 py-2.5 sm:py-3"
          style={{
            width: "100%",
            fontSize: 14,
            fontWeight: 500,
            color: "#222222",
            background: "#ffffff",
            border: "1.5px solid #e5e5e5",
            borderRadius: 12,
            outline: "none",
            boxSizing: "border-box",
            fontFamily: "inherit",
            appearance: "none",
            WebkitAppearance: "none",
            MozAppearance: "none",
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12' fill='none'><path d='M3 4.5 6 7.5 9 4.5' stroke='%236a6a6a' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/></svg>\")",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 14px center",
            paddingRight: 36,
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = BRAND_COLOR;
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "#e5e5e5";
          }}
        >
          <option value="">Unassigned</option>
          {MECHANICS.map((m) => (
            <option key={m} value={m}>
              {m === CURRENT_MECHANIC ? `${m} (you)` : m}
            </option>
          ))}
        </select>
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
      className="mb-0.5 block text-[13px] font-semibold text-[#222222] sm:mb-2.5"
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

// Compact inline version of the CrossGarageCallout from bus-detail-panel.
// Form-row scale rather than drawer-section scale — lives directly beneath
// the selected bus chip so the mechanic sees "this bus has recent work at
// the other garage" the moment they pick it.
function CrossGarageInlineWarning({
  entry,
  daysAgo,
}: {
  entry: BusHistoryEntry;
  daysAgo: number;
}) {
  const otherGarageLabel =
    entry.garage === "north" ? "North Garage" : "South Garage";
  const whenLabel =
    daysAgo === 0
      ? "earlier today"
      : daysAgo === 1
        ? "yesterday"
        : `${daysAgo} days ago`;
  const outcomeLead =
    entry.outcome === "deferred"
      ? `${entry.mechanicName} deferred this job`
      : entry.outcome === "recurring"
        ? `${entry.mechanicName} flagged a recurring issue`
        : `${entry.mechanicName} completed work`;

  return (
    <div
      className="mt-2 flex items-start gap-2.5 rounded-[12px] border border-[#f5c6b8] px-3 py-2.5"
      style={{ background: "#fdf0ed" }}
    >
      <span
        className="flex-shrink-0 text-[15px] leading-none"
        style={{ marginTop: 1 }}
        aria-hidden
      >
        ⚠️
      </span>
      <div className="min-w-0 flex-1">
        <div
          className="text-[12px] font-semibold"
          style={{ color: "#d4654a", marginBottom: 2, letterSpacing: "-0.01em" }}
        >
          Arrived from {otherGarageLabel} · {whenLabel}
        </div>
        <div
          className="text-[12px] leading-[1.4]"
          style={{ color: "#6a3b2a", fontWeight: 500 }}
        >
          {entry.issue} — {outcomeLead}
          {entry.note && (
            <>
              {" "}
              <span className="italic" style={{ color: "#8b5a44" }}>
                &ldquo;{entry.note}&rdquo;
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// M-4: when the mechanic has selected a bus and entered an issue, show recent
// service history on *that same bus* matching the keyword. Surfaces "was this
// just done?" before committing to a new ticket.
function SimilarIssuesPeek({
  matches,
}: {
  matches: SimilarIssueMatch[];
  currentGarage: Garage;
  onPickBus?: (busId: number) => void;
}) {
  return (
    <div
      className="mt-2 rounded-[12px] border border-[#e5e5e5] p-2.5"
      style={{ background: "#fafaf9" }}
    >
      <div
        className="mb-1.5 text-[12px] font-semibold"
        style={{ color: "#6a6a6a" }}
      >
        This bus had {matches.length} similar{" "}
        {matches.length === 1 ? "job" : "jobs"} in the last 30 days
      </div>
      <div className="flex flex-col gap-1">
        {matches.map((m) => {
          const whenLabel =
            m.daysAgo === 0
              ? "today"
              : m.daysAgo === 1
                ? "yesterday"
                : `${m.daysAgo}d ago`;
          const outcomeTag = OUTCOME_MINI[m.entry.outcome];
          return (
            <div key={m.entry.id} className="flex w-full items-center gap-2 px-1 py-0.5 text-[12px]">
              <span
                className="truncate font-medium text-[#6a6a6a]"
                style={{ flex: 1, minWidth: 0 }}
              >
                {m.entry.issue}
              </span>
              <span
                className="flex-shrink-0 rounded-full px-2 py-[2px] text-[11px] font-semibold"
                style={{ background: outcomeTag.bg, color: outcomeTag.color }}
              >
                {outcomeTag.label}
              </span>
              <span
                className="flex-shrink-0 text-[11px] font-medium"
                style={{ color: "#929292" }}
              >
                {whenLabel}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const OUTCOME_MINI: Record<
  HistoryOutcome,
  { label: string; color: string; bg: string }
> = {
  completed: { label: "Done", color: "#166534", bg: "#f0fdf4" },
  deferred: { label: "Deferred", color: "#92400e", bg: "#fffbeb" },
  recurring: { label: "Recurring", color: "#d4654a", bg: "#fdf0ed" },
};

function AccessibilityEscalationCallout() {
  return (
    <div
      className="mt-2 flex items-start gap-2.5 rounded-[12px] border border-[#bfdbfe] px-3 py-2.5"
      style={{ background: "#eff6ff" }}
    >
      <span
        className="flex h-4 w-4 flex-shrink-0"
        style={{ marginTop: 1, color: "#1e40af" }}
        aria-hidden
      >
        <IconAccessibilityFillDuo18 />
      </span>
      <div
        className="text-[12px] leading-[1.4]"
        style={{ color: "#1e40af", fontWeight: 500 }}
      >
        {ACCESSIBILITY_ESCALATION_NOTICE}
      </div>
    </div>
  );
}
