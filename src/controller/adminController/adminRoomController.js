import catchAsync from '../../utilities/catchAsync.js';
import { STATUS_CODES, MESSAGES, PAGINATION } from '../../constants/index.js';
import * as roomService from '../../service/admin/roomService.js';

export const getRooms = catchAsync(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const perPage = PAGINATION.ADMIN_ROOMS;
    const { total, rooms } = await roomService.getRooms({ page, perPage });

    res.render('admin/rooms', {
        title: 'Rooms - KISO Admin',
        layout: 'layouts/admin',
        showSidebar: true,
        rooms,
        pageNum: page,
        totalPages: Math.ceil(total / perPage),
        totalRooms: total
    });
});

export const createRoom = catchAsync(async (req, res) => {
    const room = await roomService.createRoom(req.body, req.file);
    res.status(STATUS_CODES.CREATED).json({ success: true, message: MESSAGES.ROOM_CREATED, room });
});

export const updateRoom = catchAsync(async (req, res) => {
    const room = await roomService.updateRoom(req.params.id, req.body, req.file);
    res.json({ success: true, message: MESSAGES.ROOM_UPDATED, room });
});

export const deleteRoom = catchAsync(async (req, res) => {
    await roomService.deleteRoom(req.params.id);
    res.json({ success: true, message: MESSAGES.ROOM_DELETED });
});

export const toggleRoomActive = catchAsync(async (req, res) => {
    const room = await roomService.toggleRoomActive(req.params.id);
    res.json({ success: true, message: MESSAGES.ROOM_UPDATED, room });
});

export const reorderRooms = catchAsync(async (req, res) => {
    await roomService.reorderRooms(req.body);
    res.json({ success: true, message: MESSAGES.ROOM_REORDERED });
});
