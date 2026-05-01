import * as cartService from "../../service/user/cartService.js";
import {STATUS_CODES, MESSAGES} from "../../constants/index.js";
import catchAsync from "../../utilities/catchAsync.js";
import Address from "../../model/Address.js";


export const getCartPage = catchAsync(async (req, res) => {
    const userId = req.session.user._id;
    const cart = await cartService.getCart(userId);

    res.render("user/cart", {
        title: "Your Cart - KISO",
        cart,
    });
});

export const getCheckoutPage = catchAsync(async (req, res) => {
    const userId = req.session.user._id;
    const cart = await cartService.getCart(userId);

    if (!cart || !cart.items || cart.items.length === 0) {
        if (req.xhr) return res.json({ success: false, message: MESSAGES.CART_IS_EMPTY });
        return res.redirect("/user/cart");
    }

    const validItems = [];
    const invalidItems = [];

    for (const item of cart.items) {
        const product = item.productId;
        const variant = product?.variants?.[item.variantIndex];
        const isProductListed = product?.isListed && (!product?.category || product.category.isActive);

        if (!product || !isProductListed) {
            invalidItems.push(`${product?.productName || 'An item'} is no longer available.`);
            continue;
        }

        if (!variant || variant.stock <= 0) {
            invalidItems.push(`${product.productName} is currently out of stock.`);
            continue;
        }

        const purchaseQty = Math.min(item.quantity, variant.stock);
        validItems.push({
            ...item,
            quantity: purchaseQty,
            price: variant.price 
        });
    }

    if (req.xhr) {
        if (validItems.length === 0) {
            return res.json({ success: false, message: "No valid items in your cart to checkout." });
        }
        // Proceed even if some items are invalid, but return the list so frontend can warn the user
        return res.json({ 
            success: true, 
            redirectUrl: "/user/checkout",
            invalidItems: invalidItems 
        });
    }

    if (validItems.length === 0) return res.redirect("/user/cart");

    const totalAmount = validItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const addresses = await Address.find({ userId }).sort({ isDefault: -1, createdAt: -1 });

    res.render("user/checkout", {
        title: "Checkout - KISO",
        cart: { ...cart, items: validItems, totalAmount },
        addresses,
        user: req.session.user
    });
});

export const addToCart = catchAsync(async (req, res) => {
    const userId = req.session.user._id;
    const {productId, variantIndex, quantity} = req.body;

    const cart = await cartService.addToCart(userId, productId, parseInt(variantIndex) || 0, parseInt(quantity) || 1);

    res.status(STATUS_CODES.OK).json({success: true, message: MESSAGES.ADDED_TO_CART, cart});
});

export const updateQuantity = catchAsync(async (req, res) => {
    const userId = req.session.user._id;
    const {itemId} = req.params;
    const {quantity} = req.body;

    const cart = await cartService.updateQty(userId, itemId, parseInt(quantity));

    res.status(STATUS_CODES.OK).json({success: true, message: MESSAGES.CART_UPDATED, cart});
});

export const removeItem = catchAsync(async (req, res) => {
    const userId = req.session.user._id;
    const {itemId} = req.params;

    const cart = await cartService.removeItem(userId, itemId);

    res.status(STATUS_CODES.OK).json({success: true, message: MESSAGES.ITEM_REMOVED, cart});
});

export const clearCart = catchAsync(async (req, res) => {
    const userId = req.session.user._id;
    await cartService.clearCart(userId);

    res.status(STATUS_CODES.OK).json({success: true, message: MESSAGES.CART_CLEARED});
});
