import { format, parseISO } from "date-fns";

import type { FareFamily, SeatPolicy } from "./airlines";

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export const formatINR = (n: number) => inr.format(Math.round(n));

export const formatDuration = (min: number) => `${Math.floor(min / 60)}h ${String(min % 60).padStart(2, "0")}m`;

export function formatClock(min: number) {
  const m = ((min % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

export const dayOffset = (min: number) => Math.floor(min / 1440);

export const formatDateLabel = (iso: string) => format(parseISO(iso), "EEE, d MMM");

export const feeLabel = (fee: number | null) => (fee === null ? "Non-refundable" : fee === 0 ? "Free" : formatINR(fee));

export const changeLabel = (fee: number) => (fee === 0 ? "Free (pay fare diff.)" : formatINR(fee));

export function seatLabel(seat: SeatPolicy, seatFee: number) {
  if (seat === "free-any") return "Any seat free";
  if (seat === "free-standard") return "Standard seat free";
  return `From ${formatINR(seatFee)}`;
}

export const bagLabel = (fare: FareFamily) => (fare.checkinKg === 0 ? "Cabin only" : `${fare.cabinKg} + ${fare.checkinKg} kg`);
