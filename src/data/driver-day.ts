/**
 * Spare Driver prototype — Jane M.'s day.
 *
 * All timestamps are computed relative to the moment the module loads so
 * the demo always presents a mid-shift view regardless of when it's opened.
 * Trip status (completed / in-progress / upcoming) is derived from the
 * current clock, not hard-coded — see `deriveTripStatus`.
 */

// ---------------------------------------------------------------------------
// Types

export type TripStatus = "completed" | "in-progress" | "upcoming";

/** Granular status within an in-progress trip — tracked in React state,
 *  advanced by the "forward-momentum" button on the Trip tab. */
export type TripSubStatus =
  | "en-route" // driving toward pickup
  | "arrived" // at pickup address
  | "picked-up" // passenger onboard, driving to dropoff
  | "dropped-off"; // trip finished, auto-advances to next

export interface TripAddress {
  line1: string;
  city: string;
}

export interface Trip {
  id: string;
  sequence: number;
  /** Break row — `passenger`, `pickup`, `dropoff` are omitted when true. */
  isBreak: boolean;
  passengerName?: string;
  /** Accessibility / preference note. Rendered as a muted badge. */
  passengerNote?: string;
  pickup?: TripAddress;
  dropoff?: TripAddress;
  scheduledPickupAt: string;
  scheduledDropoffAt: string;
  estimatedDurationMin: number;
  distanceMiles?: number;
  /** Set when this trip was shifted by the optimization engine. */
  wasUpdated?: boolean;
}

export interface ScheduleUpdate {
  updatedAt: string;
  tripId: string;
  summary: string;
  reason: string;
}

export interface DriverShift {
  driverName: string;
  driverInitials: string;
  vehicleId: string;
  shiftStart: string;
  shiftEnd: string;
  trips: Trip[];
  latestUpdate: ScheduleUpdate;
}

export type DriverPersona = "jane" | "marcus";

/** A single engine-driven change to the viewing driver's manifest today.
 *  Rendered as a factual log line on the Today tab. */
export interface DispatchAdjustment {
  /** ISO timestamp pinned relative to the mock clock. */
  at: string;
  /** Direction of the change relative to the viewing driver's manifest.
   *  Drives the row's icon + color without naming any peer. */
  direction: "inflow" | "outflow" | "neutral";
  /** Short description, e.g. "Trip 5 reassigned" or "2 trips added to your manifest". */
  summary: string;
  /** Factual reason suffix, e.g. "pickup window expired" or "cancellation upstream". */
  reason: string;
}

/** Ambient + personal context shown on the driver's Today tab. Same shape
 *  for every persona — only the numbers differ. */
export interface TodaySnapshot {
  /** Trips this driver typically runs on this weekday (their own rolling avg). */
  driverTypicalWeekdayTrips: number;
  /** Vans on shift in this driver's zone vs. scheduled total. */
  nearbyActiveDrivers: number;
  nearbyTotalDrivers: number;
  /** Three-bucket ride-volume signal for the zone right now. */
  todayDemandLevel: "light" | "typical" | "heavy";
  /** Vans out of service today — explains heavier fleet load. */
  vansOutOfService: number;
  /** Engine-driven changes to this driver's manifest today, most recent first. */
  adjustments: DispatchAdjustment[];
}

// ---------------------------------------------------------------------------
// Clock anchoring — pinned to a realistic morning shift.
//
//  - Shift: 8:00 AM – 4:30 PM (8.5 h, matches the handoff manifest length)
//  - Mock "now": 10:30 AM (150 min in → Trip 4 is always mid-trip)
//
// We use a *fixed* mock clock rather than Date.now()-relative so the demo
// always shows a plausible paratransit shift. The cost: the demo doesn't
// self-heal across days — but the shift window no longer reads as
// "1:28 PM – 9:58 PM" when opened in the afternoon.
//
// buildJane() and now() both run on the client only (DriverView calls
// buildJane inside a useEffect), so timezone drift between server SSR and
// client hydration isn't a concern.

/** Returns today's date at 10:30 AM local — the fixed mock "now" used by
 *  all clock-dependent UI so the prototype always shows mid-shift state. */
export function now(): Date {
  const d = new Date();
  d.setHours(10, 30, 0, 0);
  return d;
}

/** Derive a trip's visible status from the current clock. */
export function deriveTripStatus(trip: Trip, at: Date = now()): TripStatus {
  const pickup = new Date(trip.scheduledPickupAt).getTime();
  const dropoff = new Date(trip.scheduledDropoffAt).getTime();
  const t = at.getTime();
  if (t >= dropoff) return "completed";
  if (t >= pickup) return "in-progress";
  return "upcoming";
}

/** Find the single in-progress trip (or the next upcoming trip if none). */
export function findActiveTrip(shift: DriverShift, at: Date = now()): Trip | null {
  const inProgress = shift.trips.find(
    (t) => !t.isBreak && deriveTripStatus(t, at) === "in-progress"
  );
  if (inProgress) return inProgress;
  // Fall back to next upcoming (skipping breaks).
  const next = shift.trips.find(
    (t) => !t.isBreak && deriveTripStatus(t, at) === "upcoming"
  );
  return next ?? null;
}

/** Count completed / total non-break trips. */
export function getProgress(shift: DriverShift, at: Date = now()) {
  const tripsOnly = shift.trips.filter((t) => !t.isBreak);
  const completed = tripsOnly.filter(
    (t) => deriveTripStatus(t, at) === "completed"
  ).length;
  return { completed, total: tripsOnly.length };
}

/** Find gaps ≥ 15 min between consecutive non-break trips. Used by the
 *  Schedule tab to render "good time for a break" callouts. */
export interface ScheduleGap {
  beforeTripId: string;
  afterTripId: string;
  durationMin: number;
}
export function findGaps(shift: DriverShift, minMinutes = 15): ScheduleGap[] {
  const gaps: ScheduleGap[] = [];
  for (let i = 0; i < shift.trips.length - 1; i++) {
    const a = shift.trips[i];
    const b = shift.trips[i + 1];
    if (a.isBreak || b.isBreak) continue;
    const end = new Date(a.scheduledDropoffAt).getTime();
    const start = new Date(b.scheduledPickupAt).getTime();
    const delta = Math.round((start - end) / 60_000);
    if (delta >= minMinutes) {
      gaps.push({ beforeTripId: a.id, afterTripId: b.id, durationMin: delta });
    }
  }
  return gaps;
}

// ---------------------------------------------------------------------------
// Sample data — factory-computed so the timestamps can be generated on the
// client only (avoiding SSR/hydration mismatch).

export function buildJane(nowDate: Date = now()): DriverShift {
  // Shift always starts at 8:00 AM today. Mock now is 10:30 AM, so the
  // shift started 150 min before now.
  const shiftStart = new Date(nowDate);
  shiftStart.setHours(8, 0, 0, 0);
  const shiftStartMs = shiftStart.getTime();
  const nowMs = nowDate.getTime();
  const minutesFromStart = (mins: number) =>
    new Date(shiftStartMs + mins * 60_000).toISOString();

  return {
  driverName: "Jane M.",
  driverInitials: "JM",
  vehicleId: "Bus #247",
  shiftStart: minutesFromStart(0),
  shiftEnd: minutesFromStart(510), // 8h 30min shift
  latestUpdate: {
    // Two minutes before mock-now so the banner reads "2 min ago".
    updatedAt: new Date(nowMs - 2 * 60_000).toISOString(),
    tripId: "T-6",
    summary: "Trip 6 moved 10 min earlier",
    reason: "Bus #312 rerouted — covering their pickup",
  },
  trips: [
    {
      id: "T-1",
      sequence: 1,
      isBreak: false,
      passengerName: "Margaret S.",
      pickup: { line1: "742 Evergreen Terrace", city: "Springfield" },
      dropoff: { line1: "Riverside Medical Center", city: "Springfield" },
      scheduledPickupAt: minutesFromStart(15),
      scheduledDropoffAt: minutesFromStart(35),
      estimatedDurationMin: 20,
      distanceMiles: 4.2,
    },
    {
      id: "T-2",
      sequence: 2,
      isBreak: false,
      passengerName: "David R.",
      pickup: { line1: "88 Pine St", city: "Springfield" },
      dropoff: { line1: "Sunrise Adult Day Center", city: "Springfield" },
      scheduledPickupAt: minutesFromStart(45),
      scheduledDropoffAt: minutesFromStart(70),
      estimatedDurationMin: 25,
      distanceMiles: 5.8,
    },
    {
      id: "T-3",
      sequence: 3,
      isBreak: false,
      passengerName: "Patricia L.",
      passengerNote: "Dialysis — prompt pickup needed",
      pickup: { line1: "1201 Oak Ave", city: "Springfield" },
      dropoff: { line1: "Downtown Dialysis Clinic", city: "Springfield" },
      scheduledPickupAt: minutesFromStart(80),
      scheduledDropoffAt: minutesFromStart(110),
      estimatedDurationMin: 30,
      distanceMiles: 7.1,
    },
    {
      id: "T-4",
      sequence: 4,
      isBreak: false,
      passengerName: "Robert K.",
      passengerNote: "Uses wheelchair ramp",
      pickup: { line1: "305 Maple Dr", city: "Springfield" },
      dropoff: { line1: "VA Hospital", city: "Springfield" },
      scheduledPickupAt: minutesFromStart(125),
      scheduledDropoffAt: minutesFromStart(160),
      estimatedDurationMin: 35,
      distanceMiles: 8.4,
    },
    {
      id: "T-5",
      sequence: 5,
      isBreak: false,
      passengerName: "Helen T.",
      pickup: { line1: "15 Cedar Lane", city: "Springfield" },
      dropoff: { line1: "Greenfield Senior Center", city: "Springfield" },
      scheduledPickupAt: minutesFromStart(170),
      scheduledDropoffAt: minutesFromStart(195),
      estimatedDurationMin: 25,
      distanceMiles: 5.3,
    },
    {
      id: "T-6",
      sequence: 6,
      isBreak: false,
      passengerName: "James W.",
      pickup: { line1: "440 Birch St", city: "Springfield" },
      dropoff: { line1: "Physical Therapy Associates", city: "Springfield" },
      scheduledPickupAt: minutesFromStart(210),
      scheduledDropoffAt: minutesFromStart(235),
      estimatedDurationMin: 25,
      distanceMiles: 6.0,
      wasUpdated: true,
    },
    {
      id: "T-7",
      sequence: 7,
      isBreak: false,
      passengerName: "Susan P.",
      pickup: { line1: "670 Walnut Blvd", city: "Springfield" },
      dropoff: { line1: "Community Health Center", city: "Springfield" },
      scheduledPickupAt: minutesFromStart(255),
      scheduledDropoffAt: minutesFromStart(280),
      estimatedDurationMin: 25,
      distanceMiles: 5.9,
    },
    {
      id: "T-8",
      sequence: 8,
      isBreak: false,
      passengerName: "Frank D.",
      pickup: { line1: "92 Elm Court", city: "Springfield" },
      dropoff: { line1: "Riverside Medical Center", city: "Springfield" },
      scheduledPickupAt: minutesFromStart(300),
      scheduledDropoffAt: minutesFromStart(325),
      estimatedDurationMin: 25,
      distanceMiles: 6.4,
    },
    {
      id: "T-9",
      sequence: 9,
      isBreak: true,
      scheduledPickupAt: minutesFromStart(330),
      scheduledDropoffAt: minutesFromStart(360),
      estimatedDurationMin: 30,
    },
    {
      id: "T-10",
      sequence: 10,
      isBreak: false,
      passengerName: "Betty J.",
      pickup: { line1: "201 Spruce Way", city: "Springfield" },
      dropoff: { line1: "Sunrise Adult Day Center", city: "Springfield" },
      scheduledPickupAt: minutesFromStart(375),
      scheduledDropoffAt: minutesFromStart(400),
      estimatedDurationMin: 25,
      distanceMiles: 5.7,
    },
    {
      id: "T-11",
      sequence: 11,
      isBreak: false,
      passengerName: "William H.",
      passengerNote: "Dialysis — prompt pickup needed",
      pickup: { line1: "558 Ash Dr", city: "Springfield" },
      dropoff: { line1: "Downtown Dialysis Clinic", city: "Springfield" },
      scheduledPickupAt: minutesFromStart(420),
      scheduledDropoffAt: minutesFromStart(450),
      estimatedDurationMin: 30,
      distanceMiles: 7.8,
    },
    {
      id: "T-12",
      sequence: 12,
      isBreak: false,
      passengerName: "Dorothy M.",
      passengerNote: "Return trip home",
      pickup: { line1: "334 Willow Lane", city: "Springfield" },
      dropoff: { line1: "Home", city: "Springfield" },
      scheduledPickupAt: minutesFromStart(465),
      scheduledDropoffAt: minutesFromStart(490),
      estimatedDurationMin: 25,
      distanceMiles: 6.1,
    },
  ],
  };
}

// ---------------------------------------------------------------------------
// Marcus D. — demo persona for a driver whose morning has been quieter than
// a typical Wednesday because dispatch has reassigned trips off his van.
// Same shift window (8:00 AM – 4:30 PM), same mock 10:30 AM "now", 7 trips
// on his current manifest (down from ~10 typical).

export function buildMarcus(nowDate: Date = now()): DriverShift {
  const shiftStart = new Date(nowDate);
  shiftStart.setHours(8, 0, 0, 0);
  const shiftStartMs = shiftStart.getTime();
  const nowMs = nowDate.getTime();
  const minutesFromStart = (mins: number) =>
    new Date(shiftStartMs + mins * 60_000).toISOString();

  return {
    driverName: "Marcus D.",
    driverInitials: "MD",
    vehicleId: "Van #253",
    shiftStart: minutesFromStart(0),
    shiftEnd: minutesFromStart(510),
    // Neutral banner — manifest was reshuffled earlier this morning; the
    // next passenger trip was nudged by a few minutes.
    latestUpdate: {
      updatedAt: new Date(nowMs - 14 * 60_000).toISOString(),
      tripId: "T-3-M",
      summary: "Trip 3 moved 5 min later",
      reason: "upstream delay",
    },
    trips: [
      {
        id: "T-1-M",
        sequence: 1,
        isBreak: false,
        passengerName: "Harold B.",
        pickup: { line1: "812 Chestnut St", city: "Springfield" },
        dropoff: { line1: "Riverside Medical Center", city: "Springfield" },
        scheduledPickupAt: minutesFromStart(15),
        scheduledDropoffAt: minutesFromStart(35),
        estimatedDurationMin: 20,
        distanceMiles: 4.1,
      },
      {
        id: "T-2-M",
        sequence: 2,
        isBreak: false,
        passengerName: "Lorraine K.",
        pickup: { line1: "39 Poplar Ave", city: "Springfield" },
        dropoff: { line1: "Community Health Center", city: "Springfield" },
        scheduledPickupAt: minutesFromStart(55),
        scheduledDropoffAt: minutesFromStart(85),
        estimatedDurationMin: 30,
        distanceMiles: 6.8,
      },
      // Gap here (9:25–10:15 AM) — dispatch pulled Trip 3 off the manifest at
      // 8:40 AM after the van was stationary 22 min; 2 more trips were moved
      // at 9:14 AM. These show up in the dispatch-adjustments feed, not here.
      {
        id: "T-3-M",
        sequence: 3,
        isBreak: false,
        passengerName: "Aaron L.",
        pickup: { line1: "127 Linden Rd", city: "Springfield" },
        dropoff: { line1: "VA Hospital", city: "Springfield" },
        scheduledPickupAt: minutesFromStart(135),
        scheduledDropoffAt: minutesFromStart(165),
        estimatedDurationMin: 30,
        distanceMiles: 5.9,
        wasUpdated: true,
      },
      {
        id: "B-1-M",
        sequence: 4,
        isBreak: true,
        scheduledPickupAt: minutesFromStart(195),
        scheduledDropoffAt: minutesFromStart(225),
        estimatedDurationMin: 30,
      },
      {
        id: "T-4-M",
        sequence: 5,
        isBreak: false,
        passengerName: "Delores M.",
        pickup: { line1: "450 Hazel Ct", city: "Springfield" },
        dropoff: { line1: "Downtown Dialysis Clinic", city: "Springfield" },
        passengerNote: "Dialysis — prompt pickup needed",
        scheduledPickupAt: minutesFromStart(240),
        scheduledDropoffAt: minutesFromStart(270),
        estimatedDurationMin: 30,
        distanceMiles: 7.2,
      },
      {
        id: "T-5-M",
        sequence: 6,
        isBreak: false,
        passengerName: "Gerald P.",
        pickup: { line1: "78 Dogwood Way", city: "Springfield" },
        dropoff: { line1: "Sunrise Adult Day Center", city: "Springfield" },
        scheduledPickupAt: minutesFromStart(285),
        scheduledDropoffAt: minutesFromStart(315),
        estimatedDurationMin: 30,
        distanceMiles: 5.5,
      },
      {
        id: "T-6-M",
        sequence: 7,
        isBreak: false,
        passengerName: "Ruth C.",
        pickup: { line1: "221 Magnolia St", city: "Springfield" },
        dropoff: { line1: "Physical Therapy Associates", city: "Springfield" },
        scheduledPickupAt: minutesFromStart(345),
        scheduledDropoffAt: minutesFromStart(375),
        estimatedDurationMin: 30,
        distanceMiles: 6.2,
      },
      {
        id: "T-7-M",
        sequence: 8,
        isBreak: false,
        passengerName: "Clarence E.",
        passengerNote: "Return trip home",
        pickup: { line1: "Greenfield Senior Center", city: "Springfield" },
        dropoff: { line1: "Home", city: "Springfield" },
        scheduledPickupAt: minutesFromStart(405),
        scheduledDropoffAt: minutesFromStart(435),
        estimatedDurationMin: 30,
        distanceMiles: 5.8,
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// Today snapshots — ambient + personal context for the Today tab.
// Both personas share the same zone-level state (heavy day, 2 vans OOS)
// — what differs is the driver-specific numbers and adjustment log.

/** Pin adjustment timestamps relative to the mock clock so the feed always
 *  reads as "this morning." Mirrors buildJane's latestUpdate pattern. */
function adjustmentAt(minutesFromShiftStart: number): string {
  const shiftStart = new Date();
  shiftStart.setHours(8, 0, 0, 0);
  return new Date(
    shiftStart.getTime() + minutesFromShiftStart * 60_000
  ).toISOString();
}

export const todayForJane: TodaySnapshot = {
  driverTypicalWeekdayTrips: 11,
  nearbyActiveDrivers: 12,
  nearbyTotalDrivers: 15,
  todayDemandLevel: "heavy",
  vansOutOfService: 2,
  adjustments: [
    {
      at: adjustmentAt(112), // 9:52 AM
      direction: "neutral",
      summary: "Trip 5 moved 10 min earlier",
      reason: "cancellation upstream",
    },
    {
      at: adjustmentAt(74), // 9:14 AM
      direction: "inflow",
      summary: "2 trips added to your manifest",
      reason: "dispatch rebalance",
    },
    {
      at: adjustmentAt(40), // 8:40 AM
      direction: "neutral",
      summary: "Trip 2 dropoff window extended",
      reason: "traffic",
    },
  ],
};

export const todayForMarcus: TodaySnapshot = {
  driverTypicalWeekdayTrips: 10,
  nearbyActiveDrivers: 12,
  nearbyTotalDrivers: 15,
  todayDemandLevel: "heavy",
  vansOutOfService: 2,
  adjustments: [
    {
      at: adjustmentAt(112), // 9:52 AM
      direction: "outflow",
      summary: "Trip 5 reassigned",
      reason: "pickup window expired",
    },
    {
      at: adjustmentAt(74), // 9:14 AM
      direction: "outflow",
      summary: "2 trips reassigned from your van",
      reason: "dispatch rebalance",
    },
    {
      at: adjustmentAt(40), // 8:40 AM
      direction: "outflow",
      summary: "Trip 3 reassigned",
      reason: "van stationary 22 min",
    },
  ],
};

export function buildShift(persona: DriverPersona, nowDate: Date = now()): DriverShift {
  return persona === "marcus" ? buildMarcus(nowDate) : buildJane(nowDate);
}

export function snapshotFor(persona: DriverPersona): TodaySnapshot {
  return persona === "marcus" ? todayForMarcus : todayForJane;
}

// ---------------------------------------------------------------------------
// Formatting helpers used across tabs

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

/** Relative "X min ago" formatter for banners. */
export function formatRelative(iso: string, at: Date = now()): string {
  const diffMs = at.getTime() - new Date(iso).getTime();
  const diffMin = Math.max(0, Math.round(diffMs / 60_000));
  if (diffMin < 1) return "just now";
  if (diffMin === 1) return "1 min ago";
  if (diffMin < 60) return `${diffMin} min ago`;
  const h = Math.floor(diffMin / 60);
  return h === 1 ? "1 hr ago" : `${h} hr ago`;
}

/** Sum of distance (mi) across completed passenger trips at `at`. */
export function milesSoFar(shift: DriverShift, at: Date = now()): number {
  return shift.trips
    .filter(
      (t) => !t.isBreak && deriveTripStatus(t, at) === "completed"
    )
    .reduce((sum, t) => sum + (t.distanceMiles ?? 0), 0);
}

/** The next scheduled break that comes after `at`, or null. */
export function nextBreak(shift: DriverShift, at: Date = now()): Trip | null {
  return (
    shift.trips.find(
      (t) => t.isBreak && new Date(t.scheduledPickupAt).getTime() > at.getTime()
    ) ?? null
  );
}

/** Build the Section 1 "riders delivered today" line. Returns null when
 *  nothing has completed yet so the UI can suppress the row. */
export function riderSummary(shift: DriverShift, at: Date = now()): string | null {
  const completed = shift.trips.filter(
    (t) => !t.isBreak && deriveTripStatus(t, at) === "completed"
  );
  if (completed.length === 0) return null;

  const buckets: Record<string, number> = {};
  for (const trip of completed) {
    const drop = trip.dropoff?.line1?.toLowerCase() ?? "";
    const note = trip.passengerNote?.toLowerCase() ?? "";
    let type: string;
    if (drop.includes("dialysis") || note.includes("dialysis")) type = "dialysis";
    else if (drop.includes("adult day")) type = "adult day center";
    else if (drop.includes("senior center")) type = "senior center";
    else if (drop.includes("physical therapy")) type = "physical therapy";
    else if (drop.toLowerCase() === "home") type = "returning home";
    else type = "medical";
    buckets[type] = (buckets[type] ?? 0) + 1;
  }

  const prefix = `${completed.length} rider${completed.length === 1 ? "" : "s"} delivered today`;
  const entries = Object.entries(buckets);
  if (entries.length <= 1) return prefix;

  const breakdown = entries
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([t, n]) => `${n} ${t}`)
    .join(", ");
  return `${prefix} — ${breakdown}`;
}
