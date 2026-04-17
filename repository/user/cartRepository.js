import Cart from "../../model/Cart.js";

export const findByUserId = async (userId) => {
    return await Cart.findOne({ userId }).populate("items.productId").lean({ virtuals: true });
};

export const createCart = async (userId, items = []) => {
    return await Cart.create({ userId, items });
};

export const updateCartItems = async (userId, items) => {
    return await Cart.findOneAndUpdate(
        { userId },
        { items },
        { new: true }
    ).populate("items.productId").lean({ virtuals: true });
};

export const removeCart = async (userId) => {
    return await Cart.findOneAndDelete({ userId });
};
