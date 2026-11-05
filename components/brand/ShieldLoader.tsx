import { ShieldMark } from "@/components/brand/ShieldMark";
import { cn } from "@/lib/cn";

interface ShieldLoaderProps {
  label?: string;
  size?: number;
  className?: string;
}

/** Full-area loading state: the crest floats while its stars twinkle in turn. */
export function ShieldLoader({ label = "Loading…", size = 88, className }: ShieldLoaderProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn("flex flex-col items-center justify-center gap-4 py-20", className)}
    >
      <ShieldMark size={size} animated />
      <p className="text-body-regular text-text-secondary">{label}</p>
    </div>
  );
}
