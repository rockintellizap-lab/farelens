import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { LogOut, ScanSearch, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import { toast } from "sonner";

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { maskPhone, signOut, useDemoUser } from "@/lib/auth/demo-auth";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link to="/" className={cn("inline-flex items-center gap-2 text-primary-foreground", className)}>
      <span className="inline-flex size-8 items-center justify-center rounded-lg bg-accent text-accent-foreground">
        <ScanSearch className="size-4.5" strokeWidth={2.5} />
      </span>
      <span className="font-display text-xl font-extrabold tracking-tight">FareLens</span>
    </Link>
  );
}

function AccountButton() {
  const user = useDemoUser();
  const location = useLocation();
  const navigate = useNavigate();

  if (!user) {
    if (location.pathname === "/login") return null;
    return (
      <Link
        to="/login"
        search={{ redirect: location.href }}
        className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-primary-foreground/25 px-2.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary-foreground/10 sm:px-3"
      >
        <UserRound className="size-3.5" />
        <span className="hidden sm:inline">Sign in</span>
      </Link>
    );
  }

  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground ring-2 ring-primary-foreground/20"
        aria-label="Your account"
      >
        {initials || <UserRound className="size-4" />}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="text-sm font-bold">{user.name}</div>
          <div className="font-mono text-[11px] font-medium text-muted-foreground">{maskPhone(user.phone)}</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            signOut();
            toast("Signed out");
            navigate({ to: "/", replace: true });
          }}
        >
          <LogOut /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function SiteHeader({ children }: { children?: ReactNode }) {
  return (
    <header className="bg-primary text-primary-foreground">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 md:px-6">
        <Logo className="shrink-0" />
        <div className="flex min-w-0 items-center gap-3">
          {children ?? <span className="hidden text-sm text-primary-foreground/70 sm:block">5 low-cost airlines · one screen</span>}
          <AccountButton />
        </div>
      </div>
    </header>
  );
}

const STEPS = ["Sign in", "Search", "Compare", "Review", "Booked"] as const;

export function Steps({ current }: { current: 0 | 1 | 2 | 3 | 4 }) {
  return (
    <ol className="flex items-center gap-1 text-xs font-medium sm:gap-1.5" aria-label="Booking progress">
      {STEPS.map((step, i) => (
        <li key={step} className="flex items-center gap-1 sm:gap-1.5">
          <span
            className={cn(
              "inline-flex size-5 items-center justify-center rounded-full font-mono text-[10px]",
              i < current && "bg-success text-success-foreground",
              i === current && "bg-accent text-accent-foreground",
              i > current && "bg-primary-foreground/15 text-primary-foreground/60",
            )}
          >
            {i + 1}
          </span>
          <span className={cn("hidden lg:inline", i === current ? "text-primary-foreground" : "text-primary-foreground/60")}>{step}</span>
          {i < STEPS.length - 1 && <span className="h-px w-2 bg-primary-foreground/25 sm:w-4" />}
        </li>
      ))}
    </ol>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t bg-card">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between md:px-6">
        <span className="font-display text-sm font-bold text-foreground">FareLens</span>
        <span>Demo build · Fares, baggage and fee rules are indicative and change often — always confirm with the airline.</span>
      </div>
    </footer>
  );
}
