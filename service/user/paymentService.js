import crypto from 'crypto';
import * as cartService from './cartService.js';
import * as orderRepository from '../../repository/user/orderRepository.js';
import * as productRepository from '../../repository/user/productRepository.js';
import { userRepository } from '../../repository/user/userRepository.js';
import * as couponService from './couponService.js';
import * as walletService from './walletService.js';

export const verifyRazorpaySignature = (razorpayOrderId, paymentId, signature) => {
    const sign = `${razorpayOrderId}|${paymentId}`;
    const expected = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(sign)
        .digest('hex');
    return signature === expected;
};

export const buildValidOrderItems = (cartItems) => {
    const items = [];
    for (const item of cartItems) {
        const product = item.productId;
        const variant = product?.variants?.[item.variantIndex];
        const isListed = product?.isListed && (!product?.category || product.category.isActive);
        if (product && isListed && variant && variant.stock > 0) {
            items.push({
                productId: product._id,
                variantIndex: item.variantIndex,
                quantity: Math.min(item.quantity, variant.stock),
                price: variant.price,
                status: 'processing'
            });
        }
    }
    return items;
};

export const createOrder = async (userId, addressId, orderItems, paymentMethod, paymentStatus, appliedCoupon = null, useWallet = false) => {
    const address = await userRepository.findAddressById(addressId);
    if (!address) throw Object.assign(new Error('Address not found'), { status: 400 });

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

    const order = await orderRepository.createOrder({
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

    for (const item of orderItems) {
        await productRepository.updateVariantStock(item.productId, item.variantIndex, -item.quantity);
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

    await cartService.clearCart(userId);
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
