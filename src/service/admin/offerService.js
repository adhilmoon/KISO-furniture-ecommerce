import * as offerRepository from '../../repository/admin/offerRepository.js';
import * as offerValidator from '../../validators/adminOffer.js';
import { MESSAGES } from '../../constants/messages.js';
import { escapeRegex } from '../../utilities/escapeRegex.js';

const buildError = (message, status) =>
    Object.assign(new Error(message), { status });

export const getOffers = async ({ page, perPage, search, type }) => {
    const filter = {};
    if (type) filter.type = type;
    if (search) filter.name = { $regex: escapeRegex(search), $options: 'i' };
    const skip = (page - 1) * perPage;
    const [total, offers] = await Promise.all([
        offerRepository.countOffers(filter),
        offerRepository.findOffers(filter, { skip, limit: perPage })
    ]);
    return { total, offers };
};

export const createOffer = async (data) => {
    const validation = offerValidator.offerSchema.safeParse(data);
    if (!validation.success) {
        const message = validation.error.issues.map(i => i.message).join(', ');
        throw buildError(message, 400);
    }
    const parsed = validation.data;
    if (parsed.type === 'product' && !parsed.productId) throw buildError(MESSAGES.OFFER_TARGET_REQUIRED, 400);
    if (parsed.type === 'category' && !parsed.categoryId) throw buildError(MESSAGES.OFFER_TARGET_REQUIRED, 400);

    const offer = await offerRepository.createOffer(parsed);

    if (offer.type === 'product') {
        await offerRepository.linkProductOffer(offer.productId, offer._id);
    } else if (offer.type === 'category') {
        await offerRepository.linkCategoryOffer(offer.categoryId, offer._id);
    }
    return offer;
};

export const deleteOffer = async (id) => {
    const offer = await offerRepository.findOfferById(id);
    if (!offer) throw buildError(MESSAGES.OFFER_NOT_FOUND, 404);
    if (offer.type === 'product' && offer.productId) {
        await offerRepository.unlinkProductOffer(offer.productId);
    } else if (offer.type === 'category' && offer.categoryId) {
        await offerRepository.unlinkCategoryOffer(offer.categoryId);
    }
    await offerRepository.deleteOffer(id);
};

export const toggleOfferActive = async (id) => {
    const offer = await offerRepository.findOfferById(id);
    if (!offer) throw buildError(MESSAGES.OFFER_NOT_FOUND, 404);
    offer.isActive = !offer.isActive;
    await offer.save();
    return offer;
};
