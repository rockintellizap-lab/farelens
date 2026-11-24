import type { Airline } from "@/lib/flights/airlines";
import { cn } from "@/lib/utils";

export function AirlineMark({ airline, size = "md", className }: { airline: Airline; size?: "sm" | "md" | "lg"; className?: string }) {
  return (
    <span
      aria-label={airline.name}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-lg font-mono font-bold tracking-tight",
        airline.badgeClass,
        size === "sm" && "size-7 text-[10px]",
        size === "md" && "size-10 text-xs",
        size === "lg" && "size-12 text-sm",
        className,
      )}
    >
      {airline.code}
    </span>
  );
}
