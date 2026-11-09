"use client";

import { createContext, useContext, useState } from "react";
import { RiBookOpenLine } from "@remixicon/react";
import { cn } from "@/lib/cn";

interface SidebarState {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

const SidebarContext = createContext<SidebarState | null>(null);

/**
 * Shares the mobile drawer's open state so its trigger can sit inside the
 * header's flow instead of floating over it (a fixed button overlapped the
 * logo on narrow phones and hovered over content while scrolling).
 */
export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <SidebarContext.Provider value={{ mobileOpen, setMobileOpen }}>{children}</SidebarContext.Provider>
  );
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used inside <SidebarProvider>");
  return ctx;
}

/** Phone-only button that opens the recipe drawer. Hidden from `sm` up, where the sidebar is always shown. */
export function SidebarTrigger({ className }: { className?: string }) {
  const { mobileOpen, setMobileOpen } = useSidebar();
  return (
    <button
      type="button"
      onClick={() => setMobileOpen(true)}
      aria-label="Open recipe list"
      aria-expanded={mobileOpen}
      className={cn(
        "inline-flex size-11 shrink-0 items-center justify-center rounded-2lg border border-separator-border bg-background-primary-default text-text-primary shadow-xs sm:hidden",
        className
      )}
    >
      <RiBookOpenLine className="size-5" aria-hidden />
    </button>
  );
}
