import Banner from '../../model/Banner.js';

export const findBanners = async (filter = {}, { skip = 0, limit = 0, sort = { order: 1, createdAt: -1 } } = {}) =>
    Banner.find(filter).sort(sort).skip(skip).limit(limit).lean();

export const countBanners = async (filter = {}) =>
    Banner.countDocuments(filter);

export const findBannerById = async (id) =>
    Banner.findById(id);

export const createBanner = async (data) =>
    Banner.create(data);

export const updateBanner = async (id, data) =>
    Banner.findByIdAndUpdate(id, data, { new: true });

export const deleteBanner = async (id) =>
    Banner.findByIdAndDelete(id);

export const findActiveBanners = async () =>
    Banner.find({ isActive: true }).sort({ order: 1, createdAt: -1 }).lean();

export const bulkUpdateOrder = async (items) =>
    Banner.bulkWrite(items.map(({ id, order }) => ({
        updateOne: { filter: { _id: id }, update: { $set: { order } } }
    })));
