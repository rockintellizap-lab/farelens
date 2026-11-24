import { Armchair, Briefcase, CalendarClock, Check, ChevronDown, Flame, RotateCcw, Utensils, X } from "lucide-react";

import { AirlineMark } from "@/components/flight/AirlineMark";
import { FlightTimeline } from "@/components/flight/FlightTimeline";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { bagLabel, changeLabel, feeLabel, formatINR, seatLabel } from "@/lib/flights/format";
import { fareOptions, type FareOption } from "@/lib/flights/generate";
import { addOnsForNeeds, trueCost, type Needs } from "@/lib/flights/pricing";
import { cn } from "@/lib/utils";

function Chip({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "good" | "warn" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold",
        tone === "neutral" && "bg-muted text-muted-foreground",
        tone === "good" && "bg-success-soft text-success",
        tone === "warn" && "bg-warning-soft text-warning",
      )}
    >
      {children}
    </span>
  );
}

export function FlightCard({
  option,
  needs,
  expanded,
  onToggleExpand,
  compared,
  onToggleCompare,
  onSelect,
}: {
  option: FareOption;
  needs: Needs;
  expanded: boolean;
  onToggleExpand: () => void;
  compared: boolean;
  onToggleCompare: () => void;
  onSelect: (o: FareOption) => void;
}) {
  const { flight, fare } = option;
  const total = trueCost(option, needs);
  const extras = total - option.price;

  return (
    <article id={`flight-${flight.id}`} className={cn("overflow-hidden rounded-2xl border bg-card shadow-card transition-shadow", expanded && "ring-2 ring-primary/15")}>
      <div className="p-4 md:grid md:grid-cols-[180px_minmax(0,1fr)_210px] md:items-center md:gap-6 md:p-5">
        <div className="flex items-start justify-between gap-3 md:flex-col md:items-start md:gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <AirlineMark airline={flight.airline} />
            <div className="min-w-0">
              <div className="truncate text-sm font-bold">{flight.airline.name}</div>
              <div className="font-mono text-[11px] text-muted-foreground">
                {flight.flightNo} · {flight.aircraft}
              </div>
            </div>
          </div>
          <label className="flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <Checkbox checked={compared} onCheckedChange={onToggleCompare} aria-label={`Compare ${flight.flightNo}`} />
            Compare
          </label>
        </div>

        <div className="mt-4 min-w-0 md:mt-0">
          <FlightTimeline flight={flight} />
          <div className="mt-4 flex flex-wrap gap-1.5 md:mt-3">
            <Chip tone={fare.checkinKg ? "neutral" : "warn"}>
              <Briefcase className="size-3" /> {bagLabel(fare)}
            </Chip>
            <Chip tone={fare.cancelFee !== null && fare.cancelFee <= 1500 ? "good" : "neutral"}>
              <X className="size-3" /> Cancel {feeLabel(fare.cancelFee)}
            </Chip>
            <Chip tone={fare.changeFee === 0 ? "good" : "neutral"}>
              <RotateCcw className="size-3" /> Change {fare.changeFee === 0 ? "free" : formatINR(fare.changeFee)}
            </Chip>
            {fare.meal && (
              <Chip tone="good">
                <Utensils className="size-3" /> Meal
              </Chip>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-end justify-between gap-3 border-t border-dashed pt-3 md:mt-0 md:h-full md:flex-col md:justify-center md:border-l md:border-t-0 md:pl-6 md:pt-0 md:text-right">
          <div>
            <div className="font-display text-2xl font-extrabold leading-none">{formatINR(total)}</div>
            <div className="mt-1 text-[11px] text-muted-foreground">
              per person · {fare.name}
              {extras > 0 && ` · incl. ${formatINR(extras)} extras`}
            </div>
            {flight.seatsLeft !== null && (
              <div className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-destructive">
                <Flame className="size-3" /> Only {flight.seatsLeft} left at this price
              </div>
            )}
          </div>
          <Button variant={expanded ? "secondary" : "default"} size="sm" onClick={onToggleExpand} aria-expanded={expanded} className="md:w-full">
            {expanded ? "Hide fares" : "View fares"}
            <ChevronDown className={cn("transition-transform", expanded && "rotate-180")} />
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="animate-in fade-in slide-in-from-top-1 border-t bg-muted/50 p-4">
          <p className="mb-3 text-xs font-semibold text-muted-foreground">
            {flight.airline.name} fare types on this flight
          </p>
          <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 no-scrollbar">
            {fareOptions(flight).map((o) => (
              <FareTypeCard key={o.fare.id} option={o} needs={needs} isBest={o.fare.id === fare.id} onSelect={onSelect} />
            ))}
          </div>
        </div>
      )}
    </article>
  );
}

function FareTypeCard({ option, needs, isBest, onSelect }: { option: FareOption; needs: Needs; isBest: boolean; onSelect: (o: FareOption) => void }) {
  const { fare, flight } = option;
  const extras = addOnsForNeeds(flight.airline, fare, needs);
  const features: { icon: typeof Check; text: string; ok: boolean }[] = [
    { icon: Briefcase, text: `Cabin ${fare.cabinKg} kg`, ok: true },
    { icon: Briefcase, text: fare.checkinKg ? `Check-in ${fare.checkinKg} kg` : "No check-in bag", ok: fare.checkinKg > 0 },
    { icon: X, text: `Cancel: ${feeLabel(fare.cancelFee)}`, ok: fare.cancelFee !== null && fare.cancelFee <= 2000 },
    { icon: CalendarClock, text: `Change: ${changeLabel(fare.changeFee)}`, ok: fare.changeFee === 0 },
    { icon: Armchair, text: seatLabel(fare.seat, flight.airline.seatFee), ok: fare.seat !== "paid" },
    { icon: Utensils, text: fare.meal ? "Meal included" : "Meal paid", ok: fare.meal },
  ];
  if (fare.priority) features.push({ icon: Check, text: "Priority check-in & boarding", ok: true });

  return (
    <div className={cn("flex w-[230px] shrink-0 snap-start flex-col rounded-xl border bg-card p-3.5", isBest && "border-primary ring-1 ring-primary")}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold">{fare.name}</span>
        {isBest && <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">Best for you</span>}
      </div>
      <div className="mt-1 font-display text-xl font-extrabold">{formatINR(option.price)}</div>
      {extras.length > 0 ? (
        <div className="text-[11px] text-warning">+ {extras.map((e) => `${e.label} ${formatINR(e.amount)}`).join(", ")}</div>
      ) : (
        <div className="text-[11px] text-success">Covers everything you need</div>
      )}
      <ul className="mt-3 flex-1 space-y-1.5">
        {features.map((f) => (
          <li key={f.text} className={cn("flex items-center gap-2 text-xs", f.ok ? "text-foreground" : "text-muted-foreground")}>
            <f.icon className={cn("size-3.5 shrink-0", f.ok ? "text-success" : "text-muted-foreground")} />
            {f.text}
          </li>
        ))}
      </ul>
      <Button size="sm" className="mt-3" variant={isBest ? "accent" : "outline"} onClick={() => onSelect(option)}>
        Select {fare.name}
      </Button>
    </div>
  );
}
