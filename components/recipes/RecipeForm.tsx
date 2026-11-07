"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { PhotoUpload } from "@/components/recipes/PhotoUpload";
import { TagInput } from "@/components/recipes/TagInput";
import { IngredientEditor } from "@/components/recipes/IngredientEditor";
import { StepEditor } from "@/components/recipes/StepEditor";
import { importRecipe } from "@/app/actions/import-recipe";
import {
  findMissingMeasurements,
  newId,
  parseIngredients,
  parseSteps,
  serializeIngredients,
  serializeSteps,
  formatIngredient,
} from "@/lib/recipeFormat";

export interface RecipeFormDefaults {
  title?: string;
  category?: string;
  tags?: string[];
  ingredients?: string;
  instructions?: string;
  submitterName?: string;
  photoUrl?: string | null;
}

interface RecipeFormProps {
  action: (formData: FormData) => void | Promise<void>;
  defaultValues?: RecipeFormDefaults;
  submitLabel: string;
  pendingLabel?: string;
  /** Tags already used in the cookbook, offered as autocomplete options. */
  tagSuggestions?: string[];
}

export function RecipeForm({
  action,
  defaultValues,
  submitLabel,
  pendingLabel = "Saving…",
  tagSuggestions,
}: RecipeFormProps) {
  // Plain fields are uncontrolled; a link import replaces them by bumping
  // `fieldsKey`, which remounts the inputs with fresh defaults.
  const [fields, setFields] = useState({
    title: defaultValues?.title ?? "",
    category: defaultValues?.category ?? "",
    tags: defaultValues?.tags ?? [],
    photoUrl: defaultValues?.photoUrl ?? null,
  });
  const [fieldsKey, setFieldsKey] = useState(0);

  const [ingredients, setIngredients] = useState(() => {
    const rows = parseIngredients(defaultValues?.ingredients);
    return rows.length > 0 ? rows : [{ id: newId(), qty: "", unit: "", name: "" }];
  });
  const [steps, setSteps] = useState(() => {
    const rows = parseSteps(defaultValues?.instructions);
    return rows.length > 0 ? rows : [{ id: newId(), text: "" }];
  });

  const [importUrl, setImportUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importedFrom, setImportedFrom] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const warnings = useMemo(() => findMissingMeasurements(ingredients, steps), [ingredients, steps]);
  const ingredientsValue = serializeIngredients(ingredients);
  const instructionsValue = serializeSteps(steps);

  const hasContent =
    ingredientsValue.length > 0 || instructionsValue.length > 0 || fields.title.length > 0;

  async function handleImport() {
    if (!importUrl.trim() || importing) return;
    if (hasContent && !window.confirm("Importing will replace what you've entered so far. Continue?")) {
      return;
    }
    setImporting(true);
    setImportError(null);
    try {
      const result = await importRecipe(importUrl);
      if (!result.ok) {
        setImportError(result.error);
        return;
      }
      const r = result.recipe;
      setFields((prev) => ({
        title: r.title,
        category: r.category || prev.category,
        tags: r.tags,
        photoUrl: r.photoUrl,
      }));
      setFieldsKey((k) => k + 1);
      setIngredients(parseIngredients(r.ingredients));
      setSteps(parseSteps(r.instructions));
      setImportedFrom(r.sourceHost);
    } catch {
      setImportError("Something went wrong reading that link. Please try again.");
    } finally {
      setImporting(false);
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (!ingredientsValue) {
      e.preventDefault();
      setFormError("Add at least one ingredient.");
    } else if (!instructionsValue) {
      e.preventDefault();
      setFormError("Add at least one step.");
    } else {
      setFormError(null);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-background-secondary-default p-4">
        <Label htmlFor="importUrl">Start from a link</Label>
        <p className="mb-2 text-caption-1-regular text-text-secondary">
          Paste a recipe URL and we&apos;ll fill in the form for you to review. Works with most
          recipe sites.
        </p>
        <div className="flex gap-2">
          <Input
            id="importUrl"
            type="url"
            inputMode="url"
            placeholder="https://…"
            value={importUrl}
            onChange={(e) => setImportUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void handleImport();
              }
            }}
            disabled={importing}
          />
          <Button
            type="button"
            variant="secondary"
            onClick={handleImport}
            disabled={importing || !importUrl.trim()}
            className="shrink-0"
          >
            {importing && <Spinner />}
            {importing ? "Reading…" : "Import"}
          </Button>
        </div>
        {importError && (
          <p role="alert" className="mt-2 text-caption-1-regular text-text-error-primary">
            {importError}
          </p>
        )}
        {importedFrom && !importError && (
          <p className="mt-2 text-caption-1-regular text-status-lime-text">
            Imported from {importedFrom}. Check the details below
            {warnings.length > 0 ? " and add amounts to the steps that need them" : ""}, then
            submit.
          </p>
        )}
      </section>

      <form action={action} onSubmit={handleSubmit} className="space-y-5">
        <div key={fieldsKey} className="space-y-5">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" required defaultValue={fields.title} />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                name="category"
                placeholder="e.g. Desserts"
                required
                defaultValue={fields.category}
              />
            </div>
            <div>
              <Label htmlFor="tags">Tags</Label>
              <TagInput
                id="tags"
                name="tags"
                placeholder="e.g. quick, vegetarian"
                defaultValue={fields.tags}
                suggestions={tagSuggestions}
              />
            </div>
          </div>
        </div>

        <div>
          <Label htmlFor="submitterName">Submitted by</Label>
          <Input
            id="submitterName"
            name="submitterName"
            required
            defaultValue={defaultValues?.submitterName}
          />
        </div>

        <div>
          <Label>Ingredients</Label>
          <input type="hidden" name="ingredients" value={ingredientsValue} />
          <IngredientEditor rows={ingredients} onChange={setIngredients} />
        </div>

        <div>
          <Label>Instructions</Label>
          <p className="mb-2 text-caption-1-regular text-text-secondary">
            Include the measurement every time an ingredient is used, so nobody has to scroll back up
            while cooking.
          </p>
          <input type="hidden" name="instructions" value={instructionsValue} />
          <StepEditor
            steps={steps}
            ingredients={ingredients}
            warnings={warnings}
            onChange={setSteps}
          />
          {warnings.length > 0 && (
            <p className="mt-2 text-caption-1-regular text-status-orange-text">
              {warnings.length === 1
                ? "1 ingredient is missing its amount in the steps."
                : `${warnings.length} ingredients are missing their amounts in the steps.`}{" "}
              You can still submit, but the recipe is easier to follow with them.
            </p>
          )}
        </div>

        <details className="rounded-3xl bg-background-secondary-default p-4">
          <summary className="cursor-pointer text-body-medium text-text-primary">
            Preview how it will look
          </summary>
          <div className="mt-3 grid gap-6 sm:grid-cols-[1fr_2fr]">
            <ul className="space-y-1 text-body-regular text-text-primary">
              {ingredients
                .map(formatIngredient)
                .filter(Boolean)
                .map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
            </ul>
            <ol className="list-decimal space-y-2 pl-5 text-body-regular text-text-primary">
              {steps
                .filter((s) => s.text.trim())
                .map((s) => (
                  <li key={s.id}>{s.text}</li>
                ))}
            </ol>
          </div>
        </details>

        <div key={`photo-${fieldsKey}`}>
          <Label>Photo</Label>
          <PhotoUpload name="photoUrl" defaultValue={fields.photoUrl} />
        </div>

        {formError && (
          <p role="alert" className="text-caption-1-regular text-text-error-primary">
            {formError}
          </p>
        )}

        <SubmitButton pendingLabel={pendingLabel}>{submitLabel}</SubmitButton>
      </form>
    </div>
  );
}
