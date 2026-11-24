import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Armchair, Briefcase, CalendarClock, Clock3, IndianRupee, XCircle } from "lucide-react";
import { useMemo } from "react";

import { AirlineMark } from "@/components/flight/AirlineMark";
import { SearchForm } from "@/components/flight/SearchForm";
import { SiteFooter, SiteHeader } from "@/components/layout/SiteHeader";
import { AIRLINES } from "@/lib/flights/airlines";
import { getAirport } from "@/lib/flights/airports";
import { feeLabel, formatClock, formatINR } from "@/lib/flights/format";
import { generateFlights } from "@/lib/flights/generate";
import { airlineSummaries } from "@/lib/flights/pricing";
import { defaultDepartDate } from "@/lib/flights/search";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FareLens — Compare 5 Indian low-cost airlines in one screen" },
      { name: "description", content: "Compare IndiGo, Akasa Air, SpiceJet, Air India Express and Fly91 on true price, baggage, cancellation and reschedule fees — side by side." },
      { property: "og:title", content: "FareLens — Compare 5 low-cost airlines in one screen" },
      { property: "og:description", content: "Stop opening five airline tabs. See price, baggage and change fees side by side." },
    ],
  }),
  component: HomePage,
});

const POINTS = [
  { icon: IndianRupee, title: "True price", text: "Fare plus the bag, seat or meal you actually need." },
  { icon: Briefcase, title: "Baggage", text: "Cabin, check-in, pre-book and airport excess rates." },
  { icon: XCircle, title: "Cancellation", text: "Fees before and within 3 days — and what you get back." },
  { icon: CalendarClock, title: "Reschedule", text: "Change fees per fare type, early and late." },
  { icon: Armchair, title: "Seats & meals", text: "Free or paid, seat pitch and charging." },
  { icon: Clock3, title: "On-time record", text: "Punctuality so cheap doesn't mean late." },
];

const POPULAR = [
  ["DEL", "BOM"],
  ["BLR", "DEL"],
  ["BOM", "GOX"],
  ["HYD", "BLR"],
  ["DEL", "CCU"],
  ["MAA", "COK"],
] as const;

function HomePage() {
  const date = defaultDepartDate();
  const board = useMemo(() => airlineSummaries(generateFlights("DEL", "BOM", date), { bag: true, seat: false, meal: false }, "any", AIRLINES), [date]);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main>
        <section className="bg-hero text-primary-foreground">
          <div className="mx-auto max-w-6xl px-4 pb-28 pt-10 md:px-6 md:pb-36 md:pt-16">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">5 low-cost airlines · one screen</p>
            <h1 className="mt-3 max-w-3xl text-4xl font-extrabold leading-[1.02] md:text-6xl">Stop opening five airline tabs.</h1>
            <p className="mt-4 max-w-xl text-base text-primary-foreground/75 md:text-lg">
              Compare the true price, baggage, cancellation and reschedule fees of every Indian low-cost airline — side by side, in seconds.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-2">
              {AIRLINES.map((a) => (
                <span key={a.code} className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/15 bg-primary-foreground/5 py-1 pl-1 pr-3 text-xs font-semibold">
                  <AirlineMark airline={a} size="sm" className="rounded-full" />
                  {a.name}
                </span>
              ))}
            </div>
          </div>
        </section>

        <div className="relative z-10 mx-auto -mt-20 max-w-6xl px-4 md:px-6">
          <SearchForm />
        </div>

        <section className="mx-auto mt-14 max-w-6xl px-4 md:px-6">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-extrabold md:text-3xl">Today's fare board</h2>
              <p className="text-sm text-muted-foreground">Delhi → Mumbai, lowest fare with a 15 kg bag (demo).</p>
            </div>
            <Link
              to="/results"
              search={{ from: "DEL", to: "BOM", date, ret: undefined, adults: 1, children: 0, bag: 1, seat: 0, meal: 0, out: undefined }}
              className="hidden items-center gap-1 text-sm font-semibold hover:underline sm:inline-flex"
            >
              Full comparison <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="mt-4 overflow-hidden rounded-2xl bg-board p-1 text-board-foreground shadow-float board-scan">
            <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-board-muted md:grid-cols-[1.4fr_0.8fr_0.8fr_1fr_1fr]">
              <span>Airline</span>
              <span className="hidden md:block">Departs</span>
              <span className="hidden md:block">Bag</span>
              <span>Cancel</span>
              <span className="text-right">Fare</span>
            </div>
            {board.map((s) => (
              <div key={s.airline.code} className="grid grid-cols-[1fr_auto_auto] items-center gap-x-4 border-t border-primary-foreground/10 px-4 py-3 font-mono text-sm md:grid-cols-[1.4fr_0.8fr_0.8fr_1fr_1fr]">
                <span className="flex min-w-0 items-center gap-2">
                  <AirlineMark airline={s.airline} size="sm" />
                  <span className="truncate font-bold uppercase">{s.airline.name}</span>
                </span>
                <span className="hidden md:block">{formatClock(s.option.flight.departMin)}</span>
                <span className="hidden md:block">{s.option.fare.checkinKg} KG</span>
                <span className="text-xs text-board-muted md:text-sm md:text-board-foreground">{feeLabel(s.option.fare.cancelFee)}</span>
                <span className="text-right text-base font-bold">{formatINR(s.trueCost)}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto mt-14 max-w-6xl px-4 md:px-6">
          <h2 className="text-2xl font-extrabold md:text-3xl">Everything that changes the real price</h2>
          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3">
            {POINTS.map((p) => (
              <div key={p.title} className="rounded-2xl border bg-card p-4 shadow-card">
                <span className="inline-flex size-9 items-center justify-center rounded-xl bg-accent-soft">
                  <p.icon className="size-4.5" />
                </span>
                <h3 className="mt-3 text-base font-bold">{p.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground md:text-sm">{p.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto mt-14 max-w-6xl px-4 md:px-6">
          <h2 className="text-2xl font-extrabold md:text-3xl">Popular routes</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {POPULAR.map(([f, t]) => (
              <Link
                key={`${f}${t}`}
                to="/results"
                search={{ from: f, to: t, date, ret: undefined, adults: 1, children: 0, bag: 1, seat: 0, meal: 0, out: undefined }}
                className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm font-semibold transition-colors hover:border-primary/40"
              >
                {getAirport(f).city} <ArrowRight className="size-3.5 text-muted-foreground" /> {getAirport(t).city}
              </Link>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
