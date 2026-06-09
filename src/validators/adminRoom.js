import { z } from "zod";

const isSafeUrl = (v) => {
    if (v === '') return true;
    if (v.startsWith('//')) return false;
    if (v.startsWith('/')) return !v.startsWith('//');
    if (/^https?:\/\//i.test(v)) {
        try {
            const u = new URL(v);
            return u.protocol === 'http:' || u.protocol === 'https:';
        } catch {
            return false;
        }
    }
    return false;
};

const optionalUrl = z
    .string()
    .trim()
    .refine(isSafeUrl, { message: "Link must be a relative path (/foo) or absolute http(s) URL" })
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
