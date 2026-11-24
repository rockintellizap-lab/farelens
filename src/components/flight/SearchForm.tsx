import { useNavigate } from "@tanstack/react-router";
import { addDays, format, parseISO } from "date-fns";
import { ArrowLeftRight, Minus, Plus, Search, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AIRPORTS, getAirport } from "@/lib/flights/airports";
import { defaultDepartDate, paxLabel, type FlightSearch } from "@/lib/flights/search";
import { cn } from "@/lib/utils";

const fieldBox = "relative rounded-xl border bg-background px-3 py-2.5 text-left transition-colors hover:border-primary/40 focus-within:border-primary/60";

function AirportPicker({ label, value, onChange, exclude }: { label: string; value: string; onChange: (code: string) => void; exclude: string }) {
  const [open, setOpen] = useState(false);
  const airport = getAirport(value);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className={cn(fieldBox, "w-full min-w-0")}>
          <span className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
          <span className="block font-display text-2xl font-extrabold leading-tight">{airport.code}</span>
          <span className="block truncate text-xs text-muted-foreground">{airport.city}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <Command>
          <CommandInput placeholder="City or airport" />
          <CommandList>
            <CommandEmpty>No airport found.</CommandEmpty>
            <CommandGroup>
              {AIRPORTS.filter((a) => a.code !== exclude).map((a) => (
                <CommandItem
                  key={a.code}
                  value={`${a.code} ${a.city} ${a.name}`}
                  onSelect={() => {
                    onChange(a.code);
                    setOpen(false);
                  }}
                >
                  <span className="w-10 font-mono text-xs font-bold">{a.code}</span>
                  <span className="flex min-w-0 flex-col">
                    <span className="font-medium">{a.city}</span>
                    <span className="truncate text-xs text-muted-foreground">{a.name}</span>
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function Stepper({ label, hint, value, min, max, onChange }: { label: string; hint: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <div className="text-sm font-semibold">{label}</div>
        <div className="text-xs text-muted-foreground">{hint}</div>
      </div>
      <div className="flex items-center gap-3">
        <Button type="button" size="icon" variant="outline" className="size-8 rounded-full" disabled={value <= min} onClick={() => onChange(value - 1)} aria-label={`Fewer ${label}`}>
          <Minus />
        </Button>
        <span className="w-4 text-center font-mono font-bold">{value}</span>
        <Button type="button" size="icon" variant="outline" className="size-8 rounded-full" disabled={value >= max} onClick={() => onChange(value + 1)} aria-label={`More ${label}`}>
          <Plus />
        </Button>
      </div>
    </div>
  );
}

export function SearchForm({ initial, onSearched, className }: { initial?: Partial<FlightSearch>; onSearched?: () => void; className?: string }) {
  const navigate = useNavigate();
  const [tripType, setTripType] = useState<"oneway" | "round">(initial?.ret ? "round" : "oneway");
  const [from, setFrom] = useState(initial?.from ?? "DEL");
  const [to, setTo] = useState(initial?.to ?? "BOM");
  const [date, setDate] = useState(initial?.date ?? defaultDepartDate());
  const [ret, setRet] = useState(initial?.ret ?? format(addDays(parseISO(initial?.date ?? defaultDepartDate()), 3), "yyyy-MM-dd"));
  const [adults, setAdults] = useState(initial?.adults ?? 1);
  const [children, setChildren] = useState(initial?.children ?? 0);
  const today = format(new Date(), "yyyy-MM-dd");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (from === to) {
      toast.error("Origin and destination can't be the same.");
      return;
    }
    if (tripType === "round" && ret < date) {
      toast.error("Return date must be after departure.");
      return;
    }
    navigate({
      to: "/results",
      search: {
        from,
        to,
        date,
        ret: tripType === "round" ? ret : undefined,
        adults,
        children,
        bag: initial?.bag ?? 1,
        seat: initial?.seat ?? 0,
        meal: initial?.meal ?? 0,
      },
    });
    onSearched?.();
  }

  return (
    <form onSubmit={submit} className={cn("rounded-3xl border bg-card p-4 shadow-float md:p-5", className)}>
      <div className="mb-4 inline-flex rounded-full bg-muted p-1 text-sm font-semibold" role="tablist">
        {(["oneway", "round"] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tripType === t}
            onClick={() => setTripType(t)}
            className={cn("rounded-full px-4 py-1.5 transition-colors", tripType === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
          >
            {t === "oneway" ? "One way" : "Round trip"}
          </button>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-[1.6fr_1.4fr_1fr_auto] md:items-stretch">
        <div className="relative grid grid-cols-2 gap-2">
          <AirportPicker label="From" value={from} onChange={setFrom} exclude={to} />
          <AirportPicker label="To" value={to} onChange={setTo} exclude={from} />
          <button
            type="button"
            onClick={() => {
              setFrom(to);
              setTo(from);
            }}
            aria-label="Swap origin and destination"
            className="absolute left-1/2 top-1/2 z-10 inline-flex size-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border bg-card text-foreground shadow-card transition-transform hover:rotate-180"
          >
            <ArrowLeftRight className="size-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <label className={fieldBox}>
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Depart</span>
            <input type="date" required min={today} value={date} onChange={(e) => setDate(e.target.value)} className="mt-1 w-full bg-transparent text-sm font-semibold outline-none" />
          </label>
          {tripType === "round" ? (
            <label className={fieldBox}>
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Return</span>
              <input type="date" required min={date} value={ret} onChange={(e) => setRet(e.target.value)} className="mt-1 w-full bg-transparent text-sm font-semibold outline-none" />
            </label>
          ) : (
            <button type="button" onClick={() => setTripType("round")} className={cn(fieldBox, "border-dashed text-muted-foreground")}>
              <span className="block text-[11px] font-semibold uppercase tracking-wider">Return</span>
              <span className="mt-1 block text-sm font-semibold">+ Add return</span>
            </button>
          )}
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <button type="button" className={fieldBox}>
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Travellers</span>
              <span className="mt-1 flex items-center gap-2 text-sm font-semibold">
                <Users className="size-4 text-muted-foreground" />
                {paxLabel({ adults, children } as FlightSearch)}
              </span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-72" align="end">
            <Stepper label="Adults" hint="12+ years" value={adults} min={1} max={9} onChange={setAdults} />
            <Stepper label="Children" hint="2–11 years" value={children} min={0} max={8} onChange={setChildren} />
            <p className="mt-2 text-xs text-muted-foreground">Economy · LCCs price children the same as adults.</p>
          </PopoverContent>
        </Popover>

        <Button type="submit" variant="accent" size="xl" className="h-auto min-h-12 md:px-8">
          <Search className="size-5" />
          Compare fares
        </Button>
      </div>
    </form>
  );
}
