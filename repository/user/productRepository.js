import Product from "../../model/Product.js";

export const findProductById = async (id) => {
    const product = await Product.findOne({_id: id, isListed: true})
        .populate({
            path: "category",
            match: {isActive: true},
            select: "categoryName"
        }).lean();
    
  
    if (product && !product.category) return null;
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
