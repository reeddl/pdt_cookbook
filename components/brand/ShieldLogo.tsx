import Image from "next/image";
import shield from "@/assets/Sword_and_Shield_4C.webp";
import { cn } from "@/lib/cn";

const ASPECT = shield.width / shield.height;

interface ShieldLogoProps {
  /** Rendered height in px. Width follows the crest's aspect ratio. */
  height?: number;
  className?: string;
  /** Set on the crest that appears in the first screenful (headers). */
  preload?: boolean;
}

/**
 * The Phi Delt sword-and-shield crest, from the source asset.
 * Decorative by default — it always sits next to the "PDT Cookbook" wordmark,
 * so announcing it again would just be noise for a screen reader.
 */
export function ShieldLogo({ height = 28, className, preload = false }: ShieldLogoProps) {
  return (
    <Image
      src={shield}
      alt=""
      aria-hidden="true"
      height={height}
      width={Math.round(height * ASPECT)}
      preload={preload}
      className={cn("shrink-0", className)}
    />
  );
}
