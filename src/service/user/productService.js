import * as productRepository from "../../repository/user/productRepository.js";

export const getProductDetail = async (productId) => {
    const product = await productRepository.findProductById(productId);
    // Missing/invalid product is not an error — the controller renders a
    // graceful "Product Unavailable" page when product is null.
    if (!product) return { product: null, relatedProducts: [] };

    const categoryId = product.category?._id || null;
    const relatedProducts = categoryId 
        ? await productRepository.findRelatedProducts(categoryId, product._id)
        : [];
    
    return { product, relatedProducts };
};
