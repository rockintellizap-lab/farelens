import { differenceInCalendarDays, parseISO } from "date-fns";

import { AIRLINES, type Airline, type AirlineCode, type FareFamily } from "./airlines";
import { AIRPORTS } from "./airports";

export interface Flight {
  id: string;
  airline: Airline;
  flightNo: string;
  from: string;
  to: string;
  date: string;
  /** Minutes after local midnight; may exceed 1440 for next-day arrivals. */
  departMin: number;
  arriveMin: number;
  durationMin: number;
  stops: 0 | 1;
  via: string | null;
  layoverMin: number;
  aircraft: string;
  basePrice: number;
  seatsLeft: number | null;
}

export interface FareOption {
  flight: Flight;
  fare: FareFamily;
  /** Per-passenger fare including taxes. */
  price: number;
}

const FLIGHTS_PER_AIRLINE: Record<AirlineCode, number> = { "6E": 5, QP: 3, SG: 3, IX: 3, IC: 2 };

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function routeProfile(from: string, to: string) {
  const h = hashString([from, to].sort().join("-"));
  return { baseFare: 4300 + (h % 3400), baseDuration: 70 + ((h >>> 8) % 100) };
}

function timeFactor(departMin: number) {
  const hour = Math.floor(departMin / 60);
  if ((hour >= 6 && hour < 9) || (hour >= 17 && hour < 21)) return 1.12;
  if (hour >= 22 || hour < 6) return 0.88;
  return 1;
}

function demandFactor(date: string) {
  const days = differenceInCalendarDays(parseISO(date), new Date());
  if (days < 3) return 1.55;
  if (days < 7) return 1.28;
  if (days < 21) return 1.08;
  return 1;
}

const round5 = (n: number) => Math.round(n / 5) * 5;

export function generateFlights(from: string, to: string, date: string): Flight[] {
  if (from === to) return [];
  const rng = mulberry32(hashString(`${from}|${to}|${date}`));
  const { baseFare, baseDuration } = routeProfile(from, to);
  const demand = demandFactor(date);
  const hubs = AIRPORTS.filter((a) => a.code !== from && a.code !== to).map((a) => a.code);
  const flights: Flight[] = [];

  for (const airline of AIRLINES) {
    const count = FLIGHTS_PER_AIRLINE[airline.code];
    const used = new Set<number>();
    for (let i = 0; i < count; i++) {
      const departMin = round5(5 * 60 + ((i + rng() * 0.9) / count) * 18 * 60);
      const stops: 0 | 1 = rng() < 0.18 ? 1 : 0;
      const via = stops ? (hubs[Math.floor(rng() * hubs.length)] ?? null) : null;
      const layoverMin = stops ? 55 + Math.round(rng() * 10) * 10 : 0;
      const flyTime = baseDuration * airline.speedFactor + rng() * 15;
      const durationMin = round5(stops ? flyTime * 1.35 + layoverMin : flyTime);
      const [lo, hi] = airline.flightNoRange;
      let num = lo + Math.floor(rng() * (hi - lo));
      while (used.has(num)) num += 7;
      used.add(num);
      const basePrice = Math.round(
        baseFare * airline.priceFactor * timeFactor(departMin) * demand * (0.86 + rng() * 0.32) * (stops ? 0.9 : 1),
      );
      const seatsLeft = rng() < 0.28 ? 1 + Math.floor(rng() * 6) : null;
      const aircraft = airline.aircraft[Math.floor(rng() * airline.aircraft.length)] ?? "A320";
      flights.push({
        id: `${airline.code}${num}`,
        airline,
        flightNo: `${airline.code} ${num}`,
        from,
        to,
        date,
        departMin,
        arriveMin: departMin + durationMin,
        durationMin,
        stops,
        via,
        layoverMin,
        aircraft,
        basePrice,
        seatsLeft,
      });
    }
  }
  return flights.sort((a, b) => a.departMin - b.departMin);
}

export function farePrice(flight: Flight, fare: FareFamily): number {
  return Math.max(1499, flight.basePrice + fare.addOn);
}

export function fareOptions(flight: Flight): FareOption[] {
  return flight.airline.fares.map((fare) => ({ flight, fare, price: farePrice(flight, fare) }));
}

/** Selection strings look like "6E2134.saver". */
export function selectionKey(option: FareOption) {
  return `${option.flight.id}.${option.fare.id}`;
}

export function findOption(flights: Flight[], selection: string | undefined): FareOption | null {
  if (!selection) return null;
  const [flightId, fareId] = selection.split(".");
  const flight = flights.find((f) => f.id === flightId);
  const fare = flight?.airline.fares.find((f) => f.id === fareId);
  if (!flight || !fare) return null;
  return { flight, fare, price: farePrice(flight, fare) };
}
