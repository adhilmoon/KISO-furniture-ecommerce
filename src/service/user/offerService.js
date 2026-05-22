import * as offerRepository from '../../repository/user/offerRepository.js';

const isOfferUsable = (offer) => {
    if (!offer || !offer.isActive) return false;
    const now = Date.now();
    if (offer.startsAt && new Date(offer.startsAt).getTime() > now) return false;
    if (offer.expiresAt && new Date(offer.expiresAt).getTime() < now) return false;
    return true;
};

export const calculateOfferDiscount = (offer, basePrice) => {
    if (!isOfferUsable(offer) || !basePrice || basePrice <= 0) return 0;
    let discount = offer.discountType === 'percentage'
        ? (basePrice * offer.discountValue) / 100
        : offer.discountValue;
    if (offer.maxDiscount && offer.maxDiscount > 0 && discount > offer.maxDiscount) {
        discount = offer.maxDiscount;
    }
    if (discount > basePrice) discount = basePrice;
    return Math.round(discount);
};

export const getBestOfferForProduct = async ({ productId, categoryId, basePrice }) => {
    const offers = await offerRepository.findActiveOffersForProduct(productId, categoryId);
    let best = null;
    let bestDiscount = 0;
    for (const offer of offers) {
        const discount = calculateOfferDiscount(offer, basePrice);
        if (discount > bestDiscount) {
            bestDiscount = discount;
            best = offer;
        }
    }
    return { offer: best, discount: bestDiscount, effectivePrice: Math.max(basePrice - bestDiscount, 0) };
};

export const pickBestOfferFromList = (offers, basePrice) => {
    let best = null;
    let bestDiscount = 0;
    for (const offer of offers || []) {
        if (!isOfferUsable(offer)) continue;
        const discount = calculateOfferDiscount(offer, basePrice);
        if (discount > bestDiscount) {
            bestDiscount = discount;
            best = offer;
        }
    }
    return { offer: best, discount: bestDiscount, effectivePrice: Math.max(basePrice - bestDiscount, 0) };
};
