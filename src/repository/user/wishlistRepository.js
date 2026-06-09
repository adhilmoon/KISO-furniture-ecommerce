import Wishlist from "../../model/Wishlist.js";

export const findByUserId = async (userId) =>
    Wishlist.findOne({ userId })
        .populate({
            path: 'items.productId',
            populate: { path: 'category' }
        })
        .lean();

export const findOneByUserId = async (userId) =>
    Wishlist.findOne({ userId });

export const createWishlist = async (userId, items = []) =>
    Wishlist.create({ userId, items });
