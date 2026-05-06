import catchAsync from '../../utilities/catchAsync.js';
import { STATUS_CODES } from '../../constants/index.js';
import * as orderService from '../../service/admin/adminOrderService.js';

const displayOrderId = (order) =>
  order.orderId || `#${order._id.toString().slice(-8).toUpperCase()}`;

const STATUS_OPTIONS = ['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];

export const getOrders = catchAsync(async (req, res) => {
  const page    = parseInt(req.query.page)  || 1;
  const perPage = 5;
  const search  = req.query.search?.trim()  || '';
  const status  = req.query.status          || '';
  const sort    = req.query.sort            || 'newest';

  const { total, orders } = await orderService.getOrders({ page, perPage, search, status, sort });

  orders.forEach(o => { o.displayId = displayOrderId(o); });

  res.render('admin/orders', {
    title: 'Order Management',
    layout: 'layouts/admin',
    showSidebar: true,
    orders,
    pageNum: page,
    totalPages: Math.ceil(total / perPage),
    totalOrders: total,
    search,
    status,
    sort,
    STATUS_OPTIONS
  });
});

export const getOrderDetail = catchAsync(async (req, res) => {
  const order = await orderService.getOrder(req.params.id);
  if (!order) return res.redirect('/admin/orders');

  res.render('admin/order-detail', {
    title: `Order ${displayOrderId(order)}`,
    layout: 'layouts/admin',
    showSidebar: true,
    order,
    displayId: displayOrderId(order),
    STATUS_OPTIONS
  });
});

export const updateOrderStatus = catchAsync(async (req, res) => {
  const { status } = req.body;
  if (!STATUS_OPTIONS.includes(status)) {
    return res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: 'Invalid status' });
  }
  await orderService.updateStatus(req.params.id, status);
  res.json({ success: true, message: 'Order status updated' });
});
