import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import {
  ArrowRight,
  ArrowLeftRight,
  Plane,
  SlidersHorizontal,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AirlineMark } from "@/components/flight/AirlineMark";
import { SearchForm } from "@/components/flight/SearchForm";
import { SiteFooter, SiteHeader, Steps } from "@/components/layout/SiteHeader";
import { CompareTray } from "@/components/results/CompareTray";
import { ComparisonMatrix } from "@/components/results/ComparisonMatrix";
import { FiltersPanel } from "@/components/results/FiltersPanel";
import { FlightCard } from "@/components/results/FlightCard";
import { NeedsBar } from "@/components/results/NeedsBar";
import { SmartPicks, type Pick } from "@/components/results/SmartPicks";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { isSignedIn } from "@/lib/auth/demo-auth";
import { AIRLINES, type AirlineCode } from "@/lib/flights/airlines";
import { getAirport } from "@/lib/flights/airports";
import {
  formatClock,
  formatDateLabel,
  formatDuration,
  formatINR,
} from "@/lib/flights/format";
import {
  findOption,
  generateFlights,
  selectionKey,
  type FareOption,
} from "@/lib/flights/generate";
import {
  airlineSummaries,
  bestFareForNeeds,
  indexOfMin,
  trueCost,
  valueScores,
  type Needs,
} from "@/lib/flights/pricing";
import {
  needsFromSearch,
  paxLabel,
  pickSearch,
  resultsSearchSchema,
} from "@/lib/flights/search";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/results")({
  validateSearch: (s: Record<string, unknown>) => resultsSearchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Compare fares across 5 low-cost airlines | FareLens" },
      {
        name: "description",
        content:
          "IndiGo, Akasa Air, SpiceJet, Air India Express and Fly91 compared side by side on price, baggage, cancellation and change fees.",
      },
      {
        property: "og:title",
        content: "Compare fares across 5 low-cost airlines | FareLens",
      },
      {
        property: "og:description",
        content:
          "See the true cost, baggage and flexibility of every Indian LCC in one table.",
      },
    ],
  }),
  component: ResultsPage,
});

type SortKey = "true" | "fast" | "early" | "value";
const SLOTS = [
  { id: "early", label: "Before 6 AM", from: 0, to: 360 },
  { id: "morning", label: "6 AM–12 PM", from: 360, to: 720 },
  { id: "afternoon", label: "12–6 PM", from: 720, to: 1080 },
  { id: "evening", label: "After 6 PM", from: 1080, to: 1440 },
] as const;

function ResultsPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const router = useRouter();
  const needs = needsFromSearch(search);
  const isReturnLeg = Boolean(search.ret && search.out);
  const legFrom = isReturnLeg ? search.to : search.from;
  const legTo = isReturnLeg ? search.from : search.to;
  const legDate = isReturnLeg && search.ret ? search.ret : search.date;

  const flights = useMemo(
    () => generateFlights(legFrom, legTo, legDate),
    [legFrom, legTo, legDate],
  );
  const outbound = useMemo(
    () =>
      isReturnLeg
        ? findOption(
            generateFlights(search.from, search.to, search.date),
            search.out,
          )
        : null,
    [isReturnLeg, search.from, search.to, search.date, search.out],
  );

  const [tier, setTier] = useState<"any" | "flex">("any");
  const [airlineFilter, setAirlineFilter] = useState<AirlineCode[]>([]);
  const [nonstop, setNonstop] = useState(false);
  const [slots, setSlots] = useState<string[]>([]);
  const [sort, setSort] = useState<SortKey>("true");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [compare, setCompare] = useState<string[]>([]);
  const [modifyOpen, setModifyOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const setNeeds = (n: Needs) =>
    navigate({
      search: (prev) => ({
        ...prev,
        bag: n.bag ? 1 : 0,
        seat: n.seat ? 1 : 0,
        meal: n.meal ? 1 : 0,
      }),
      replace: true,
      resetScroll: false,
    });

  const summaries = useMemo(
    () => airlineSummaries(flights, needs, tier, AIRLINES),
    [flights, needs.bag, needs.seat, needs.meal, tier],
  ); // eslint-disable-line react-hooks/exhaustive-deps
  const summaryBest = indexOfMin(
    valueScores(
      summaries.map((s) => s.option),
      needs,
    ),
  );

  const options = useMemo(
    () => flights.map((f) => bestFareForNeeds(f, needs)),
    [flights, needs.bag, needs.seat, needs.meal],
  ); // eslint-disable-line react-hooks/exhaustive-deps

  const picks = useMemo<Pick[]>(() => {
    if (!options.length) return [];
    const byCost = [...options].sort(
      (a, b) => trueCost(a, needs) - trueCost(b, needs),
    );
    const cheapest = byCost[0]!;
    const fastest = [...options].sort(
      (a, b) =>
        a.flight.durationMin - b.flight.durationMin ||
        trueCost(a, needs) - trueCost(b, needs),
    )[0]!;
    const flexPool = flights.map((f) => bestFareForNeeds(f, needs, "flex"));
    const flexible = [...flexPool].sort(
      (a, b) =>
        a.fare.changeFee +
          (a.fare.cancelFee ?? 9999) -
          (b.fare.changeFee + (b.fare.cancelFee ?? 9999)) ||
        trueCost(a, needs) - trueCost(b, needs),
    )[0]!;
    const scores = valueScores(options, needs);
    const value = options[indexOfMin(scores)]!;
    const second = byCost[1];
    return [
      {
        key: "cheapest",
        title: "Cheapest",
        option: cheapest,
        reason: second
          ? `${formatINR(trueCost(second, needs) - trueCost(cheapest, needs))} less than the next best option.`
          : "Lowest true cost today.",
      },
      {
        key: "fastest",
        title: "Fastest",
        option: fastest,
        reason: `${formatDuration(fastest.flight.durationMin)} door to door, ${fastest.flight.stops ? "1 stop" : "non-stop"}.`,
      },
      {
        key: "flexible",
        title: "Most flexible",
        option: flexible,
        reason: `Free reschedule, cancel for ${flexible.fare.cancelFee === null ? "taxes only" : formatINR(flexible.fare.cancelFee)}.`,
      },
      {
        key: "value",
        title: "Best value",
        option: value,
        reason: `Balances price, time and ${value.flight.airline.onTimePct}% on-time record.`,
      },
    ];
  }, [options, flights]); // eslint-disable-line react-hooks/exhaustive-deps

  const visible = useMemo(() => {
    const list = options.filter((o) => {
      if (
        airlineFilter.length &&
        !airlineFilter.includes(o.flight.airline.code)
      )
        return false;
      if (nonstop && o.flight.stops) return false;
      if (slots.length) {
        const m = o.flight.departMin % 1440;
        if (!SLOTS.some((s) => slots.includes(s.id) && m >= s.from && m < s.to))
          return false;
      }
      return true;
    });
    const scores = new Map(
      options.map((o, i) => [o.flight.id, valueScores(options, needs)[i] ?? 0]),
    );
    return list.sort((a, b) => {
      if (sort === "fast") return a.flight.durationMin - b.flight.durationMin;
      if (sort === "early") return a.flight.departMin - b.flight.departMin;
      if (sort === "value")
        return (scores.get(a.flight.id) ?? 0) - (scores.get(b.flight.id) ?? 0);
      return trueCost(a, needs) - trueCost(b, needs);
    });
  }, [options, airlineFilter, nonstop, slots, sort]); // eslint-disable-line react-hooks/exhaustive-deps

  const compared = compare
    .map((id) => options.find((o) => o.flight.id === id))
    .filter((o): o is FareOption => Boolean(o));

  function toggleCompare(id: string) {
    setCompare((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) {
        toast("You can compare up to 3 flights at once.");
        return prev;
      }
      return [...prev, id];
    });
  }

  function select(o: FareOption) {
    const sel = selectionKey(o);
    const base = pickSearch(search);
    if (search.ret && !search.out) {
      setCompare([]);
      setExpanded(null);
      navigate({ search: { ...base, out: sel } });
      toast.success(
        `Departure set: ${o.flight.flightNo}. Now pick your return.`,
      );
      return;
    }
    const reviewSearch =
      search.ret && search.out
        ? { ...base, out: search.out, back: sel }
        : { ...base, out: sel };
    if (!isSignedIn()) {
      const href = router.buildLocation({
        to: "/review",
        search: reviewSearch,
      }).href;
      navigate({ to: "/login", search: { redirect: href } });
      return;
    }
    navigate({ to: "/review", search: reviewSearch });
  }

  const from = getAirport(legFrom);
  const to = getAirport(legTo);
  const activeFilters = airlineFilter.length + (nonstop ? 1 : 0) + slots.length;

  return (
    <div className="min-h-screen pb-24">
      <SiteHeader>
        <Steps current={1} />
      </SiteHeader>

      <div className="sticky top-0 z-30 border-b bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5 md:px-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2 font-display text-lg font-extrabold">
              {from.code}{" "}
              {search.ret ? (
                <ArrowLeftRight className="size-4" />
              ) : (
                <ArrowRight className="size-4" />
              )}{" "}
              {to.code}
              {search.ret && (
                <span className="rounded-full bg-accent-soft px-2 py-0.5 font-sans text-[11px] font-bold text-accent-foreground">
                  {isReturnLeg ? "Return" : "Departure"}
                </span>
              )}
            </div>
            <div className="truncate text-xs text-muted-foreground">
              {formatDateLabel(legDate)} · {paxLabel(search)} · Economy
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setModifyOpen(true)}
          >
            Modify
          </Button>
        </div>
      </div>

      <main className="mx-auto max-w-6xl space-y-8 px-4 pt-5 md:px-6">
        {search.ret && (
          <div className="flex items-center gap-3 text-xs font-semibold">
            <span
              className={cn(
                "rounded-full px-3 py-1",
                !isReturnLeg
                  ? "bg-primary text-primary-foreground"
                  : "bg-success-soft text-success",
              )}
            >
              1 · Departure
            </span>
            <span className="h-px flex-1 bg-border" />
            <span
              className={cn(
                "rounded-full px-3 py-1",
                isReturnLeg
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground",
              )}
            >
              2 · Return
            </span>
          </div>
        )}

        {outbound && (
          <div className="flex items-center gap-3 rounded-2xl border border-success/30 bg-success-soft p-3">
            <AirlineMark airline={outbound.flight.airline} size="sm" />
            <div className="min-w-0 flex-1 text-xs">
              <div className="font-bold text-success">Departure selected</div>
              <div className="truncate text-foreground">
                {outbound.flight.flightNo} ·{" "}
                {formatClock(outbound.flight.departMin)} {outbound.flight.from}{" "}
                → {outbound.flight.to} · {outbound.fare.name} ·{" "}
                {formatINR(outbound.price)}
              </div>
            </div>
            <Link
              to="/results"
              search={{ ...pickSearch(search), out: undefined }}
              className="text-xs font-semibold underline"
            >
              Change
            </Link>
          </div>
        )}

        <NeedsBar needs={needs} onChange={setNeeds} />

        <section aria-labelledby="glance">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="glance" className="text-2xl font-extrabold">
                5 airlines at a glance
              </h2>
              <p className="text-sm text-muted-foreground">
                Each airline's best option for you. Green = best in that row.
              </p>
            </div>
            <div className="inline-flex rounded-full bg-muted p-1 text-xs font-semibold">
              {(
                [
                  ["any", "Lowest fares"],
                  ["flex", "Flexible fares"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setTier(id)}
                  className={cn(
                    "rounded-full px-3 py-1.5 transition-colors",
                    tier === id
                      ? "bg-card text-foreground shadow-card"
                      : "text-muted-foreground",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <ComparisonMatrix
            columns={summaries.map((s, i) => ({
              key: s.airline.code,
              option: s.option,
              trueCost: s.trueCost,
              flightsOnRoute: s.flightsOnRoute,
              recommended: i === summaryBest,
            }))}
            onSelect={select}
          />
          <p className="mt-2 text-[11px] text-muted-foreground md:hidden">
            Swipe the table sideways to see all 5 airlines →
          </p>
        </section>

        <section aria-labelledby="picks">
          <h2 id="picks" className="mb-3 text-2xl font-extrabold">
            Smart picks
          </h2>
          <SmartPicks picks={picks} needs={needs} onSelect={select} />
        </section>

        <section aria-labelledby="all" className="space-y-3">
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 lg:gap-0">
            <FiltersPanel
              airlineFilter={airlineFilter}
              setAirlineFilter={setAirlineFilter}
              nonstop={nonstop}
              setNonstop={setNonstop}
              slots={slots}
              setSlots={setSlots}
              activeFilters={activeFilters}
              onReset={() => {
                setAirlineFilter([]);
                setNonstop(false);
                setSlots([]);
              }}
            />

            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 id="all" className="text-2xl font-extrabold">
                  All flights{" "}
                  <span className="font-sans text-base font-semibold text-muted-foreground">
                    ({visible.length})
                  </span>
                </h2>
                <div className="flex items-center gap-2">
                  <Select
                    value={sort}
                    onValueChange={(v) => setSort(v as SortKey)}
                  >
                    <SelectTrigger className="h-9 w-[150px] bg-card text-xs font-semibold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Cheapest (true cost)</SelectItem>
                      <SelectItem value="value">Best value</SelectItem>
                      <SelectItem value="fast">Fastest</SelectItem>
                      <SelectItem value="early">Earliest departure</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 bg-card lg:hidden"
                    onClick={() => setFiltersOpen(true)}
                  >
                    <SlidersHorizontal /> Filters
                    {activeFilters ? ` (${activeFilters})` : ""}
                  </Button>
                </div>
              </div>

              <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar md:mx-0 md:px-0 lg:hidden">
                {summaries.map((s) => {
                  const on = airlineFilter.includes(s.airline.code);
                  return (
                    <button
                      key={s.airline.code}
                      onClick={() =>
                        setAirlineFilter((prev) =>
                          on
                            ? prev.filter((c) => c !== s.airline.code)
                            : [...prev, s.airline.code],
                        )
                      }
                      className={cn(
                        "flex shrink-0 items-center gap-2 rounded-xl border bg-card px-3 py-2 text-left transition-colors",
                        on
                          ? "border-primary ring-1 ring-primary"
                          : "hover:border-primary/40",
                      )}
                      aria-pressed={on}
                    >
                      <AirlineMark airline={s.airline} size="sm" />
                      <span>
                        <span className="block text-xs font-bold">
                          {s.airline.name}
                        </span>
                        <span className="block font-mono text-[11px] text-muted-foreground">
                          from {formatINR(s.trueCost)}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="space-y-3">
                {visible.map((o) => (
                  <FlightCard
                    key={o.flight.id}
                    option={o}
                    needs={needs}
                    expanded={expanded === o.flight.id}
                    onToggleExpand={() =>
                      setExpanded((e) =>
                        e === o.flight.id ? null : o.flight.id,
                      )
                    }
                    compared={compare.includes(o.flight.id)}
                    onToggleCompare={() => toggleCompare(o.flight.id)}
                    onSelect={select}
                  />
                ))}
              </div>
              {!visible.length && (
                <div className="rounded-2xl border border-dashed bg-card p-10 text-center">
                  <Plane className="mx-auto size-8 text-muted-foreground" />
                  <p className="mt-2 font-semibold">
                    No flights match these filters.
                  </p>
                  <Button
                    variant="link"
                    onClick={() => {
                      setAirlineFilter([]);
                      setNonstop(false);
                      setSlots([]);
                    }}
                  >
                    Clear filters
                  </Button>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />

      <CompareTray
        options={compared}
        needs={needs}
        onClear={() => setCompare([])}
        onRemove={toggleCompare}
        onSelect={select}
      />

      <Sheet open={modifyOpen} onOpenChange={setModifyOpen}>
        <SheetContent
          side="top"
          className="max-h-[92vh] overflow-y-auto bg-background p-4"
        >
          <SheetHeader className="p-0 pb-3">
            <SheetTitle className="font-display">Modify search</SheetTitle>
          </SheetHeader>
          <SearchForm
            initial={search}
            onSearched={() => setModifyOpen(false)}
            className="shadow-none"
          />
        </SheetContent>
      </Sheet>

      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl bg-background p-5">
          <SheetHeader className="p-0 pb-2">
            <SheetTitle className="font-display">Filters</SheetTitle>
          </SheetHeader>
          <div className="space-y-5">
            <label className="flex items-center justify-between rounded-xl border bg-card p-3">
              <span className="text-sm font-semibold">Non-stop only</span>
              <Switch checked={nonstop} onCheckedChange={setNonstop} />
            </label>
            <div>
              <div className="mb-2 text-sm font-semibold">Departure time</div>
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
                        "rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors",
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
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setAirlineFilter([]);
                  setNonstop(false);
                  setSlots([]);
                }}
              >
                Reset
              </Button>
              <Button className="flex-1" onClick={() => setFiltersOpen(false)}>
                Show {visible.length} flights
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
