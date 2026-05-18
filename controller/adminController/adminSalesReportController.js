import catchAsync from '../../utilities/catchAsync.js';
import * as salesReportService from '../../service/admin/salesReportService.js';
import { streamSalesReportPdf } from '../../utilities/salesReportPdf.js';
import { streamSalesReportExcel } from '../../utilities/salesReportExcel.js';

export const getSalesReportPage = catchAsync(async (req, res) => {
    const { period = 'monthly', startDate, endDate } = req.query;
    const report = await salesReportService.getReport({ period, startDate, endDate });
    res.render('admin/sales-report', {
        title: 'Sales Report - KISO Admin',
        report,
        period,
        startDate: startDate || '',
        endDate: endDate || ''
    });
});

export const downloadSalesReportPdf = catchAsync(async (req, res) => {
    const { period = 'monthly', startDate, endDate } = req.query;
    const report = await salesReportService.getReport({ period, startDate, endDate });
    streamSalesReportPdf(res, report);
});

export const downloadSalesReportExcel = catchAsync(async (req, res) => {
    const { period = 'monthly', startDate, endDate } = req.query;
    const report = await salesReportService.getReport({ period, startDate, endDate, includeOrders: true });
    await streamSalesReportExcel(res, report);
});
