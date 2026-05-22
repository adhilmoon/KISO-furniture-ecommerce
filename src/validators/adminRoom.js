import { z } from "zod";

const optionalUrl = z
    .string()
    .trim()
    .refine(v => v === '' || /^(https?:)?\/\/|^\//.test(v), { message: "Link must be a valid URL or path" })
    .optional()
    .or(z.literal(''));

const optionalInt = z
    .union([z.number(), z.string()])
    .transform(v => parseInt(v, 10))
    .refine(v => Number.isInteger(v) && v >= 0, { message: "Order must be a non-negative integer" })
    .optional();

export const roomSchema = z.object({
    title: z.string().trim().min(1, 'Title is required').max(80, 'Title must be at most 80 characters'),
    linkUrl: optionalUrl,
    order: optionalInt,
    isActive: z
        .union([z.boolean(), z.string()])
        .transform(v => v === true || v === 'true' || v === 'on')
        .optional()
});

export const reorderSchema = z.object({
    items: z.array(z.object({
        id: z.string().min(1),
        order: z.number().int().min(0)
    })).min(1)
});
