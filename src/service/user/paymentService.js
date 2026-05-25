import crypto from 'crypto';
import * as cartService from './cartService.js';
import * as orderRepository from '../../repository/user/orderRepository.js';
import * as productRepository from '../../repository/user/productRepository.js';
import { userRepository } from '../../repository/user/userRepository.js';
import * as couponService from './couponService.js';
import * as walletService from './walletService.js';
import * as offerService from './offerService.js';

export const verifyRazorpaySignature = (razorpayOrderId, paymentId, signature) => {
    if (typeof signature !== 'string') return false;
    const sign = `${razorpayOrderId}|${paymentId}`;
    const expected = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(sign)
        .digest('hex');
    const expectedBuf = Buffer.from(expected, 'hex');
    let sigBuf;
    try {
        sigBuf = Buffer.from(signature, 'hex');
    } catch {
        return false;
    }
    if (expectedBuf.length !== sigBuf.length) return false;
    return crypto.timingSafeEqual(expectedBuf, sigBuf);
};

/** Thrown when cart contents fail inventory checks. Carries a per-item `issues` array. */
export class CheckoutInventoryError extends Error {
    constructor(issues, message = 'Some items in your cart are no longer available') {
        super(message);
        this.status = 400;
        this.issues = issues;
        this.name = 'CheckoutInventoryError';
    }
}

const inspectCartItem = (item) => {
    const product = item.productId;
    const variant = product?.variants?.[item.variantIndex];
    const isListed = product?.isListed && (!product?.category || product.category.isActive);

    if (!product || !isListed) {
        return {
            issue: {
                productName: product?.productName || 'Item',
                code: 'unavailable',
                message: `${product?.productName || 'An item'} is no longer available.`
            }
        };
    }
    if (!variant || variant.stock <= 0) {
        return {
            issue: {
                productName: product.productName,
                code: 'out_of_stock',
                message: `${product.productName} is out of stock.`
            }
        };
    }
    if (item.quantity > variant.stock) {
        return {
            product,
            variant,
            issue: {
                productName: product.productName,
                code: 'exceeds_stock',
                available: variant.stock,
                requested: item.quantity,
                message: `Only ${variant.stock} unit(s) of ${product.productName} available (you requested ${item.quantity}).`
            }
        };
    }
    return { product, variant };
};

const enrichItem = async (product, variant, item, qty) => {
    const categoryId = product.category?._id || product.category;
    const { offer, discount, effectivePrice } = await offerService.getBestOfferForProduct({
        productId: product._id,
        categoryId,
        basePrice: variant.price
    });
    return {
        productId: product._id,
        variantIndex: item.variantIndex,
        quantity: qty,
        price: effectivePrice,
        originalPrice: variant.price,
        offerDiscount: discount,
        offerId: offer?._id || undefined,
        status: 'processing'
    };
};

/**
 * Preview-only: silently caps quantities to available stock and skips
 * unavailable items. Used by checkout/payment page renders.
 */
export const buildValidOrderItems = async (cartItems) => {
    const items = [];
    for (const item of cartItems) {
        const insp = inspectCartItem(item);
        if (!insp.product || !insp.variant) continue;
        const qty = Math.min(item.quantity, insp.variant.stock);
        items.push(await enrichItem(insp.product, insp.variant, item, qty));
    }
    return items;
};

/**
 * Strict: throws CheckoutInventoryError if ANY cart item is unavailable,
 * out of stock, or exceeds available stock. Used right before placing an order.
 */
export const validateCheckoutItems = async (cartItems) => {
    const issues = [];
    const valid = [];
    for (const item of cartItems) {
        const insp = inspectCartItem(item);
        if (insp.issue) {
            issues.push(insp.issue);
            continue;
        }
        valid.push({ product: insp.product, variant: insp.variant, item });
    }
    if (issues.length > 0) throw new CheckoutInventoryError(issues);
    if (valid.length === 0) throw Object.assign(new Error('No valid items to place order'), { status: 400 });

    const items = [];
    for (const { product, variant, item } of valid) {
        items.push(await enrichItem(product, variant, item, item.quantity));
    }
    return items;
};

/**
 * Atomically decrements stock for every order item. If any decrement fails
 * (concurrent purchase emptied stock), rolls back already-applied decrements
 * and throws CheckoutInventoryError. Guarantees no over-selling.
 */
const reserveStock = async (orderItems) => {
    const decremented = [];
    for (const item of orderItems) {
        const ok = await productRepository.tryDecrementVariantStock(item.productId, item.variantIndex, item.quantity);
        if (!ok) {
            for (const d of decremented) {
                await productRepository.updateVariantStock(d.productId, d.variantIndex, d.quantity);
            }
            throw new CheckoutInventoryError(
                [{ code: 'race_lost', message: 'Stock for one of your items changed while placing the order. Please review your cart.' }],
                'Stock changed during checkout. Please review your cart.'
            );
        }
        decremented.push(item);
    }
};

export const createOrder = async (userId, addressId, orderItems, paymentMethod, paymentStatus, appliedCoupon = null, useWallet = false, { skipCartClear = false } = {}) => {
    const address = await userRepository.findAddressById(addressId);
    if (!address) throw Object.assign(new Error('Address not found'), { status: 400 });

    await reserveStock(orderItems);

    const subtotal = orderItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

    let couponId, couponCode, couponDiscount = 0;
    if (appliedCoupon && appliedCoupon.couponId) {
        couponId = appliedCoupon.couponId;
        couponCode = appliedCoupon.code;
        couponDiscount = Math.min(appliedCoupon.discount || 0, subtotal);
    }
    const grandTotal = Math.max(subtotal - couponDiscount, 0);

    let walletPaid = 0;
    let finalPaymentMethod = paymentMethod;
    let finalPaymentStatus = paymentStatus;
    if (useWallet && grandTotal > 0) {
        const balance = await walletService.getBalance(userId);
        walletPaid = Math.min(balance, grandTotal);
        if (walletPaid >= grandTotal) {
            finalPaymentMethod = 'wallet';
            finalPaymentStatus = 'paid';
        }
    }

    let order;
    try {
        order = await orderRepository.createOrder({
            userId,
            shippingAddress: {
                name: address.fullName,
                phone: address.mobile,
                streetAddress: address.houseName,
                city: address.city,
                state: address.state,
                pincode: address.pincode,
                addressType: address.type?.toLowerCase() || 'home'
            },
            orderItems,
            subtotal,
            shippingCost: 0,
            discount: couponDiscount,
            couponId,
            couponCode,
            couponDiscount,
            walletPaid,
            grandTotal,
            orderStatus: 'confirmed',
            paymentMethod: finalPaymentMethod,
            paymentStatus: finalPaymentStatus
        });
    } catch (err) {
        for (const item of orderItems) {
            await productRepository.updateVariantStock(item.productId, item.variantIndex, item.quantity);
        }
        throw err;
    }

    if (walletPaid > 0) {
        await walletService.debitWallet(userId, walletPaid, 'checkout_pay', {
            orderId: order._id,
            description: `Payment for order ${order.orderId || order._id}`
        });
    }

    if (couponId) {
        await couponService.recordUsage(couponId, userId, order._id);
    }

    if (!skipCartClear) await cartService.clearCart(userId);
    return order;
};

export const getOrderConfirmation = async (orderId, userId) =>
    orderRepository.findOrderWithItems(orderId, userId);

export const getPaymentPageData = async (userId, addressId) => {
    const [cart, address] = await Promise.all([
        cartService.getCart(userId),
        userRepository.findAddressById(addressId)
    ]);
    return { cart, address };
};
