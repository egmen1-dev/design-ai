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

export const registerSchema = z.object({
  name: z.string().trim().max(80, "Имя должно быть короче 80 символов").optional(),
  email: z.string().trim().email("Введите корректный email").toLowerCase(),
  password: z
    .string()
    .min(8, "Пароль должен быть не короче 8 символов")
    .max(128, "Пароль должен быть короче 128 символов"),
});

export const loginSchema = registerSchema.pick({
  email: true,
  password: true,
});

export type GenerateInput = z.infer<typeof generateSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
