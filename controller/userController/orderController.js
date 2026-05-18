import catchAsync from '../../utilities/catchAsync.js';
import { STATUS_CODES } from '../../constants/index.js';
import PDFDocument from 'pdfkit';
import { uploadToCloudinary } from '../../utilities/uploadToCloudinary.js';
import * as orderService from '../../service/user/orderService.js';

const IMAGE_REQUIRED_REASONS = ['damaged', 'wrong_item', 'defective'];

export const getOrders = catchAsync(async (req, res) => {
    const userId = req.session.user._id;
    const pageNum = parseInt(req.query.page) || 1;
    const perPage = 8;
    const search = req.query.search?.trim() || '';

    const { total, orders } = await orderService.getOrders(userId, { page: pageNum, perPage, search });

    res.render('user/orders', {
        title: 'My Orders - KISO',
        orders,
        pageNum,
        totalPages: Math.ceil(total / perPage),
        totalOrders: total,
        search,
        isProfilePage: true,
        currentPage: 'orders'
    });
});

export const getOrderDetail = catchAsync(async (req, res) => {
    const userId = req.session.user._id;
    const order = await orderService.getOrder(req.params.id, userId);
    if (!order) return res.redirect('/user/orders');

    res.render('user/order-detail', {
        title: `Order ${orderService.displayOrderId(order)} - KISO`,
        order,
        displayOrderId: orderService.displayOrderId(order),
        isProfilePage: true,
        currentPage: 'orders'
    });
});

export const cancelOrder = catchAsync(async (req, res) => {
    const userId = req.session.user._id;
    const { reason } = req.body;
    await orderService.cancelOrder(req.params.id, userId, reason);
    res.json({ success: true, message: 'Order cancelled successfully' });
});

export const cancelItem = catchAsync(async (req, res) => {
    const userId = req.session.user._id;
    const { itemId } = req.params;
    const { reason } = req.body;
    await orderService.cancelItem(req.params.id, itemId, userId, reason);
    res.json({ success: true, message: 'Item cancelled successfully' });
});

export const returnOrder = catchAsync(async (req, res) => {
    const userId = req.session.user._id;
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: 'Return reason is required' });
    }
    if (IMAGE_REQUIRED_REASONS.includes(reason) && !req.file) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: 'Image proof is required for this return reason' });
    }

    let imageUrl = null;
    if (req.file) {
        const result = await uploadToCloudinary(req.file.buffer, 'kiso_returns');
        imageUrl = result.secure_url;
    }

    await orderService.requestReturn(req.params.id, userId, reason, imageUrl);
    res.json({ success: true, message: 'Return request submitted successfully' });
});

export const cancelReturnRequest = catchAsync(async (req, res) => {
    const userId = req.session.user._id;
    await orderService.cancelReturnRequest(req.params.id, userId);
    res.json({ success: true, message: 'Return request cancelled' });
});

export const downloadInvoice = catchAsync(async (req, res) => {
    const userId = req.session.user._id;
    const order = await orderService.getOrderForInvoice(req.params.id, userId);
    if (!order) return res.redirect('/user/orders');

    const oid = orderService.displayOrderId(order);
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${oid}.pdf"`);
    doc.pipe(res);

    doc.fontSize(22).font('Helvetica-Bold').text('KISO', 50, 50);
    doc.fontSize(10).font('Helvetica').fillColor('#888').text('Premium Furniture', 50, 76);
    doc.fillColor('#000').fontSize(18).font('Helvetica-Bold').text('INVOICE', 400, 50, { align: 'right' });
    doc.moveTo(50, 100).lineTo(545, 100).stroke('#ddd');

    const orderDate = new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    doc.fontSize(10).font('Helvetica').fillColor('#444');
    doc.text(`Order ID: ${oid}`, 50, 115);
    doc.text(`Date: ${orderDate}`, 50, 130);
    doc.text(`Payment: ${order.paymentMethod.toUpperCase()}`, 50, 145);
    doc.text(`Status: ${order.orderStatus.toUpperCase()}`, 50, 160);

    const addr = order.shippingAddress;
    doc.font('Helvetica-Bold').fillColor('#000').text('Ship To:', 350, 115);
    doc.font('Helvetica').fillColor('#444')
        .text(addr.name, 350, 130)
        .text(`${addr.streetAddress}, ${addr.city}`, 350, 145)
        .text(`${addr.state} - ${addr.pincode}`, 350, 160)
        .text(`Ph: ${addr.phone}`, 350, 175);

    doc.moveTo(50, 200).lineTo(545, 200).stroke('#ddd');
    doc.rect(50, 210, 495, 22).fill('#f5f5f5');
    doc.fillColor('#000').font('Helvetica-Bold').fontSize(9);
    doc.text('Product', 58, 217);
    doc.text('Qty', 360, 217, { width: 50, align: 'center' });
    doc.text('Unit Price', 415, 217, { width: 70, align: 'right' });
    doc.text('Total', 490, 217, { width: 55, align: 'right' });

    let y = 240;
    doc.font('Helvetica').fontSize(9).fillColor('#222');
    for (const item of order.orderItems) {
        const name = item.productId?.productName || 'Product';
        const lineTotal = item.price * item.quantity;
        doc.text(name, 58, y, { width: 290 });
        doc.text(String(item.quantity), 360, y, { width: 50, align: 'center' });
        doc.text(`Rs. ${item.price.toLocaleString()}`, 415, y, { width: 70, align: 'right' });
        doc.text(`Rs. ${lineTotal.toLocaleString()}`, 490, y, { width: 55, align: 'right' });
        y += 20;
        doc.moveTo(50, y - 2).lineTo(545, y - 2).stroke('#eee');
    }

    doc.moveTo(50, y + 5).lineTo(545, y + 5).stroke('#ddd');
    y += 15;
    doc.font('Helvetica').fontSize(10).fillColor('#444');
    doc.text('Subtotal:', 380, y);
    doc.text(`Rs. ${order.subtotal.toLocaleString()}`, 490, y, { width: 55, align: 'right' });
    y += 18;
    doc.text('Shipping:', 380, y);
    doc.fillColor('#16a34a').text('FREE', 490, y, { width: 55, align: 'right' });
    if (order.discount > 0) {
        y += 18;
        doc.fillColor('#444').text('Discount:', 380, y);
        doc.fillColor('#16a34a').text(`-Rs. ${order.discount.toLocaleString()}`, 490, y, { width: 55, align: 'right' });
    }
    y += 20;
    doc.moveTo(370, y).lineTo(545, y).stroke('#ddd');
    y += 8;
    doc.font('Helvetica-Bold').fontSize(12).fillColor('#000');
    doc.text('Grand Total:', 370, y);
    doc.text(`Rs. ${order.grandTotal.toLocaleString()}`, 490, y, { width: 55, align: 'right' });

    doc.fontSize(8).font('Helvetica').fillColor('#aaa')
        .text('Thank you for shopping with KISO!', 50, 760, { align: 'center', width: 495 });

    doc.end();
});
