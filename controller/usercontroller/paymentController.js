import razorpay from '../../config/razorpay.js';
import catchAsync from '../../utilities/catchAsync.js';
import * as cartService from '../../service/user/cartService.js';
import * as paymentService from '../../service/user/paymentService.js';
import { STATUS_CODES } from '../../constants/index.js';

export const getPaymentPage = catchAsync(async (req, res) => {
    const userId = req.session.user._id;
    const { addressId } = req.query;

    if (!addressId) return res.redirect('/user/checkout');

    const { cart, address } = await paymentService.getPaymentPageData(userId, addressId);

    if (!cart || !cart.items || cart.items.length === 0 || !address) {
        return res.redirect('/user/cart');
    }

    const validItems = paymentService.buildValidOrderItems(cart.items);
    if (validItems.length === 0) return res.redirect('/user/cart?error=availability');

    const totalAmount = validItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

    res.render('user/payment', {
        title: 'Payment - KISO',
        cart: { ...cart, items: validItems, totalAmount },
        address,
        razorpayKeyId: process.env.RAZORPAY_KEY_ID
    });
});

export const createOrder = catchAsync(async (req, res) => {
    const { amount } = req.body;
    const options = {
        amount: Math.round(amount * 100),
        currency: 'INR',
        receipt: 'order_rcptid_' + Date.now()
    };
    const order = await razorpay.orders.create(options);
    res.json({ success: true, order });
});

export const verifyPayment = catchAsync(async (req, res) => {
    const userId = req.session.user._id;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, addressId } = req.body;

    const isValid = paymentService.verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    if (!isValid) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: 'Payment verification failed. Invalid signature.' });
    }

    const cart = await cartService.getCart(userId);
    if (!cart || !cart.items || cart.items.length === 0) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: 'Cart or address not found.' });
    }

    const orderItems = paymentService.buildValidOrderItems(cart.items);
    if (orderItems.length === 0) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: 'All items are out of stock.' });
    }

    const newOrder = await paymentService.createOrder(userId, addressId, orderItems, 'razorpay', 'paid');

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

    const cart = await cartService.getCart(userId);
    if (!cart || !cart.items || cart.items.length === 0) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: 'Cart or address not found.' });
    }

    const orderItems = paymentService.buildValidOrderItems(cart.items);
    if (orderItems.length === 0) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: 'All items are out of stock.' });
    }

    const newOrder = await paymentService.createOrder(userId, addressId, orderItems, 'cod', 'pending');
    res.json({ success: true, message: 'Order placed successfully', orderId: newOrder._id });
});

