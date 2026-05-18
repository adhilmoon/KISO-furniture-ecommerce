import { z } from "zod";

const numericPositive = z
    .union([z.number(), z.string()])
    .transform(v => Number(v))
    .refine(v => Number.isFinite(v) && v >= 0, { message: "Must be a non-negative number" });

const numericInteger = z
    .union([z.number(), z.string()])
    .transform(v => parseInt(v, 10))
    .refine(v => Number.isInteger(v) && v >= 0, { message: "Must be a non-negative integer" });

export const couponSchema = z.object({
    code: z
        .string()
        .min(3, "Coupon code must be at least 3 characters")
        .max(20, "Coupon code must be at most 20 characters")
        .regex(/^[A-Z0-9_-]+$/i, "Only letters, numbers, dash, underscore allowed")
        .trim(),
    description: z
        .string()
        .max(200, "Description must be at most 200 characters")
        .trim()
        .optional()
        .or(z.literal('')),
    discountType: z.enum(['percentage', 'flat'], { message: "Discount type must be 'percentage' or 'flat'" }),
    discountValue: numericPositive,
    minPurchase: numericPositive.optional(),
    maxDiscount: numericPositive.optional(),
    usageLimit: numericInteger.optional(),
    perUserLimit: numericInteger.optional(),
    expiresAt: z
        .string()
        .refine(v => !Number.isNaN(Date.parse(v)), { message: "Invalid expiry date" })
        .refine(v => new Date(v).getTime() > Date.now(), { message: "Expiry date must be in the future" })
}).refine(
    data => data.discountType !== 'percentage' || data.discountValue <= 100,
    { message: "Percentage discount must be between 0 and 100", path: ['discountValue'] }
);
