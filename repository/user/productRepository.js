import Product from "../../model/Product.js";

export const findProductById = async (id) => {
    return await Product.findById(id).populate("category", "categoryName").lean();
};

export const findRelatedProducts = async (categoryId, excludeId, limit = 4) => {
    return await Product.find({
        category: categoryId,
        _id: { $ne: excludeId },
        // isListed: true // skipping for now based on store logic update
    })
    .limit(limit)
    .lean();
};
