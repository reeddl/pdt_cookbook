import { cn } from "@/lib/cn";

/**
 * Small in-button busy indicator. Inherits `currentColor`, so it reads
 * correctly on every Button variant.
 */
export function Spinner({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={cn("pdt-spin h-4 w-4", className)}>
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path
        d="M 21 12 A 9 9 0 0 0 12 3"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
