"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PhoneColumn } from "@/components/driver/phone-column";
import { StatusHeader } from "@/components/driver/status-header";
import {
  BottomTabBar,
  type DriverTab,
} from "@/components/driver/bottom-tab-bar";
import { TripTab } from "@/components/driver/tabs/trip-tab";
import { ScheduleTab } from "@/components/driver/tabs/schedule-tab";
import { TodayTab } from "@/components/driver/tabs/today-tab";
import { InboxTab } from "@/components/driver/tabs/inbox-tab";
import {
  buildShift,
  findActiveTrip,
  snapshotFor,
  type DriverPersona,
  type DriverShift,
  type TripSubStatus,
} from "@/data/driver-day";

/**
 * Spare Driver prototype — top-level client component.
 *
 * Owns:
 *  - the shift data (computed client-side on mount to avoid SSR/hydration
 *    mismatch — timestamps depend on a local clock)
 *  - which tab is showing (`activeTab`)
 *  - which trip the driver is currently on (`currentTripId`)
 *  - sub-status within that trip (en-route → arrived → picked-up → dropped-off)
 *  - whether the schedule-update banner has been dismissed (shared across
 *    Trip and Schedule tabs; also drives the Inbox unread indicator)
 */
export function DriverView() {
  const [persona, setPersona] = useState<DriverPersona>("jane");
  const [shift, setShift] = useState<DriverShift | null>(null);
  const [activeTab, setActiveTab] = useState<DriverTab>("trip");
  const [currentTripId, setCurrentTripId] = useState<string | null>(null);
  const [subStatus, setSubStatus] = useState<TripSubStatus>("en-route");
  const [bannerDismissed, setBannerDismissed] = useState(false);

  // Rebuild the shift whenever the persona changes. Derived state that
  // depends on the shift (active trip, sub-status, banner dismissal) also
  // resets so the new persona starts from a clean mid-shift view.
  useEffect(() => {
    const built = buildShift(persona);
    setShift(built);
    setCurrentTripId(findActiveTrip(built)?.id ?? null);
    setSubStatus("en-route");
    setBannerDismissed(false);
  }, [persona]);

  const handleSwapPersona = useCallback(() => {
    setPersona((p) => (p === "jane" ? "marcus" : "jane"));
  }, []);

  const currentTrip = useMemo(() => {
    if (!shift || !currentTripId) return null;
    return shift.trips.find((t) => t.id === currentTripId) ?? null;
  }, [shift, currentTripId]);

  const advance = useCallback(() => {
    if (!shift) return;
    const wasDroppedOff = subStatus === "dropped-off";
    setSubStatus((prev) => {
      switch (prev) {
        case "en-route":
          return "arrived";
        case "arrived":
          return "picked-up";
        case "picked-up":
          return "dropped-off";
        case "dropped-off":
          return "en-route";
      }
    });
    if (wasDroppedOff) {
      setCurrentTripId((prevId) => {
        if (!prevId) return null;
        const idx = shift.trips.findIndex((t) => t.id === prevId);
        const next = shift.trips.slice(idx + 1).find((t) => !t.isBreak);
        return next?.id ?? null;
      });
    }
  }, [shift, subStatus]);

  const handleSelectTripFromSchedule = useCallback((tripId: string) => {
    setCurrentTripId(tripId);
    setSubStatus("en-route");
    setActiveTab("trip");
  }, []);

  const handleDismissBanner = useCallback(() => {
    setBannerDismissed(true);
  }, []);

  const handleViewChanges = useCallback(() => {
    setActiveTab("schedule");
  }, []);

  // Pre-mount skeleton. Matches the final layout shape so the content
  // doesn't jump when the shift data lands.
  if (!shift) {
    return (
      <PhoneColumn>
        <div className="flex flex-1 items-center justify-center">
          <div className="size-6 animate-pulse rounded-full bg-[var(--color-brand)]/40" />
        </div>
      </PhoneColumn>
    );
  }

  const unreadInbox = !bannerDismissed && shift.latestUpdate != null;

  return (
    <PhoneColumn>
      <StatusHeader shift={shift} />

      {activeTab === "trip" && (
        <TripTab
          shift={shift}
          activeTrip={currentTrip}
          subStatus={subStatus}
          latestUpdate={shift.latestUpdate}
          bannerDismissed={bannerDismissed}
          onDismissBanner={handleDismissBanner}
          onAdvance={advance}
          onJumpToSchedule={handleViewChanges}
        />
      )}
      {activeTab === "schedule" && (
        <ScheduleTab
          shift={shift}
          latestUpdate={shift.latestUpdate}
          bannerDismissed={bannerDismissed}
          onDismissBanner={handleDismissBanner}
          onSelectTrip={handleSelectTripFromSchedule}
        />
      )}
      {activeTab === "today" && (
        <TodayTab
          shift={shift}
          snapshot={snapshotFor(persona)}
          persona={persona}
          onSwapPersona={handleSwapPersona}
        />
      )}
      {activeTab === "inbox" && (
        <InboxTab
          shift={shift}
          latestUpdate={shift.latestUpdate}
          unread={unreadInbox}
        />
      )}

      <BottomTabBar
        active={activeTab}
        onChange={setActiveTab}
        unreadInbox={unreadInbox}
      />
    </PhoneColumn>
  );
}
