"use client";

import { useMemo, useRef, useState } from "react";
import { buses } from "@/data/buses";
import { busHistory, getBusHistory } from "@/data/bus-history";
import { MECHANICS } from "@/data/mechanics";
import type {
  Bus,
  BusHistoryEntry,
  Garage,
  HistoryOutcome,
  Severity,
} from "@/data/types";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LogRepairDraft {
  busId: number;
  busNumber: string;
  issue: string;
  severity: Severity;
  assignedTo: string | null;
}

interface LogRepairFormProps {
  garage: Garage;
  recentBusNumbers: string[];
  onCancel: () => void;
  onSubmit: (draft: LogRepairDraft) => void;
  /** Called when the mechanic taps into a related bus from the similarity
   *  peek. Parent should close the form and open the bus detail panel. */
  onViewBus?: (bus: Bus) => void;
}

const SEVERITY_ORDER: Severity[] = ["critical", "high", "routine"];

export function LogRepairForm({
  garage,
  recentBusNumbers,
  onCancel,
  onSubmit,
  onViewBus,
}: LogRepairFormProps) {
  const [busId, setBusId] = useState<number | null>(null);
  const [busQuery, setBusQuery] = useState("");
  const [issue, setIssue] = useState("");
  const [severity, setSeverity] = useState<Severity | null>(null);
  const [assignedTo, setAssignedTo] = useState<string | null>(CURRENT_MECHANIC);

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

  // M-2: if the selected bus was recently worked on at the *other* garage,
  // surface that the moment the mechanic picks the bus — before they start
  // diagnosing. Reuses the same 14-day window the BusDetailPanel uses.
  const crossGarageCallout = useMemo(() => {
    if (!selectedBus) return null;
    return getCrossGarageCallout(selectedBus, getBusHistory(selectedBus.id));
  }, [selectedBus]);

  // M-4: once a symptom has been entered, look across all service history for
  // recent jobs on *other* buses at the other garage matching the same
  // keyword. Surfaces "has anyone else seen this?" without the mechanic having
  // to go hunt.
  const similarIssues = useMemo<SimilarIssueMatch[]>(() => {
    const trimmed = issue.trim();
    if (trimmed.length < 3) return [];
    return getSimilarRecentIssues(trimmed, busHistory, {
      withinDays: 30,
      excludeBusId: selectedBus?.id,
      excludeGarage: garage,
      onlyOtherGarage: true,
    }).slice(0, 3);
  }, [issue, selectedBus, garage]);

  const handleOpenSimilarBus = (matchBusId: number) => {
    if (!onViewBus) return;
    const bus = buses.find((b) => b.id === matchBusId);
    if (bus) onViewBus(bus);
  };

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
          className="mb-0.5 text-[19px] font-bold leading-[1.2] tracking-[-0.03em] text-foreground sm:text-[22px]"
        >
          Log new repair
        </h2>
        <p className="hidden text-[13px] font-medium text-text-muted sm:block sm:text-[14px]">
          {garageLabel} · Adds to Intake
        </p>
      </div>

      {/* Field 1: Bus */}
      <div>
        <FieldLabel htmlFor="bus-number-input">Which bus?</FieldLabel>

        {recentBuses.length > 0 && !selectedBus && (
          <div className="mb-2.5 hidden flex-wrap items-center gap-1.5 sm:flex">
            <span className="mr-0.5 self-center text-[11px] font-semibold uppercase tracking-[0.04em] text-text-faint">
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
            <div className="flex items-center justify-between rounded-[12px] border-[1.5px] border-brand bg-brand-light px-3.5 py-2.5 sm:px-4 sm:py-3.5">
              <div className="flex flex-col gap-0.5">
                <span className="text-[16px] font-bold tracking-[-0.02em] text-foreground">
                  Bus #{selectedBus.busNumber}
                </span>
                <span className="text-[12px] font-medium text-text-secondary">
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
                    className="cursor-pointer rounded-[10px] border-[1.5px] border-transparent bg-muted px-2 py-2.5 text-sm font-bold text-foreground transition-colors hover:border-brand hover:bg-brand-light"
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
                  color: isActive ? BRAND_COLOR : "var(--color-text-secondary)",
                  background: isActive ? "var(--color-brand-light)" : "var(--color-surface-warm)",
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
            onPickBus={onViewBus ? handleOpenSimilarBus : undefined}
          />
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
                className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-[12px] border-2 px-3 py-2.5 text-sm font-bold transition-colors cursor-pointer sm:min-h-14 sm:py-3.5"
                style={{
                  color: isActive ? sc.text : "var(--color-text-secondary)",
                  background: isActive ? sc.bg : "var(--color-surface-warm)",
                  borderColor: isActive ? sc.border : "transparent",
                }}
              >
                <span
                  style={{
                    display: "flex",
                    color: isActive ? sc.dot : "var(--color-text-faint)",
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
        <FieldLabel htmlFor="assigned-to-select">Assigned to</FieldLabel>
        <Select
          value={assignedTo ?? ""}
          onValueChange={(v) => setAssignedTo(v === "" ? null : v)}
        >
          <SelectTrigger id="assigned-to-select" className="h-11 text-[14px] sm:h-12">
            <SelectValue placeholder="Unassigned" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Unassigned</SelectItem>
            {MECHANICS.map((m) => (
              <SelectItem key={m} value={m}>
                {m === CURRENT_MECHANIC ? `${m} (you)` : m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
      className="mb-0.5 block text-[13px] font-semibold text-foreground sm:mb-2.5"
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
      className="cursor-pointer rounded-full border-[1.5px] border-transparent bg-muted px-3 py-1.5 text-[13px] font-semibold text-foreground transition-colors hover:border-brand hover:bg-brand-light"
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
    <div className="mt-2 flex items-start gap-2.5 rounded-[12px] border border-brand/25 bg-brand-light px-3 py-2.5">
      <span className="mt-[1px] shrink-0 text-[15px] leading-none" aria-hidden>
        ⚠️
      </span>
      <div className="min-w-0 flex-1">
        <div className="mb-0.5 text-[10px] font-bold uppercase tracking-[0.04em] text-brand">
          Arrived from {otherGarageLabel} · {whenLabel}
        </div>
        <div className="text-[12px] font-medium leading-[1.4] text-text-secondary">
          {entry.issue} — {outcomeLead}
          {entry.note && (
            <>
              {" "}
              <span className="italic text-text-muted">
                &ldquo;{entry.note}&rdquo;
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// M-4: when the mechanic enters an issue, show up to 3 related jobs at the
// other garage. Each row is tappable — opens the referenced bus's detail
// panel so the mechanic can compare notes before committing.
function SimilarIssuesPeek({
  matches,
  currentGarage,
  onPickBus,
}: {
  matches: SimilarIssueMatch[];
  currentGarage: Garage;
  onPickBus?: (busId: number) => void;
}) {
  const otherGarageLabel = currentGarage === "north" ? "South" : "North";
  return (
    <div className="mt-2 rounded-[12px] border border-border bg-card-hover p-2.5">
      <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.04em] text-text-secondary">
        {matches.length} similar{" "}
        {matches.length === 1 ? "job" : "jobs"} at {otherGarageLabel} Garage in
        the last 30 days
      </div>
      <div className="flex flex-col gap-1">
        {matches.map((m) => {
          const busNumber = String(m.busId).padStart(3, "0");
          const whenLabel =
            m.daysAgo === 0
              ? "today"
              : m.daysAgo === 1
                ? "yesterday"
                : `${m.daysAgo}d ago`;
          const outcomeTag = OUTCOME_MINI[m.entry.outcome];
          const body = (
            <div className="flex w-full items-center gap-2 text-[12px]">
              <span className="font-bold text-foreground">
                #{busNumber}
              </span>
              <span className="min-w-0 flex-1 truncate font-medium text-text-secondary">
                {m.entry.issue}
              </span>
              <span
                className="shrink-0 rounded-full px-1.5 py-[1px] text-[10px] font-bold uppercase tracking-[0.02em]"
                style={{ background: outcomeTag.bg, color: outcomeTag.color }}
              >
                {outcomeTag.label}
              </span>
              <span className="shrink-0 text-[11px] font-medium text-text-muted">
                {whenLabel}
              </span>
            </div>
          );

          if (!onPickBus) {
            return (
              <div key={m.entry.id} className="px-1 py-0.5">
                {body}
              </div>
            );
          }
          return (
            <button
              key={m.entry.id}
              type="button"
              onClick={() => onPickBus(m.busId)}
              className="cursor-pointer rounded-[8px] px-1.5 py-1 text-left transition-colors hover:bg-muted"
            >
              {body}
            </button>
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
  completed: {
    label: "Done",
    color: "var(--color-severity-routine-text)",
    bg: "var(--color-severity-routine-bg)",
  },
  deferred: {
    label: "Deferred",
    color: "var(--color-severity-high-text)",
    bg: "var(--color-severity-high-bg)",
  },
  recurring: {
    label: "Recurring",
    color: "var(--color-brand)",
    bg: "var(--color-brand-light)",
  },
};
