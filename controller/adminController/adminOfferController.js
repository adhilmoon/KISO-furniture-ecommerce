import catchAsync from '../../utilities/catchAsync.js';
import { STATUS_CODES, MESSAGES } from '../../constants/index.js';
import * as offerService from '../../service/admin/offerService.js';
import Product from '../../model/Product.js';
import Category from '../../model/Category.js';

export const getOffers = catchAsync(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const perPage = 10;
    const search = req.query.search?.trim() || '';
    const type = req.query.type?.trim() || '';

    const { total, offers } = await offerService.getOffers({ page, perPage, search, type });
    const [products, categories] = await Promise.all([
        Product.find({}, 'productName').lean(),
        Category.find({}, 'categoryName').lean()
    ]);

    res.render('admin/offers', {
        title: 'Offers - KISO Admin',
        offers,
        products,
        categories,
        pageNum: page,
        totalPages: Math.ceil(total / perPage),
        totalOffers: total,
        search,
        typeFilter: type
    });
});

export const createOffer = catchAsync(async (req, res) => {
    const offer = await offerService.createOffer(req.body);
    res.status(STATUS_CODES.CREATED).json({ success: true, message: MESSAGES.OFFER_CREATED, offer });
});

export const deleteOffer = catchAsync(async (req, res) => {
    await offerService.deleteOffer(req.params.id);
    res.json({ success: true, message: MESSAGES.OFFER_DELETED });
});

export const toggleOfferActive = catchAsync(async (req, res) => {
    const offer = await offerService.toggleOfferActive(req.params.id);
    res.json({ success: true, message: MESSAGES.OFFER_UPDATED, offer });
});
