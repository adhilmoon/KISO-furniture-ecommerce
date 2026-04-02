import Product from "../../model/Product.js";

/**
 * createProduct
 * 
 * @param {Object} body   - req.body after form submission
 * @param {Array}  files  - req.files from multer (.any())
 * 
 * Payload shape expected from the frontend:
 * {
 *   productName, description, category, basePrice, material,
 *   dimensions: { width, depth, height },
 *   customAttributes: [ { key, value }, ... ],       ← JSON string from hidden input
 *   variants: [                                       ← JSON string from hidden input
 *     { optionType, optionValue, price, stock },
 *     ...
 *   ]
 * }
 *
 * Files from multer (.any()):
 *   { fieldname: "images", ... }                     → main product images
 *   { fieldname: "variants[0][images]", ... }        → variant 0 images
 *   { fieldname: "variants[1][images]", ... }        → variant 1 images
 */
export const createProduct = async (body, files = []) => {
  const {
    productName,
    description,
    category,
    basePrice,
    material,
  } = body;

  // ── Dimensions ────────────────────────────────────────────────────────────
  const dimensions = {
    width:  parseFloat(body["dimensions[width]"]  || body?.dimensions?.width  || 0) || 0,
    depth:  parseFloat(body["dimensions[depth]"]  || body?.dimensions?.depth  || 0) || 0,
    height: parseFloat(body["dimensions[height]"] || body?.dimensions?.height || 0) || 0,
  };

  // ── Custom Attributes ─────────────────────────────────────────────────────
  // Frontend sends a JSON string in the hidden field "customAttributesJSON"
  let customAttributes = [];
  if (body.customAttributesJSON) {
    try {
      const parsed = JSON.parse(body.customAttributesJSON);
      // Filter out rows where key is empty
      customAttributes = parsed.filter(attr => attr.key && attr.key.trim() !== "");
    } catch (e) {
      customAttributes = [];
    }
  }

  // ── Main Product Images ───────────────────────────────────────────────────
  const mainImages = files
    .filter(f => f.fieldname === "images")
    .map(f => f.path); // Cloudinary returns the URL in `path`

  // ── Variants ──────────────────────────────────────────────────────────────
  // Frontend sends a JSON string in the hidden field "variantsJSON"
  let variantsData = [];
  if (body.variantsJSON) {
    try {
      variantsData = JSON.parse(body.variantsJSON);
    } catch (e) {
      variantsData = [];
    }
  }

  // Map variant images: fieldname "variants[{index}][images]" → variant index
  const variantImageMap = {}; // { index: [url, url, ...] }
  files
    .filter(f => f.fieldname.startsWith("variants["))
    .forEach(f => {
      // Parse index from fieldname like "variants[2][images]"
      const match = f.fieldname.match(/variants\[(\d+)\]\[images\]/);
      if (match) {
        const idx = parseInt(match[1]);
        if (!variantImageMap[idx]) variantImageMap[idx] = [];
        variantImageMap[idx].push(f.path); // Cloudinary URL
      }
    });

  // Build final variants array
  const variants = variantsData.map((v, index) => ({
    optionType:  v.optionType  || "",
    optionValue: v.optionValue || "",
    price:       parseFloat(v.price)  || 0,
    stock:       parseInt(v.stock, 10) || 0,
    images:      variantImageMap[index] || [],
  }));

  // ── Save to DB ────────────────────────────────────────────────────────────
  const newProduct = new Product({
    productName: productName.trim(),
    description: description.trim(),
    category,
    basePrice:   parseFloat(basePrice) || 0,
    material:    material ? material.trim() : "",
    dimensions,
    customAttributes,
    variants,
    images: mainImages,
    isListed: true,
  });

  return await newProduct.save();
};
