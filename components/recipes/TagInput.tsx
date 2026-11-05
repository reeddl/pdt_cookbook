"use client";

import { useId, useMemo, useRef, useState } from "react";
import { CloseIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

interface TagInputProps {
  /** Submitted as a comma-separated string, matching the recipe schema. */
  name: string;
  id?: string;
  defaultValue?: string[];
  /** Tags already used elsewhere in the cookbook, offered as suggestions. */
  suggestions?: string[];
  placeholder?: string;
}

const MAX_SUGGESTIONS = 6;

export function TagInput({
  name,
  id,
  defaultValue = [],
  suggestions = [],
  placeholder = "Add a tag…",
}: TagInputProps) {
  const [tags, setTags] = useState<string[]>(defaultValue);
  const [draft, setDraft] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  const matches = useMemo(() => {
    const taken = new Set(tags.map((t) => t.toLowerCase()));
    const q = draft.trim().toLowerCase();
    return suggestions
      .filter((s) => !taken.has(s.toLowerCase()) && (q === "" || s.toLowerCase().includes(q)))
      .slice(0, MAX_SUGGESTIONS);
  }, [suggestions, tags, draft]);

  function addTag(raw: string) {
    const value = raw.trim().replace(/\s+/g, " ");
    if (!value) return;
    // Reuse an existing tag's capitalisation so "Quick" and "quick" don't split.
    const existing = suggestions.find((s) => s.toLowerCase() === value.toLowerCase());
    const next = existing ?? value;
    if (tags.some((t) => t.toLowerCase() === next.toLowerCase())) {
      setDraft("");
      return;
    }
    setTags((prev) => [...prev, next]);
    setDraft("");
    setHighlight(0);
  }

  function removeTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag));
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      // Enter commits a tag — it must not submit the surrounding recipe form.
      e.preventDefault();
      const picked = open && matches[highlight] && draft.trim() !== "" ? matches[highlight] : draft;
      addTag(picked);
      return;
    }
    if (e.key === "Backspace" && draft === "" && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
      return;
    }
    if (e.key === "ArrowDown" && matches.length > 0) {
      e.preventDefault();
      setOpen(true);
      setHighlight((h) => (h + 1) % matches.length);
      return;
    }
    if (e.key === "ArrowUp" && matches.length > 0) {
      e.preventDefault();
      setOpen(true);
      setHighlight((h) => (h - 1 + matches.length) % matches.length);
      return;
    }
    if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="relative">
      <input type="hidden" name={name} value={tags.join(", ")} />

      <div
        onClick={() => inputRef.current?.focus()}
        className="flex min-h-[42px] w-full flex-wrap items-center gap-1.5 rounded-lg border border-border bg-surface px-2 py-1.5 focus-within:ring-2 focus-within:ring-accent/40"
      >
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-accent/10 py-0.5 pl-2.5 pr-1 text-xs font-medium text-accent"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              aria-label={`Remove tag ${tag}`}
              className="rounded-full p-0.5 text-accent/70 transition-colors hover:bg-accent/20 hover:text-accent"
            >
              <CloseIcon className="h-3 w-3" />
            </button>
          </span>
        ))}

        <input
          ref={inputRef}
          id={id}
          type="text"
          value={draft}
          autoComplete="off"
          role="combobox"
          aria-expanded={open && matches.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            open && matches.length > 0 ? `${listId}-option-${highlight}` : undefined
          }
          placeholder={tags.length === 0 ? placeholder : ""}
          onChange={(e) => {
            setDraft(e.target.value);
            setOpen(true);
            setHighlight(0);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={handleKeyDown}
          className="min-w-[8rem] flex-1 bg-transparent px-1 py-0.5 text-sm text-text placeholder:text-text-muted focus:outline-none"
        />
      </div>

      <ul
        id={listId}
        role="listbox"
        hidden={!open || matches.length === 0}
        // Keep focus in the input so the list doesn't close before the click.
        onMouseDown={(e) => e.preventDefault()}
        className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-border bg-surface py-1 shadow-md"
      >
        {matches.map((match, i) => (
          <li
            key={match}
            id={`${listId}-option-${i}`}
            role="option"
            aria-selected={i === highlight}
            onClick={() => addTag(match)}
            onMouseEnter={() => setHighlight(i)}
            className={cn(
              "cursor-pointer px-3 py-1.5 text-sm text-text",
              i === highlight && "bg-accent/10 text-accent"
            )}
          >
            {match}
          </li>
        ))}
      </ul>

      <p className="mt-1 text-xs text-text-muted">
        Press enter or comma to add a tag.
      </p>
    </div>
  );
}
