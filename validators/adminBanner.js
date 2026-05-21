import { z } from "zod";

const HEX_COLOR = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

const optionalTrimmed = (max, label) =>
    z.string().max(max, `${label} must be at most ${max} characters`).trim().optional().or(z.literal(''));

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

const colorSchema = z.string().regex(HEX_COLOR, "Invalid hex color (use #RGB or #RRGGBB)");

export const bannerSchema = z.object({
    title: optionalTrimmed(100, 'Title'),
    subtitle: optionalTrimmed(200, 'Subtitle'),
    ctaText: optionalTrimmed(30, 'CTA text'),
    linkUrl: optionalUrl,
    bgColor: colorSchema.optional(),
    textColor: colorSchema.optional(),
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
