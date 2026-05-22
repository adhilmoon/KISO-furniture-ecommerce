import * as productService from "../../service/admin/productService.js";
import {STATUS_CODES} from "../../constants/statusCodes.js";
import catchAsync from "../../utilities/catchAsync.js";



export const addProduct = catchAsync(async (req, res) => {
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
    if(!basePrice || isNaN(parseFloat(basePrice)) || parseFloat(basePrice) <= 0) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: "Base price must be greater than 0.",
      });
    }

    const product = await productService.createProduct(req.body, req.files || []);

    return res.status(STATUS_CODES.CREATED).json({
      success: true,
      message: "Product created successfully.",
      productId: product._id,
    });
});

export const updateProduct = catchAsync(async (req, res) => {
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
    if(!basePrice || isNaN(parseFloat(basePrice)) || parseFloat(basePrice) <= 0) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: "Base price must be greater than 0.",
      });
    }

    const updatedProduct = await productService.updateProduct(productId, req.body, req.files || []);
    if(!updatedProduct) {
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
});
export const disableProduct = catchAsync(async (req, res) => {
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
});
export const enableProduct = catchAsync(async (req, res) => {
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
});