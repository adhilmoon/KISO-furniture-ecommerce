import Wishlist from "../../model/Wishlist.js";

export const findByUserId = async (userId) => {
    return await Wishlist.findOne({ userId })
        .populate({
            path: 'products',
            populate: { path: 'category' }
        })
        .lean();
};

export const createWishlist = async (userId, products = []) => {
    return await Wishlist.create({ userId, products });
};

export const updateWishlistProducts = async (userId, products) => {
    return await Wishlist.findOneAndUpdate(
        { userId },
        { products },
        { new: true, upsert: true }
    ).populate({
        path: 'products',
        populate: { path: 'category' }
    }).lean();
};

export const findOneByUserId = async (userId) => {
    return await Wishlist.findOne({ userId });
};
