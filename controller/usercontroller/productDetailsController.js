import * as productService from "../../service/user/productService.js";
import * as wishlistService from "../../service/user/wishlistService.js";
import catchAsync from "../../utilities/catchAsync.js";

export const getProductDetail = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { product, relatedProducts } = await productService.getProductDetail(id);
    
    let isInWishlist = false;
    if (req.session.user) {
        const wishlist = await wishlistService.getWishlist(req.session.user._id);
        isInWishlist = wishlist.products.some(p => p._id.toString() === id);
    }

    if (!product || !product.isListed) {
        return res.render("user/product-detail", {
            title:'KISO',
            product: null,
            relatedProducts,
            isUnavailable: true,
            isInWishlist: false
        });
    }

    res.render("user/product-detail", {
        title: `${product.productName} - KISO`,
        product,
        relatedProducts,
        isUnavailable:false,
        isInWishlist
    });
});
