import * as cartService from "../../service/user/cartService.js";
import { STATUS_CODES, MESSAGES } from "../../constants/index.js";
import catchAsync from "../../utilities/catchAsync.js";

export const getCartPage = catchAsync(async (req, res) => {
    const userId = req.session.user._id;
    const cart = await cartService.getCart(userId);
    
    res.render("user/cart", {
        title: "Your Cart - KISO",
        cart,
    });
});

export const addToCart = catchAsync(async (req, res) => {
    const userId = req.session.user._id;
    const { productId, variantIndex, quantity } = req.body;

    const cart = await cartService.addToCart(userId, productId, parseInt(variantIndex) || 0, parseInt(quantity) || 1);

    res.status(STATUS_CODES.OK).json({ success: true, message: MESSAGES.ADDED_TO_CART, cart });
});

export const updateQuantity = catchAsync(async (req, res) => {
    const userId = req.session.user._id;
    const { itemId } = req.params;
    const { quantity } = req.body;

    const cart = await cartService.updateQty(userId, itemId, parseInt(quantity));

    res.status(STATUS_CODES.OK).json({ success: true, message: MESSAGES.CART_UPDATED, cart });
});

export const removeItem = catchAsync(async (req, res) => {
    const userId = req.session.user._id;
    const { itemId } = req.params;

    const cart = await cartService.removeItem(userId, itemId);

    res.status(STATUS_CODES.OK).json({ success: true, message: MESSAGES.ITEM_REMOVED, cart });
});

export const clearCart = catchAsync(async (req, res) => {
    const userId = req.session.user._id;
    await cartService.clearCart(userId);

    res.status(STATUS_CODES.OK).json({ success: true, message: MESSAGES.CART_CLEARED });
});
