import * as wishlistRepository from "../../repository/user/wishlistRepository.js";
import Product from "../../model/Product.js";
import * as cartRepository from "../../repository/user/cartRepository.js";
import logger from "../../utilities/logger.js";

const buildKey = (productId, variantIndex) => `${productId}_${variantIndex}`;

const enrichItems = (items, cartKeys) =>
    items.map((it) => {
        const product = it.productId;
        if (!product) return null;
        const variant = product.variants?.[it.variantIndex] || null;
        const isListed = product.isListed && (!product.category || product.category.isActive);
        if (!isListed) return null;
        return {
            _id: it._id,
            productId: product._id,
            variantIndex: it.variantIndex,
            product,
            variant,
            isInCart: cartKeys.has(buildKey(String(product._id), it.variantIndex))
        };
    }).filter(Boolean);

export const getWishlist = async (userId) => {
    let [wishlist, cart] = await Promise.all([
        wishlistRepository.findByUserId(userId),
        cartRepository.findByUserId(userId)
    ]);

    if (!wishlist) {
        wishlist = await wishlistRepository.createWishlist(userId, []);
        wishlist = wishlist.toObject ? wishlist.toObject() : wishlist;
    }

    const cartKeys = new Set(
        (cart?.items || [])
            .filter((i) => i.productId != null)
            .map((i) => buildKey(String(i.productId._id ?? i.productId), i.variantIndex))
    );

    return {
        ...wishlist,
        items: enrichItems(wishlist.items || [], cartKeys),
    };
};

export const toggleWishlist = async (userId, productId, variantIndex = 0) => {
    let wishlist = await wishlistRepository.findOneByUserId(userId);
    if (!wishlist) wishlist = await wishlistRepository.createWishlist(userId, []);

    const product = await Product.findById(productId).populate('category');
    if (!product || !product.isListed || (product.category && !product.category.isActive)) {
        throw new Error("Product is not available");
    }
    if (!product.variants?.[variantIndex]) {
        throw new Error("Variant not available");
    }

    const cart = await cartRepository.findByUserId(userId);
    const isInCart = (cart?.items || []).some(
        (item) =>
            item.productId != null &&
            String(item.productId._id ?? item.productId) === String(productId) &&
            item.variantIndex === variantIndex
    );
    if (isInCart) return { action: "in_cart", wishlist };

    const existing = wishlist.items.findIndex(
        (it) => String(it.productId) === String(productId) && it.variantIndex === variantIndex
    );

    let action;
    if (existing > -1) {
        wishlist.items.splice(existing, 1);
        action = "removed";
    } else {
        wishlist.items.push({ productId, variantIndex });
        action = "added";
    }
    await wishlist.save();
    return { action, wishlist };
};

export const removeFromWishlist = async (userId, productId, variantIndex) => {
    const wishlist = await wishlistRepository.findOneByUserId(userId);
    if (!wishlist) return;
    wishlist.items = wishlist.items.filter((it) => {
        if (String(it.productId) !== String(productId)) return true;
        if (variantIndex == null) return false;
        return it.variantIndex !== Number(variantIndex);
    });
    await wishlist.save();
};

export const addAllToCart = async (userId) => {
    const wishlist = await getWishlist(userId);
    const results = {
        added: 0,
        skipped: { outOfStock: 0, limitReached: 0, unavailable: 0 },
        total: wishlist.items.length
    };
    if (wishlist.items.length === 0) return results;

    const { addToCart } = await import("./cartService.js");

    for (const it of wishlist.items) {
        try {
            if (!it.variant || it.variant.stock <= 0) {
                results.skipped.outOfStock++;
                continue;
            }
            await addToCart(userId, it.product._id, it.variantIndex, 1);
            results.added++;
        } catch (error) {
            if (error.message.includes("Maximum 3 units allowed")) {
                results.skipped.limitReached++;
            } else if (error.message.includes("Not enough stock")) {
                results.skipped.outOfStock++;
            } else {
                logger.error(`wishlist→cart move failed for user ${userId}: ${error.message}`);
                results.skipped.unavailable++;
            }
        }
    }
    return results;
};
