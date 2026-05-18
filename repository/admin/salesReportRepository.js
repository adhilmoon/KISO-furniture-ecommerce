import Order from '../../model/Order.js';

const EXCLUDED_STATUSES = ['cancelled', 'returned'];

export const aggregateSummary = async ({ startDate, endDate }) => {
    const match = {
        createdAt: { $gte: startDate, $lte: endDate },
        orderStatus: { $nin: EXCLUDED_STATUSES }
    };
    const [summary] = await Order.aggregate([
        { $match: match },
        {
            $group: {
                _id: null,
                totalOrders: { $sum: 1 },
                totalSales: { $sum: '$subtotal' },
                totalCouponDiscount: { $sum: { $ifNull: ['$couponDiscount', 0] } },
                totalItemDiscount: { $sum: { $ifNull: ['$discount', 0] } },
                totalRevenue: { $sum: '$grandTotal' },
                totalWalletPaid: { $sum: { $ifNull: ['$walletPaid', 0] } }
            }
        }
    ]);

    const refundMatch = {
        createdAt: { $gte: startDate, $lte: endDate },
        orderStatus: { $in: ['cancelled', 'returned'] },
        paymentStatus: 'refunded'
    };
    const [refunds] = await Order.aggregate([
        { $match: refundMatch },
        {
            $group: {
                _id: null,
                totalRefunds: { $sum: 1 },
                totalRefundAmount: { $sum: '$grandTotal' }
            }
        }
    ]);

    return {
        totalOrders: summary?.totalOrders || 0,
        totalSales: summary?.totalSales || 0,
        totalCouponDiscount: summary?.totalCouponDiscount || 0,
        totalItemDiscount: summary?.totalItemDiscount || 0,
        totalRevenue: summary?.totalRevenue || 0,
        totalWalletPaid: summary?.totalWalletPaid || 0,
        totalRefunds: refunds?.totalRefunds || 0,
        totalRefundAmount: refunds?.totalRefundAmount || 0
    };
};

export const findOrdersInRange = async ({ startDate, endDate }, { skip = 0, limit = 1000 } = {}) =>
    Order.find({ createdAt: { $gte: startDate, $lte: endDate } })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'name email')
        .lean();

export const aggregateDailyBreakdown = async ({ startDate, endDate }) =>
    Order.aggregate([
        {
            $match: {
                createdAt: { $gte: startDate, $lte: endDate },
                orderStatus: { $nin: EXCLUDED_STATUSES }
            }
        },
        {
            $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                orders: { $sum: 1 },
                sales: { $sum: '$subtotal' },
                revenue: { $sum: '$grandTotal' },
                couponDiscount: { $sum: { $ifNull: ['$couponDiscount', 0] } }
            }
        },
        { $sort: { _id: 1 } }
    ]);
