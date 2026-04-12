"use client";

import { useMemo, type ReactNode } from "react";
import { SectionPill } from "@/components/section-pill";
import { Card } from "@/components/ui/card";
import { AreaChart } from "@/components/ui/area-chart";
import type { AvailabilityDataPoint } from "@/data/availability-history";

type DeltaDirection = "up-is-good" | "down-is-good";

interface KpiCardProps {
  label: string;
  value: number;
  suffix?: string;
  color: string;
  isPrimary?: boolean;
  pillColor: string;
  pillBg: string;
  pillIcon?: ReactNode;
  /** % forecast for the primary availability card. */
  forecast?: number;
  /** Absolute number of buses available tomorrow — shown alongside the
   *  forecast percent so ops see both the rate and the decision unit. */
  forecastCount?: number;
  sparklineData?: AvailabilityDataPoint[];
  /** Count card footer: yesterday's value for the delta, tomorrow's
   *  forecast value, and which direction is "good" for this metric. When
   *  yesterdayValue is set we render a compact two-row footer instead of
   *  the primary card's single forecast row. */
  yesterdayValue?: number;
  forecastValue?: number;
  deltaDirection?: DeltaDirection;
  /** Optional line shown below the main value — used for compliance cards
   *  to surface the raw count (e.g. "10 buses overdue"). */
  subtitle?: string;
  /** Optional suffix appended to the footer delta value (e.g. "%" for rate
   *  cards). Also switches delta formatting to one decimal place. */
  footerSuffix?: string;
  /** Whole-card click — used to drill into the affected bus list. */
  onClick?: () => void;
  /** ARIA label for the clickable card. */
  ariaLabel?: string;
}

function formatSparkDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Return green/red/gray for a delta based on which direction is "good". */
function deltaColor(
  delta: number,
  direction: DeltaDirection
): string {
  if (delta === 0) return "#929292";
  const isGood =
    (delta > 0 && direction === "up-is-good") ||
    (delta < 0 && direction === "down-is-good");
  return isGood ? "#16a34a" : "#dc2626";
}

export function KpiCard({
  label,
  value,
  suffix = "",
  color,
  isPrimary = false,
  pillColor,
  pillBg,
  pillIcon,
  forecast,
  forecastCount,
  sparklineData,
  yesterdayValue,
  forecastValue,
  deltaDirection = "down-is-good",
  subtitle,
  footerSuffix,
  onClick,
  ariaLabel,
}: KpiCardProps) {
  const displayValue = suffix === "%" ? value.toFixed(1) : Math.round(value).toString();

  // Tight Y domain for sparkline: just under the lowest point, just above 95% target.
  const sparkDomain = useMemo<[number, number] | undefined>(() => {
    if (!sparklineData || sparklineData.length === 0) return undefined;
    const minVal = Math.min(...sparklineData.map((d) => d.value));
    return [minVal - 1, 96];
  }, [sparklineData]);

  const isClickable = Boolean(onClick);
  const hasCountFooter = yesterdayValue !== undefined;
  const yesterdayDelta = hasCountFooter ? value - yesterdayValue! : 0;
  const forecastDelta =
    hasCountFooter && forecastValue !== undefined
      ? forecastValue - value
      : 0;

  // Footer delta: prefer tomorrow forecast; fall back to yesterday-only
  // for cards without a forecastValue (Road Calls). Omit entirely when
  // Road Calls delta is 0 — unplanned breakdowns aren't forecastable so
  // "steady" isn't meaningful. For other cards, show "→ steady".
  const footerDelta = (() => {
    if (!hasCountFooter) return null;
    const useForecast = forecastValue !== undefined;
    const delta = useForecast ? forecastDelta : yesterdayDelta;
    const timeLabel = useForecast ? "tomorrow" : "since yesterday";
    if (!useForecast && delta === 0) return null;
    return { delta, timeLabel };
  })();

  const cardClassName =
    "min-w-0 h-full rounded-lg shadow-card transition-shadow " +
    (isPrimary
      ? "p-5 sm:p-6 md:p-[28px_32px]"
      : "p-4 sm:p-5 md:p-[24px_28px]") +
    (isClickable
      ? " cursor-pointer hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
      : "");

  const cardInner = (
    <Card
      className={cardClassName}
      // When clickable, the outer <button> handles keyboard + click. We still
      // keep the Card's visual hover style above for the shadow lift.
      role={isClickable ? undefined : undefined}
    >
      <div className="flex min-w-0" style={{ marginBottom: isPrimary ? 20 : 14 }}>
        <SectionPill
          label={label}
          color={pillColor}
          bgColor={pillBg}
          icon={pillIcon}
        />
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 4,
        }}
      >
        <span
          className={
            "font-bold tracking-[-0.03em] leading-none " +
            (isPrimary
              ? "text-5xl sm:text-6xl md:text-[72px]"
              : "text-[32px] sm:text-[36px] md:text-[40px]")
          }
          style={{ color }}
        >
          {displayValue}
        </span>
        {suffix && (
          <span
            className={
              "font-semibold opacity-50 " +
              (isPrimary
                ? "text-2xl sm:text-3xl md:text-[36px]"
                : "text-lg sm:text-xl md:text-[24px]")
            }
            style={{ color }}
          >
            {suffix}
          </span>
        )}
      </div>
      {subtitle && (
        <p className="mt-1.5 text-[13px] font-medium" style={{ color: "#929292" }}>
          {subtitle}
        </p>
      )}
      {sparklineData ? (
        <div style={{ marginTop: 20, paddingTop: 24 }}>
          <AreaChart
            data={sparklineData}
            index="date"
            category="value"
            color={color}
            height={120}
            yDomain={sparkDomain}
            targetValue={95}
            targetLabel="95% target"
            formatValue={(v) => `${v.toFixed(1)}%`}
            formatIndex={formatSparkDate}
          />
        </div>
      ) : suffix === "%" && !hasCountFooter ? (
        <div
          style={{
            marginTop: 20,
            height: 8,
            background: "#f2f2f2",
            borderRadius: 999,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${value}%`,
              background: color,
              borderRadius: 999,
            }}
          />
        </div>
      ) : null}

      {/* Primary-card forecast row (Fleet Availability only) */}
      {forecast !== undefined && !hasCountFooter && (
        <div className="mt-3.5 flex flex-wrap items-center gap-2">
          <span className="text-[13px] font-medium text-[#6a6a6a]">
            Tomorrow (est.)
          </span>
          <span
            className="text-[15px] font-bold"
            style={{ color: forecast > value ? "#22c55e" : "#6a6a6a" }}
          >
            {forecast.toFixed(1)}%
          </span>
          {forecastCount !== undefined && (
            <span className="text-[13px] font-medium text-[#929292]">
              · {forecastCount} buses
            </span>
          )}
          {forecast > value && (
            <span className="text-[13px] font-semibold text-[#22c55e]">
              +{(forecast - value).toFixed(1)}
            </span>
          )}
        </div>
      )}

      {/* Count-card footer: single directional delta */}
      {footerDelta !== null && (
        <div className="mt-5 border-t border-black/[0.06] pt-3">
          {footerDelta.delta === 0 ? (
            <span className="text-[13px] font-medium text-[#929292]">
              → steady
            </span>
          ) : (
            <span
              className="text-[13px] font-bold tabular-nums"
              style={{ color: deltaColor(footerDelta.delta, deltaDirection) }}
            >
              {footerDelta.delta > 0 ? "↑" : "↓"}{footerSuffix ? Math.abs(footerDelta.delta).toFixed(1) : Math.abs(footerDelta.delta)}{footerSuffix ?? ""} {footerDelta.timeLabel}
            </span>
          )}
        </div>
      )}
    </Card>
  );

  if (!isClickable) return cardInner;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className="block w-full h-full min-w-0 cursor-pointer text-left rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 transition-transform active:scale-[0.995]"
    >
      {cardInner}
    </button>
  );
}
