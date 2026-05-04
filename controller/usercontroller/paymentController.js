import razorpay from "../../config/razorpay.js";
import catchAsync from "../../utilities/catchAsync.js";
import * as cartService from "../../service/user/cartService.js";
import Address from "../../model/Address.js";
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

    // Filter valid items (same logic as checkout page)
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
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(sign.toString())
        .digest("hex");

    if (razorpay_signature === expectedSign) {
        // Payment verified
        res.json({ success: true, message: "Payment verified successfully" });
    } else {
        res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: "Invalid signature sent!" });
    }
});