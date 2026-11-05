"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SearchIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

interface SidebarRecipe {
  id: string;
  title: string;
  category: string;
}

export function Sidebar({ recipes }: { recipes: SidebarRecipe[] }) {
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchHovered, setSearchHovered] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const pathname = usePathname();

  // Collapsed to a circle by default; opens on hover, on keyboard focus, and
  // stays open while there's a query so results aren't orphaned by a stray
  // mouse-out. Tapping the circle focuses the input, which covers touch.
  const searchOpen = searchHovered || searchFocused || query !== "";

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return recipes;
    return recipes.filter(
      (r) => r.title.toLowerCase().includes(q) || r.category.toLowerCase().includes(q)
    );
  }, [recipes, query]);

  const grouped = useMemo(() => {
    const groups = new Map<string, SidebarRecipe[]>();
    for (const recipe of filtered) {
      const list = groups.get(recipe.category) ?? [];
      list.push(recipe);
      groups.set(recipe.category, list);
    }
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        aria-label="Open recipe list"
        className="fixed left-4 top-3 z-30 rounded-2lg border border-separator-border bg-background-primary-default px-3 py-2 text-body-regular text-text-primary shadow-xs sm:hidden"
      >
        ☰ Recipes
      </button>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 sm:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex h-full w-[280px] flex-shrink-0 flex-col border-r border-separator-border bg-background-secondary-default transition-transform duration-200 sm:static sm:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between gap-2 p-4 sm:pt-4">
          <div
            onMouseEnter={() => setSearchHovered(true)}
            onMouseLeave={() => setSearchHovered(false)}
            className={cn(
              "relative flex h-9 items-center transition-[width] duration-300 ease-out",
              searchOpen ? "w-full" : "w-9"
            )}
          >
            <SearchIcon className="pointer-events-none absolute left-2.5 z-10 text-text-secondary" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              aria-label="Search recipes"
              placeholder={searchOpen ? "Search recipes…" : ""}
              className={cn(
                "h-9 w-full rounded-full bg-background-tertiary-default pl-9 text-body-regular text-text-primary ring-2 ring-inset ring-transparent outline-none placeholder:text-text-tertiary hover:ring-border-button-hover focus:ring-border-button-active",
                searchOpen ? "pr-3" : "cursor-pointer pr-0"
              )}
            />
          </div>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Close recipe list"
            className="text-text-secondary sm:hidden"
          >
            ✕
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-2 pb-4">
          {grouped.length === 0 && (
            <p className="px-2 text-body-regular text-text-secondary">No recipes found.</p>
          )}
          {grouped.map(([category, items]) => {
            const isCollapsed = collapsed[category];
            return (
              <div key={category} className="mb-1">
                <button
                  type="button"
                  onClick={() =>
                    setCollapsed((prev) => ({ ...prev, [category]: !prev[category] }))
                  }
                  className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-caption-1-semibold uppercase tracking-wide text-text-secondary hover:text-text-primary"
                >
                  {category}
                  <span className={cn("transition-transform", isCollapsed && "-rotate-90")}>
                    ▾
                  </span>
                </button>
                {!isCollapsed && (
                  <ul>
                    {items.map((recipe) => {
                      const href = `/recipes/${recipe.id}`;
                      const active = pathname === href;
                      return (
                        <li key={recipe.id}>
                          <Link
                            href={href}
                            onClick={() => setMobileOpen(false)}
                            className={cn(
                              "block rounded-md px-3 py-1.5 text-body-regular text-text-primary hover:bg-background-secondary-hover",
                              active && "bg-button-ghost-background text-body-medium text-button-ghost-foreground"
                            )}
                          >
                            {recipe.title}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
