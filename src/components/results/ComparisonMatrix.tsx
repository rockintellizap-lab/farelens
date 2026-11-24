import { Check, ChevronDown, Crown } from "lucide-react";
import { useState, type ReactNode } from "react";

import { AirlineMark } from "@/components/flight/AirlineMark";
import { Button } from "@/components/ui/button";
import { changeLabel, feeLabel, formatClock, formatDuration, formatINR, seatLabel } from "@/lib/flights/format";
import type { FareOption } from "@/lib/flights/generate";
import { bestIndexes, refundIfCancelled, seatScore } from "@/lib/flights/pricing";
import { cn } from "@/lib/utils";

export interface MatrixColumn {
  key: string;
  option: FareOption;
  trueCost: number;
  flightsOnRoute?: number;
  recommended?: boolean;
}

interface RowDef {
  label: string;
  hint?: string;
  render: (c: MatrixColumn) => ReactNode;
  metric?: (c: MatrixColumn) => number | null;
  better?: "min" | "max";
  /** Shown when the table is collapsed; everything else waits behind "Show all details". */
  essential?: boolean;
}

interface GroupDef {
  title: string;
  rows: RowDef[];
}

function buildGroups(showRouteCount: boolean): GroupDef[] {
  return [
    {
      title: "Price",
      rows: [
        { label: "Fare per person", render: (c) => formatINR(c.option.price), metric: (c) => c.option.price, better: "min" },
        { essential: true, label: "True cost for you", hint: "Fare + extras you need", render: (c) => <span className="font-bold">{formatINR(c.trueCost)}</span>, metric: (c) => c.trueCost, better: "min" },
        { essential: true, label: "Fare type", render: (c) => c.option.fare.name },
      ],
    },
    {
      title: "Flight",
      rows: [
        { essential: true, label: "Timing", render: (c) => `${formatClock(c.option.flight.departMin)} → ${formatClock(c.option.flight.arriveMin)}` },
        { label: "Duration", render: (c) => formatDuration(c.option.flight.durationMin), metric: (c) => c.option.flight.durationMin, better: "min" },
        { essential: true, label: "Stops", render: (c) => (c.option.flight.stops ? `1 · via ${c.option.flight.via}` : "Non-stop"), metric: (c) => c.option.flight.stops, better: "min" },
      ],
    },
    {
      title: "Baggage",
      rows: [
        { essential: true, label: "Cabin bag", render: (c) => `${c.option.fare.cabinKg} kg`, metric: (c) => c.option.fare.cabinKg, better: "max" },
        { essential: true, label: "Check-in bag", render: (c) => (c.option.fare.checkinKg ? `${c.option.fare.checkinKg} kg` : `None (+${formatINR(c.option.flight.airline.bagAddOn15kg)})`), metric: (c) => c.option.fare.checkinKg, better: "max" },
        { label: "Extra 5 kg (pre-book)", render: (c) => formatINR(c.option.flight.airline.extra5kg), metric: (c) => c.option.flight.airline.extra5kg, better: "min" },
        { label: "Excess at airport", render: (c) => `${formatINR(c.option.flight.airline.excessPerKg)}/kg`, metric: (c) => c.option.flight.airline.excessPerKg, better: "min" },
      ],
    },
    {
      title: "If plans change",
      rows: [
        { essential: true, label: "Cancel fee", hint: "3+ days before", render: (c) => feeLabel(c.option.fare.cancelFee), metric: (c) => c.option.fare.cancelFee ?? 99999, better: "min" },
        { label: "Cancel fee", hint: "Within 3 days", render: (c) => feeLabel(c.option.fare.cancelFeeLate), metric: (c) => c.option.fare.cancelFeeLate ?? 99999, better: "min" },
        { essential: true, label: "You get back", hint: "Cancel 3+ days before, incl. taxes", render: (c) => formatINR(refundIfCancelled(c.option)), metric: (c) => refundIfCancelled(c.option), better: "max" },
        { essential: true, label: "Reschedule fee", hint: "3+ days before", render: (c) => changeLabel(c.option.fare.changeFee), metric: (c) => c.option.fare.changeFee, better: "min" },
        { label: "Reschedule fee", hint: "Within 3 days", render: (c) => changeLabel(c.option.fare.changeFeeLate), metric: (c) => c.option.fare.changeFeeLate, better: "min" },
        { label: "Refund goes to", render: (c) => <span className="text-xs">{c.option.flight.airline.refundMode}</span> },
        { label: "No-show", render: (c) => <span className="text-xs">{c.option.flight.airline.noShow}</span> },
      ],
    },
    {
      title: "Comfort",
      rows: [
        { label: "Seat selection", render: (c) => seatLabel(c.option.fare.seat, c.option.flight.airline.seatFee), metric: (c) => seatScore(c.option.fare, c.option.flight.airline), better: "min" },
        { label: "Meal", render: (c) => (c.option.fare.meal ? "Included" : `From ${formatINR(c.option.flight.airline.mealFee)}`), metric: (c) => (c.option.fare.meal ? 0 : c.option.flight.airline.mealFee), better: "min" },
        { label: "Priority check-in", render: (c) => (c.option.fare.priority ? "Yes" : "—"), metric: (c) => (c.option.fare.priority ? 1 : 0), better: "max" },
        { label: "Seat pitch", render: (c) => c.option.flight.airline.seatPitch },
        { label: "Aircraft", render: (c) => c.option.flight.aircraft },
        { label: "Charging", render: (c) => <span className="text-xs">{c.option.flight.airline.power}</span> },
      ],
    },
    {
      title: "Reliability",
      rows: [
        { label: "On-time performance", render: (c) => `${c.option.flight.airline.onTimePct}%`, metric: (c) => c.option.flight.airline.onTimePct, better: "max" },
        ...(showRouteCount
          ? [{ label: "Flights this day", render: (c: MatrixColumn) => String(c.flightsOnRoute ?? 0), metric: (c: MatrixColumn) => c.flightsOnRoute ?? 0, better: "max" as const }]
          : []),
      ],
    },
  ];
}

export function ComparisonMatrix({ columns, onSelect, selectLabel = "Select" }: { columns: MatrixColumn[]; onSelect: (o: FareOption) => void; selectLabel?: string }) {
  const [showAll, setShowAll] = useState(false);
  const allGroups = buildGroups(columns.some((c) => c.flightsOnRoute !== undefined));
  const groups = showAll ? allGroups : allGroups.map((g) => ({ ...g, rows: g.rows.filter((r) => r.essential) })).filter((g) => g.rows.length);
  const hiddenCount = allGroups.reduce((n, g) => n + g.rows.filter((r) => !r.essential).length, 0);
  const labelCell = "sticky left-0 z-10 w-[118px] min-w-[118px] border-r bg-card px-3 py-2.5 text-left align-top md:w-[180px] md:min-w-[180px]";
  const valueCell = "min-w-[132px] px-3 py-2.5 text-left align-top text-sm";

  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-card">
      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full border-separate border-spacing-0">
          <thead>
            <tr>
              <th className={cn(labelCell, "z-20 border-b align-bottom text-xs font-semibold text-muted-foreground")}>
                {columns.length} options
              </th>
              {columns.map((c) => (
                <th key={c.key} className={cn(valueCell, "relative border-b align-bottom", c.recommended && "bg-accent-soft")}>
                  {c.recommended && (
                    <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent-foreground">
                      <Crown className="size-3" /> Best value
                    </span>
                  )}
                  <div className="flex items-center gap-2">
                    <AirlineMark airline={c.option.flight.airline} size="sm" />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-bold">{c.option.flight.airline.name}</div>
                      <div className="font-mono text-[11px] font-medium text-muted-foreground">{c.option.flight.flightNo}</div>
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groups.map((g) => (
              <GroupRows key={g.title} group={g} columns={columns} labelCell={labelCell} valueCell={valueCell} />
            ))}
            <tr>
              <td className={cn(labelCell, "border-t")} />
              {columns.map((c) => (
                <td key={c.key} className={cn(valueCell, "border-t", c.recommended && "bg-accent-soft")}>
                  <Button size="sm" variant={c.recommended ? "accent" : "default"} className="w-full" onClick={() => onSelect(c.option)}>
                    {selectLabel} · {formatINR(c.option.price)}
                  </Button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <button
        type="button"
        onClick={() => setShowAll((v) => !v)}
        aria-expanded={showAll}
        className="flex w-full items-center justify-center gap-1.5 border-t bg-muted/60 px-4 py-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
      >
        {showAll ? (
          "Show key details only"
        ) : (
          <span>
            Show {hiddenCount} more details
            <span className="hidden font-normal text-muted-foreground sm:inline"> · extra baggage, late cancellation, seats & meals, on-time record</span>
          </span>
        )}
        <ChevronDown className={cn("size-4 transition-transform", showAll && "rotate-180")} />
      </button>
    </div>
  );
}

function GroupRows({ group, columns, labelCell, valueCell }: { group: GroupDef; columns: MatrixColumn[]; labelCell: string; valueCell: string }) {
  return (
    <>
      <tr>
        <td className={cn(labelCell, "bg-muted py-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground")}>{group.title}</td>
        <td colSpan={columns.length} className="bg-muted py-1.5" />
      </tr>
      {group.rows.map((row, ri) => {
        const best = row.metric && row.better ? bestIndexes(columns.map(row.metric), row.better) : new Set<number>();
        return (
          <tr key={`${row.label}-${ri}`}>
            <td className={cn(labelCell, "border-b border-border/60")}>
              <div className="text-xs font-semibold leading-tight">{row.label}</div>
              {row.hint && <div className="text-[11px] leading-tight text-muted-foreground">{row.hint}</div>}
            </td>
            {columns.map((c, i) => (
              <td key={c.key} className={cn(valueCell, "border-b border-border/60", c.recommended && "bg-accent-soft/60")}>
                <span className={cn("inline-flex items-start gap-1 rounded-md", best.has(i) && "bg-success-soft px-1.5 py-0.5 font-semibold text-success")}>
                  {best.has(i) && <Check className="mt-0.5 size-3.5 shrink-0" strokeWidth={3} />}
                  <span>{row.render(c)}</span>
                </span>
              </td>
            ))}
          </tr>
        );
      })}
    </>
  );
}
