"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { RecipeForm, type RecipeFormDefaults } from "@/components/recipes/RecipeForm";
import { importRecipeFromUrl } from "@/lib/recipe-import/actions";

interface RecipeImportFormProps {
  action: (formData: FormData) => void | Promise<void>;
  defaultValues?: RecipeFormDefaults;
  submitLabel: string;
  pendingLabel?: string;
  tagSuggestions?: string[];
}

/**
 * New-recipe flow that starts from a link: paste a recipe page's URL, we pull
 * out the ingredients and directions, and the usual form opens pre-filled for
 * review. Entering a recipe by hand is still one tap away.
 */
export function RecipeImportForm({ defaultValues, ...formProps }: RecipeImportFormProps) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [importedFrom, setImportedFrom] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formDefaults, setFormDefaults] = useState<RecipeFormDefaults | undefined>(defaultValues);
  // RecipeForm's fields are uncontrolled, so a new key re-mounts it with the imported values.
  const [formKey, setFormKey] = useState(0);
  const [pending, startTransition] = useTransition();

  function handleImport(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await importRecipeFromUrl(url);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setFormDefaults({
        ...defaultValues,
        title: result.recipe.title,
        ingredients: result.recipe.ingredients,
        instructions: result.recipe.instructions,
        ...(result.recipe.category ? { category: result.recipe.category } : {}),
      });
      setImportedFrom(hostOf(result.sourceUrl));
      setFormKey((k) => k + 1);
      setShowForm(true);
    });
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleImport} className="space-y-2">
        <Label htmlFor="recipeUrl">Recipe link</Label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            id="recipeUrl"
            name="recipeUrl"
            type="text"
            inputMode="url"
            autoComplete="url"
            autoCapitalize="off"
            spellCheck={false}
            placeholder="https://www.example.com/best-chili-recipe"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            aria-invalid={error ? true : undefined}
            aria-describedby="recipeUrl-help"
            required
          />
          <Button type="submit" disabled={pending || !url.trim()} className="shrink-0">
            {pending ? (
              <>
                <Spinner /> Importing…
              </>
            ) : importedFrom ? (
              "Import again"
            ) : (
              "Import recipe"
            )}
          </Button>
        </div>
        <p id="recipeUrl-help" className="text-body-regular text-text-secondary">
          Paste the link to a recipe page and we&apos;ll fill in the ingredients and directions for you
          to check.
        </p>
        {error && (
          <p role="alert" className="rounded-3xl bg-status-rose-background p-4 text-body-regular text-status-rose-text">
            {error}
          </p>
        )}
      </form>

      {importedFrom && !error && (
        <div
          role="status"
          className="rounded-3xl bg-status-lime-background p-4 text-body-regular text-status-lime-text"
        >
          Imported from {importedFrom}. Check everything below before you submit.
        </div>
      )}

      {showForm ? (
        <RecipeForm key={formKey} defaultValues={formDefaults} {...formProps} />
      ) : (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="text-body-regular text-button-ghost-foreground underline"
        >
          No link? Enter a recipe by hand
        </button>
      )}
    </div>
  );
}

function hostOf(u: string): string {
  try {
    return new URL(u).hostname.replace(/^www\./, "");
  } catch {
    return "that page";
  }
}
