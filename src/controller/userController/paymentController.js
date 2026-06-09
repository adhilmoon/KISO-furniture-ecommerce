import catchAsync from '../../utilities/catchAsync.js';
import * as cartService from '../../service/user/cartService.js';
import * as paymentService from '../../service/user/paymentService.js';
import * as walletService from '../../service/user/walletService.js';
import * as buyNowService from '../../service/user/buyNowService.js';
import { STATUS_CODES } from '../../constants/index.js';

/**
 * Returns the cart-shaped source for checkout (instant-buy session or DB cart).
 * Single source of truth for all order-placement controllers.
 */
const getCheckoutSource = async (req) => {
    if (req.session.instantBuy) {
        return buyNowService.buildInstantBuyCart(req.session.instantBuy);
    }
    return cartService.getCart(req.session.user._id);
};

const finalizeSessionAfterOrder = (req) => {
    delete req.session.appliedCoupon;
    buyNowService.clearInstantBuy(req);
};

/**
 * Recomputes the authoritative payable amount for the current session's
 * checkout entirely on the server. Never trusts a client-supplied amount.
 * Returns the cart source plus the full money breakdown.
 */
const resolveCheckoutTotals = async (req, useWallet) => {
    const userId = req.session.user._id;
    const cart = await getCheckoutSource(req);
    if (!cart || !cart.items || cart.items.length === 0) return null;

    const validItems = await paymentService.buildValidOrderItems(cart.items);
    if (validItems.length === 0) return null;

    const appliedCoupon = req.session.appliedCoupon || null;
    const walletBalance = await walletService.getBalance(userId);
    const totals = paymentService.summarizeTotals({ validItems, appliedCoupon, walletBalance, useWallet });
    return { cart, validItems, appliedCoupon, walletBalance, ...totals };
};

export const getPaymentPage = catchAsync(async (req, res) => {
    const userId = req.session.user._id;
    const { addressId, useWallet } = req.query;

    if (!addressId) return res.redirect('/user/checkout');

    const isInstantBuy = buyNowService.isInstantBuyActive(req);
    let cart;
    try {
        cart = await getCheckoutSource(req);
    } catch {
        buyNowService.clearInstantBuy(req);
        return res.redirect('/user/cart?error=availability');
    }
    const { address } = await paymentService.getPaymentPageData(userId, addressId);

    if (!cart || !cart.items || cart.items.length === 0 || !address) {
        return res.redirect(isInstantBuy ? '/user/store' : '/user/cart');
    }

    const validItems = await paymentService.buildValidOrderItems(cart.items);
    if (validItems.length === 0) return res.redirect('/user/cart?error=availability');

    const wantsWallet = useWallet === '1';
    const walletBalance = await walletService.getBalance(userId);
    const appliedCoupon = req.session.appliedCoupon || null;
    const { subtotal, couponDiscount, grandTotal, walletApplied, payableAmount } =
        paymentService.summarizeTotals({ validItems, appliedCoupon, walletBalance, useWallet: wantsWallet });

    res.render('user/payment', {
        title: 'Payment - KISO',
        cart: { ...cart, items: validItems, totalAmount: subtotal },
        address,
        appliedCoupon,
        couponDiscount,
        grandTotal,
        useWallet: wantsWallet,
        walletBalance,
        walletApplied,
        payableAmount,
        razorpayKeyId: process.env.RAZORPAY_KEY_ID,
        isInstantBuy
    });
});

/**
 * Creates a Razorpay order for the SERVER-computed payable amount. The
 * client sends only the address and wallet preference — never the amount.
 */
export const createOrder = catchAsync(async (req, res) => {
    const userId = req.session.user._id;
    const { addressId, useWallet } = req.body;

    if (!addressId) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: 'Address is required.' });
    }

    const totals = await resolveCheckoutTotals(req, !!useWallet);
    if (!totals) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: 'Cart is empty or items are unavailable.' });
    }
    if (totals.payableAmount <= 0) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: 'Nothing to pay online. Use the wallet checkout instead.' });
    }

    const order = await paymentService.createCheckoutOrder({
        amountRupees: totals.payableAmount,
        userId,
        addressId,
        useWallet: !!useWallet
    });
    res.json({ success: true, order });
});

/**
 * Verifies a completed Razorpay payment and places the order. Address and
 * wallet usage are read from the trusted Razorpay order notes, and the
 * captured amount is cross-checked against a fresh server computation, so a
 * tampered or replayed request cannot alter what was actually charged.
 */
export const verifyPayment = catchAsync(async (req, res) => {
    const userId = req.session.user._id;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!paymentService.verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: 'Payment verification failed. Invalid signature.' });
    }

    const { addressId, useWallet, amountRupees } = await paymentService.fetchAuthorizedCheckoutOrder({
        orderId: razorpay_order_id,
        userId
    });

    const totals = await resolveCheckoutTotals(req, useWallet);
    if (!totals) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: 'Cart or address not found.' });
    }
    if (totals.payableAmount !== amountRupees) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({
            success: false,
            message: 'Order amount changed since payment was initiated. The payment will be refunded.'
        });
    }

    const orderItems = await paymentService.validateCheckoutItems(totals.cart.items);
    const newOrder = await paymentService.createOrder(
        userId, addressId, orderItems, 'razorpay', 'paid', totals.appliedCoupon, useWallet,
        { skipCartClear: totals.cart.isInstantBuy }
    );
    finalizeSessionAfterOrder(req);

    res.json({ success: true, message: 'Payment verified and order placed successfully', orderId: newOrder._id });
});

export const getOrderConfirmation = catchAsync(async (req, res) => {
    const userId = req.session.user._id;
    const order = await paymentService.getOrderConfirmation(req.params.orderId, userId);
    if (!order) return res.redirect('/user/store');
    res.render('user/order-confirmation', { title: 'Order Confirmed - KISO', order });
});

export const getPaymentFailed = catchAsync(async (req, res) => {
    const { reason } = req.query;
    res.render('user/payment-failed', {
        title: 'Payment Failed - KISO',
        reason: reason || 'The payment could not be completed. Please try again.'
    });
});

export const placeCODOrder = catchAsync(async (req, res) => {
    const userId = req.session.user._id;
    const { addressId } = req.body;

    const cart = await getCheckoutSource(req);
    if (!cart || !cart.items || cart.items.length === 0) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: 'Cart or address not found.' });
    }

    const orderItems = await paymentService.validateCheckoutItems(cart.items);

    const appliedCoupon = req.session.appliedCoupon || null;
    const useWallet = !!req.body.useWallet;
    const newOrder = await paymentService.createOrder(userId, addressId, orderItems, 'cod', 'pending', appliedCoupon, useWallet, { skipCartClear: cart.isInstantBuy });
    finalizeSessionAfterOrder(req);
    res.json({ success: true, message: 'Order placed successfully', orderId: newOrder._id });
});

export const placeWalletOrder = catchAsync(async (req, res) => {
    const userId = req.session.user._id;
    const { addressId } = req.body;

    const cart = await getCheckoutSource(req);
    if (!cart || !cart.items || cart.items.length === 0) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: 'Cart or address not found.' });
    }

    const orderItems = await paymentService.validateCheckoutItems(cart.items);

    const appliedCoupon = req.session.appliedCoupon || null;
    const subtotal = orderItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const couponDiscount = appliedCoupon ? Math.min(appliedCoupon.discount || 0, subtotal) : 0;
    const grandTotal = Math.max(subtotal - couponDiscount, 0);

    const balance = await walletService.getBalance(userId);
    if (balance < grandTotal) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: 'Insufficient wallet balance' });
    }

    const newOrder = await paymentService.createOrder(userId, addressId, orderItems, 'wallet', 'paid', appliedCoupon, true, { skipCartClear: cart.isInstantBuy });
    finalizeSessionAfterOrder(req);
    res.json({ success: true, message: 'Order placed using wallet', orderId: newOrder._id });
});
