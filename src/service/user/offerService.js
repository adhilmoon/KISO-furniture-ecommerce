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

/**
 * Build the display payload for the best active offer on a single price point.
 * Returns null when no active offer applies — templates use that to decide
 * whether to render the strikethrough + % OFF badge at all. No fake discounts.
 */
export const computeProductBestOffer = async (product, variantPrice) => {
    if (!product || !variantPrice || variantPrice <= 0) return null;
    const categoryId = product.category?._id || product.category || null;
    const { offer, discount, effectivePrice } = await getBestOfferForProduct({
        productId: product._id,
        categoryId,
        basePrice: variantPrice,
    });
    if (!offer || discount <= 0) return null;
    return {
        name: offer.name,
        discountType: offer.discountType,
        discountValue: offer.discountValue,
        discount,
        originalPrice: variantPrice,
        effectivePrice,
        percentOff: Math.round((discount / variantPrice) * 100),
    };
};

/** Mutates each product in-place, attaching `bestOffer` for its display variant. */
export const attachBestOffersToProducts = async (products) => {
    if (!Array.isArray(products)) return products;
    await Promise.all(products.map(async (p) => {
        const v = (p.variants || []).find(x => (x?.stock || 0) > 0) || (p.variants || [])[0];
        const price = v?.price ?? p.basePrice;
        p.bestOffer = await computeProductBestOffer(p, price);
    }));
    return products;
};

/** Mutates each variant of a product in-place with its own `bestOffer`. */
export const attachBestOffersToVariants = async (product) => {
    if (!product || !Array.isArray(product.variants)) return product;
    await Promise.all(product.variants.map(async (v) => {
        v.bestOffer = await computeProductBestOffer(product, v?.price);
    }));
    // Convenience: also expose the offer on the product itself for the first variant.
    product.bestOffer = product.variants[0]?.bestOffer || null;
    return product;
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
