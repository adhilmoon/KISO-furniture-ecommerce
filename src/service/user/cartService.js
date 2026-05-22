import * as cartRepository from "../../repository/user/cartRepository.js";
import * as productRepository from "../../repository/user/productRepository.js";
import * as wishlistService from "./wishlistService.js";
import { CART } from "../../constants/index.js";

const { MAX_PER_USER } = CART;

const computeTotalAmount = (items = []) =>
    items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 0), 0);

const withTotal = (cart) => {
    if (!cart) return cart;
    const items = Array.isArray(cart.items) ? cart.items : [];
    return { ...cart, totalAmount: computeTotalAmount(items) };
};

export const getCart = async (userId) => {
    let cart = await cartRepository.findByUserId(userId);
    if (!cart) {
        cart = await cartRepository.createCart(userId, []);
    }
    return withTotal(cart);
};

export const addToCart = async (userId, productId, variantIndex, quantity) => {
    let cart = await cartRepository.findByUserId(userId);
    if (!cart) {
        cart = await cartRepository.createCart(userId, []);
    }

    const product = await productRepository.findProductById(productId);
    if (!product || !product.isListed) throw new Error("Product not available");

    const price = product.variants && product.variants.length > 0 
                  ? product.variants[variantIndex]?.price 
                  : product.basePrice;

    if (!price) throw new Error("Invalid variant or price");

    const stock = product.variants && product.variants.length > 0 
                  ? product.variants[variantIndex]?.stock 
                  : 0;

    const existingItemIndex = cart.items.findIndex(
        item => item.productId != null && String(item.productId._id ?? item.productId) === String(productId) && item.variantIndex === variantIndex
    );

    let currentCartQty = 0;
    if (existingItemIndex > -1) {
        currentCartQty = cart.items[existingItemIndex].quantity;
    }

    if (currentCartQty + quantity > stock) {
        throw new Error("Not enough stock available");
    }

    if (currentCartQty + quantity > MAX_PER_USER) {
        throw new Error(`Maximum ${MAX_PER_USER} units allowed per user`);
    }

    if (existingItemIndex > -1) {
        cart.items[existingItemIndex].quantity += quantity;
    } else {
        cart.items.push({ productId, variantIndex, quantity, price });
    }

    const updatedCart = await cartRepository.updateCartItems(userId, cart.items);
    await wishlistService.removeFromWishlist(userId, productId, variantIndex);
    return withTotal(updatedCart);
};

export const updateQty = async (userId, itemId, newQty) => {
    const cart = await cartRepository.findByUserId(userId);
    if (!cart) throw new Error("Cart not found");

    const itemIndex = cart.items.findIndex(item => String(item._id) === String(itemId));
    if (itemIndex > -1) {
        const item = cart.items[itemIndex];
        const product = await productRepository.findProductById(item.productId._id);
        if (!product || !product.isListed) throw new Error("Product not available");
        
        const stock = product.variants && product.variants.length > 0
                      ? product.variants[item.variantIndex]?.stock
                      : 0;
                      
        if (newQty > stock) {
            throw new Error("Not enough stock available");
        }

        if (newQty > MAX_PER_USER) {
            throw new Error(`Maximum ${MAX_PER_USER} units allowed per user`);
        }

        cart.items[itemIndex].quantity = newQty;
        const updated = await cartRepository.updateCartItems(userId, cart.items);
        return withTotal(updated);
    }
    throw new Error("Item not found in cart");
};

export const removeItem = async (userId, itemId) => {
    const cart = await cartRepository.findByUserId(userId);
    if (!cart) throw new Error("Cart not found");

    const newItems = cart.items.filter(item => String(item._id) !== String(itemId));
    const updated = await cartRepository.updateCartItems(userId, newItems);
    return withTotal(updated);
};

export const clearCart = async (userId) => {
    return await cartRepository.removeCart(userId);
};
