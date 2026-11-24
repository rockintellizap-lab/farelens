import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, BadgeCheck, Clock3, ShieldCheck, Smartphone, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { SiteFooter, SiteHeader, Steps } from "@/components/layout/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { safeRedirect, signIn, useDemoUser, type DemoUser } from "@/lib/auth/demo-auth";

const loginSearchSchema = z.object({
  redirect: z.string().optional().catch(undefined),
});

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>) => loginSearchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Sign in to book | FareLens" },
      { name: "description", content: "Sign in with your mobile number to book the fare you picked and keep your trips in one place." },
      { property: "og:title", content: "Sign in to book | FareLens" },
      { property: "og:description", content: "One sign-in for IndiGo, Akasa Air, SpiceJet, Air India Express and Fly91 bookings." },
    ],
  }),
  component: LoginPage,
});

const DEMO: DemoUser = { name: "Aarav Sharma", phone: "9876543210", email: "aarav.sharma@example.com" };

function LoginPage() {
  const { redirect } = Route.useSearch();
  const navigate = Route.useNavigate();
  const user = useDemoUser();
  const target = safeRedirect(redirect);
  const booking = target.startsWith("/review");

  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [showErrors, setShowErrors] = useState(false);
  const [seconds, setSeconds] = useState(30);

  const digits = phone.replace(/\D/g, "");
  const phoneInvalid = digits.length !== 10;
  const nameInvalid = name.trim().length < 2;

  // Already signed in (e.g. Back button) — go straight on.
  useEffect(() => {
    if (user && step === "phone") navigate({ href: target, replace: true });
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (step !== "otp" || seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [step, seconds]);

  function finish(u: DemoUser) {
    signIn(u);
    toast.success(`Welcome, ${u.name.split(" ")[0]}!`);
    navigate({ href: target, replace: true });
  }

  function sendOtp(e?: React.FormEvent) {
    e?.preventDefault();
    if (phoneInvalid || nameInvalid) {
      setShowErrors(true);
      return;
    }
    setStep("otp");
    setSeconds(30);
    setOtp("");
    toast(`OTP sent to +91 ${digits.slice(0, 5)} ${digits.slice(5)}`, { description: "Demo: any 6 digits will work." });
  }

  function verify(code: string) {
    if (code.length !== 6) return;
    finish({ name: name.trim(), phone: digits, email: digits === DEMO.phone ? DEMO.email : "" });
  }

  return (
    <div className="min-h-screen">
      <SiteHeader>{booking ? <Steps current={2} /> : undefined}</SiteHeader>

      <main className="mx-auto grid max-w-5xl gap-8 px-4 py-6 md:px-6 md:py-12 lg:grid-cols-[1fr_420px] lg:items-center">
        <section className="hidden lg:block">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1 text-xs font-bold text-accent-foreground">
            <Sparkles className="size-3.5" /> One account, five airlines
          </span>
          <h1 className="mt-4 text-4xl font-extrabold leading-tight">
            {booking ? "Almost there — sign in to lock your fare." : "Sign in to FareLens"}
          </h1>
          <p className="mt-3 max-w-md text-muted-foreground">No need to make separate accounts on IndiGo, Akasa Air, SpiceJet, Air India Express and Fly91. Book any of them from here.</p>
          <ul className="mt-8 space-y-4">
            {[
              { icon: Clock3, title: "Details filled in for you", text: "Your name and contact go into every booking automatically." },
              { icon: BadgeCheck, title: "All your trips in one place", text: "PNRs from every airline, with their cancel and change rules." },
              { icon: ShieldCheck, title: "Fare alerts", text: "Hear first when the fare on your route drops." },
            ].map((b) => (
              <li key={b.title} className="flex gap-3">
                <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-card text-primary shadow-card">
                  <b.icon className="size-4.5" />
                </span>
                <span>
                  <span className="block text-sm font-bold">{b.title}</span>
                  <span className="block text-sm text-muted-foreground">{b.text}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-3xl border bg-card p-5 shadow-float md:p-7">
          {booking && (
            <button type="button" onClick={() => window.history.back()} className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground">
              <ArrowLeft className="size-4" /> Back to comparison
            </button>
          )}

          {step === "phone" ? (
            <form onSubmit={sendOtp} noValidate>
              <h2 className="text-2xl font-extrabold">{booking ? "Sign in to continue" : "Welcome back"}</h2>
              <p className="mt-1 text-sm text-muted-foreground">We'll send a one-time code to your mobile.</p>

              <div className="mt-6 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Full name</Label>
                  <Input id="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="As on your ID" aria-invalid={showErrors && nameInvalid} className="h-11 bg-background aria-invalid:border-destructive" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Mobile number</Label>
                  <div className="flex h-11 items-center rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring has-[input[aria-invalid=true]]:border-destructive">
                    <span className="flex h-full items-center gap-1.5 border-r px-3 font-mono text-sm font-medium text-muted-foreground">
                      <Smartphone className="size-4" /> +91
                    </span>
                    <input
                      id="phone"
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel-national"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/[^\d ]/g, "").slice(0, 11))}
                      placeholder="98765 43210"
                      aria-invalid={showErrors && phoneInvalid}
                      className="h-full min-w-0 flex-1 bg-transparent px-3 font-mono text-base outline-none placeholder:text-muted-foreground"
                    />
                  </div>
                  {showErrors && phoneInvalid && <p className="text-xs text-destructive">Enter a 10-digit mobile number.</p>}
                </div>
              </div>

              <Button type="submit" variant="accent" size="xl" className="mt-6 w-full">
                Get OTP
              </Button>
              <button
                type="button"
                onClick={() => {
                  setName(DEMO.name);
                  setPhone("98765 43210");
                }}
                className="mt-3 inline-flex w-full items-center justify-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                <Sparkles className="size-3.5" /> Fill demo details
              </button>

              <div className="my-5 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
              </div>

              <Button type="button" variant="outline" size="lg" className="w-full bg-background" onClick={() => finish(DEMO)}>
                <GoogleMark /> Continue with Google
              </Button>
              {booking && (
                <Button type="button" variant="ghost" size="sm" className="mt-2 w-full text-muted-foreground" onClick={() => navigate({ href: target })}>
                  Continue as guest
                </Button>
              )}
            </form>
          ) : (
            <div>
              <h2 className="text-2xl font-extrabold">Enter the code</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Sent to <span className="font-mono font-semibold text-foreground">+91 {digits.slice(0, 5)} {digits.slice(5)}</span>{" "}
                <button onClick={() => setStep("phone")} className="font-semibold text-primary underline-offset-2 hover:underline">
                  Change
                </button>
              </p>

              <div className="mt-6 flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={otp}
                  onChange={(v) => {
                    setOtp(v);
                    verify(v);
                  }}
                  autoFocus
                  aria-label="One-time code"
                >
                  <InputOTPGroup className="gap-2">
                    {Array.from({ length: 6 }, (_, i) => (
                      <InputOTPSlot key={i} index={i} className="size-11 rounded-lg border bg-background font-mono text-lg font-bold first:rounded-l-lg last:rounded-r-lg" />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <p className="mt-3 text-center text-xs text-muted-foreground">Demo: any 6 digits will work.</p>

              <Button variant="accent" size="xl" className="mt-6 w-full" disabled={otp.length !== 6} onClick={() => verify(otp)}>
                Verify & continue
              </Button>
              <div className="mt-3 flex items-center justify-between text-xs">
                <button type="button" onClick={() => verify("123456")} className="inline-flex items-center gap-1.5 font-semibold text-muted-foreground hover:text-foreground">
                  <Sparkles className="size-3.5" /> Auto-fill demo OTP
                </button>
                {seconds > 0 ? (
                  <span className="text-muted-foreground">Resend in 0:{String(seconds).padStart(2, "0")}</span>
                ) : (
                  <button onClick={() => sendOtp()} className="font-semibold text-primary">
                    Resend OTP
                  </button>
                )}
              </div>
            </div>
          )}

          <p className="mt-6 border-t pt-4 text-center text-[11px] text-muted-foreground">Demo sign-in — no account is created and nothing leaves this browser.</p>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path fill="currentColor" d="M21.35 11.1H12v2.98h5.35c-.23 1.4-1.66 4.1-5.35 4.1-3.22 0-5.85-2.67-5.85-5.96S8.78 6.26 12 6.26c1.83 0 3.06.78 3.76 1.45l2.57-2.47C16.7 3.72 14.56 2.8 12 2.8 6.92 2.8 2.8 6.92 2.8 12s4.12 9.2 9.2 9.2c5.31 0 8.83-3.73 8.83-8.99 0-.6-.07-1.06-.15-1.51Z" />
    </svg>
  );
}
