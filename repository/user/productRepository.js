import Product from "../../model/Product.js";

export const findProductById = async (id) => {
    const product = await Product.findOne({_id: id})
        .populate({
            path: "category",
            select: "categoryName isActive"
        }).lean();
    
    if (product) {
        if (!product.category || !product.category.isActive) {
            product.isListed = false;
        }
    }
    
    return product;
};

export const findRelatedProducts = async (categoryId, excludeId, limit = 4) => {
    return await Product.find({
        category: categoryId,
        isListed: true,
        _id: { $ne: excludeId },
    })
    .limit(limit)
    .lean();
};
