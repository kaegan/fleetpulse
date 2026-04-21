/**
 * Paratransit trip schedule. Unlike fixed-route transit, paratransit runs
 * are door-to-door pickups tied to a passenger, a mobility profile, and a
 * specific appointment (medical, day program, rehab, etc.). Each driver
 * has a manifest of 6–8 trips per shift.
 *
 * Times are ISO datetimes anchored to today. Status (upcoming / in-progress
 * / completed) is derived from the current clock at render time — see
 * `deriveTripStatus` below.
 */

export type Mobility = "ambulatory" | "wheelchair" | "walker" | "scooter";

export type TripStatus = "upcoming" | "in-progress" | "completed";

export interface Trip {
  id: string;
  driverId: string;
  /** ISO datetime — scheduled pickup window start. */
  scheduledPickupAt: string;
  /** Expected door-to-door duration in minutes. */
  durationMinutes: number;
  pickupAddress: string;
  dropoffLabel: string;
  passengerName: string;
  mobility: Mobility;
  /** Short, single-line dispatcher note (e.g. "Buzzer broken — call on arrival"). */
  note?: string;
}

/** Build an ISO datetime for today at the given local hour/minute. */
function todayAt(hour: number, minute: number): string {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

/**
 * Marcus W.'s manifest for today (DRV-104). Seven pickups across a
 * 7:00a–3:30p shift — mix of morning dialysis, midday medical, and
 * afternoon day-program return runs.
 */
export const trips: Trip[] = [
  {
    id: "TRP-8041",
    driverId: "DRV-104",
    scheduledPickupAt: todayAt(7, 30),
    durationMinutes: 25,
    pickupAddress: "284 Maplewood Dr",
    dropoffLabel: "Northside Dialysis Center",
    passengerName: "R. Patel",
    mobility: "wheelchair",
  },
  {
    id: "TRP-8042",
    driverId: "DRV-104",
    scheduledPickupAt: todayAt(8, 15),
    durationMinutes: 20,
    pickupAddress: "1847 Pine Crescent",
    dropoffLabel: "St. Vincent Medical — Clinic B",
    passengerName: "L. Chen",
    mobility: "ambulatory",
  },
  {
    id: "TRP-8043",
    driverId: "DRV-104",
    scheduledPickupAt: todayAt(9, 10),
    durationMinutes: 30,
    pickupAddress: "512 Harmony Lane",
    dropoffLabel: "Riverside Senior Day Program",
    passengerName: "J. Okafor",
    mobility: "walker",
    note: "Buzzer broken — call on arrival",
  },
  {
    id: "TRP-8044",
    driverId: "DRV-104",
    scheduledPickupAt: todayAt(10, 30),
    durationMinutes: 25,
    pickupAddress: "73 Oak Ridge Rd",
    dropoffLabel: "Mercy Regional Hospital — West Tower",
    passengerName: "E. Martinez",
    mobility: "wheelchair",
    note: "Requires ramp — secure tie-downs",
  },
  {
    id: "TRP-8045",
    driverId: "DRV-104",
    scheduledPickupAt: todayAt(11, 45),
    durationMinutes: 20,
    pickupAddress: "1021 Westfield Ave",
    dropoffLabel: "Cedar Grove Rehab",
    passengerName: "D. Kim",
    mobility: "scooter",
  },
  {
    id: "TRP-8046",
    driverId: "DRV-104",
    scheduledPickupAt: todayAt(13, 15),
    durationMinutes: 30,
    pickupAddress: "Riverside Senior Day Program",
    dropoffLabel: "512 Harmony Lane (return)",
    passengerName: "J. Okafor",
    mobility: "walker",
  },
  {
    id: "TRP-8047",
    driverId: "DRV-104",
    scheduledPickupAt: todayAt(14, 30),
    durationMinutes: 25,
    pickupAddress: "Northside Dialysis Center",
    dropoffLabel: "284 Maplewood Dr (return)",
    passengerName: "R. Patel",
    mobility: "wheelchair",
  },
];

/** Derive status from the current clock. A trip is:
 *  - completed if its dropoff time has passed (pickup + duration)
 *  - in-progress if pickup has started but dropoff hasn't
 *  - upcoming otherwise
 */
export function deriveTripStatus(trip: Trip, now: Date = new Date()): TripStatus {
  const pickup = new Date(trip.scheduledPickupAt).getTime();
  const dropoff = pickup + trip.durationMinutes * 60_000;
  const t = now.getTime();
  if (t >= dropoff) return "completed";
  if (t >= pickup) return "in-progress";
  return "upcoming";
}

/** Fetch a driver's trips for today, sorted by pickup time. */
export function tripsForDriver(driverId: string): Trip[] {
  return trips
    .filter((t) => t.driverId === driverId)
    .sort((a, b) => a.scheduledPickupAt.localeCompare(b.scheduledPickupAt));
}
