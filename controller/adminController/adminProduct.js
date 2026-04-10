import * as productService from "../../service/admin/productService.js";
import {STATUS_CODES} from "../../constants/statusCodes.js";



export const addProduct = async (req, res) => {
  try {
    const {productName, category, basePrice} = req.body;


    if(!productName || !productName.trim()) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: "Product name is required.",
      });
    }
    if(!category) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: "Category is required.",
      });
    }
    if(!basePrice || isNaN(parseFloat(basePrice)) || parseFloat(basePrice) < 0) {
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

  } catch(error) {
    console.error("addProduct error:", error);

    // Handle duplicate key errors (e.g. SKU if we add it back later)
    if(error.code === 11000) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: "A product with those details already exists.",
      });
    }

    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
    });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const {productName, category, basePrice} = req.body;

    if(!productName || !productName.trim()) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: "Product name is required.",
      });
    }
    if(!category) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: "Category is required.",
      });
    }
    if(!basePrice || isNaN(parseFloat(basePrice)) || parseFloat(basePrice) < 0) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: "A valid base price is required.",
      });
    }

    const updatedProduct = await productService.updateProduct(productId, req.body, req.files || []);
    if(!updated) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: "Product not found"
      });
    }
    return res.status(STATUS_CODES.OK).json({
      success: true,
      message: "Product updated successfully.",
      productId: updatedProduct._id,
    });

  } catch(error) {
    console.error("updateProduct error:", error);

    if(error.code === 11000) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: "A product with those details already exists.",
      });
    }

    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || "Failed to update product. Please try again.",
    });
  }
};
export const disableProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const updated = await productService.disableProduct(productId);
    if(!updated) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: "Product not found"
      });
    }

    return res.status(STATUS_CODES.OK).json({
      success: true,
      message: "success fully product disabled"
    })


  } catch(err) {
    console.error("product disble side in controller", err)
  }
}
export const enableProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const updated=await productService.enableProduct(productId)
    if(!updated){
        return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: "Product not found"
      });
    }
    return res.status(STATUS_CODES.OK).json({
      success: true,
      message: "success fully product enabled"
    })


  } catch(err) {
    console.error("product enable side in controller", err)
  }
}