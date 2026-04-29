import * as wishlistRepository from "../../repository/user/wishlistRepository.js";
import Product from "../../model/Product.js";

export const getWishlist = async (userId) => {
    let wishlist = await wishlistRepository.findByUserId(userId);
    if (!wishlist) {
        wishlist = await wishlistRepository.createWishlist(userId, []);
    }
    
    wishlist.products = wishlist.products.filter(product => {
        return product.isListed && (!product.category || product.category.isActive);
    });

    return wishlist;
};

export const toggleWishlist = async (userId, productId) => {
    let wishlist = await wishlistRepository.findOneByUserId(userId);
    if (!wishlist) {
        wishlist = await wishlistRepository.createWishlist(userId, []);
    }

    const product = await Product.findById(productId).populate('category');
    if (!product || !product.isListed || (product.category && !product.category.isActive)) {
        throw new Error("Product is not available");
    }

    const productIndex = wishlist.products.indexOf(productId);
    let action = "";

    if (productIndex > -1) {
        wishlist.products.splice(productIndex, 1);
        action = "removed";
    } else {
        wishlist.products.push(productId);
        action = "added";
    }

    await wishlist.save();
    return { action, wishlist };
};

export const removeFromWishlist = async (userId, productId) => {
    const wishlist = await wishlistRepository.findOneByUserId(userId);
    if (wishlist) {
        wishlist.products = wishlist.products.filter(id => id.toString() !== productId.toString());
        await wishlist.save();
    }
};

export const addAllToCart = async (userId) => {
    const wishlist = await getWishlist(userId);
    const results = {
        added: 0,
        skipped: {
            outOfStock: 0,
            limitReached: 0,
            unavailable: 0
        },
        total: wishlist.products.length
    };

    if (wishlist.products.length === 0) return results;

    const { addToCart } = await import("./cartService.js");

    for (const product of wishlist.products) {
        try {
    
            const variantIndex = product.variants ? product.variants.findIndex(v => v.stock > 0) : -1;
            
            if (variantIndex === -1) {
                results.skipped.outOfStock++;
                continue;
            }

            await addToCart(userId, product._id, variantIndex, 1);
            results.added++;
        } catch (error) {
            if (error.message.includes("Maximum 3 units allowed")) {
                results.skipped.limitReached++;
            } else if (error.message.includes("Not enough stock")) {
                results.skipped.outOfStock++;
            } else {
                results.skipped.unavailable++;
            }
        }
    }

    return results;
};
