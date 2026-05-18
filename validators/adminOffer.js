import { z } from "zod";

const numericPositive = z
    .union([z.number(), z.string()])
    .transform(v => Number(v))
    .refine(v => Number.isFinite(v) && v >= 0, { message: "Must be a non-negative number" });

const objectIdOrEmpty = z.string().trim().optional().or(z.literal('')).transform(v => v || null);

export const offerSchema = z.object({
    name: z
        .string()
        .min(3, "Offer name must be at least 3 characters")
        .max(100, "Offer name must be at most 100 characters")
        .trim(),
    description: z.string().max(300).trim().optional().or(z.literal('')),
    type: z.enum(['product', 'category', 'referral'], { message: "Type must be 'product', 'category', or 'referral'" }),
    discountType: z.enum(['percentage', 'flat'], { message: "Discount type must be 'percentage' or 'flat'" }),
    discountValue: numericPositive,
    maxDiscount: numericPositive.optional(),
    productId: objectIdOrEmpty,
    categoryId: objectIdOrEmpty,
    startsAt: z.string().optional().or(z.literal('')),
    expiresAt: z
        .string()
        .refine(v => !Number.isNaN(Date.parse(v)), { message: "Invalid expiry date" })
        .refine(v => new Date(v).getTime() > Date.now(), { message: "Expiry date must be in the future" })
}).refine(
    data => data.discountType !== 'percentage' || data.discountValue <= 100,
    { message: "Percentage discount must be between 0 and 100", path: ['discountValue'] }
).refine(
    data => data.type !== 'product' || !!data.productId,
    { message: "Product is required for product offer", path: ['productId'] }
).refine(
    data => data.type !== 'category' || !!data.categoryId,
    { message: "Category is required for category offer", path: ['categoryId'] }
);
