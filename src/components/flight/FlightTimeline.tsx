import { dayOffset, formatClock, formatDuration } from "@/lib/flights/format";
import type { Flight } from "@/lib/flights/generate";
import { cn } from "@/lib/utils";

export function FlightTimeline({ flight, compact = false }: { flight: Flight; compact?: boolean }) {
  const plus = dayOffset(flight.arriveMin);
  return (
    <div className="flex items-center gap-3">
      <div className="text-left">
        <div className={cn("font-mono font-bold leading-none", compact ? "text-lg" : "text-2xl")}>{formatClock(flight.departMin)}</div>
        <div className="mt-1 text-xs font-medium text-muted-foreground">{flight.from}</div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col items-center">
        <span className="text-[11px] font-medium text-muted-foreground">{formatDuration(flight.durationMin)}</span>
        <div className="relative my-1 h-px w-full bg-border">
          <span className="absolute -left-0.5 -top-[3px] size-[7px] rounded-full border border-muted-foreground/50 bg-card" />
          {flight.stops === 1 && <span className="absolute left-1/2 -top-[3px] size-[7px] -translate-x-1/2 rounded-full bg-warning" />}
          <span className="absolute -right-0.5 -top-[3px] size-[7px] rounded-full bg-primary" />
        </div>
        <span className={cn("text-[11px] font-medium", flight.stops ? "text-warning" : "text-success")}>
          {flight.stops ? `1 stop · ${flight.via}` : "Non-stop"}
        </span>
      </div>
      <div className="text-right">
        <div className={cn("font-mono font-bold leading-none", compact ? "text-lg" : "text-2xl")}>
          {formatClock(flight.arriveMin)}
          {plus > 0 && <sup className="ml-0.5 text-[10px] text-warning">+{plus}</sup>}
        </div>
        <div className="mt-1 text-xs font-medium text-muted-foreground">{flight.to}</div>
      </div>
    </div>
  );
}
