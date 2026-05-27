import * as cartService from '../../service/user/cartService.js';
import * as profileService from '../../service/user/profileService.js';
import * as walletService from '../../service/user/walletService.js';
import * as offerService from '../../service/user/offerService.js';
import * as buyNowService from '../../service/user/buyNowService.js';
import { STATUS_CODES, MESSAGES } from '../../constants/index.js';
import catchAsync from '../../utilities/catchAsync.js';


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
    const instantBuy = req.session.instantBuy;

    let cart;
    if (instantBuy) {
        try {
            cart = await buyNowService.buildInstantBuyCart(instantBuy);
        } catch (err) {
            buyNowService.clearInstantBuy(req);
            if (req.xhr) return res.json({ success: false, message: err.message });
            return res.redirect(`/user/product/${instantBuy.productId}?error=${encodeURIComponent(err.message)}`);
        }
    } else {
        cart = await cartService.getCart(userId);
    }

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
        const categoryId = product.category?._id || product.category;
        const { offer, discount, effectivePrice } = await offerService.getBestOfferForProduct({
            productId: product._id,
            categoryId,
            basePrice: variant.price
        });
        validItems.push({
            ...item,
            quantity: purchaseQty,
            price: effectivePrice,
            originalPrice: variant.price,
            offerDiscount: discount,
            offerName: offer?.name || null
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
    const addresses = await profileService.getAddresses(userId);

    const appliedCoupon = req.session.appliedCoupon || null;
    const couponDiscount = appliedCoupon ? Math.min(appliedCoupon.discount || 0, totalAmount) : 0;
    const finalAmount = Math.max(totalAmount - couponDiscount, 0);
    const walletBalance = await walletService.getBalance(userId);

    res.render("user/checkout", {
        title: "Checkout - KISO",
        cart: { ...cart, items: validItems, totalAmount },
        addresses,
        appliedCoupon,
        couponDiscount,
        finalAmount,
        walletBalance,
        user: req.session.user,
        isInstantBuy: !!instantBuy
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

// Returns fresh nav badge counts (computed by the injectUserBadges middleware
// into res.locals). Used by the client to update header badges in-place.
export const getBadgeCounts = (req, res) => {
    res.status(STATUS_CODES.OK).json({
        success: true,
        cartCount: res.locals.cartCount || 0,
        wishlistCount: res.locals.wishlistCount || 0
    });
};
