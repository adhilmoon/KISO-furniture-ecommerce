import * as couponRepository from '../../repository/user/couponRepository.js';
import { MESSAGES } from '../../constants/messages.js';

const buildError = (message, status) =>
    Object.assign(new Error(message), { status });

export const calculateCouponDiscount = (coupon, subtotal) => {
    if (!coupon) return 0;
    let discount = coupon.discountType === 'percentage'
        ? (subtotal * coupon.discountValue) / 100
        : coupon.discountValue;
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

/**
 * Lists active, non-expired coupons with a per-user eligibility verdict for
 * the given cart subtotal. Eligible coupons carry the discount they'd yield;
 * ineligible ones carry a short reason so the UI can explain why.
 */
export const listAvailableCoupons = async (userId, subtotal) => {
    const coupons = await couponRepository.findAvailableCoupons();
    return coupons.map((c) => {
        const userUsage = (c.usedBy || []).filter(u => String(u.userId) === String(userId)).length;
        let eligible = true;
        let reason = '';
        if (c.usageLimit && c.usageLimit > 0 && c.usedCount >= c.usageLimit) {
            eligible = false; reason = 'Usage limit reached';
        } else if (c.perUserLimit && c.perUserLimit > 0 && userUsage >= c.perUserLimit) {
            eligible = false; reason = 'Already used';
        } else if (c.minPurchase && subtotal < c.minPurchase) {
            eligible = false; reason = `Add ₹${(c.minPurchase - subtotal).toLocaleString('en-IN')} more to use`;
        }
        return {
            code: c.code,
            description: c.description || '',
            discountType: c.discountType,
            discountValue: c.discountValue,
            minPurchase: c.minPurchase || 0,
            maxDiscount: c.maxDiscount || 0,
            expiresAt: c.expiresAt,
            eligible,
            reason,
            discount: eligible ? calculateCouponDiscount(c, subtotal) : 0
        };
    });
};

export const recordUsage = async (couponId, userId, orderId) =>
    couponRepository.recordCouponUsage(couponId, userId, orderId);

export const revokeUsage = async (couponId, orderId) =>
    couponRepository.revokeCouponUsage(couponId, orderId);
