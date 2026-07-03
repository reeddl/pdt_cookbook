"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

interface SidebarRecipe {
  id: string;
  title: string;
  category: string;
}

export function Sidebar({ recipes }: { recipes: SidebarRecipe[] }) {
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const pathname = usePathname();

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
    <aside className="flex h-full w-[280px] flex-shrink-0 flex-col border-r border-border bg-sidebar">
      <div className="p-4">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search recipes…"
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/40"
        />
      </div>
      <nav className="flex-1 overflow-y-auto px-2 pb-4">
        {grouped.length === 0 && (
          <p className="px-2 text-sm text-text-muted">No recipes found.</p>
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
                className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-xs font-semibold uppercase tracking-wide text-text-muted hover:text-text"
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
                          className={cn(
                            "block rounded-md px-3 py-1.5 text-sm text-text hover:bg-border",
                            active && "bg-accent/10 font-medium text-accent"
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
  );
}
