import * as productService from "../../service/admin/productService.js";
import Category from "../../model/Category.js";
import { STATUS_CODES } from "../../constants/statusCodes.js";

/**
 * GET /admin/product/add
 * Renders the Add Product form with active categories injected.
 */
export const addProductPage = async (req, res) => {
  try {
    const categories = await Category.find({ isActieve: true }).lean();
    res.render("admin/product-add", {
      title: "Add Product",
      layout: "layouts/admin",
      showSidebar: true,
      categories,
    });
  } catch (error) {
    console.error("addProductPage error:", error);
    res.status(500).send("Server error");
  }
};

/**
 * POST /admin/product/add
 * 
 * Processes the multipart form:
 *  - req.body       → product fields + JSON strings for customAttributes & variants
 *  - req.files      → multer .any() array of all uploaded files (main + variant images)
 * 
 * Returns JSON so the frontend can handle success/error toasts and redirect.
 */
export const addProduct = async (req, res) => {
  try {
    const { productName, category, basePrice } = req.body;

    // ── Basic server-side validation ───────────────────────────────────────
    if (!productName || !productName.trim()) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: "Product name is required.",
      });
    }
    if (!category) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: "Category is required.",
      });
    }
    if (!basePrice || isNaN(parseFloat(basePrice)) || parseFloat(basePrice) < 0) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: "A valid base price is required.",
      });
    }

    // ── Delegate to service ────────────────────────────────────────────────
    const product = await productService.createProduct(req.body, req.files || []);

    return res.status(STATUS_CODES.CREATED).json({
      success: true,
      message: "Product created successfully.",
      productId: product._id,
    });

  } catch (error) {
    console.error("addProduct error:", error);

    // Handle duplicate key errors (e.g. SKU if we add it back later)
    if (error.code === 11000) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: "A product with those details already exists.",
      });
    }

    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || "Failed to create product. Please try again.",
    });
  }
};
