import { addDays, format } from "date-fns";
import { z } from "zod";

import type { Needs } from "./pricing";

const isoDate = /^\d{4}-\d{2}-\d{2}$/;

export const defaultDepartDate = () => format(addDays(new Date(), 14), "yyyy-MM-dd");

export const flightSearchSchema = z.object({
  from: z.string().length(3).catch("DEL"),
  to: z.string().length(3).catch("BOM"),
  date: z.string().regex(isoDate).catch(() => defaultDepartDate()),
  ret: z.string().regex(isoDate).optional().catch(undefined),
  adults: z.coerce.number().int().min(1).max(9).catch(1),
  children: z.coerce.number().int().min(0).max(8).catch(0),
  bag: z.coerce.number().int().min(0).max(1).catch(1),
  seat: z.coerce.number().int().min(0).max(1).catch(0),
  meal: z.coerce.number().int().min(0).max(1).catch(0),
});

export type FlightSearch = z.infer<typeof flightSearchSchema>;

export const resultsSearchSchema = flightSearchSchema.extend({
  out: z.string().optional().catch(undefined),
});

export const reviewSearchSchema = flightSearchSchema.extend({
  out: z.string().catch(""),
  back: z.string().optional().catch(undefined),
});

export const confirmationSearchSchema = reviewSearchSchema.extend({
  name: z.string().catch("Traveller"),
  email: z.string().catch(""),
  paid: z.coerce.number().catch(0),
});

export function pickSearch(s: FlightSearch): FlightSearch {
  return {
    from: s.from,
    to: s.to,
    date: s.date,
    ret: s.ret,
    adults: s.adults,
    children: s.children,
    bag: s.bag,
    seat: s.seat,
    meal: s.meal,
  };
}

export const needsFromSearch = (s: FlightSearch): Needs => ({ bag: s.bag === 1, seat: s.seat === 1, meal: s.meal === 1 });

export const paxCount = (s: FlightSearch) => s.adults + s.children;

export function paxLabel(s: FlightSearch) {
  const parts = [`${s.adults} adult${s.adults > 1 ? "s" : ""}`];
  if (s.children) parts.push(`${s.children} child${s.children > 1 ? "ren" : ""}`);
  return parts.join(", ");
}
