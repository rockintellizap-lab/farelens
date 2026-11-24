import type { Airline, FareFamily, FareTier } from "./airlines";
import { fareOptions, type FareOption, type Flight } from "./generate";

export interface Needs {
  bag: boolean;
  seat: boolean;
  meal: boolean;
}

export interface AddOnLine {
  label: string;
  amount: number;
}

/** Extras a traveller must buy on top of the fare to get what they need. */
export function addOnsForNeeds(airline: Airline, fare: FareFamily, needs: Needs): AddOnLine[] {
  const lines: AddOnLine[] = [];
  if (needs.bag && fare.checkinKg === 0) lines.push({ label: "15 kg check-in bag", amount: airline.bagAddOn15kg });
  if (needs.seat && fare.seat === "paid") lines.push({ label: "Seat of your choice", amount: airline.seatFee });
  if (needs.meal && !fare.meal) lines.push({ label: "Meal", amount: airline.mealFee });
  return lines;
}

/** Fare + the extras needed = what the traveller really pays per person. */
export function trueCost(option: FareOption, needs: Needs): number {
  return option.price + addOnsForNeeds(option.flight.airline, option.fare, needs).reduce((s, l) => s + l.amount, 0);
}

/** Share of a fare that is the airline's base fare; the rest is taxes & airport fees. */
export const BASE_FARE_SHARE = 0.82;

export const baseFarePart = (price: number) => Math.round(price * BASE_FARE_SHARE);

/**
 * Money back per person if cancelled. The airline fee is capped at the base fare,
 * so taxes & airport fees always come back; non-refundable fares return only those.
 */
export function refundIfCancelled(option: FareOption, late = false): number {
  const fee = late ? option.fare.cancelFeeLate : option.fare.cancelFee;
  const base = baseFarePart(option.price);
  return option.price - Math.min(fee ?? base, base);
}

export type TierFilter = FareTier | "any";

/** The fare on this flight that costs least once the traveller's needs are added. */
export function bestFareForNeeds(flight: Flight, needs: Needs, tier: TierFilter = "any"): FareOption {
  const all = fareOptions(flight);
  const pool = tier === "any" ? all : all.filter((o) => o.fare.tier === tier);
  const candidates = pool.length ? pool : all;
  return candidates.reduce((best, o) => (trueCost(o, needs) < trueCost(best, needs) ? o : best));
}

export interface AirlineSummary {
  airline: Airline;
  option: FareOption;
  trueCost: number;
  flightsOnRoute: number;
}

/** One best option per airline (lowest true cost across its flights for the chosen tier). */
export function airlineSummaries(flights: Flight[], needs: Needs, tier: TierFilter, airlines: Airline[]): AirlineSummary[] {
  return airlines.flatMap((airline) => {
    const own = flights.filter((f) => f.airline.code === airline.code);
    if (!own.length) return [];
    const options = own.map((f) => bestFareForNeeds(f, needs, tier));
    const option = options.reduce((best, o) => (trueCost(o, needs) < trueCost(best, needs) ? o : best));
    return [{ airline, option, trueCost: trueCost(option, needs), flightsOnRoute: own.length }];
  });
}

/** Lower is better. Weighs true cost, duration, punctuality and stops relative to the set. */
export function valueScores(options: FareOption[], needs: Needs): number[] {
  if (!options.length) return [];
  const costs = options.map((o) => trueCost(o, needs));
  const durations = options.map((o) => o.flight.durationMin);
  const norm = (v: number, arr: number[]) => {
    const min = Math.min(...arr);
    const max = Math.max(...arr);
    return max === min ? 0 : (v - min) / (max - min);
  };
  return options.map(
    (o, i) =>
      norm(costs[i] ?? 0, costs) * 0.55 +
      norm(durations[i] ?? 0, durations) * 0.2 +
      (1 - o.flight.airline.onTimePct / 100) * 0.6 +
      o.flight.stops * 0.1,
  );
}

export function indexOfMin(values: number[]): number {
  let best = -1;
  values.forEach((v, i) => {
    if (best === -1 || v < (values[best] ?? Infinity)) best = i;
  });
  return best;
}

/** Indexes holding the best value; empty when every value ties (nothing to highlight). */
export function bestIndexes(values: (number | null)[], better: "min" | "max"): Set<number> {
  const nums = values.filter((v): v is number => v !== null);
  if (nums.length < 2) return new Set();
  const target = better === "min" ? Math.min(...nums) : Math.max(...nums);
  if (nums.every((v) => v === target)) return new Set();
  return new Set(values.flatMap((v, i) => (v === target ? [i] : [])));
}

export function seatScore(fare: FareFamily, airline: Airline): number {
  if (fare.seat === "free-any") return 0;
  if (fare.seat === "free-standard") return 1;
  return 2 + airline.seatFee / 10000;
}
