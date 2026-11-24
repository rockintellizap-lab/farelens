import { SlidersHorizontal, X } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";

import { AirlineMark } from "@/components/flight/AirlineMark";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { AIRLINES, type AirlineCode } from "@/lib/flights/airlines";
import { cn } from "@/lib/utils";

const SLOTS = [
  { id: "early", label: "Before 6 AM", from: 0, to: 360 },
  { id: "morning", label: "6 AM–12 PM", from: 360, to: 720 },
  { id: "afternoon", label: "12–6 PM", from: 720, to: 1080 },
  { id: "evening", label: "After 6 PM", from: 1080, to: 1440 },
] as const;

interface FiltersPanelProps {
  airlineFilter: AirlineCode[];
  setAirlineFilter: Dispatch<SetStateAction<AirlineCode[]>>;
  nonstop: boolean;
  setNonstop: Dispatch<SetStateAction<boolean>>;
  slots: string[];
  setSlots: Dispatch<SetStateAction<string[]>>;
  activeFilters: number;
  onReset: () => void;
}

export function FiltersPanel({
  airlineFilter,
  setAirlineFilter,
  nonstop,
  setNonstop,
  slots,
  setSlots,
  activeFilters,
  onReset,
}: FiltersPanelProps) {
  return (
    <aside className="hidden md:flex flex-col gap-4 w-[280px] shrink-0">
      <div className="flex items-center gap-2 rounded-xl border bg-card p-3">
        <SlidersHorizontal className="size-4 text-muted-foreground" />
        <span className="text-sm font-semibold">Filters</span>
        {activeFilters > 0 && (
          <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
            {activeFilters}
          </span>
        )}
      </div>

      <div className="space-y-3">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Airline
          </p>
          <div className="space-y-1.5">
            {AIRLINES.map((a) => {
              const on = airlineFilter.includes(a.code);
              return (
                <button
                  key={a.code}
                  onClick={() =>
                    setAirlineFilter((prev) =>
                      on ? prev.filter((c) => c !== a.code) : [...prev, a.code],
                    )
                  }
                  className={cn(
                    "flex items-center gap-3 rounded-xl border px-3 py-2 text-left transition-colors",
                    on
                      ? "border-primary bg-primary text-primary-foreground"
                      : "bg-card hover:border-primary/40",
                  )}
                  aria-pressed={on}
                >
                  <AirlineMark airline={a} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">
                      {a.name}
                    </span>
                  </span>
                  {on && <X className="size-3.5 shrink-0 opacity-70" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Stops
          </p>
          <label className="flex items-center justify-between rounded-xl border bg-card p-3 cursor-pointer select-none">
            <span className="text-sm font-semibold">Non-stop only</span>
            <Switch checked={nonstop} onCheckedChange={setNonstop} />
          </label>
        </div>

        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Departure time
          </p>
          <div className="grid grid-cols-2 gap-2">
            {SLOTS.map((s) => {
              const on = slots.includes(s.id);
              return (
                <button
                  key={s.id}
                  onClick={() =>
                    setSlots((prev) =>
                      on ? prev.filter((x) => x !== s.id) : [...prev, s.id],
                    )
                  }
                  className={cn(
                    "rounded-xl border px-3 py-2 text-sm font-semibold transition-colors",
                    on
                      ? "border-primary bg-primary text-primary-foreground"
                      : "bg-card",
                  )}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-auto pt-3 border-t">
        <Button variant="outline" className="w-full" onClick={onReset}>
          Reset filters
        </Button>
      </div>
    </aside>
  );
}
