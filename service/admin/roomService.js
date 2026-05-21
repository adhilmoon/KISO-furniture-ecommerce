import * as roomRepository from '../../repository/admin/roomRepository.js';
import * as roomValidator from '../../validators/adminRoom.js';
import { uploadImageAsset, replaceImageAsset, removeImageAsset } from '../../utilities/imageAsset.js';
import { MESSAGES, PAGINATION, CLOUDINARY_FOLDERS } from '../../constants/index.js';

const CLOUDINARY_FOLDER = CLOUDINARY_FOLDERS.ROOMS;

const buildError = (message, status) =>
    Object.assign(new Error(message), { status });

const parseBody = (body) => {
    const validation = roomValidator.roomSchema.safeParse(body);
    if (!validation.success) {
        const message = validation.error.issues.map(i => i.message).join(', ');
        throw buildError(message, 400);
    }
    const data = validation.data;
    if (data.linkUrl === '') delete data.linkUrl;
    return data;
};

export const getRooms = async ({ page = 1, perPage = PAGINATION.ADMIN_ROOMS } = {}) => {
    const skip = (page - 1) * perPage;
    const [total, rooms] = await Promise.all([
        roomRepository.countRooms(),
        roomRepository.findRooms({}, { skip, limit: perPage })
    ]);
    return { total, rooms };
};

export const getActiveRooms = () => roomRepository.findActiveRooms();

export const getRoomById = async (id) => {
    const room = await roomRepository.findRoomById(id);
    if (!room) throw buildError(MESSAGES.ROOM_NOT_FOUND, 404);
    return room;
};

export const createRoom = async (body, file) => {
    if (!file) throw buildError(MESSAGES.ROOM_IMAGE_REQUIRED, 400);
    const data = parseBody(body);
    const image = await uploadImageAsset(file, CLOUDINARY_FOLDER);
    return roomRepository.createRoom({ ...data, image });
};

export const updateRoom = async (id, body, file) => {
    const existing = await roomRepository.findRoomById(id);
    if (!existing) throw buildError(MESSAGES.ROOM_NOT_FOUND, 404);
    const data = parseBody(body);
    if (file) {
        data.image = await replaceImageAsset(existing.image?.url, file, CLOUDINARY_FOLDER);
    }
    return roomRepository.updateRoom(id, data);
};

export const deleteRoom = async (id) => {
    const room = await roomRepository.findRoomById(id);
    if (!room) throw buildError(MESSAGES.ROOM_NOT_FOUND, 404);
    await removeImageAsset(room.image?.url);
    await roomRepository.deleteRoom(id);
};

export const toggleRoomActive = async (id) => {
    const room = await roomRepository.findRoomById(id);
    if (!room) throw buildError(MESSAGES.ROOM_NOT_FOUND, 404);
    room.isActive = !room.isActive;
    await room.save();
    return room;
};

export const reorderRooms = async (body) => {
    const validation = roomValidator.reorderSchema.safeParse(body);
    if (!validation.success) {
        const message = validation.error.issues.map(i => i.message).join(', ');
        throw buildError(message, 400);
    }
    await roomRepository.bulkUpdateOrder(validation.data.items);
};
