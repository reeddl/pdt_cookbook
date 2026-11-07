"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { CloseIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import {
  formatIngredientForStep,
  newId,
  type IngredientRow,
  type MeasurementWarning,
  type StepRow,
} from "@/lib/recipeFormat";

interface StepEditorProps {
  steps: StepRow[];
  ingredients: IngredientRow[];
  warnings: MeasurementWarning[];
  onChange: (steps: StepRow[]) => void;
}

export function StepEditor({ steps, ingredients, warnings, onChange }: StepEditorProps) {
  const [focusId, setFocusId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const choices = useMemo(
    () =>
      ingredients
        .map((i) => ({ id: i.id, label: formatIngredientForStep(i) }))
        .filter((c) => c.label.trim().length > 0),
    [ingredients]
  );

  function update(id: string, text: string) {
    onChange(steps.map((s) => (s.id === id ? { ...s, text } : s)));
  }

  function move(from: number, to: number) {
    if (to < 0 || to >= steps.length || from === to) return;
    const next = [...steps];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  }

  function addStep(afterIndex = steps.length - 1) {
    const step = { id: newId(), text: "" };
    const next = [...steps];
    next.splice(afterIndex + 1, 0, step);
    onChange(next);
    setFocusId(step.id);
  }

  function drop(targetId: string) {
    if (!dragId || dragId === targetId) return;
    move(
      steps.findIndex((s) => s.id === dragId),
      steps.findIndex((s) => s.id === targetId)
    );
  }

  return (
    <div className="space-y-3">
      {steps.map((step, i) => (
        <StepCard
          key={step.id}
          step={step}
          index={i}
          total={steps.length}
          choices={choices}
          missing={warnings.filter((w) => w.stepId === step.id).map((w) => w.ingredient)}
          autoFocus={focusId === step.id}
          onFocused={() => setFocusId(null)}
          isDragging={dragId === step.id}
          isOver={overId === step.id && dragId !== step.id}
          onChange={(text) => update(step.id, text)}
          onMove={(dir) => move(i, i + dir)}
          onRemove={() => onChange(steps.filter((s) => s.id !== step.id))}
          onAddAfter={() => addStep(i)}
          onDragStart={() => setDragId(step.id)}
          onDragOver={() => setOverId(step.id)}
          onDrop={() => {
            drop(step.id);
            setDragId(null);
            setOverId(null);
          }}
          onDragEnd={() => {
            setDragId(null);
            setOverId(null);
          }}
        />
      ))}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="secondary" onClick={() => addStep()}>
          + Add step
        </Button>
        <p className="text-caption-1-regular text-text-secondary">
          Type <kbd className="rounded bg-background-secondary-default px-1">@</kbd> or tap an
          ingredient chip to drop in its measurement.
        </p>
      </div>
    </div>
  );
}

interface StepCardProps {
  step: StepRow;
  index: number;
  total: number;
  choices: { id: string; label: string }[];
  missing: string[];
  autoFocus: boolean;
  isDragging: boolean;
  isOver: boolean;
  onFocused: () => void;
  onChange: (text: string) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
  onAddAfter: () => void;
  onDragStart: () => void;
  onDragOver: () => void;
  onDrop: () => void;
  onDragEnd: () => void;
}

function StepCard({
  step,
  index,
  total,
  choices,
  missing,
  autoFocus,
  isDragging,
  isOver,
  onFocused,
  onChange,
  onMove,
  onRemove,
  onAddAfter,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: StepCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const areaRef = useRef<HTMLTextAreaElement>(null);
  // `at` is where the "@" sits in the text; `query` is what was typed after it.
  const [menu, setMenu] = useState<{ at: number; query: string } | null>(null);
  const [highlight, setHighlight] = useState(0);

  useEffect(() => {
    if (autoFocus) {
      areaRef.current?.focus();
      onFocused();
    }
  }, [autoFocus, onFocused]);

  // Grow with content so long steps never need an inner scrollbar.
  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [step.text]);

  const matches = useMemo(() => {
    if (!menu) return [];
    const q = menu.query.toLowerCase();
    return choices.filter((c) => c.label.toLowerCase().includes(q)).slice(0, 6);
  }, [menu, choices]);

  function insert(label: string, replaceFrom?: number) {
    const el = areaRef.current;
    const text = step.text;
    const caret = el?.selectionStart ?? text.length;
    const from = replaceFrom ?? caret;
    // Pad with a space so the amount doesn't run into neighbouring words.
    const before = text.slice(0, from);
    const after = text.slice(caret);
    const lead = before && !/[\s(\[]$/.test(before) ? " " : "";
    const trail = after && !/^[\s.,;:!?)\]]/.test(after) ? " " : "";
    const insertion = lead + label + trail;
    onChange(before + insertion + after);
    setMenu(null);
    const pos = from + lead.length + label.length;
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(pos, pos);
    });
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const value = e.target.value;
    onChange(value);
    const caret = e.target.selectionStart;
    const m = value.slice(0, caret).match(/(?:^|\s)@([^\s@]*)$/);
    if (m) {
      setMenu({ at: caret - m[1].length - 1, query: m[1] });
      setHighlight(0);
    } else {
      setMenu(null);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (menu && matches.length > 0) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const d = e.key === "ArrowDown" ? 1 : -1;
        setHighlight((h) => (h + d + matches.length) % matches.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        insert(matches[highlight].label, menu.at);
        return;
      }
    }
    if (e.key === "Escape") {
      setMenu(null);
      return;
    }
    if (e.key === "Enter" && !e.shiftKey) {
      // Enter finishes the step and starts the next; Shift+Enter is not needed
      // because steps are single paragraphs.
      e.preventDefault();
      if (step.text.trim()) onAddAfter();
    }
  }

  return (
    <div
      ref={cardRef}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver();
      }}
      onDrop={(e) => {
        e.preventDefault();
        onDrop();
      }}
      className={cn(
        "group rounded-3xl bg-background-secondary-default p-3 transition-[opacity,box-shadow]",
        isDragging && "opacity-40",
        isOver && "ring-2 ring-border-button-active",
        missing.length > 0 && "ring-2 ring-inset ring-status-orange-text/40"
      )}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          draggable
          aria-label={`Drag to reorder step ${index + 1}`}
          onDragStart={(e) => {
            e.dataTransfer.effectAllowed = "move";
            if (cardRef.current) e.dataTransfer.setDragImage(cardRef.current, 16, 16);
            onDragStart();
          }}
          onDragEnd={onDragEnd}
          className="mt-1 flex h-7 w-7 shrink-0 cursor-grab flex-col items-center justify-center rounded-full bg-button-ghost-background text-caption-1-semibold text-button-ghost-foreground active:cursor-grabbing"
        >
          {index + 1}
        </button>

        <div className="relative min-w-0 flex-1">
          <textarea
            ref={areaRef}
            value={step.text}
            rows={2}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onBlur={() => setMenu(null)}
            aria-label={`Step ${index + 1}`}
            placeholder={
              index === 0 ? "Preheat the oven to 350°F. Melt @ to add an ingredient…" : "Next step…"
            }
            className="block w-full resize-none rounded-2lg bg-background-tertiary-default px-3 py-2 text-body-regular text-text-primary ring-2 ring-inset ring-transparent outline-none placeholder:text-text-tertiary hover:ring-border-button-hover focus:ring-border-button-active"
          />

          {menu && matches.length > 0 && (
            <ul
              role="listbox"
              onMouseDown={(e) => e.preventDefault()}
              className="absolute left-0 z-20 mt-1 w-64 max-w-full overflow-hidden rounded-2lg border border-separator-border bg-background-primary-default py-1 shadow-md"
            >
              {matches.map((m, i) => (
                <li
                  key={m.id}
                  role="option"
                  aria-selected={i === highlight}
                  onClick={() => insert(m.label, menu.at)}
                  onMouseEnter={() => setHighlight(i)}
                  className={cn(
                    "cursor-pointer px-3 py-1.5 text-body-regular text-text-primary",
                    i === highlight && "bg-button-ghost-background text-button-ghost-foreground"
                  )}
                >
                  {m.label}
                </li>
              ))}
            </ul>
          )}

          {choices.length > 0 && (
            // Only the step being edited shows chips, so long recipes stay tidy.
            <div
              className="mt-2 hidden flex-wrap gap-1.5 group-focus-within:flex"
              aria-label="Insert ingredient"
            >
              {choices.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  // Keep the caret in the textarea so the chip inserts where you were typing.
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => insert(c.label)}
                  className="rounded-full bg-background-tertiary-default px-2.5 py-0.5 text-caption-1-regular text-text-secondary transition-colors hover:bg-button-ghost-background hover:text-button-ghost-foreground"
                >
                  + {c.label}
                </button>
              ))}
            </div>
          )}

          {missing.length > 0 && (
            <p className="mt-2 rounded-2lg bg-status-orange-background px-2.5 py-1 text-caption-1-regular text-status-orange-text">
              Add the amount for: {missing.join(", ")}
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-center">
          <button
            type="button"
            onClick={() => onMove(-1)}
            disabled={index === 0}
            aria-label={`Move step ${index + 1} up`}
            className="rounded-full p-1 text-text-secondary hover:bg-background-secondary-hover disabled:opacity-30"
          >
            ▲
          </button>
          <button
            type="button"
            onClick={() => onMove(1)}
            disabled={index === total - 1}
            aria-label={`Move step ${index + 1} down`}
            className="rounded-full p-1 text-text-secondary hover:bg-background-secondary-hover disabled:opacity-30"
          >
            ▼
          </button>
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove step ${index + 1}`}
            className="rounded-full p-1 text-text-secondary hover:bg-background-secondary-hover hover:text-text-primary"
          >
            <CloseIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
