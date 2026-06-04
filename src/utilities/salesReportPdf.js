import PDFDocument from 'pdfkit';

const fmt = (n) => Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });

// ─── Header ──────────────────────────────────────────────────────────────────
const drawHeader = (doc, label) => {
    doc.fontSize(22).font('Helvetica-Bold').fillColor('#000').text('KISO', 50, 50);
    doc.fontSize(10).font('Helvetica').fillColor('#888').text('Premium Furniture', 50, 76);
    doc.fillColor('#000').fontSize(18).font('Helvetica-Bold').text('SALES REPORT', 400, 50, { align: 'right' });
    doc.fontSize(10).font('Helvetica').fillColor('#444').text(label, 400, 76, { align: 'right' });
    doc.moveTo(50, 100).lineTo(545, 100).stroke('#ddd');
};

// ─── Summary cards ───────────────────────────────────────────────────────────
const drawSummary = (doc, summary, y) => {
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#000').text('Summary', 50, y);
    y += 20;
    const rows = [
        ['Total Orders',           String(summary.totalOrders)],
        ['Total Sales (subtotal)', `Rs. ${fmt(summary.totalSales)}`],
        ['Coupon Deductions',      `Rs. ${fmt(summary.totalCouponDiscount)}`],
        ['Item-level Discounts',   `Rs. ${fmt(summary.totalItemDiscount)}`],
        ['Wallet Paid',            `Rs. ${fmt(summary.totalWalletPaid)}`],
        ['Net Revenue',            `Rs. ${fmt(summary.totalRevenue)}`],
        ['Refunds Issued',         String(summary.totalRefunds)],
        ['Refund Amount',          `Rs. ${fmt(summary.totalRefundAmount)}`]
    ];
    doc.fontSize(10).font('Helvetica').fillColor('#222');
    for (const [label, value] of rows) {
        doc.text(label, 50, y, { width: 240 });
        doc.text(value, 290, y, { width: 200, align: 'right' });
        y += 16;
        doc.moveTo(50, y - 2).lineTo(545, y - 2).stroke('#eee');
    }
    return y + 14;
};

// ─── Orders table ─────────────────────────────────────────────────────────────
// Columns: Order ID | Date | Status | Method | Coupon | Discount | Total
const COL = {
    orderId:  { x: 50,  w: 110 },
    date:     { x: 160, w: 72  },
    status:   { x: 232, w: 68  },
    method:   { x: 300, w: 60  },
    coupon:   { x: 360, w: 55  },
    discount: { x: 415, w: 60  },
    total:    { x: 475, w: 70  }
};

const ROW_H   = 18;
const HEADER_H = 22;

const drawTableHeader = (doc, y) => {
    doc.rect(50, y, 495, HEADER_H).fill('#f5f5f5');
    doc.fillColor('#000').font('Helvetica-Bold').fontSize(8);
    doc.text('Order ID',  COL.orderId.x + 2,  y + 7, { width: COL.orderId.w });
    doc.text('Date',      COL.date.x,          y + 7, { width: COL.date.w });
    doc.text('Status',    COL.status.x,         y + 7, { width: COL.status.w });
    doc.text('Method',    COL.method.x,         y + 7, { width: COL.method.w });
    doc.text('Coupon',    COL.coupon.x,         y + 7, { width: COL.coupon.w });
    doc.text('Discount',  COL.discount.x,       y + 7, { width: COL.discount.w, align: 'right' });
    doc.text('Total',     COL.total.x,          y + 7, { width: COL.total.w,    align: 'right' });
    return y + HEADER_H;
};

const statusColor = (status) => {
    switch ((status || '').toLowerCase()) {
        case 'delivered':  return '#16a34a';
        case 'cancelled':  return '#dc2626';
        case 'returned':
        case 'refunded':   return '#d97706';
        case 'processing': return '#2563eb';
        default:           return '#555';
    }
};

const drawOrdersTable = (doc, orders, y) => {
    if (!orders || orders.length === 0) return y;

    doc.fontSize(12).font('Helvetica-Bold').fillColor('#000').text('Orders', 50, y);
    y += 16;

    y = drawTableHeader(doc, y);

    doc.fontSize(8).font('Helvetica');

    for (const o of orders) {
        // page break
        if (y + ROW_H > 780) {
            doc.addPage();
            y = 50;
            y = drawTableHeader(doc, y);
            doc.fontSize(8).font('Helvetica');
        }

        const orderId   = o.orderId || String(o._id).slice(-10).toUpperCase();
        const date      = new Date(o.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
        const status    = o.orderStatus || '-';
        const method    = o.paymentMethod || '-';
        const coupon    = o.couponCode || '-';
        const discount  = o.couponDiscount ? `Rs. ${fmt(o.couponDiscount)}` : '-';
        const total     = `Rs. ${fmt(o.grandTotal)}`;

        doc.fillColor('#222').text(`#${orderId}`, COL.orderId.x + 2, y, { width: COL.orderId.w });
        doc.fillColor('#444').text(date,           COL.date.x,        y, { width: COL.date.w });
        doc.fillColor(statusColor(status)).font('Helvetica-Bold')
            .text(status.charAt(0).toUpperCase() + status.slice(1), COL.status.x, y, { width: COL.status.w });
        doc.fillColor('#444').font('Helvetica')
            .text(method,   COL.method.x,   y, { width: COL.method.w });
        doc.fillColor(coupon !== '-' ? '#2563eb' : '#aaa').font(coupon !== '-' ? 'Helvetica-Bold' : 'Helvetica')
            .text(coupon,   COL.coupon.x,   y, { width: COL.coupon.w });
        doc.fillColor(o.couponDiscount ? '#d97706' : '#aaa').font(o.couponDiscount ? 'Helvetica-Bold' : 'Helvetica')
            .text(discount, COL.discount.x, y, { width: COL.discount.w, align: 'right' });
        doc.fillColor('#111').font('Helvetica-Bold')
            .text(total,    COL.total.x,    y, { width: COL.total.w,    align: 'right' });

        y += ROW_H;
        doc.moveTo(50, y - 2).lineTo(545, y - 2).strokeColor('#eee').stroke();
    }

    return y;
};

// ─── Main export ─────────────────────────────────────────────────────────────
export const streamSalesReportPdf = (res, { label, summary, breakdown, orders }) => {
    const filename = `sales-report-${Date.now()}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    doc.pipe(res);

    drawHeader(doc, label);
    let y = 120;
    y = drawSummary(doc, summary, y);
    y = drawOrdersTable(doc, orders, y);

    // footer on last page
    doc.fontSize(8).font('Helvetica').fillColor('#aaa')
        .text('Generated by KISO Admin', 50, 820, { align: 'center', width: 495 });

    doc.end();
};
