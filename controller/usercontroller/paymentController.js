import razorpay from "../../config/razorpay.js";
import catchAsync from "../../utilities/catchAsync.js";
import * as cartService from "../../service/user/cartService.js";
import Address from "../../model/Address.js";
import Order from "../../model/Order.js";
import Product from "../../model/Product.js";
import crypto from "crypto";
import { STATUS_CODES } from "../../constants/index.js";

export const getPaymentPage = catchAsync(async (req, res) => {
    const userId = req.session.user._id;
    const { addressId } = req.query;

    if (!addressId) {
        return res.redirect("/user/checkout");
    }

    const cart = await cartService.getCart(userId);
    const address = await Address.findById(addressId);

    if (!cart || !cart.items || cart.items.length === 0 || !address) {
        return res.redirect("/user/cart");
    }

   
    const validItems = [];
    for (const item of cart.items) {
        const product = item.productId;
        const variant = product?.variants?.[item.variantIndex];
        const isProductListed = product?.isListed && (!product?.category || product.category.isActive);

        if (product && isProductListed && variant && variant.stock > 0) {
            const purchaseQty = Math.min(item.quantity, variant.stock);
            validItems.push({
                ...item,
                quantity: purchaseQty,
                price: variant.price
            });
        }
    }

    if (validItems.length === 0) {
        return res.redirect("/user/cart?error=availability");
    }

    const totalAmount = validItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    res.render("user/payment", {
        title: "Payment - KISO",
        cart: { ...cart, items: validItems, totalAmount },
        address,
        razorpayKeyId: process.env.RAZORPAY_KEY_ID
    });
});

export const createOrder = catchAsync(async (req, res) => {
    const { amount } = req.body;

    const options = {
        amount: Math.round(amount * 100), // convert to paise
        currency: "INR",
        receipt: "order_rcptid_" + Date.now(),
    };

    const order = await razorpay.orders.create(options);

    res.json({
        success: true,
        order,
    });
});

export const verifyPayment = catchAsync(async (req, res) => {
    const userId = req.session.user._id;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, addressId } = req.body;

    // 1. Verify Razorpay Signature
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(sign.toString())
        .digest("hex");

    if (razorpay_signature !== expectedSign) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({ 
            success: false, 
            message: "Payment verification failed. Invalid signature." 
        });
    }

    // 2. Fetch cart and address for order creation
    const cart = await cartService.getCart(userId);
    const address = await Address.findById(addressId);

    if (!cart || !cart.items || cart.items.length === 0 || !address) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({ 
            success: false, 
            message: "Cart or address not found." 
        });
    }

    // 3. Filter valid items and do final stock check
    const orderItems = [];
    for (const item of cart.items) {
        const product = item.productId;
        const variant = product?.variants?.[item.variantIndex];
        const isProductListed = product?.isListed && (!product?.category || product.category.isActive);

        if (product && isProductListed && variant && variant.stock > 0) {
            const purchaseQty = Math.min(item.quantity, variant.stock);
            orderItems.push({
                productId: product._id,
                variantIndex: item.variantIndex,
                quantity: purchaseQty,
                price: variant.price,
                status: 'processing'
            });
        }
    }

    if (orderItems.length === 0) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({ 
            success: false, 
            message: "All items are out of stock." 
        });
    }

    const subtotal = orderItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    // 4. Create the Order
    const newOrder = await Order.create({
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
        discount: 0,
        grandTotal: subtotal,
        orderStatus: 'confirmed',
        paymentMethod: 'razorpay',
        paymentStatus: 'paid'
    });

    // 5. Deduct stock for each purchased variant
    for (const item of orderItems) {
        await Product.updateOne(
            { _id: item.productId },
            { $inc: { [`variants.${item.variantIndex}.stock`]: -item.quantity } }
        );
    }

    // 6. Clear the user's cart
    await cartService.clearCart(userId);

    // 7. Return success with order ID
    res.json({ 
        success: true, 
        message: "Payment verified and order placed successfully",
        orderId: newOrder._id
    });
});

// Order Confirmation Page
export const 
getOrderConfirmation = catchAsync(async (req, res) => {
    const { orderId } = req.params;
    const userId = req.session.user._id;

    const order = await Order.findOne({ _id: orderId, userId }).populate('orderItems.productId');

    if (!order) {
        return res.redirect("/user/store");
    }

    res.render("user/order-confirmation", {
        title: "Order Confirmed - KISO",
        order
    });
});

// Payment Failed Page
export const getPaymentFailed = catchAsync(async (req, res) => {
    const { reason } = req.query;

    res.render("user/payment-failed", {
        title: "Payment Failed - KISO",
        reason: reason || "The payment could not be completed. Please try again."
    });
});

export const placeCODOrder = catchAsync(async (req, res) => {
    const userId = req.session.user._id;
    const { addressId } = req.body;

    const cart = await cartService.getCart(userId);
    const address = await Address.findById(addressId);

    if (!cart || !cart.items || cart.items.length === 0 || !address) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({
            success: false,
            message: "Cart or address not found."
        });
    }

    const orderItems = [];
    for (const item of cart.items) {
        const product = item.productId;
        const variant = product?.variants?.[item.variantIndex];
        const isProductListed = product?.isListed && (!product?.category || product.category.isActive);

        if (product && isProductListed && variant && variant.stock > 0) {
            const purchaseQty = Math.min(item.quantity, variant.stock);
            orderItems.push({
                productId: product._id,
                variantIndex: item.variantIndex,
                quantity: purchaseQty,
                price: variant.price,
                status: 'processing'
            });
        }
    }

    if (orderItems.length === 0) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({
            success: false,
            message: "All items are out of stock."
        });
    }

    const subtotal = orderItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    const newOrder = await Order.create({
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
        discount: 0,
        grandTotal: subtotal,
        orderStatus: 'confirmed',
        paymentMethod: 'cod',
        paymentStatus: 'pending'
    });

    for (const item of orderItems) {
        await Product.updateOne(
            { _id: item.productId },
            { $inc: { [`variants.${item.variantIndex}.stock`]: -item.quantity } }
        );
    }

    await cartService.clearCart(userId);

    res.json({
        success: true,
        message: "Order placed successfully",
        orderId: newOrder._id
    });
});