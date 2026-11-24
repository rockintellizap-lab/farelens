import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, BadgeCheck, Lock, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { LegSummary } from "@/components/flight/LegSummary";
import { SiteFooter, SiteHeader, Steps } from "@/components/layout/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useDemoUser } from "@/lib/auth/demo-auth";
import { formatINR } from "@/lib/flights/format";
import { findOption, generateFlights, type FareOption } from "@/lib/flights/generate";
import { baseFarePart } from "@/lib/flights/pricing";
import { needsFromSearch, paxCount, pickSearch, reviewSearchSchema } from "@/lib/flights/search";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/review")({
  validateSearch: (s: Record<string, unknown>) => reviewSearchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Review your flight & fare rules | FareLens" },
      { name: "description", content: "Check baggage, cancellation and reschedule rules, add extras and enter traveller details before booking." },
      { property: "og:title", content: "Review your flight & fare rules | FareLens" },
      { property: "og:description", content: "Every fee spelled out before you pay." },
    ],
  }),
  component: ReviewPage,
});

interface Extras {
  bag15: boolean;
  extraKg: 0 | 5 | 10;
  seat: boolean;
  meal: boolean;
}

interface Traveller {
  title: string;
  first: string;
  last: string;
}

const PLATFORM_FEE = 0;

function extrasCost(o: FareOption, e: Extras) {
  const a = o.flight.airline;
  const lines: { label: string; amount: number }[] = [];
  if (o.fare.checkinKg === 0 && e.bag15) lines.push({ label: "15 kg check-in bag", amount: a.bagAddOn15kg });
  if (e.extraKg) lines.push({ label: `Extra ${e.extraKg} kg`, amount: a.extra5kg * (e.extraKg / 5) });
  if (o.fare.seat === "paid" && e.seat) lines.push({ label: "Seat selection", amount: a.seatFee });
  if (!o.fare.meal && e.meal) lines.push({ label: "Meal", amount: a.mealFee });
  return lines;
}

function ReviewPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const needs = needsFromSearch(search);
  const pax = paxCount(search);

  const out = useMemo(() => findOption(generateFlights(search.from, search.to, search.date), search.out), [search.from, search.to, search.date, search.out]);
  const back = useMemo(
    () => (search.ret && search.back ? findOption(generateFlights(search.to, search.from, search.ret), search.back) : null),
    [search.to, search.from, search.ret, search.back],
  );
  const legs = [out, back].filter((o): o is FareOption => Boolean(o));

  const initialExtras: Extras = { bag15: needs.bag, extraKg: 0, seat: needs.seat, meal: needs.meal };
  const [extras, setExtras] = useState<Extras[]>(() => legs.map(() => ({ ...initialExtras })));
  const [travellers, setTravellers] = useState<Traveller[]>(() =>
    Array.from({ length: pax }, (_, i) => ({ title: i < search.adults ? "Mr" : "Master", first: "", last: "" })),
  );
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [showErrors, setShowErrors] = useState(false);
  const user = useDemoUser();

  // Signed-in travellers get their contact details and lead name filled in.
  useEffect(() => {
    if (!user) return;
    setEmail((v) => v || user.email);
    setPhone((v) => v || `${user.phone.slice(0, 5)} ${user.phone.slice(5)}`);
    const [first = "", ...rest] = user.name.split(" ");
    setTravellers((prev) => prev.map((t, i) => (i === 0 && !t.first && !t.last ? { ...t, first, last: rest.join(" ") } : t)));
  }, [user]);

  if (!out) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <main className="mx-auto max-w-lg px-4 py-20 text-center">
          <h1 className="text-2xl font-extrabold">That fare is no longer available</h1>
          <p className="mt-2 text-muted-foreground">Prices move fast on low-cost airlines. Pick again from fresh results.</p>
          <Button asChild className="mt-6">
            <Link to="/results" search={pickSearch(search)}>Back to results</Link>
          </Button>
        </main>
      </div>
    );
  }

  const fareTotal = legs.reduce((s, o) => s + o.price, 0) * pax;
  const extraLines = legs.flatMap((o, i) => extrasCost(o, extras[i] ?? initialExtras).map((l) => ({ ...l, label: `${o.flight.from}→${o.flight.to} · ${l.label}`, amount: l.amount * pax })));
  const extrasTotal = extraLines.reduce((s, l) => s + l.amount, 0);
  const total = fareTotal + extrasTotal + PLATFORM_FEE;
  const baseFare = baseFarePart(fareTotal);

  const updateExtras = (i: number, patch: Partial<Extras>) => setExtras((prev) => prev.map((e, j) => (j === i ? { ...e, ...patch } : e)));
  const updateTraveller = (i: number, patch: Partial<Traveller>) => setTravellers((prev) => prev.map((t, j) => (j === i ? { ...t, ...patch } : t)));

  const travellerInvalid = travellers.some((t) => t.first.trim().length < 2 || t.last.trim().length < 1);
  const emailInvalid = !/^\S+@\S+\.\S+$/.test(email);
  const phoneInvalid = phone.replace(/\D/g, "").length < 10;

  function fillDemo() {
    const names = [["Aarav", "Sharma"], ["Priya", "Sharma"], ["Kabir", "Sharma"], ["Anaya", "Sharma"]];
    setTravellers((prev) => prev.map((t, i) => ({ ...t, first: names[i % names.length]?.[0] ?? "Guest", last: names[i % names.length]?.[1] ?? "Traveller", title: i === 1 ? "Ms" : t.title })));
    setEmail("aarav.sharma@example.com");
    setPhone("98765 43210");
  }

  function pay() {
    if (travellerInvalid || emailInvalid || phoneInvalid) {
      setShowErrors(true);
      toast.error("Please complete traveller and contact details.");
      return;
    }
    const lead = travellers[0];
    navigate({
      to: "/confirmation",
      search: { ...pickSearch(search), out: search.out, back: search.back, name: lead ? `${lead.title} ${lead.first} ${lead.last}` : "Traveller", email, paid: total },
    });
  }

  return (
    <div className="min-h-screen pb-28 lg:pb-0">
      <SiteHeader>
        <Steps current={3} />
      </SiteHeader>
      <main className="mx-auto max-w-6xl px-4 pt-5 md:px-6">
        <Link to="/results" search={{ ...pickSearch(search), out: search.ret ? search.out : undefined }} className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to comparison
        </Link>
        <h1 className="mt-2 text-3xl font-extrabold">Review your trip</h1>
        <p className="text-sm text-muted-foreground">All fees are shown before you pay — no surprises at the airport.</p>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            {legs.map((o, i) => {
              const e = extras[i] ?? initialExtras;
              const a = o.flight.airline;
              return (
                <LegSummary
                  key={o.flight.id}
                  option={o}
                  label={i === 0 ? "Departure" : "Return"}
                  footer={
                    <div className="space-y-3 border-t bg-muted/40 px-4 py-4">
                      <div className="text-xs font-bold">Add extras (per person)</div>
                      {o.fare.checkinKg === 0 ? (
                        <ExtraToggle label="15 kg check-in bag" price={a.bagAddOn15kg} checked={e.bag15} onChange={(v) => updateExtras(i, { bag15: v })} note="This fare is cabin-only" />
                      ) : (
                        <div className="flex items-center justify-between gap-3 rounded-xl border bg-card p-3">
                          <div>
                            <div className="text-sm font-semibold">Extra baggage</div>
                            <div className="text-xs text-muted-foreground">{formatINR(a.extra5kg)} per 5 kg · {formatINR(a.excessPerKg)}/kg at airport</div>
                          </div>
                          <div className="inline-flex rounded-lg bg-muted p-0.5 text-xs font-semibold">
                            {([0, 5, 10] as const).map((kg) => (
                              <button key={kg} onClick={() => updateExtras(i, { extraKg: kg })} className={cn("rounded-md px-2.5 py-1", e.extraKg === kg ? "bg-card shadow-card" : "text-muted-foreground")}>
                                {kg ? `+${kg}` : "None"}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      {o.fare.seat === "paid" ? (
                        <ExtraToggle label="Choose your seat" price={a.seatFee} checked={e.seat} onChange={(v) => updateExtras(i, { seat: v })} />
                      ) : (
                        <IncludedRow label={o.fare.seat === "free-any" ? "Any seat — included" : "Standard seat — included"} />
                      )}
                      {!o.fare.meal ? <ExtraToggle label="Pre-book a meal" price={a.mealFee} checked={e.meal} onChange={(v) => updateExtras(i, { meal: v })} /> : <IncludedRow label="Meal — included" />}
                    </div>
                  }
                />
              );
            })}

            <section className="rounded-2xl border bg-card p-4 shadow-card">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-extrabold">Traveller details</h2>
                <Button variant="soft" size="sm" onClick={fillDemo}>
                  <Sparkles /> Fill demo data
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Names exactly as on government ID.</p>
              {user && (
                <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-success-soft px-2.5 py-1 text-[11px] font-semibold text-success">
                  <BadgeCheck className="size-3.5" /> Signed in as {user.name} — your details are filled in
                </p>
              )}
              <div className="mt-4 space-y-4">
                {travellers.map((t, i) => (
                  <div key={i} className="grid grid-cols-[88px_1fr] gap-2 md:grid-cols-[100px_1fr_1fr]">
                    <div className="col-span-2 text-xs font-bold text-muted-foreground md:col-span-3">
                      {i < search.adults ? `Adult ${i + 1}` : `Child ${i - search.adults + 1}`}
                    </div>
                    <Select value={t.title} onValueChange={(v) => updateTraveller(i, { title: v })}>
                      <SelectTrigger className="bg-background" aria-label="Title">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(i < search.adults ? ["Mr", "Ms", "Mrs"] : ["Master", "Miss"]).map((x) => (
                          <SelectItem key={x} value={x}>{x}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input placeholder="First name" value={t.first} onChange={(e) => updateTraveller(i, { first: e.target.value })} aria-invalid={showErrors && t.first.trim().length < 2} className="bg-background aria-invalid:border-destructive" />
                    <Input placeholder="Last name" value={t.last} onChange={(e) => updateTraveller(i, { last: e.target.value })} aria-invalid={showErrors && !t.last.trim()} className="col-span-2 bg-background aria-invalid:border-destructive md:col-span-1" />
                  </div>
                ))}
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email for e-ticket</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={showErrors && emailInvalid} className="bg-background aria-invalid:border-destructive" placeholder="you@example.com" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Mobile number</Label>
                  <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} aria-invalid={showErrors && phoneInvalid} className="bg-background aria-invalid:border-destructive" placeholder="+91 98765 43210" />
                </div>
              </div>
            </section>
          </div>

          <aside className="lg:sticky lg:top-4 lg:self-start">
            <div className="rounded-2xl border bg-card p-4 shadow-card">
              <h2 className="text-lg font-extrabold">Price summary</h2>
              <dl className="mt-3 space-y-2 text-sm">
                <Row label={`Base fare × ${pax}`} value={formatINR(baseFare)} />
                <Row label="Taxes & airport fees" value={formatINR(fareTotal - baseFare)} />
                {extraLines.map((l) => (
                  <Row key={l.label} label={l.label} value={formatINR(l.amount)} muted />
                ))}
                <Row label="FareLens fee" value={PLATFORM_FEE ? formatINR(PLATFORM_FEE) : "₹0"} muted />
              </dl>
              <div className="mt-3 flex items-baseline justify-between border-t border-dashed pt-3">
                <span className="text-sm font-semibold">Total</span>
                <span className="font-display text-2xl font-extrabold">{formatINR(total)}</span>
              </div>
              <Button variant="accent" size="xl" className="mt-4 hidden w-full lg:flex" onClick={pay}>
                <Lock className="size-4" /> Pay {formatINR(total)} & book
              </Button>
              <p className="mt-3 text-center text-[11px] text-muted-foreground">Demo checkout — no payment is taken.</p>
            </div>
          </aside>
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 p-3 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-xl items-center gap-3">
          <div className="flex-1">
            <div className="text-[11px] text-muted-foreground">Total for {pax}</div>
            <div className="font-display text-xl font-extrabold leading-none">{formatINR(total)}</div>
          </div>
          <Button variant="accent" size="xl" onClick={pay}>
            <Lock className="size-4" /> Pay & book
          </Button>
        </div>
      </div>
      <div className="hidden lg:block">
        <SiteFooter />
      </div>
    </div>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className={cn(muted && "text-muted-foreground")}>{label}</dt>
      <dd className="font-mono font-medium">{value}</dd>
    </div>
  );
}

function ExtraToggle({ label, price, checked, onChange, note }: { label: string; price: number; checked: boolean; onChange: (v: boolean) => void; note?: string }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border bg-card p-3">
      <div>
        <div className="text-sm font-semibold">{label}</div>
        <div className="text-xs text-muted-foreground">
          +{formatINR(price)}
          {note && ` · ${note}`}
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}

function IncludedRow({ label }: { label: string }) {
  return <div className="rounded-xl border border-success/25 bg-success-soft px-3 py-2.5 text-sm font-semibold text-success">✓ {label}</div>;
}
