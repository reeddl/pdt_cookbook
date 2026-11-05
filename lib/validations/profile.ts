import { z } from "zod";

export const profileInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  bondNumber: z.string().trim().max(40).optional().or(z.literal("")),
  pledgeClass: z.string().trim().max(60).optional().or(z.literal("")),
  graduationYear: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((val) => (val ? Number(val) : null))
    .refine((val) => val === null || (Number.isInteger(val) && val > 1900 && val < 2100), {
      message: "Enter a valid graduation year",
    }),
});

export type ProfileInput = z.infer<typeof profileInputSchema>;
