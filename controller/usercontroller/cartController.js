import * as cartService from "../../service/user/cartService.js";
import { STATUS_CODES } from "../../constants/statusCodes.js";

export const getCartPage = async (req, res) => {
    try {
        const userId = req.session.user._id;
        const cart = await cartService.getCart(userId);
        
        res.render("user/cart", {
            title: "Your Cart - KISO",
            cart,
        });
    } catch (error) {
        console.error("Error loading cart page:", error);
        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).render("404", { title: "Error" });
    }
};

export const addToCart = async (req, res) => {
    try {
        const userId = req.session.user._id;
        const { productId, variantIndex, quantity } = req.body;

        const cart = await cartService.addToCart(userId, productId, parseInt(variantIndex) || 0, parseInt(quantity) || 1);

        res.status(STATUS_CODES.OK).json({ success: true, message: "Added to cart", cart });
    } catch (error) {
        console.error("Add to cart error:", error);
        res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: error.message });
    }
};

export const updateQuantity = async (req, res) => {
    try {
        const userId = req.session.user._id;
        const { itemId } = req.params;
        const { quantity } = req.body;

        const cart = await cartService.updateQty(userId, itemId, parseInt(quantity));

        res.status(STATUS_CODES.OK).json({ success: true, message: "Cart updated", cart });
    } catch (error) {
        console.error("Update cart qty error:", error);
        res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: error.message });
    }
};

export const removeItem = async (req, res) => {
    try {
        const userId = req.session.user._id;
        const { itemId } = req.params;

        const cart = await cartService.removeItem(userId, itemId);

        res.status(STATUS_CODES.OK).json({ success: true, message: "Item removed", cart });
    } catch (error) {
        console.error("Remove cart item error:", error);
        res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: error.message });
    }
};

export const clearCart = async (req, res) => {
    try {
        const userId = req.session.user._id;
        await cartService.clearCart(userId);

        res.status(STATUS_CODES.OK).json({ success: true, message: "Cart cleared" });
    } catch (error) {
        console.error("Clear cart error:", error);
        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
    }
};
