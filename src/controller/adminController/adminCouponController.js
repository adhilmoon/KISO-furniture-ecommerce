import catchAsync from '../../utilities/catchAsync.js';
import { STATUS_CODES, MESSAGES, PAGINATION } from '../../constants/index.js';
import * as couponService from '../../service/admin/couponService.js';

export const getCoupons = catchAsync(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const perPage = PAGINATION.ADMIN_COUPONS;
    const search = req.query.search?.trim() || '';

    const { total, coupons } = await couponService.getCoupons({ page, perPage, search });

    res.render('admin/coupons', {
        title: 'Coupons - KISO Admin',
        layout: 'layouts/admin',
        showSidebar: true,
        coupons,
        pageNum: page,
        totalPages: Math.ceil(total / perPage),
        totalCoupons: total,
        search
    });
});

export const createCoupon = catchAsync(async (req, res) => {
    const coupon = await couponService.createCoupon(req.body);
    res.status(STATUS_CODES.CREATED).json({ success: true, message: MESSAGES.COUPON_CREATED, coupon });
});

export const deleteCoupon = catchAsync(async (req, res) => {
    await couponService.deleteCoupon(req.params.id);
    res.json({ success: true, message: MESSAGES.COUPON_DELETED });
});

export const toggleCouponActive = catchAsync(async (req, res) => {
    const coupon = await couponService.toggleCouponActive(req.params.id);
    res.json({ success: true, message: MESSAGES.COUPON_UPDATED, coupon });
});
