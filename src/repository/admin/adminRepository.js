import Admin from '../../model/Admin.js';
import User from '../../model/User.js';
import Order from '../../model/Order.js';
import Product from '../../model/Product.js';

export const findAdminByEmail = async (email) => Admin.findOne({email});

export const findUsers = async (filter, {skip, limit}) =>
    User.find(filter).skip(skip).limit(limit).sort({createdAt: -1}).lean();

export const countUsers = async (filter = {}) => User.countDocuments(filter);

export const buildUserFilter = ({ search = '', status = 'all' } = {}) => {
    const filter = {};
    if (search) {
        const safe = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const rx = new RegExp(safe, 'i');
        filter.$or = [{ name: rx }, { email: rx }, { phone: rx }];
    }
    if (status === 'active') filter.isBlocked = { $ne: true };
    else if (status === 'blocked') filter.isBlocked = true;
    return filter;
};

export const searchUsers = async (query) => {
    const filter = query
        ? {$or: [{name: {$regex: query, $options: 'i'}}, {email: {$regex: query, $options: 'i'}}]}
        : {};
    return User.find(filter).sort({createdAt: -1}).lean();
};

export const findUserById = async (id) => User.findById(id);

export const getOrderCountsByUserIds = async (userIds) =>
    Order.aggregate([
        {$match: {userId: {$in: userIds}}},
        {$group: {_id: '$userId', count: {$sum: 1}}}
    ]);

export const getDashboardStats = async () => {
    const [totalProducts, totalUsers, totalOrders, revenueResult] = await Promise.all([
        Product.countDocuments(),
        User.countDocuments({isActive: true, isBlocked: false}),
        Order.countDocuments({orderStatus: {$ne: 'cancelled'}}),
        Order.aggregate([
            {$match: {orderStatus: {$ne: 'cancelled'}}},
            {$group: {_id: null, total: {$sum: '$grandTotal'}}}
        ])
    ]);
    return {
        totalProducts,
        totalUsers,
        totalOrders,
        totalRevenue: revenueResult[0]?.total || 0
    };
};
