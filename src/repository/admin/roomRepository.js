import Room from '../../model/Room.js';

export const findRooms = async (filter = {}, { skip = 0, limit = 0, sort = { order: 1, createdAt: -1 } } = {}) =>
    Room.find(filter).sort(sort).skip(skip).limit(limit).lean();

export const countRooms = async (filter = {}) =>
    Room.countDocuments(filter);

export const findRoomById = async (id) =>
    Room.findById(id);

export const createRoom = async (data) =>
    Room.create(data);

export const updateRoom = async (id, data) =>
    Room.findByIdAndUpdate(id, data, { new: true });

export const deleteRoom = async (id) =>
    Room.findByIdAndDelete(id);

export const findActiveRooms = async () =>
    Room.find({ isActive: true }).sort({ order: 1, createdAt: -1 }).lean();

export const bulkUpdateOrder = async (items) =>
    Room.bulkWrite(items.map(({ id, order }) => ({
        updateOne: { filter: { _id: id }, update: { $set: { order } } }
    })));
