"use client";

import { useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { CloseIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import {
  UNITS,
  newId,
  parseIngredientLine,
  type IngredientRow,
} from "@/lib/recipeFormat";

interface IngredientEditorProps {
  rows: IngredientRow[];
  onChange: (rows: IngredientRow[]) => void;
}

export function IngredientEditor({ rows, onChange }: IngredientEditorProps) {
  const nameRefs = useRef(new Map<string, HTMLInputElement>());
  // Row to focus once it has rendered (set when adding or removing rows).
  const pendingFocus = useRef<string | null>(null);
  const setFocusId = (id: string) => {
    pendingFocus.current = id;
  };

  useEffect(() => {
    if (pendingFocus.current) {
      nameRefs.current.get(pendingFocus.current)?.focus();
      pendingFocus.current = null;
    }
  }, [rows]);

  function update(id: string, patch: Partial<IngredientRow>) {
    onChange(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function insertAfter(index: number, fresh: IngredientRow[]) {
    const next = [...rows.slice(0, index + 1), ...fresh, ...rows.slice(index + 1)];
    onChange(next);
    setFocusId(fresh[fresh.length - 1].id);
  }

  function addBlank() {
    const row = { id: newId(), qty: "", unit: "", name: "" };
    onChange([...rows, row]);
    setFocusId(row.id);
  }

  function remove(id: string) {
    onChange(rows.filter((r) => r.id !== id));
  }

  /** Pasting several lines (e.g. a copied ingredient list) becomes several rows. */
  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>, index: number) {
    const text = e.clipboardData.getData("text");
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) return;
    e.preventDefault();
    const parsed = lines.map((l) => ({ id: newId(), ...parseIngredientLine(l) }));
    const current = rows[index];
    const isEmpty = !current.qty && !current.unit && !current.name;
    const next = isEmpty
      ? [...rows.slice(0, index), ...parsed, ...rows.slice(index + 1)]
      : [...rows.slice(0, index + 1), ...parsed, ...rows.slice(index + 1)];
    onChange(next);
    setFocusId(parsed[parsed.length - 1].id);
  }

  return (
    <div className="space-y-2">
      {rows.map((row, i) => (
        <div key={row.id} className="flex items-center gap-2">
          <Input
            aria-label={`Ingredient ${i + 1} amount`}
            value={row.qty}
            onChange={(e) => update(row.id, { qty: e.target.value })}
            placeholder="1½"
            inputMode="text"
            className="w-20 shrink-0"
          />
          <select
            aria-label={`Ingredient ${i + 1} unit`}
            value={row.unit}
            onChange={(e) => update(row.id, { unit: e.target.value })}
            className="w-24 shrink-0 rounded-2lg bg-background-tertiary-default px-2 py-2 text-body-regular text-text-primary ring-2 ring-inset ring-transparent outline-none hover:ring-border-button-hover focus:ring-border-button-active"
          >
            <option value="">—</option>
            {UNITS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
          <Input
            ref={(el) => {
              if (el) nameRefs.current.set(row.id, el);
              else nameRefs.current.delete(row.id);
            }}
            aria-label={`Ingredient ${i + 1} name`}
            value={row.name}
            onChange={(e) => update(row.id, { name: e.target.value })}
            onPaste={(e) => handlePaste(e, i)}
            onBlur={() => {
              // Typed "2 cups flour" straight into the name box? Split it up.
              if (row.qty || row.unit) return;
              const parsed = parseIngredientLine(row.name);
              if (parsed.qty) update(row.id, parsed);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                // Enter adds the next ingredient instead of submitting the form.
                e.preventDefault();
                if (row.name.trim()) {
                  insertAfter(i, [{ id: newId(), qty: "", unit: "", name: "" }]);
                }
              } else if (e.key === "Backspace" && !row.name && !row.qty && rows.length > 1) {
                e.preventDefault();
                remove(row.id);
                const prev = rows[i - 1] ?? rows[i + 1];
                if (prev) setFocusId(prev.id);
              }
            }}
            placeholder="butter, softened"
            className="min-w-0 flex-1"
          />
          <button
            type="button"
            onClick={() => remove(row.id)}
            aria-label={`Remove ingredient ${i + 1}`}
            className="rounded-full p-1.5 text-text-secondary transition-colors hover:bg-background-secondary-hover hover:text-text-primary"
          >
            <CloseIcon />
          </button>
        </div>
      ))}

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <Button type="button" variant="secondary" onClick={addBlank}>
          + Add ingredient
        </Button>
        <p className="text-caption-1-regular text-text-secondary">
          Press enter for the next one, or paste a whole list.
        </p>
      </div>
    </div>
  );
}
