import * as wishlistService from "../../service/user/wishlistService.js";
import { STATUS_CODES, MESSAGES } from "../../constants/index.js";
import catchAsync from "../../utilities/catchAsync.js";

export const getWishlistPage = catchAsync(async (req, res) => {
    const userId = req.session.user._id;
    const wishlist = await wishlistService.getWishlist(userId);

    res.render("user/wishlist", {
        title: "My Wishlist - KISO",
        wishlist,
    });
});

export const toggleWishlist = catchAsync(async (req, res) => {
    const userId = req.session.user._id;
    const { productId } = req.body;

    const { action } = await wishlistService.toggleWishlist(userId, productId);

    const message = action === "added"
        ? "Product added to wishlist"
        : action === "in_cart"
        ? "This product is already in your cart"
        : "Product removed from wishlist";

    res.status(STATUS_CODES.OK).json({
        success: true,
        message,
        action
    });
});

export const removeItem = catchAsync(async (req, res) => {
    const userId = req.session.user._id;
    const { productId } = req.params;

    await wishlistService.removeFromWishlist(userId, productId);

    res.status(STATUS_CODES.OK).json({
        success: true,
        message: "Removed from wishlist"
    });
});

export const addAllToCart = catchAsync(async (req, res) => {
    const userId = req.session.user._id;
    const results = await wishlistService.addAllToCart(userId);

    res.status(STATUS_CODES.OK).json({
        success: true,
        results
    });
});
