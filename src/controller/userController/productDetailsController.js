import * as productService from "../../service/user/productService.js";
import * as wishlistService from "../../service/user/wishlistService.js";
import catchAsync from "../../utilities/catchAsync.js";
import sanitizeHtml from "sanitize-html";

const DESCRIPTION_SANITIZE_OPTS = {
    allowedTags: ['p', 'br', 'b', 'i', 'em', 'strong', 'u', 'ul', 'ol', 'li', 'h2', 'h3', 'h4', 'a', 'span', 'div'],
    allowedAttributes: {
        a: ['href', 'title', 'target', 'rel'],
        '*': []
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: {
        a: (tagName, attribs) => ({
            tagName,
            attribs: { ...attribs, rel: 'noopener noreferrer nofollow', target: '_blank' }
        })
    }
};

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

    if (product && typeof product.description === 'string') {
        product.description = sanitizeHtml(product.description, DESCRIPTION_SANITIZE_OPTS);
    }

    res.render("user/product-detail", {
        title: `${product.productName} - KISO`,
        product,
        relatedProducts,
        isUnavailable:false,
        isInWishlist
    });
});
