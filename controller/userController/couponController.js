import catchAsync from '../../utilities/catchAsync.js';
import { STATUS_CODES, MESSAGES } from '../../constants/index.js';
import * as couponService from '../../service/user/couponService.js';
import * as cartService from '../../service/user/cartService.js';
import * as offerService from '../../service/user/offerService.js';

const computeCartSubtotal = async (cart) => {
    let sum = 0;
    for (const item of cart.items) {
        const product = item.productId;
        const variant = product?.variants?.[item.variantIndex];
        const basePrice = variant?.price ?? item.price ?? 0;
        const categoryId = product?.category?._id || product?.category;
        const { effectivePrice } = await offerService.getBestOfferForProduct({
            productId: product?._id,
            categoryId,
            basePrice
        });
        sum += effectivePrice * item.quantity;
    }
    return sum;
};

export const applyCoupon = catchAsync(async (req, res) => {
    const userId = req.session.user._id;
    const { code } = req.body;

    if (req.session.appliedCoupon) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: MESSAGES.COUPON_ALREADY_APPLIED });
    }

    const cart = await cartService.getCart(userId);
    if (!cart || !cart.items || cart.items.length === 0) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: MESSAGES.CART_IS_EMPTY });
    }
    const subtotal = await computeCartSubtotal(cart);

    const { coupon, discount } = await couponService.applyCoupon(code, userId, subtotal);

    req.session.appliedCoupon = {
        couponId: coupon._id,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discount
    };

    res.status(STATUS_CODES.OK).json({
        success: true,
        message: MESSAGES.COUPON_APPLIED,
        coupon: req.session.appliedCoupon,
        subtotal,
        finalAmount: subtotal - discount
    });
});

export const removeCoupon = catchAsync(async (req, res) => {
    delete req.session.appliedCoupon;
    res.status(STATUS_CODES.OK).json({ success: true, message: MESSAGES.COUPON_REMOVED });
});
