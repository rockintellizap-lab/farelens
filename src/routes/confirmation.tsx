import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Download, Mail, Search } from "lucide-react";
import { useMemo } from "react";
import { toast } from "sonner";

import { LegSummary } from "@/components/flight/LegSummary";
import { SiteFooter, SiteHeader, Steps } from "@/components/layout/SiteHeader";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/flights/format";
import { findOption, generateFlights, type FareOption } from "@/lib/flights/generate";
import { confirmationSearchSchema, paxLabel } from "@/lib/flights/search";

export const Route = createFileRoute("/confirmation")({
  validateSearch: (s: Record<string, unknown>) => confirmationSearchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Booking confirmed | FareLens" },
      { name: "description", content: "Your low-cost flight is booked. PNR, itinerary and fare rules in one place." },
      { property: "og:title", content: "Booking confirmed | FareLens" },
      { property: "og:description", content: "PNR, itinerary and fare rules in one place." },
    ],
  }),
  component: ConfirmationPage,
});

function pnrFor(seed: string) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let h = 7;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  let out = "";
  for (let i = 0; i < 6; i++) {
    out += chars[h % chars.length];
    h = Math.floor(h / chars.length) + (i + 1) * 977;
  }
  return out;
}

function ConfirmationPage() {
  const search = Route.useSearch();
  const out = useMemo(() => findOption(generateFlights(search.from, search.to, search.date), search.out), [search.from, search.to, search.date, search.out]);
  const back = useMemo(
    () => (search.ret && search.back ? findOption(generateFlights(search.to, search.from, search.ret), search.back) : null),
    [search.to, search.from, search.ret, search.back],
  );
  const legs = [out, back].filter((o): o is FareOption => Boolean(o));

  return (
    <div className="min-h-screen">
      <SiteHeader>
        <Steps current={4} />
      </SiteHeader>
      <section className="bg-hero text-primary-foreground">
        <div className="mx-auto max-w-3xl px-4 py-10 text-center md:px-6">
          <CheckCircle2 className="mx-auto size-14 text-accent animate-in zoom-in-50 duration-500" />
          <h1 className="mt-3 text-3xl font-extrabold md:text-4xl">You're booked, {search.name.split(" ").slice(1, 2).join("") || "traveller"}!</h1>
          <p className="mt-2 text-primary-foreground/75">
            {paxLabel(search)} · Total paid {formatINR(search.paid)}
          </p>
          {search.email && (
            <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-primary-foreground/60">
              <Mail className="size-4" /> E-ticket sent to {search.email}
            </p>
          )}
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {legs.map((o) => (
              <div key={o.flight.id} className="rounded-xl border border-primary-foreground/15 bg-board px-4 py-2.5 text-left board-scan">
                <div className="text-[10px] font-semibold uppercase tracking-widest text-board-muted">
                  {o.flight.airline.name} PNR
                </div>
                <div className="font-mono text-2xl font-bold tracking-[0.3em] text-board-foreground">{pnrFor(`${o.flight.id}${search.name}${search.paid}`)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-3xl space-y-5 px-4 py-8 md:px-6">
        {legs.map((o, i) => (
          <LegSummary key={o.flight.id} option={o} label={i === 0 ? "Departure" : "Return"} />
        ))}
        <div className="rounded-2xl border bg-accent-soft p-4 text-sm">
          <div className="font-bold">Good to know</div>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
            <li>Web check-in opens 48 hours before departure on the airline's site or app.</li>
            <li>Reach the airport at least 2 hours early; bag drop closes 45–60 minutes before departure.</li>
            <li>Manage, reschedule or cancel from your FareLens trips — fees are exactly as shown above.</li>
          </ul>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button variant="outline" className="flex-1" onClick={() => toast.success("E-ticket downloaded (demo)")}>
            <Download /> Download e-ticket
          </Button>
          <Button asChild variant="accent" className="flex-1">
            <Link to="/">
              <Search /> Search another flight
            </Link>
          </Button>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
