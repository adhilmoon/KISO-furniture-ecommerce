import Order from '../../model/Order.js';

export const getOrders = async ({ page, perPage, search, status, sort }) => {
  const filter = {};
  if (search) {
    filter.$or = [
      { orderId: { $regex: search, $options: 'i' } }
    ];
  }
  if (status) filter.orderStatus = status;

  const sortMap = {
    newest:       { createdAt: -1 },
    oldest:       { createdAt:  1 },
    'total-high': { grandTotal: -1 },
    'total-low':  { grandTotal:  1 }
  };
  const sortCriteria = sortMap[sort] || sortMap.newest;
  const skip = (page - 1) * perPage;

  const [total, orders] = await Promise.all([
    Order.countDocuments(filter),
    Order.find(filter)
      .populate('userId', 'name email phone')
      .populate('orderItems.productId', 'productName variants')
      .sort(sortCriteria)
      .skip(skip)
      .limit(perPage)
      .lean()
  ]);
  return { total, orders };
};

export const getOrder = async (id) => {
  return Order.findById(id)
    .populate('userId', 'name email phone')
    .populate('orderItems.productId', 'productName variants')
    .lean();
};

export const updateStatus = async (id, newStatus) => {
  const order = await Order.findById(id);
  if (!order) throw new Error('Order not found');

  order.orderStatus = newStatus;

  const itemStatusMap = {
    shipped:          'shipped',
    out_for_delivery: 'shipped',
    delivered:        'delivered',
    cancelled:        'cancelled'
  };
  const itemStatus = itemStatusMap[newStatus];

  if (itemStatus) {
    for (const item of order.orderItems) {
      if (item.status !== 'cancelled' && item.status !== 'returned') {
        item.status = itemStatus;
        if (newStatus === 'delivered') item.deliveredAt = new Date();
        if (newStatus === 'shipped' || newStatus === 'out_for_delivery') item.shippedAt = new Date();
      }
    }
  }

  if (newStatus === 'delivered' && order.paymentMethod === 'cod' && order.paymentStatus !== 'paid') {
    order.paymentStatus = 'paid';
  }

  await order.save();
  return order;
};

export const markCODPaid = async (id) => {
  const order = await Order.findById(id);
  if (!order) throw new Error('Order not found');
  if (order.paymentMethod !== 'cod') throw new Error('Not a COD order');
  if (order.paymentStatus === 'paid') throw new Error('Already paid');
  order.paymentStatus = 'paid';
  await order.save();
  return order;
};

export const approveReturn = async (id) => {
  const order = await Order.findById(id);
  if (!order) throw new Error('Order not found');
  if (order.orderStatus !== 'return_requested') throw new Error('No pending return request');
  order.orderStatus = 'returned';
  order.paymentStatus = 'refunded';
  order.returnApprovedAt = new Date();
  for (const item of order.orderItems) {
    if (item.status === 'returned') item.returnRequestedAt = item.returnRequestedAt || new Date();
  }
  await order.save();
  return order;
};
