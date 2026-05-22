import * as bannerRepository from '../../repository/admin/bannerRepository.js';
import * as bannerValidator from '../../validators/adminBanner.js';
import { uploadImageAsset, replaceImageAsset, removeImageAsset } from '../../utilities/imageAsset.js';
import { MESSAGES, PAGINATION, CLOUDINARY_FOLDERS } from '../../constants/index.js';

const CLOUDINARY_FOLDER = CLOUDINARY_FOLDERS.BANNERS;
const IMAGE_RULES = {
    minWidth: 1200,
    minHeight: 400,
    maxBytes: 5 * 1024 * 1024,
    aspectRatio: { ratio: 21 / 9, tolerance: 0.35 }
};

const buildError = (message, status) =>
    Object.assign(new Error(message), { status });

const parseBody = (body) => {
    const validation = bannerValidator.bannerSchema.safeParse(body);
    if (!validation.success) {
        const message = validation.error.issues.map(i => i.message).join(', ');
        throw buildError(message, 400);
    }
    const data = validation.data;
    for (const k of ['title', 'subtitle', 'ctaText', 'linkUrl']) {
        if (data[k] === '') delete data[k];
    }
    return data;
};

export const getBanners = async ({ page = 1, perPage = PAGINATION.ADMIN_BANNERS } = {}) => {
    const skip = (page - 1) * perPage;
    const [total, banners] = await Promise.all([
        bannerRepository.countBanners(),
        bannerRepository.findBanners({}, { skip, limit: perPage })
    ]);
    return { total, banners };
};

export const getActiveBanners = () => bannerRepository.findActiveBanners();

export const getBannerById = async (id) => {
    const banner = await bannerRepository.findBannerById(id);
    if (!banner) throw buildError(MESSAGES.BANNER_NOT_FOUND, 404);
    return banner;
};

export const createBanner = async (body, file) => {
    if (!file) throw buildError(MESSAGES.BANNER_IMAGE_REQUIRED, 400);
    const data = parseBody(body);
    const image = await uploadImageAsset(file, CLOUDINARY_FOLDER, IMAGE_RULES);
    return bannerRepository.createBanner({ ...data, image });
};

export const updateBanner = async (id, body, file) => {
    const existing = await bannerRepository.findBannerById(id);
    if (!existing) throw buildError(MESSAGES.BANNER_NOT_FOUND, 404);
    const data = parseBody(body);
    if (file) {
        data.image = await replaceImageAsset(existing.image?.url, file, CLOUDINARY_FOLDER, IMAGE_RULES);
    }
    return bannerRepository.updateBanner(id, data);
};

export const deleteBanner = async (id) => {
    const banner = await bannerRepository.findBannerById(id);
    if (!banner) throw buildError(MESSAGES.BANNER_NOT_FOUND, 404);
    await removeImageAsset(banner.image?.url);
    await bannerRepository.deleteBanner(id);
};

export const toggleBannerActive = async (id) => {
    const banner = await bannerRepository.findBannerById(id);
    if (!banner) throw buildError(MESSAGES.BANNER_NOT_FOUND, 404);
    banner.isActive = !banner.isActive;
    await banner.save();
    return banner;
};

export const reorderBanners = async (body) => {
    const validation = bannerValidator.reorderSchema.safeParse(body);
    if (!validation.success) {
        const message = validation.error.issues.map(i => i.message).join(', ');
        throw buildError(message, 400);
    }
    await bannerRepository.bulkUpdateOrder(validation.data.items);
};
