import * as salesReportRepository from '../../repository/admin/salesReportRepository.js';
import { resolvePeriod, formatDateRangeLabel } from '../../utilities/dateRange.js';

export const getReport = async ({ period, startDate, endDate, includeOrders = false }) => {
    const range = resolvePeriod(period, startDate, endDate);
    const [summary, breakdown, orders] = await Promise.all([
        salesReportRepository.aggregateSummary(range),
        salesReportRepository.aggregateDailyBreakdown(range),
        includeOrders ? salesReportRepository.findOrdersInRange(range, { limit: 1000 }) : Promise.resolve([])
    ]);

    return {
        period: period || 'monthly',
        startDate: range.startDate,
        endDate: range.endDate,
        label: formatDateRangeLabel(range.startDate, range.endDate),
        summary,
        breakdown,
        orders
    };
};
