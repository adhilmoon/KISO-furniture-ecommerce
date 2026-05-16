import * as orderRepository from '../../repository/user/orderRepository.js';
import * as productRepository from '../../repository/user/productRepository.js';

const CANCELLABLE_STATUSES = ['pending', 'confirmed', 'processing'];

export const displayOrderId = (order) =>
    order.orderId || `#${order._id.toString().slice(-8).toUpperCase()}`;

export const getOrders = async (userId, { page, perPage, search }) => {
    const filter = { userId };
    if (search) filter.$or = [{ orderId: { $regex: search, $options: 'i' } }];
    const skip = (page - 1) * perPage;
    const [total, orders] = await Promise.all([
        orderRepository.countOrders(filter),
        orderRepository.findOrders(filter, { skip, limit: perPage })
    ]);
    return { total, orders };
};

export const getOrder = async (orderId, userId) =>
    orderRepository.findOrderPopulated(orderId, userId);

export const cancelOrder = async (orderId, userId, reason) => {
    const order = await orderRepository.findOrderDoc(orderId, userId);
    if (!order) throw Object.assign(new Error('Order not found'), { status: 404 });
    if (!CANCELLABLE_STATUSES.includes(order.orderStatus)) {
        throw Object.assign(new Error('Order cannot be cancelled at this stage'), { status: 400 });
    }
    for (const item of order.orderItems) {
        if (item.status !== 'cancelled') {
            item.status = 'cancelled';
            item.cancellationReason = reason || '';
            await productRepository.updateVariantStock(item.productId, item.variantIndex, item.quantity);
        }
    }
    order.orderStatus = 'cancelled';
    order.cancellationReason = reason || '';
    await order.save();
};

export const cancelItem = async (orderId, itemId, userId, reason) => {
 
     
    const order = await orderRepository.findOrderDoc(orderId, userId);
    if (!order) throw Object.assign(new Error('Order not found'), { status: 404 });
    const item = order.orderItems.id(itemId);
    if (!item) throw Object.assign(new Error('Item not found'), { status: 404 });
    if (item.status !== 'processing') {
        throw Object.assign(new Error('Item cannot be cancelled at this stage'), { status: 400 });
    }
    item.status = 'cancelled';
    item.cancellationReason = reason || '';
    console.log(`${item.productId}and ${item.variantIndex}and ${item.quantity}`)
    await productRepository.updateVariantStock(item.productId, item.variantIndex, item.quantity);
    if (order.orderItems.every(i => i.status === 'cancelled')) order.orderStatus = 'cancelled';
    await order.save();
   
    
};

export const requestReturn = async (orderId, userId, reason, imageUrl) => {
    const order = await orderRepository.findOrderDoc(orderId, userId);
    if (!order) throw Object.assign(new Error('Order not found'), { status: 404 });
    const hasDelivered = order.orderItems.some(i => i.status === 'delivered');
    if (!hasDelivered && order.orderStatus !== 'delivered') {
        throw Object.assign(new Error('Order must be delivered before requesting a return'), { status: 400 });
    }
    for (const item of order.orderItems) {
        if (item.status === 'delivered') {
            item.status = 'returned';
            item.returnReason = reason.trim();
            item.returnImage = imageUrl;
            item.returnRequestedAt = new Date();
        }
    }
    order.orderStatus = 'return_requested';
    order.returnReason = reason.trim();
    order.returnImage = imageUrl;
    await order.save();
};

export const getOrderForInvoice = async (orderId, userId) =>
    orderRepository.findOrderLean(orderId, userId);
