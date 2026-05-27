import Coupon from '../../model/Coupon.js';

export const findActiveCouponByCode = async (code) =>
    Coupon.findOne({ code: code.toUpperCase(), isActive: true });

export const findAvailableCoupons = async () =>
    Coupon.find({ isActive: true, expiresAt: { $gt: new Date() } })
        .sort({ createdAt: -1 })
        .lean();

export const recordCouponUsage = async (couponId, userId, orderId) =>
    Coupon.findByIdAndUpdate(
        couponId,
        {
            $inc: { usedCount: 1 },
            $push: { usedBy: { userId, orderId, usedAt: new Date() } }
        },
        { new: true }
    );

export const revokeCouponUsage = async (couponId, orderId) =>
    Coupon.findByIdAndUpdate(
        couponId,
        {
            $inc: { usedCount: -1 },
            $pull: { usedBy: { orderId } }
        },
        { new: true }
    );

export const countUserUsage = async (couponId, userId) => {
    const coupon = await Coupon.findById(couponId, { usedBy: 1 }).lean();
    if (!coupon) return 0;
    return coupon.usedBy.filter(u => String(u.userId) === String(userId)).length;
};
