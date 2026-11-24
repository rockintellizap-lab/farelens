import { GitCompareArrows, X } from "lucide-react";
import { useState } from "react";

import { AirlineMark } from "@/components/flight/AirlineMark";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { FareOption } from "@/lib/flights/generate";
import { indexOfMin, trueCost, valueScores, type Needs } from "@/lib/flights/pricing";

import { ComparisonMatrix } from "./ComparisonMatrix";

export function CompareTray({ options, needs, onClear, onRemove, onSelect }: { options: FareOption[]; needs: Needs; onClear: () => void; onRemove: (id: string) => void; onSelect: (o: FareOption) => void }) {
  const [open, setOpen] = useState(false);
  if (!options.length) return null;
  const best = indexOfMin(valueScores(options, needs));

  return (
    <>
      <div className="fixed inset-x-3 bottom-3 z-40 mx-auto flex max-w-xl items-center gap-3 rounded-2xl bg-primary p-3 text-primary-foreground shadow-float animate-in slide-in-from-bottom-4">
        <div className="flex -space-x-2">
          {options.map((o) => (
            <button key={o.flight.id} onClick={() => onRemove(o.flight.id)} className="group relative rounded-lg ring-2 ring-primary" aria-label={`Remove ${o.flight.flightNo}`}>
              <AirlineMark airline={o.flight.airline} size="sm" />
              <span className="absolute -right-1 -top-1 hidden size-3.5 items-center justify-center rounded-full bg-card text-foreground group-hover:flex">
                <X className="size-2.5" />
              </span>
            </button>
          ))}
        </div>
        <div className="min-w-0 flex-1 text-xs">
          <div className="font-semibold">{options.length} of 3 selected</div>
          <button onClick={onClear} className="text-primary-foreground/60 underline-offset-2 hover:underline">
            Clear
          </button>
        </div>
        <Button variant="accent" size="sm" disabled={options.length < 2} onClick={() => setOpen(true)}>
          <GitCompareArrows /> Compare
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] w-[calc(100vw-1rem)] max-w-4xl overflow-y-auto p-4 md:p-6">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Flight-by-flight comparison</DialogTitle>
            <DialogDescription>Green marks the best value in each row. Prices are per person for your needs.</DialogDescription>
          </DialogHeader>
          <ComparisonMatrix
            columns={options.map((o, i) => ({ key: o.flight.id, option: o, trueCost: trueCost(o, needs), recommended: i === best }))}
            onSelect={(o) => {
              setOpen(false);
              onSelect(o);
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
