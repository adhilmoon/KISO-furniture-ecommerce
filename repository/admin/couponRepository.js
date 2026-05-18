import Coupon from '../../model/Coupon.js';

export const findCoupons = async (filter, { skip, limit }) =>
    Coupon.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean();

export const countCoupons = async (filter = {}) =>
    Coupon.countDocuments(filter);

export const findCouponByCode = async (code) =>
    Coupon.findOne({ code: code.toUpperCase() });

export const findCouponById = async (id) =>
    Coupon.findById(id);

export const createCoupon = async (data) =>
    Coupon.create(data);

export const deleteCoupon = async (id) =>
    Coupon.findByIdAndDelete(id);

export const updateCoupon = async (id, data) =>
    Coupon.findByIdAndUpdate(id, data, { new: true });
