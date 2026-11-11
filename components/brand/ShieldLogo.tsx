import { cn } from "@/lib/cn";

/*
 * The cookbook crest: the chapter shield with a spatula down the middle where
 * the sword used to be. The shield is traced from the original crest artwork;
 * only its left half is stored here and the right half is drawn as a mirror
 * image. `app/icon.svg` is the same drawing, used as the favicon.
 */

const NAVY = "#0c1533";
const BLUE = "#629cc6";
const WHITE = "#ffffff";

const VIEW_W = 694;
const VIEW_H = 1033;
/** Reflects the left half of the shield onto the right half. */
const MIRROR = `matrix(-1 0 0 1 ${VIEW_W - 1} 0)`;

/** Left half of the shield: navy body, white inner border, pale-blue panel. */
const SHIELD_HALF: { d: string; fill: string }[] = [
  { fill: NAVY, d: "M0.9 326.3 L13.7 310.7 L17.3 307.3 L26.7 295.7 L37.3 284.3 L46.7 272.7 L50.3 269.3 L59.7 257.7 L63.3 254.3 L66.7 249.7 L70.3 246.3 L92.7 219.7 L96.9 215.9 L98.7 215.6 L100.7 216.3 L137.3 234.7 L158.6 243.4 L167.6 246.4 L181.7 250.3 L190.9 252.1 L213.0 256.0 L221.0 256.0 L227.0 257.0 L236.0 257.0 L242.0 256.0 L250.0 256.0 L259.0 255.0 L285.3 250.3 L308.4 242.4 L324.7 235.7 L345.3 225.3 L347.0 224.9 L347.7 225.6 L348.0 873.0 L348.0 965.0 L347.7 966.4 L346.7 967.0 L323.3 937.7 L300.3 914.7 L282.9 901.1 L272.0 894.0 L258.7 887.3 L241.3 880.7 L234.7 877.3 L137.3 832.7 L117.3 822.7 L107.1 816.9 L86.7 802.3 L73.7 791.3 L65.7 783.3 L62.3 778.7 L53.7 769.3 L41.1 751.9 L32.3 736.7 L26.3 724.7 L18.6 705.4 L13.7 689.3 L10.9 676.1 L8.0 658.0 L8.0 652.0 L7.0 646.0 L7.0 625.0 L8.0 619.0 L8.0 614.0 L9.0 606.0 L11.9 589.9 L14.6 578.6 L17.6 568.6 L47.4 489.4 L51.3 477.3 L53.1 469.1 L55.0 457.0 L55.0 453.0 L56.0 447.0 L56.0 438.0 L54.0 421.0 L51.3 407.7 L47.4 395.6 L40.9 380.1 L30.9 363.1 L20.3 349.7 L16.7 346.3 L7.3 334.7 L3.7 331.3 L1.1 327.9 Z" },
  { fill: WHITE, d: "M45.4 621.4 L47.0 608.0 L49.7 592.7 L54.4 577.4 L85.4 495.4 L86.4 490.4 L88.3 485.3 L90.1 476.1 L93.0 457.0 L93.0 428.0 L90.1 408.9 L84.4 386.6 L76.7 367.3 L72.0 358.0 L69.1 353.9 L66.9 349.1 L62.1 342.9 L60.0 339.0 L51.3 327.7 L50.9 326.3 L57.7 317.7 L61.3 314.3 L75.9 296.9 L81.3 291.3 L90.7 279.7 L94.3 276.3 L97.7 271.7 L105.9 262.9 L108.3 262.7 L130.9 273.1 L149.6 280.4 L162.6 284.4 L187.9 290.1 L208.0 293.0 L212.0 293.0 L218.0 294.0 L249.0 294.0 L279.1 290.1 L293.3 287.3 L306.3 283.6 L307.3 284.0 L308.0 286.0 L308.0 455.0 L308.0 870.0 L307.0 872.1 L306.0 872.0 L293.0 863.0 L276.7 854.3 L249.3 842.7 L139.3 791.7 L123.0 782.0 L110.7 773.3 L103.7 767.3 L88.7 752.3 L76.1 735.9 L67.1 721.9 L56.3 698.7 L51.7 685.3 L47.0 663.0 L45.0 647.0 Z" },
  { fill: BLUE, d: "M58.4 626.4 L59.0 618.0 L60.9 605.9 L65.6 586.6 L95.4 507.4 L99.4 495.4 L103.4 478.4 L106.0 462.0 L106.0 456.0 L107.0 450.0 L107.0 434.0 L106.0 428.0 L106.0 423.0 L103.1 404.9 L99.4 389.6 L95.4 377.6 L89.7 363.3 L83.0 350.0 L75.9 338.1 L69.1 328.9 L68.6 327.0 L68.9 325.9 L73.7 319.7 L77.3 316.3 L80.7 311.7 L84.3 308.3 L87.7 303.7 L108.7 279.7 L110.9 278.7 L112.0 279.0 L121.3 283.7 L140.6 291.4 L152.6 295.4 L170.7 300.3 L190.0 304.0 L214.0 307.0 L253.0 307.0 L265.4 305.4 L267.1 305.9 L268.0 308.0 L268.0 447.0 L268.0 833.0 L267.3 835.0 L265.7 835.3 L257.3 831.7 L145.3 779.7 L135.1 773.9 L126.1 767.9 L112.7 757.3 L98.7 743.3 L86.1 726.9 L75.0 708.0 L71.3 699.7 L65.6 684.4 L62.7 674.3 L60.9 665.1 L59.0 653.0 L59.0 648.0 L58.0 642.0 Z" },
  { fill: WHITE, d: "M185.5 359.0 L195.1 388.4 L226.0 388.4 L201.0 406.6 L210.5 436.0 L185.5 417.8 L160.5 436.0 L170.0 406.6 L145.0 388.4 L175.9 388.4 Z" },
  { fill: WHITE, d: "M185.5 500.0 L195.1 529.4 L226.0 529.4 L201.0 547.6 L210.5 577.0 L185.5 558.8 L160.5 577.0 L170.0 547.6 L145.0 529.4 L175.9 529.4 Z" },
  { fill: WHITE, d: "M185.5 641.0 L195.1 670.4 L226.0 670.4 L201.0 688.6 L210.5 718.0 L185.5 699.8 L160.5 718.0 L170.0 688.6 L145.0 670.4 L175.9 670.4 Z" },
];

interface ShieldLogoProps {
  /** Rendered height in px. Width follows the crest's aspect ratio. */
  height?: number;
  className?: string;
}

/**
 * Decorative by default: it always sits next to the "Cookbook" wordmark,
 * so announcing it again would just be noise for a screen reader.
 */
export function ShieldLogo({ height = 28, className }: ShieldLogoProps) {
  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      height={height}
      width={Math.round((height * VIEW_W) / VIEW_H)}
      aria-hidden="true"
      focusable="false"
      className={cn("shrink-0", className)}
    >
      {SHIELD_HALF.map(({ d, fill }, i) => (
        <g key={i} fill={fill}>
          <path d={d} />
          <path d={d} transform={MIRROR} />
        </g>
      ))}

      {/* Spatula: slotted head above the shield, handle down the middle */}
      <path d="M 260.5 14 L 432.5 14 Q 458.5 14 457.5 40 L 424.5 150 Q 420.5 168 394.5 168 L 298.5 168 Q 272.5 168 268.5 150 L 235.5 40 Q 234.5 14 260.5 14 Z" fill={NAVY}/>
      <path d="M 302.5 164 L 390.5 164 C 368.5 188, 368.5 208, 372.5 254 L 320.5 254 C 324.5 208, 324.5 188, 302.5 164 Z" fill={NAVY}/>
      <path d="M 316.5 900 L 376.5 900 L 376.5 1000 A 30 30 0 0 1 316.5 1000 Z" fill={NAVY}/>
      <rect x="286.5" y="48" width="16" height="88" rx="8.0" fill={WHITE}/>
      <rect x="338.5" y="48" width="16" height="88" rx="8.0" fill={WHITE}/>
      <rect x="390.5" y="48" width="16" height="88" rx="8.0" fill={WHITE}/>
      <rect x="342.0" y="234" width="9" height="736" rx="4.5" fill={WHITE}/>
      <circle cx="346.5" cy="994" r="11" fill={WHITE}/>
    </svg>
  );
}
