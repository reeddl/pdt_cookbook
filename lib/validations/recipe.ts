import { z } from "zod";

export const recipeInputSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  ingredients: z.string().trim().min(1, "Ingredients are required"),
  instructions: z.string().trim().min(1, "Instructions are required"),
  category: z.string().trim().min(1, "Category is required").max(60),
  tags: z
    .string()
    .trim()
    .transform((val) =>
      val
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    ),
  photoUrl: z.string().url().optional().or(z.literal("")),
  submitterName: z.string().trim().min(1, "Submitter name is required").max(120),
});

export type RecipeInput = z.infer<typeof recipeInputSchema>;
