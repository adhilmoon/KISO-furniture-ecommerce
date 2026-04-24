import * as productService from "../../service/user/productService.js";
import { STATUS_CODES } from "../../constants/index.js";
import catchAsync from "../../utilities/catchAsync.js";

export const getProductDetail = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { product, relatedProducts } = await productService.getProductDetail(id);

    res.render("user/product-detail", {
        title: `${product.productName} - KISO`,
        product,
        relatedProducts,
    });
});
