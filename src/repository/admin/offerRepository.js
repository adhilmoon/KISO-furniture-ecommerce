import Offer from '../../model/Offer.js';
import Product from '../../model/Product.js';
import Category from '../../model/Category.js';

export const findOffers = async (filter, { skip, limit }) =>
    Offer.find(filter)
        .populate('productId', 'productName')
        .populate('categoryId', 'categoryName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

export const countOffers = async (filter = {}) =>
    Offer.countDocuments(filter);

export const findOfferById = async (id) =>
    Offer.findById(id);

export const createOffer = async (data) =>
    Offer.create(data);

export const deleteOffer = async (id) =>
    Offer.findByIdAndDelete(id);

export const updateOffer = async (id, data) =>
    Offer.findByIdAndUpdate(id, data, { new: true });

export const linkProductOffer = async (productId, offerId) =>
    Product.findByIdAndUpdate(productId, { offer: offerId }, { new: true });

export const linkCategoryOffer = async (categoryId, offerId) =>
    Category.findByIdAndUpdate(categoryId, { offer: offerId }, { new: true });

export const unlinkProductOffer = async (productId) =>
    Product.findByIdAndUpdate(productId, { offer: null }, { new: true });

export const unlinkCategoryOffer = async (categoryId) =>
    Category.findByIdAndUpdate(categoryId, { offer: null }, { new: true });
