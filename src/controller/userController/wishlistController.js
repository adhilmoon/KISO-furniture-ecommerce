import * as wishlistService from "../../service/user/wishlistService.js";
import { STATUS_CODES } from "../../constants/index.js";
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
    const { productId, variantIndex = 0 } = req.body;

    const { action } = await wishlistService.toggleWishlist(userId, productId, parseInt(variantIndex) || 0);

    const message = action === "added"
        ? "Added to wishlist"
        : action === "in_cart"
            ? "This variant is already in your cart"
            : "Removed from wishlist";

    res.status(STATUS_CODES.OK).json({ success: true, message, action });
});

export const removeItem = catchAsync(async (req, res) => {
    const userId = req.session.user._id;
    const { productId } = req.params;
    const variantIndex = req.query.variantIndex != null ? parseInt(req.query.variantIndex) : null;

    await wishlistService.removeFromWishlist(userId, productId, variantIndex);
    res.status(STATUS_CODES.OK).json({ success: true, message: "Removed from wishlist" });
});

export const addAllToCart = catchAsync(async (req, res) => {
    const userId = req.session.user._id;
    const results = await wishlistService.addAllToCart(userId);
    res.status(STATUS_CODES.OK).json({ success: true, results });
});
