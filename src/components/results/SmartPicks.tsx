import { BadgePercent, Crown, ShieldCheck, Zap } from "lucide-react";

import { AirlineMark } from "@/components/flight/AirlineMark";
import { Button } from "@/components/ui/button";
import { formatClock, formatDuration, formatINR } from "@/lib/flights/format";
import type { FareOption } from "@/lib/flights/generate";
import { trueCost, type Needs } from "@/lib/flights/pricing";

export interface Pick {
  key: string;
  title: string;
  reason: string;
  option: FareOption;
}

const ICONS = { cheapest: BadgePercent, fastest: Zap, flexible: ShieldCheck, value: Crown } as const;

export function SmartPicks({ picks, needs, onSelect }: { picks: Pick[]; needs: Needs; onSelect: (o: FareOption) => void }) {
  return (
    <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 no-scrollbar md:mx-0 md:grid md:grid-cols-4 md:px-0">
      {picks.map((p) => {
        const Icon = ICONS[p.key as keyof typeof ICONS] ?? Crown;
        const o = p.option;
        return (
          <div key={p.key} className="flex w-[78%] shrink-0 snap-start flex-col rounded-2xl border bg-card p-4 shadow-card md:w-auto">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <Icon className="size-4 text-accent-foreground" />
              {p.title}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <AirlineMark airline={o.flight.airline} size="sm" />
              <div className="min-w-0">
                <div className="truncate text-sm font-bold">{o.flight.airline.name}</div>
                <div className="font-mono text-[11px] text-muted-foreground">
                  {formatClock(o.flight.departMin)} · {formatDuration(o.flight.durationMin)} · {o.fare.name}
                </div>
              </div>
            </div>
            <div className="mt-3 font-display text-2xl font-extrabold">{formatINR(trueCost(o, needs))}</div>
            <p className="mt-1 flex-1 text-xs text-muted-foreground">{p.reason}</p>
            <Button size="sm" variant="outline" className="mt-3" onClick={() => onSelect(o)}>
              Choose this
            </Button>
          </div>
        );
      })}
    </div>
  );
}
