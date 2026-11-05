"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PhotoUpload } from "@/components/recipes/PhotoUpload";

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
}

export function RecipeForm({ action, defaultValues, submitLabel }: RecipeFormProps) {
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
          <Label htmlFor="tags">Tags (comma-separated)</Label>
          <Input
            id="tags"
            name="tags"
            placeholder="e.g. quick, vegetarian"
            defaultValue={defaultValues?.tags?.join(", ")}
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

      <Button type="submit">{submitLabel}</Button>
    </form>
  );
}
