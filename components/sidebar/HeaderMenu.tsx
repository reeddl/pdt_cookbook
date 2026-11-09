"use client";

import { useEffect, useState } from "react";
import { RiCloseLine, RiMenuLine } from "@remixicon/react";
import { cn } from "@/lib/cn";

/**
 * The header's account links. From `sm` up they sit inline exactly as before;
 * on phones they fold behind a menu button into a full-width panel of
 * thumb-sized rows, instead of wrapping into two or three cramped lines.
 */
export function HeaderMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="header-menu"
        className="inline-flex size-11 shrink-0 items-center justify-center rounded-2lg text-text-primary hover:bg-background-secondary-hover sm:hidden"
      >
        {open ? <RiCloseLine className="size-6" aria-hidden /> : <RiMenuLine className="size-6" aria-hidden />}
      </button>
      <div
        id="header-menu"
        // A tapped link navigates client-side, so close the panel ourselves.
        onClick={(e) => {
          if ((e.target as HTMLElement).closest("a")) setOpen(false);
        }}
        className={cn(
          "flex-wrap items-center gap-4 text-body-regular sm:flex",
          open
            ? "absolute inset-x-0 top-full z-20 flex flex-col items-stretch gap-0 border-b border-separator-border bg-background-primary-default px-4 pt-1 pb-3 shadow-md sm:static sm:flex-row sm:items-center sm:gap-4 sm:border-0 sm:p-0 sm:shadow-none"
            : "hidden"
        )}
      >
        {children}
      </div>
    </>
  );
}
