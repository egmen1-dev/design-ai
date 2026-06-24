import { z } from "zod";

export const generateSchema = z.object({
  prompt: z
    .string()
    .min(10, "Prompt must be at least 10 characters")
    .max(2000, "Prompt must be at most 2000 characters"),
});

export const checkoutSchema = z.object({
  priceId: z.string().min(1).optional(),
});

export type GenerateInput = z.infer<typeof generateSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
