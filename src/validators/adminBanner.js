import { z } from "zod";

const HEX_COLOR = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

const optionalTrimmed = (max, label) =>
    z.string().max(max, `${label} must be at most ${max} characters`).trim().optional().or(z.literal(''));

// Allow absolute HTTP(S) URLs or root-relative paths only.
// Reject protocol-relative (`//evil.com`), javascript:, data:, and other schemes.
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
    .refine(isSafeUrl, { message: "Link must be a relative path (/foo) or absolute http(s) URL — protocol-relative and other schemes are not allowed" })
    .optional()
    .or(z.literal(''));

const optionalInt = z
    .union([z.number(), z.string()])
    .transform(v => parseInt(v, 10))
    .refine(v => Number.isInteger(v) && v >= 0, { message: "Order must be a non-negative integer" })
    .optional();

const colorSchema = z.string().regex(HEX_COLOR, "Invalid hex color (use #RGB or #RRGGBB)");

export const bannerSchema = z.object({
    title: z.string().trim().min(2, 'Title is required (min 2 characters)').max(100, 'Title must be at most 100 characters'),
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
