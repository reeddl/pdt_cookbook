"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { PhotoUpload } from "@/components/recipes/PhotoUpload";
import { TagInput } from "@/components/recipes/TagInput";

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
  return (
    <form action={action} className="space-y-5">
      <div>
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" required defaultValue={defaultValues?.title} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="category">Category</Label>
          <Input
            id="category"
            name="category"
            placeholder="e.g. Desserts"
            required
            defaultValue={defaultValues?.category}
          />
        </div>
        <div>
          <Label htmlFor="tags">Tags</Label>
          <TagInput
            id="tags"
            name="tags"
            placeholder="e.g. quick, vegetarian"
            defaultValue={defaultValues?.tags}
            suggestions={tagSuggestions}
          />
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
        <Label htmlFor="ingredients">Ingredients (one per line)</Label>
        <Textarea
          id="ingredients"
          name="ingredients"
          rows={6}
          required
          defaultValue={defaultValues?.ingredients}
        />
      </div>

      <div>
        <Label htmlFor="instructions">Instructions</Label>
        <Textarea
          id="instructions"
          name="instructions"
          rows={8}
          required
          defaultValue={defaultValues?.instructions}
        />
      </div>

      <div>
        <Label>Photo</Label>
        <PhotoUpload name="photoUrl" defaultValue={defaultValues?.photoUrl} />
      </div>

      <SubmitButton pendingLabel={pendingLabel}>{submitLabel}</SubmitButton>
    </form>
  );
}
