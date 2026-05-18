import * as couponRepository from '../../repository/user/couponRepository.js';
import { MESSAGES } from '../../constants/messages.js';

const buildError = (message, status) =>
    Object.assign(new Error(message), { status });

export const calculateCouponDiscount = (coupon, subtotal) => {
    if (!coupon) return 0;
    let discount = 0;
    if (coupon.discountType === 'percentage') {
        discount = (subtotal * coupon.discountValue) / 100;
    } else {
        discount = coupon.discountValue;
    }
    if (coupon.maxDiscount && coupon.maxDiscount > 0 && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
    }
    if (discount > subtotal) discount = subtotal;
    return Math.round(discount);
};

export const assertCouponUsable = async (coupon, userId, subtotal) => {
    if (!coupon || !coupon.isActive) throw buildError(MESSAGES.COUPON_INACTIVE, 400);
    if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() < Date.now()) {
        throw buildError(MESSAGES.COUPON_EXPIRED, 400);
    }
    if (coupon.minPurchase && subtotal < coupon.minPurchase) {
        throw buildError(`${MESSAGES.COUPON_MIN_PURCHASE} (₹${coupon.minPurchase})`, 400);
    }
    if (coupon.usageLimit && coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
        throw buildError(MESSAGES.COUPON_USAGE_LIMIT_REACHED, 400);
    }
    if (coupon.perUserLimit && coupon.perUserLimit > 0) {
        const userUsage = await couponRepository.countUserUsage(coupon._id, userId);
        if (userUsage >= coupon.perUserLimit) {
            throw buildError(MESSAGES.COUPON_USER_LIMIT_REACHED, 400);
        }
    }
};

export const applyCoupon = async (code, userId, subtotal) => {
    if (!code || !code.trim()) throw buildError(MESSAGES.COUPON_CODE_REQUIRED, 400);
    const coupon = await couponRepository.findActiveCouponByCode(code.trim());
    if (!coupon) throw buildError(MESSAGES.COUPON_NOT_FOUND, 404);
    await assertCouponUsable(coupon, userId, subtotal);
    const discount = calculateCouponDiscount(coupon, subtotal);
    return { coupon, discount };
};

export const recordUsage = async (couponId, userId, orderId) =>
    couponRepository.recordCouponUsage(couponId, userId, orderId);

export const revokeUsage = async (couponId, orderId) =>
    couponRepository.revokeCouponUsage(couponId, orderId);
