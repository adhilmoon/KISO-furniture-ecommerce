import {z} from "zod";


const numericString = (fieldName) => z
  .string()
  .optional()
  .refine((val) => {
    if (!val || val.trim() === '') return true;
    const parsed = parseFloat(val);
    return !isNaN(parsed) && parsed >= 0;
  }, { message: `${fieldName} must be a valid positive number` });

export const productSchema = z.object({
  productName: z
    .string()
    .min(3, "Product name must be at least 3 characters")
    .trim(),
    
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .trim(),
    
  category: z
    .string()
    .min(1, "Category is required")
    .trim(),
    
  basePrice: z
    .string()
    .min(1, "Base price is required")
    .refine((val) => {
      const parsed = parseFloat(val);
      return !isNaN(parsed) && parsed > 0;
    }, {
      message: "Base price must be greater than 0",
    }),
    
  material: z
    .string()
    .trim()
    .optional(),
    
  'dimensions[width]': numericString("Width"),
  'dimensions[depth]': numericString("Depth"),
  'dimensions[height]': numericString("Height"),

  customAttributesJSON: z
    .string()
    .optional()
    .refine((val) => {
      if (!val || val.trim() === '') return true;
      try {
        JSON.parse(val);
        return true;
      } catch (e) {
        return false;
      }
    }, { message: "Invalid JSON format for custom attributes" }),

  variantsJSON: z
    .string()
    .optional()
    .refine((val) => {
      if (!val || val.trim() === '') return true;
      try {
        JSON.parse(val);
        return true;
      } catch (e) {
        return false;
      }
    }, { message: "Invalid JSON format for variants" }),
});
