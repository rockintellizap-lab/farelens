import { Armchair, Briefcase, Utensils } from "lucide-react";

import type { Needs } from "@/lib/flights/pricing";
import { cn } from "@/lib/utils";

const ITEMS = [
  { key: "bag", label: "Check-in bag", icon: Briefcase },
  { key: "seat", label: "Pick my seat", icon: Armchair },
  { key: "meal", label: "Meal on board", icon: Utensils },
] as const;

export function NeedsBar({ needs, onChange }: { needs: Needs; onChange: (n: Needs) => void }) {
  return (
    <div className="rounded-2xl border bg-accent-soft p-4">
      <p className="text-sm font-semibold">What do you need on this trip?</p>
      <p className="text-xs text-muted-foreground">We add the cost of anything a fare doesn't include, so you compare the real price — not the headline.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {ITEMS.map(({ key, label, icon: Icon }) => {
          const on = needs[key];
          return (
            <button
              key={key}
              type="button"
              aria-pressed={on}
              onClick={() => onChange({ ...needs, [key]: !on })}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-semibold transition-all",
                on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-4" />
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
