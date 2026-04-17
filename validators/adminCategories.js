import {z} from "zod"

export const categorySchema = z.object({
  categoryName: z
    .string()
    .min(3, "Category name must be at least 3 characters")
    .regex(/^[A-Za-z\s]+$/, "Only letters and spaces allowed") // 🔥 REGEX
    .trim(),

  description: z
    .string()
    .min(5, "Description must be at least 5 characters")
    .trim()
});