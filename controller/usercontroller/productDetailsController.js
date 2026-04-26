import * as productService from "../../service/user/productService.js";
import catchAsync from "../../utilities/catchAsync.js";

export const getProductDetail = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { product, relatedProducts } = await productService.getProductDetail(id);
    if (!product || !product.isListed) {
    return res.render("user/product-detail", {
        title:'KISO',
        product: null,
        relatedProducts,
        isUnavailable: true
    });
}

   res.render("user/product-detail", {
        title: `${product.productName} - KISO`,
        product,
        relatedProducts,
        isUnavailable:false,
    });
});
