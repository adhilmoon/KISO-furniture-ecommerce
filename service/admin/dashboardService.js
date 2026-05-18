import * as dashboardRepository from '../../repository/admin/dashboardRepository.js';
import { resolvePeriod, formatDateRangeLabel } from '../../utilities/dateRange.js';

const groupByForPeriod = (period) => {
    if (period === 'yearly') return 'month';
    if (period === 'monthly') return 'day';
    if (period === 'weekly') return 'day';
    return 'day';
};

export const getChartData = async ({ period, startDate, endDate }) => {
    const range = resolvePeriod(period, startDate, endDate);
    const groupBy = groupByForPeriod(period);
    const rows = await dashboardRepository.aggregateChartData({ ...range, groupBy });
    return {
        period,
        groupBy,
        label: formatDateRangeLabel(range.startDate, range.endDate),
        labels: rows.map(r => r._id),
        orders: rows.map(r => r.orders),
        revenue: rows.map(r => r.revenue)
    };
};

export const getTopAnalytics = async ({ period, startDate, endDate, limit = 10 }) => {
    const range = resolvePeriod(period, startDate, endDate);
    const [products, categories, brands] = await Promise.all([
        dashboardRepository.aggregateTopProducts({ ...range, limit }),
        dashboardRepository.aggregateTopCategories({ ...range, limit }),
        dashboardRepository.aggregateTopBrands({ ...range, limit })
    ]);
    return { products, categories, brands };
};
