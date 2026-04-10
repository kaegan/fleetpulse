"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { Bus } from "@/data/types";
import { workOrders } from "@/data/work-orders";
import {
  STATUS_COLORS,
  STATUS_LABELS,
  PM_INTERVAL_MILES,
  SEVERITY_COLORS,
  SEVERITY_LABELS,
  STAGES,
} from "@/lib/constants";
import { formatNumber, milesUntilPm } from "@/lib/utils";

interface BusDetailPanelProps {
  bus: Bus | null;
  onClose: () => void;
}

export function BusDetailPanel({ bus, onClose }: BusDetailPanelProps) {
  return (
    <AnimatePresence>
      {bus && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.2)",
              zIndex: 40,
            }}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 400, damping: 35 }}
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              bottom: 0,
              width: 400,
              background: "#ffffff",
              zIndex: 50,
              boxShadow:
                "0px 0px 0px 1px rgba(0,0,0,0.04), 0px 8px 24px rgba(0,0,0,0.12), 0px 16px 32px rgba(0,0,0,0.08)",
              overflow: "auto",
            }}
          >
            <PanelContent bus={bus} onClose={onClose} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function PanelContent({ bus, onClose }: { bus: Bus; onClose: () => void }) {
  const color = STATUS_COLORS[bus.status];
  const busWorkOrders = workOrders.filter((wo) => wo.busId === bus.id);
  const milesLeft = milesUntilPm(bus);
  const pmProgress = Math.min(
    ((bus.mileage - bus.lastPmMileage) / PM_INTERVAL_MILES) * 100,
    100
  );

  return (
    <div style={{ padding: 28 }}>
      {/* Close button */}
      <button
        onClick={onClose}
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          width: 32,
          height: 32,
          borderRadius: "50%",
          border: "none",
          background: "#f2f2f2",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 16,
          color: "#6a6a6a",
        }}
      >
        &times;
      </button>

      {/* Bus number */}
      <h2
        style={{
          fontSize: 28,
          fontWeight: 700,
          color: "#222222",
          letterSpacing: "-0.03em",
          marginBottom: 4,
        }}
      >
        Bus #{bus.busNumber}
      </h2>

      {/* Status + garage */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 28,
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
            fontWeight: 600,
            padding: "4px 12px",
            borderRadius: 8,
            background:
              bus.status === "road-call" ? "#f5f5f5" : `${color}18`,
            color:
              bus.status === "running"
                ? "#166534"
                : bus.status === "pm-due"
                  ? "#92400e"
                  : bus.status === "in-maintenance"
                    ? "#991b1b"
                    : "#222222",
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: color,
            }}
          />
          {STATUS_LABELS[bus.status]}
        </span>
        <span style={{ fontSize: 13, fontWeight: 500, color: "#929292" }}>
          {bus.garage === "north" ? "North Garage" : "South Garage"}
        </span>
      </div>

      {/* Vehicle info */}
      <SectionLabel>Vehicle Info</SectionLabel>
      <InfoGrid>
        <InfoRow label="Model" value={bus.model} />
        <InfoRow label="Year" value={String(bus.year)} />
        <InfoRow label="Mileage" value={`${formatNumber(bus.mileage)} mi`} />
      </InfoGrid>

      {/* PM Status */}
      <SectionLabel>Preventive Maintenance</SectionLabel>
      <div
        style={{
          background: "#fafaf9",
          borderRadius: 14,
          padding: 16,
          marginBottom: 24,
          border: "1px solid rgba(0,0,0,0.04)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 10,
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 500, color: "#6a6a6a" }}>
            A-Service (every {formatNumber(PM_INTERVAL_MILES)} mi)
          </span>
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: milesLeft <= 0 ? "#ef4444" : milesLeft < 1000 ? "#f59e0b" : "#22c55e",
            }}
          >
            {milesLeft <= 0
              ? `${formatNumber(Math.abs(milesLeft))} mi overdue`
              : `${formatNumber(milesLeft)} mi remaining`}
          </span>
        </div>

        {/* Progress bar */}
        <div
          style={{
            height: 6,
            background: "#f2f2f2",
            borderRadius: 3,
            overflow: "hidden",
            marginBottom: 10,
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${pmProgress}%`,
              background:
                pmProgress >= 100
                  ? "#ef4444"
                  : pmProgress > 80
                    ? "#f59e0b"
                    : "#22c55e",
              borderRadius: 3,
              transition: "width 0.3s ease",
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 11,
            fontWeight: 500,
            color: "#b5b5b5",
          }}
        >
          <span>Last PM: {formatNumber(bus.lastPmMileage)} mi</span>
          <span>Due: {formatNumber(bus.nextPmDueMileage)} mi</span>
        </div>
      </div>

      {/* Active Work Orders */}
      {busWorkOrders.length > 0 && (
        <>
          <SectionLabel>Active Work Orders</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {busWorkOrders.map((wo) => {
              const sev = SEVERITY_COLORS[wo.severity];
              return (
                <div
                  key={wo.id}
                  style={{
                    background: "#fafaf9",
                    borderRadius: 14,
                    padding: 14,
                    borderLeft: `4px solid ${sev.border}`,
                    border: "1px solid rgba(0,0,0,0.04)",
                    borderLeftWidth: 4,
                    borderLeftColor: sev.border,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 6,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#222222",
                      }}
                    >
                      {wo.issue}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: sev.text,
                        background: sev.bg,
                        padding: "2px 8px",
                        borderRadius: 6,
                      }}
                    >
                      {SEVERITY_LABELS[wo.severity]}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 12,
                      fontWeight: 500,
                      color: "#929292",
                    }}
                  >
                    <span style={{ fontFamily: "monospace" }}>{wo.id}</span>
                    <span>{STAGES[wo.stage]}</span>
                  </div>
                  {wo.mechanicName && (
                    <div
                      style={{
                        marginTop: 6,
                        fontSize: 12,
                        fontWeight: 500,
                        color: "#b5b5b5",
                      }}
                    >
                      Assigned: {wo.mechanicName}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {busWorkOrders.length === 0 && (
        <>
          <SectionLabel>Work Orders</SectionLabel>
          <p
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: "#b5b5b5",
              padding: "12px 0",
            }}
          >
            No active work orders for this bus.
          </p>
        </>
      )}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 600,
        textTransform: "uppercase" as const,
        letterSpacing: "0.06em",
        color: "#929292",
        marginBottom: 10,
      }}
    >
      {children}
    </div>
  );
}

function InfoGrid({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        gap: 10,
        marginBottom: 24,
      }}
    >
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        background: "#fafaf9",
        borderRadius: 10,
        padding: "10px 14px",
        border: "1px solid rgba(0,0,0,0.04)",
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 500,
          color: "#b5b5b5",
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: "#222222",
          letterSpacing: "-0.01em",
        }}
      >
        {value}
      </div>
    </div>
  );
}
