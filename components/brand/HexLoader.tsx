import { cn } from "@/lib/cn";

const BLUE = "#629cc6";

/** Pointy-top regular hexagon of radius `r`, centred in a 100×100 box. */
function hexagon(r: number) {
  return Array.from({ length: 6 }, (_, i) => {
    const a = ((-90 + 60 * i) * Math.PI) / 180;
    return `${(50 + r * Math.cos(a)).toFixed(2)},${(50 + r * Math.sin(a)).toFixed(2)}`;
  }).join(" ");
}

/**
 * Inner to outer. Each ring turns a sixth of a revolution a beat after the one
 * inside it, so the turns ripple outward; a hexagon looks the same after 60°,
 * so the loop has no visible seam.
 */
const RINGS = [
  { points: hexagon(14), stroke: "currentColor", delay: "0s" },
  { points: hexagon(27), stroke: BLUE, delay: "0.14s" },
  { points: hexagon(40), stroke: "currentColor", delay: "0.28s" },
];

interface HexLoaderProps {
  label?: string;
  size?: number;
  className?: string;
}

/** Full-area loading state: three concentric hexagons turning in sequence. */
export function HexLoader({ label = "Loading…", size = 72, className }: HexLoaderProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn("flex flex-col items-center justify-center gap-4 py-20", className)}
    >
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        aria-hidden="true"
        focusable="false"
        className="text-text-primary"
      >
        {RINGS.map((ring) => (
          <polygon
            key={ring.points}
            points={ring.points}
            fill="none"
            stroke={ring.stroke}
            strokeWidth="4.5"
            strokeLinejoin="round"
            className="pdt-hex"
            style={{ animationDelay: ring.delay }}
          />
        ))}
      </svg>
      <p className="text-body-regular text-text-secondary">{label}</p>
    </div>
  );
}
