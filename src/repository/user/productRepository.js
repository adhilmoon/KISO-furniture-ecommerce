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
    return Product.find({
        category: categoryId,
        isListed: true,
        _id: { $ne: excludeId },
        variants: { $exists: true, $not: { $size: 0 } }
    }).limit(limit).lean();
};

export const updateVariantStock = async (productId, variantIndex, delta) =>
    Product.updateOne(
        { _id: productId },
        { $inc: { [`variants.${variantIndex}.stock`]: delta } }
    );


export const tryDecrementVariantStock = async (productId, variantIndex, qty) => {
    const result = await Product.updateOne(
        {
            _id: productId,
            isListed: true,
            [`variants.${variantIndex}.stock`]: { $gte: qty }
        },
        { $inc: { [`variants.${variantIndex}.stock`]: -qty } }
    );
    return result.modifiedCount === 1;
};
