import Offer from '../../model/Offer.js';

export const findActiveOfferById = async (id) =>
    Offer.findOne({ _id: id, isActive: true }).lean();

export const findActiveOffersForProduct = async (productId, categoryId) => {
    const now = new Date();
    return Offer.find({
        isActive: true,
        expiresAt: { $gt: now },
        startsAt: { $lte: now },
        $or: [
            { type: 'product', productId },
            { type: 'category', categoryId }
        ]
    }).lean();
};
