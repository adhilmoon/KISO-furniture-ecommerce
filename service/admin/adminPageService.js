import * as adminRepository from '../../repository/admin/adminRepository.js';
import Category from '../../model/Category.js';
import Product from '../../model/Product.js';
import { MESSAGES } from '../../constants/index.js';

export const getDashboardStats = async () => adminRepository.getDashboardStats();

export const getUsers = async (page, perPage) => {
    const skip = (page - 1) * perPage;
    const [total, users] = await Promise.all([
        adminRepository.countUsers(),
        adminRepository.findUsers({}, { skip, limit: perPage })
    ]);
    const userIds = users.map(u => u._id);
    const orderCountRows = userIds.length ? await adminRepository.getOrderCountsByUserIds(userIds) : [];
    const countMap = new Map(orderCountRows.map(r => [String(r._id), r.count]));
    users.forEach(u => {
        u.ordercount = countMap.get(String(u._id)) || 0;
        u.status = u.isBlocked ? 'Blocked' : u.isActive ? 'Active' : 'Inactive';
    });
    return { total, users };
};

export const toggleUserBlock = async (userId) => {
    const user = await adminRepository.findUserById(userId);
    if (!user) throw Object.assign(new Error(MESSAGES.USER_NOT_FOUND), { status: 404 });
    user.isBlocked = !user.isBlocked;
    user.status = user.isBlocked ? 'Blocked' : user.isActive ? 'Active' : 'Inactive';
    await user.save();
    return { isBlocked: user.isBlocked, status: user.status };
};

export const getCategoryPage = async ({ search, page, perPage }) => {
    const skip = (page - 1) * perPage;
    const filter = search ? { categoryName: { $regex: search, $options: 'i' } } : {};
    const [total, categories] = await Promise.all([
        Category.countDocuments(),
        Category.find(filter).skip(skip).limit(perPage).sort({ createdAt: -1 }).lean()
    ]);
    for (const cat of categories) {
        cat.productCount = await Product.countDocuments({ category: cat._id });
    }
    return { total, categories };
};

export const getProductPage = async ({ search, page, perPage }) => {
    const skip = (page - 1) * perPage;
    const filter = search ? { productName: { $regex: search, $options: 'i' } } : {};
    const [total, products] = await Promise.all([
        Product.countDocuments(filter),
        Product.find(filter)
            .populate('category', 'categoryName')
            .skip(skip)
            .limit(perPage)
            .sort({ createdAt: -1 })
            .lean()
    ]);
    products.forEach(p => {
        p.totalQuantity = Array.isArray(p.variants)
            ? p.variants.reduce((s, v) => s + (v.stock || 0), 0)
            : 0;
    });
    return { total, products };
};

export const getCategoryById = async (id) => Category.findById(id).lean();

export const getProductForEdit = async (id) =>
    Product.findById(id).populate('category', 'categoryName').lean();

export const getActiveCategories = async () => Category.find({ isActive: true }).lean();
