import * as productRepository from "../../repository/user/productRepository.js";

export const getProductDetail = async (productId) => {
    const product = await productRepository.findProductById(productId);
    if (!product) throw new Error("Product not found");

    const categoryId = product.category?._id || null;
    const relatedProducts = categoryId 
        ? await productRepository.findRelatedProducts(categoryId, product._id)
        : [];
    
    return { product, relatedProducts };
};
