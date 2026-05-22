import ExcelJS from 'exceljs';

export const streamSalesReportExcel = async (res, { label, summary, breakdown, orders }) => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'KISO Admin';
    workbook.created = new Date();

    // Summary sheet
    const sheet = workbook.addWorksheet('Summary');
    sheet.mergeCells('A1:B1');
    sheet.getCell('A1').value = `KISO Sales Report — ${label}`;
    sheet.getCell('A1').font = { bold: true, size: 14 };

    const rows = [
        ['Total Orders', summary.totalOrders],
        ['Total Sales (subtotal)', summary.totalSales],
        ['Coupon Deductions', summary.totalCouponDiscount],
        ['Item-level Discounts', summary.totalItemDiscount],
        ['Wallet Paid', summary.totalWalletPaid],
        ['Net Revenue', summary.totalRevenue],
        ['Refunds Issued', summary.totalRefunds],
        ['Refund Amount', summary.totalRefundAmount]
    ];
    let rowIdx = 3;
    for (const [label, value] of rows) {
        sheet.getCell(`A${rowIdx}`).value = label;
        sheet.getCell(`A${rowIdx}`).font = { bold: true };
        sheet.getCell(`B${rowIdx}`).value = value;
        rowIdx++;
    }
    sheet.columns = [{ width: 30 }, { width: 25 }];

    // Daily breakdown sheet
    const dailySheet = workbook.addWorksheet('Daily Breakdown');
    dailySheet.columns = [
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Orders', key: 'orders', width: 12 },
        { header: 'Sales', key: 'sales', width: 18 },
        { header: 'Coupon Discount', key: 'couponDiscount', width: 18 },
        { header: 'Revenue', key: 'revenue', width: 18 }
    ];
    dailySheet.getRow(1).font = { bold: true };
    for (const row of breakdown || []) {
        dailySheet.addRow({
            date: row._id,
            orders: row.orders,
            sales: row.sales,
            couponDiscount: row.couponDiscount || 0,
            revenue: row.revenue
        });
    }

    // Orders sheet (if provided)
    if (orders && orders.length > 0) {
        const ordersSheet = workbook.addWorksheet('Orders');
        ordersSheet.columns = [
            { header: 'Order ID', key: 'orderId', width: 22 },
            { header: 'Date', key: 'date', width: 20 },
            { header: 'Customer', key: 'customer', width: 25 },
            { header: 'Payment Method', key: 'paymentMethod', width: 16 },
            { header: 'Status', key: 'orderStatus', width: 16 },
            { header: 'Subtotal', key: 'subtotal', width: 14 },
            { header: 'Coupon', key: 'couponDiscount', width: 14 },
            { header: 'Wallet Paid', key: 'walletPaid', width: 14 },
            { header: 'Grand Total', key: 'grandTotal', width: 14 }
        ];
        ordersSheet.getRow(1).font = { bold: true };
        for (const o of orders) {
            ordersSheet.addRow({
                orderId: o.orderId || String(o._id).slice(-8).toUpperCase(),
                date: new Date(o.createdAt).toLocaleString('en-IN'),
                customer: o.userId?.name || o.userId?.email || '-',
                paymentMethod: o.paymentMethod,
                orderStatus: o.orderStatus,
                subtotal: o.subtotal,
                couponDiscount: o.couponDiscount || 0,
                walletPaid: o.walletPaid || 0,
                grandTotal: o.grandTotal
            });
        }
    }

    const filename = `sales-report-${Date.now()}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    await workbook.xlsx.write(res);
    res.end();
};
