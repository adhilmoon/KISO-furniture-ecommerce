import * as cartService from "../../service/user/cartService.js";
import { STATUS_CODES, MESSAGES } from "../../constants/index.js";
import logger from "../../utilities/logger.js";

export const getCartPage = async (req, res) => {
    try {
        const userId = req.session.user._id;
        const cart = await cartService.getCart(userId);
        
        res.render("user/cart", {
            title: "Your Cart - KISO",
            cart,
        });
    } catch (error) {
        logger.error(`Error loading cart page: ${error.message}`);
        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).render("404", { title: "Error" });
    }
};

export const addToCart = async (req, res) => {
    try {
        const userId = req.session.user._id;
        const { productId, variantIndex, quantity } = req.body;

        const cart = await cartService.addToCart(userId, productId, parseInt(variantIndex) || 0, parseInt(quantity) || 1);

        res.status(STATUS_CODES.OK).json({ success: true, message: MESSAGES.ADDED_TO_CART, cart });
    } catch (error) {
        logger.error(`Add to cart error: ${error.message}`);
        res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: error.message });
    }
};

export const updateQuantity = async (req, res) => {
    try {
        const userId = req.session.user._id;
        const { itemId } = req.params;
        const { quantity } = req.body;

        const cart = await cartService.updateQty(userId, itemId, parseInt(quantity));

        res.status(STATUS_CODES.OK).json({ success: true, message: MESSAGES.CART_UPDATED, cart });
    } catch (error) {
        logger.error(`Update cart qty error: ${error.message}`);
        res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: error.message });
    }
};

export const removeItem = async (req, res) => {
    try {
        const userId = req.session.user._id;
        const { itemId } = req.params;

        const cart = await cartService.removeItem(userId, itemId);

        res.status(STATUS_CODES.OK).json({ success: true, message: MESSAGES.ITEM_REMOVED, cart });
    } catch (error) {
        logger.error(`Remove cart item error: ${error.message}`);
        res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: error.message });
    }
};

export const clearCart = async (req, res) => {
    try {
        const userId = req.session.user._id;
        await cartService.clearCart(userId);

        res.status(STATUS_CODES.OK).json({ success: true, message: MESSAGES.CART_CLEARED });
    } catch (error) {
        logger.error(`Clear cart error: ${error.message}`);
        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
    }
};
