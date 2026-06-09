import * as couponRepository from '../../repository/admin/couponRepository.js';
import * as couponValidator from '../../validators/adminCoupon.js';
import { MESSAGES } from '../../constants/messages.js';

const buildError = (message, status) =>
    Object.assign(new Error(message), { status });

export const getCoupons = async ({ page, perPage, search }) => {
    const filter = {};
    if (search) filter.code = { $regex: search, $options: 'i' };
    const skip = (page - 1) * perPage;
    const [total, coupons] = await Promise.all([
        couponRepository.countCoupons(filter),
        couponRepository.findCoupons(filter, { skip, limit: perPage })
    ]);
    return { total, coupons };
};

export const createCoupon = async (data) => {
    const validation = couponValidator.couponSchema.safeParse(data);
    if (!validation.success) {
        const message = validation.error.issues.map(i => i.message).join(', ');
        throw buildError(message, 400);
    }
    const parsed = validation.data;
    parsed.code = parsed.code.toUpperCase();

    const exists = await couponRepository.findCouponByCode(parsed.code);
    if (exists) throw buildError(MESSAGES.COUPON_CODE_EXISTS, 400);

    return couponRepository.createCoupon(parsed);
};

export const deleteCoupon = async (id) => {
    const coupon = await couponRepository.findCouponById(id);
    if (!coupon) throw buildError(MESSAGES.COUPON_NOT_FOUND, 404);
    await couponRepository.deleteCoupon(id);
};

export const toggleCouponActive = async (id) => {
    const coupon = await couponRepository.findCouponById(id);
    if (!coupon) throw buildError(MESSAGES.COUPON_NOT_FOUND, 404);
    coupon.isActive = !coupon.isActive;
    await coupon.save();
    return coupon;
};
