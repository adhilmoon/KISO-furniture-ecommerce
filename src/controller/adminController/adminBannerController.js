import catchAsync from '../../utilities/catchAsync.js';
import { STATUS_CODES, MESSAGES, PAGINATION } from '../../constants/index.js';
import * as bannerService from '../../service/admin/bannerService.js';

export const getBanners = catchAsync(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const perPage = PAGINATION.ADMIN_BANNERS;
    const { total, banners } = await bannerService.getBanners({ page, perPage });

    res.render('admin/banners', {
        title: 'Banners - KISO Admin',
        layout: 'layouts/admin',
        showSidebar: true,
        banners,
        pageNum: page,
        totalPages: Math.ceil(total / perPage),
        totalBanners: total
    });
});

export const createBanner = catchAsync(async (req, res) => {
    const banner = await bannerService.createBanner(req.body, req.file);
    res.status(STATUS_CODES.CREATED).json({ success: true, message: MESSAGES.BANNER_CREATED, banner });
});

export const updateBanner = catchAsync(async (req, res) => {
    const banner = await bannerService.updateBanner(req.params.id, req.body, req.file);
    res.json({ success: true, message: MESSAGES.BANNER_UPDATED, banner });
});

export const deleteBanner = catchAsync(async (req, res) => {
    await bannerService.deleteBanner(req.params.id);
    res.json({ success: true, message: MESSAGES.BANNER_DELETED });
});

export const toggleBannerActive = catchAsync(async (req, res) => {
    const banner = await bannerService.toggleBannerActive(req.params.id);
    res.json({ success: true, message: MESSAGES.BANNER_UPDATED, banner });
});

export const reorderBanners = catchAsync(async (req, res) => {
    await bannerService.reorderBanners(req.body);
    res.json({ success: true, message: MESSAGES.BANNER_REORDERED });
});
