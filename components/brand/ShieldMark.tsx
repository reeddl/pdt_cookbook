import { cn } from "@/lib/cn";

const NAVY = "#16203f";
const BLUE = "#79a9ce";

/** Five-pointed star, outer radius 8, centred on the origin. */
const STAR =
  "M 0 -8 L 1.8 -2.48 L 7.61 -2.47 L 2.91 0.95 L 4.7 6.47 L 0 3.06 L -4.7 6.47 L -2.91 0.95 L -7.61 -2.47 L -1.8 -2.48 Z";

/** The six crest stars, ordered so the twinkle rolls down the shield. */
const STARS = [
  { x: 35, y: 82 },
  { x: 85, y: 82 },
  { x: 35, y: 106 },
  { x: 85, y: 106 },
  { x: 37, y: 130 },
  { x: 83, y: 130 },
];

const ASPECT = 120 / 190;

interface ShieldMarkProps {
  /** Rendered height in px. */
  size?: number;
  /** Twinkle the stars and float the crest — used for loading states. */
  animated?: boolean;
  className?: string;
}

/**
 * An inline-SVG drawing of the crest. The raster asset in `assets/` is the
 * real logo and is what `ShieldLogo` renders; this traced version exists so the
 * six stars are individually addressable and can be animated while pages load.
 */
export function ShieldMark({ size = 80, animated = false, className }: ShieldMarkProps) {
  return (
    <svg
      viewBox="0 0 120 190"
      height={size}
      width={Math.round(size * ASPECT)}
      aria-hidden="true"
      focusable="false"
      className={cn(animated && "pdt-shield-float", className)}
    >
      {/* Shield: navy body, white inner border, two pale-blue panels */}
      <path
        d="M 4 48 C 22 40, 44 44, 60 54 C 76 44, 98 40, 116 48 C 116 100, 108 150, 60 176 C 12 150, 4 100, 4 48 Z"
        fill={NAVY}
      />
      <path
        d="M 12 55 C 28 48, 46 52, 60 61 C 74 52, 92 48, 108 55 C 108 100, 100 145, 60 169 C 20 145, 12 100, 12 55 Z"
        fill="#ffffff"
      />
      <path d="M 18 62 C 32 56, 45 60, 53 67 L 53 152 C 24 132, 18 98, 18 62 Z" fill={BLUE} />
      <path d="M 102 62 C 88 56, 75 60, 67 67 L 67 152 C 96 132, 102 98, 102 62 Z" fill={BLUE} />

      {STARS.map((star, i) => (
        <g key={`${star.x}-${star.y}`} transform={`translate(${star.x} ${star.y}) scale(1.15)`}>
          <path
            d={STAR}
            fill="#ffffff"
            className={cn(animated && "pdt-star")}
            style={animated ? { animationDelay: `${i * 0.14}s` } : undefined}
          />
        </g>
      ))}

      {/* Sword, laid over the shield: white blade with navy edges */}
      <path
        d="M 55 38 L 65 38 L 65 172 L 60 186 L 55 172 Z"
        fill="#ffffff"
        stroke={NAVY}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path d="M 26 34 L 38 26 L 82 26 L 94 34 L 82 42 L 38 42 Z" fill={NAVY} />
      <ellipse cx="60" cy="34" rx="8" ry="5" fill="#ffffff" stroke={NAVY} strokeWidth="2" />
      <rect x="56.5" y="8" width="7" height="19" rx="2" fill={NAVY} />
      <circle cx="60" cy="6" r="4.5" fill={NAVY} />
    </svg>
  );
}
