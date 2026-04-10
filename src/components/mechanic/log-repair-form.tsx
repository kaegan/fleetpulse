"use client";

import { useMemo, useRef, useState } from "react";
import { buses } from "@/data/buses";
import { MECHANICS } from "@/data/mechanics";
import type { Garage, Severity } from "@/data/types";
import {
  BRAND_COLOR,
  BRAND_COLOR_HOVER,
  CURRENT_MECHANIC,
  ISSUE_TEMPLATES,
  SEVERITY_COLORS,
  SEVERITY_LABELS,
  SEVERITY_ICONS,
} from "@/lib/constants";

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
      className="flex flex-col gap-2.5 p-5 sm:gap-5 sm:p-7 sm:pb-6"
    >
      {/* Header */}
      <div>
        <h2
          id="log-repair-title"
          className="text-[19px] sm:text-[22px]"
          style={{
            fontWeight: 700,
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
          <div
            className="hidden sm:flex"
            style={{
              flexWrap: "wrap",
              gap: 6,
              marginBottom: 10,
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#b5b5b5",
                alignSelf: "center",
                marginRight: 2,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
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
            className="px-3.5 py-2.5 sm:px-4 sm:py-3.5"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "#fdf0ed",
              border: `1.5px solid ${BRAND_COLOR}`,
              borderRadius: 12,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
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
            <button
              type="button"
              onClick={handleClearBus}
              style={{
                background: "transparent",
                border: "none",
                fontSize: 13,
                fontWeight: 600,
                color: BRAND_COLOR,
                cursor: "pointer",
                padding: "6px 8px",
                fontFamily: "inherit",
              }}
            >
              Change
            </button>
          </div>
        ) : (
          <>
            <input
              id="bus-number-input"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Type bus number (e.g. 147)"
              value={busQuery}
              onChange={(e) => handleBusQueryChange(e.target.value)}
              autoComplete="off"
              className="px-3.5 py-2.5 sm:py-3"
              style={{
                width: "100%",
                fontSize: 15,
                fontWeight: 500,
                color: "#222222",
                background: "#ffffff",
                border: "1.5px solid #e5e5e5",
                borderRadius: 12,
                outline: "none",
                boxSizing: "border-box",
                fontFamily: "inherit",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = BRAND_COLOR;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#e5e5e5";
              }}
            />
            {matchingBuses.length > 0 && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: 6,
                  marginTop: 10,
                }}
              >
                {matchingBuses.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => handlePickBus(b.id)}
                    style={{
                      padding: "10px 8px",
                      fontSize: 14,
                      fontWeight: 700,
                      color: "#222222",
                      background: "#f7f7f7",
                      border: "1.5px solid transparent",
                      borderRadius: 10,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      transition: "background 120ms ease, border-color 120ms ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#fdf0ed";
                      e.currentTarget.style.borderColor = BRAND_COLOR;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "#f7f7f7";
                      e.currentTarget.style.borderColor = "transparent";
                    }}
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
        <div
          className="grid grid-cols-3 gap-1.5 mb-2 sm:mb-2.5"
        >
          {ISSUE_TEMPLATES.map((t) => {
            const isActive = issue === t.defaultIssue && t.label !== "Other";
            return (
              <button
                key={t.label}
                type="button"
                aria-pressed={isActive}
                onClick={() => handlePickIssue(t)}
                className="px-2 py-2 sm:px-2.5 sm:py-2.5 whitespace-nowrap overflow-hidden text-ellipsis"
                style={{
                  fontSize: 13,
                  minWidth: 0,
                  fontWeight: 600,
                  color: isActive ? BRAND_COLOR : "#6a6a6a",
                  background: isActive ? "#fdf0ed" : "#f7f7f7",
                  border: `1.5px solid ${isActive ? BRAND_COLOR : "transparent"}`,
                  borderRadius: 10,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "background 120ms ease, border-color 120ms ease, color 120ms ease",
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>
        <input
          id="issue-input"
          ref={issueInputRef}
          type="text"
          placeholder="Describe the issue (or tap a chip above)"
          value={issue}
          onChange={(e) => setIssue(e.target.value)}
          maxLength={120}
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
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = BRAND_COLOR;
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "#e5e5e5";
          }}
        />
      </div>

      {/* Field 3: Severity */}
      <div>
        <FieldLabel>How urgent?</FieldLabel>
        <div
          role="radiogroup"
          aria-label="Severity"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 8,
          }}
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
                className="py-2.5 sm:py-3.5 min-h-[44px] sm:min-h-[56px]"
                style={{
                  paddingLeft: 12,
                  paddingRight: 12,
                  fontSize: 14,
                  fontWeight: 700,
                  color: isActive ? sc.text : "#6a6a6a",
                  background: isActive ? sc.bg : "#f7f7f7",
                  border: `2px solid ${isActive ? sc.border : "transparent"}`,
                  borderRadius: 12,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  transition: "background 120ms ease, border-color 120ms ease, color 120ms ease",
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
        <FieldLabel htmlFor="assigned-to-select">Assigned to</FieldLabel>
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
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: 10,
          marginTop: 2,
        }}
      >
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 sm:px-[18px] sm:py-3"
          style={{
            background: "transparent",
            border: "none",
            color: "#6a6a6a",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            borderRadius: 10,
            fontFamily: "inherit",
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!canSubmit}
          className="px-5 py-3 sm:px-[22px] sm:py-3.5 min-h-[44px] sm:min-h-[48px]"
          style={{
            background: canSubmit ? BRAND_COLOR : "#e5e5e5",
            color: "#ffffff",
            border: "none",
            fontSize: 15,
            fontWeight: 600,
            borderRadius: 12,
            cursor: canSubmit ? "pointer" : "not-allowed",
            fontFamily: "inherit",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            transition: "background 120ms ease",
          }}
          onMouseEnter={(e) => {
            if (canSubmit) e.currentTarget.style.background = BRAND_COLOR_HOVER;
          }}
          onMouseLeave={(e) => {
            if (canSubmit) e.currentTarget.style.background = BRAND_COLOR;
          }}
        >
          Add to Intake
          <span aria-hidden="true">&rarr;</span>
        </button>
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
      className="mb-0.5 sm:mb-2.5"
      style={{
        display: "block",
        fontSize: 13,
        fontWeight: 600,
        color: "#222222",
      }}
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
      style={{
        padding: "6px 12px",
        fontSize: 13,
        fontWeight: 600,
        color: "#222222",
        background: "#f2f2f2",
        border: "1.5px solid transparent",
        borderRadius: 999,
        cursor: "pointer",
        fontFamily: "inherit",
        transition: "background 120ms ease, border-color 120ms ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "#fdf0ed";
        e.currentTarget.style.borderColor = BRAND_COLOR;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "#f2f2f2";
        e.currentTarget.style.borderColor = "transparent";
      }}
    >
      {label}
    </button>
  );
}
