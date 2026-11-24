import { Armchair, Briefcase, CalendarClock, Utensils, X } from "lucide-react";

import { AirlineMark } from "@/components/flight/AirlineMark";
import { FlightTimeline } from "@/components/flight/FlightTimeline";
import { bagLabel, changeLabel, feeLabel, formatDateLabel, formatINR, seatLabel } from "@/lib/flights/format";
import type { FareOption } from "@/lib/flights/generate";
import { refundIfCancelled } from "@/lib/flights/pricing";

export function LegSummary({ option, label, footer }: { option: FareOption; label: string; footer?: React.ReactNode }) {
  const { flight, fare } = option;
  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-card">
      <div className="flex items-center justify-between gap-3 border-b bg-muted/60 px-4 py-2.5">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
        <span className="text-xs font-semibold">{formatDateLabel(flight.date)}</span>
      </div>
      <div className="p-4">
        <div className="flex items-center gap-2.5">
          <AirlineMark airline={flight.airline} />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold">{flight.airline.name}</div>
            <div className="font-mono text-[11px] text-muted-foreground">
              {flight.flightNo} · {flight.aircraft} · {fare.name}
            </div>
          </div>
          <div className="text-right font-display text-lg font-extrabold">{formatINR(option.price)}</div>
        </div>
        <div className="mt-4">
          <FlightTimeline flight={flight} />
        </div>
        <ul className="mt-4 grid grid-cols-2 gap-2 text-xs">
          <li className="flex items-center gap-1.5"><Briefcase className="size-3.5 text-muted-foreground" />{bagLabel(fare)}</li>
          <li className="flex items-center gap-1.5"><Armchair className="size-3.5 text-muted-foreground" />{seatLabel(fare.seat, flight.airline.seatFee)}</li>
          <li className="flex items-center gap-1.5"><Utensils className="size-3.5 text-muted-foreground" />{fare.meal ? "Meal included" : "Meal paid"}</li>
          <li className="flex items-center gap-1.5"><CalendarClock className="size-3.5 text-muted-foreground" />Change {fare.changeFee === 0 ? "free" : formatINR(fare.changeFee)}</li>
        </ul>
      </div>
      <div className="border-t border-dashed px-4 py-3">
        <div className="mb-2 text-xs font-bold">If your plans change (per person)</div>
        <table className="w-full text-xs">
          <thead className="text-muted-foreground">
            <tr>
              <th className="py-1 text-left font-medium" />
              <th className="py-1 text-left font-medium">3+ days before</th>
              <th className="py-1 text-left font-medium">Within 3 days</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-1 font-semibold"><X className="mr-1 inline size-3" />Cancel</td>
              <td>{feeLabel(fare.cancelFee)}</td>
              <td>{feeLabel(fare.cancelFeeLate)}</td>
            </tr>
            <tr>
              <td className="py-1 font-semibold">You get back</td>
              <td className="font-semibold text-success">{formatINR(refundIfCancelled(option))}</td>
              <td className="font-semibold text-success">{formatINR(refundIfCancelled(option, true))}</td>
            </tr>
            <tr>
              <td className="py-1 font-semibold">Reschedule</td>
              <td>{changeLabel(fare.changeFee)}</td>
              <td>{changeLabel(fare.changeFeeLate)}</td>
            </tr>
          </tbody>
        </table>
        <p className="mt-2 text-[11px] text-muted-foreground">No-show: {flight.airline.noShow}. Refund to {flight.airline.refundMode.toLowerCase()}.</p>
      </div>
      {footer}
    </div>
  );
}
