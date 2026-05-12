import bcrypt from 'bcrypt';
import * as adminRepository from '../../repository/admin/adminRepository.js';
import { MESSAGES } from '../../constants/index.js';

export const adminLogin = async (email, password) => {
    if (!email || !password) throw Object.assign(new Error(MESSAGES.EMPTY_FIELDS), { status: 400 });
    const admin = await adminRepository.findAdminByEmail(email);
    if (!admin) throw Object.assign(new Error(MESSAGES.WRONG_ADMIN_CREDENTIALS), { status: 401 });
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) throw Object.assign(new Error(MESSAGES.INVALID_PASSWORD), { status: 401 });
    return admin;
};

export const searchUsersWithOrderCounts = async (query) => {
    const users = await adminRepository.searchUsers(query);
    const userIds = users.map(u => u._id);
    const orderCountRows = userIds.length ? await adminRepository.getOrderCountsByUserIds(userIds) : [];
    const countMap = new Map(orderCountRows.map(r => [String(r._id), r.count]));
    return users.map(u => ({
        ...u,
        ordercount: countMap.get(String(u._id)) || 0,
        status: u.isBlocked ? 'Blocked' : u.isActive ? 'Active' : 'Inactive'
    }));
};
