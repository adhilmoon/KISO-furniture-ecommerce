import Order from '../../model/Order.js';
import Product from '../../model/Product.js';

const SALES_EXCLUDED = ['cancelled', 'returned'];

export const aggregateChartData = async ({ startDate, endDate, groupBy }) => {
    const fmt = groupBy === 'year' ? '%Y' : groupBy === 'month' ? '%Y-%m' : '%Y-%m-%d';
    return Order.aggregate([
        {
            $match: {
                createdAt: { $gte: startDate, $lte: endDate },
                orderStatus: { $nin: SALES_EXCLUDED }
            }
        },
        {
            $group: {
                _id: { $dateToString: { format: fmt, date: '$createdAt' } },
                orders: { $sum: 1 },
                revenue: { $sum: '$grandTotal' }
            }
        },
        { $sort: { _id: 1 } }
    ]);
};

export const aggregateTopProducts = async ({ startDate, endDate, limit = 10 }) =>
    Order.aggregate([
        {
            $match: {
                createdAt: { $gte: startDate, $lte: endDate },
                orderStatus: { $nin: SALES_EXCLUDED }
            }
        },
        { $unwind: '$orderItems' },
        { $match: { 'orderItems.status': { $nin: ['cancelled', 'returned'] } } },
        {
            $group: {
                _id: '$orderItems.productId',
                unitsSold: { $sum: '$orderItems.quantity' },
                revenue: { $sum: { $multiply: ['$orderItems.price', '$orderItems.quantity'] } }
            }
        },
        { $sort: { unitsSold: -1 } },
        { $limit: limit },
        {
            $lookup: {
                from: 'products',
                localField: '_id',
                foreignField: '_id',
                as: 'product'
            }
        },
        { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
        {
            $project: {
                _id: 1,
                unitsSold: 1,
                revenue: 1,
                productName: '$product.productName',
                brand: '$product.brand',
                category: '$product.category'
            }
        }
    ]);

export const aggregateTopCategories = async ({ startDate, endDate, limit = 10 }) =>
    Order.aggregate([
        {
            $match: {
                createdAt: { $gte: startDate, $lte: endDate },
                orderStatus: { $nin: SALES_EXCLUDED }
            }
        },
        { $unwind: '$orderItems' },
        { $match: { 'orderItems.status': { $nin: ['cancelled', 'returned'] } } },
        {
            $lookup: {
                from: 'products',
                localField: 'orderItems.productId',
                foreignField: '_id',
                as: 'product'
            }
        },
        { $unwind: '$product' },
        {
            $group: {
                _id: '$product.category',
                unitsSold: { $sum: '$orderItems.quantity' },
                revenue: { $sum: { $multiply: ['$orderItems.price', '$orderItems.quantity'] } }
            }
        },
        { $sort: { unitsSold: -1 } },
        { $limit: limit },
        {
            $lookup: {
                from: 'categories',
                localField: '_id',
                foreignField: '_id',
                as: 'category'
            }
        },
        { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
        {
            $project: {
                _id: 1,
                unitsSold: 1,
                revenue: 1,
                categoryName: '$category.categoryName'
            }
        }
    ]);

export const aggregateTopBrands = async ({ startDate, endDate, limit = 10 }) =>
    Order.aggregate([
        {
            $match: {
                createdAt: { $gte: startDate, $lte: endDate },
                orderStatus: { $nin: SALES_EXCLUDED }
            }
        },
        { $unwind: '$orderItems' },
        { $match: { 'orderItems.status': { $nin: ['cancelled', 'returned'] } } },
        {
            $lookup: {
                from: 'products',
                localField: 'orderItems.productId',
                foreignField: '_id',
                as: 'product'
            }
        },
        { $unwind: '$product' },
        { $match: { 'product.brand': { $ne: '' } } },
        {
            $group: {
                _id: '$product.brand',
                unitsSold: { $sum: '$orderItems.quantity' },
                revenue: { $sum: { $multiply: ['$orderItems.price', '$orderItems.quantity'] } }
            }
        },
        { $sort: { unitsSold: -1 } },
        { $limit: limit }
    ]);

export const getQuickStats = async () => {
    const [totalProducts, totalUsers] = await Promise.all([
        Product.countDocuments(),
        Product.distinct('brand').then(r => r.filter(Boolean).length)
    ]);
    return { totalProducts, totalBrands: totalUsers };
};
