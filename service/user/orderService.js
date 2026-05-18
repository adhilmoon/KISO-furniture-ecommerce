import * as orderRepository from '../../repository/user/orderRepository.js';
import * as productRepository from '../../repository/user/productRepository.js';

const CANCELLABLE_STATUSES = ['pending', 'confirmed', 'processing'];
const RETURN_WINDOW_DAYS = 30;
const MAX_RETURN_ATTEMPTS = 3;
const RETURN_FINAL_STATUSES = ['returned'];

const getDeliveredAt = (order) =>
    order.orderItems.find(i => i.deliveredAt)?.deliveredAt || order.updatedAt;

const assertReturnEligible = (order) => {
    if(order.orderStatus === 'return_requested') {
        throw Object.assign(new Error('Return already in progress for this order'), {status: 400});
    }
    if(RETURN_FINAL_STATUSES.includes(order.orderStatus)) {
        throw Object.assign(new Error('Return already finalized for this order'), {status: 400});
    }
    const hasDelivered = order.orderItems.some(i => i.status === 'delivered');
    if(!hasDelivered && order.orderStatus !== 'delivered') {
        throw Object.assign(new Error('Order must be delivered before requesting a return'), {status: 400});
    }
    const deliveredAt = getDeliveredAt(order);
    if(deliveredAt && Date.now() - new Date(deliveredAt).getTime() > RETURN_WINDOW_DAYS * 24 * 60 * 60 * 1000) {
        throw Object.assign(new Error(`Return window expired (${RETURN_WINDOW_DAYS} days from delivery)`), {status: 400});
    }
    if((order.returnAttempts || 0) >= MAX_RETURN_ATTEMPTS) {
        throw Object.assign(new Error(`Maximum return attempts (${MAX_RETURN_ATTEMPTS}) reached. Contact support.`), {status: 400});
    }
};

const clearOrderReturnFields = (order) => {
    order.returnReason = undefined;
    order.returnImage = undefined;
    order.returnRequestedAt = undefined;
};

const clearItemReturnFields = (item) => {
    item.returnReason = undefined;
    item.returnImage = undefined;
    item.returnRequestedAt = undefined;
};

export const displayOrderId = (order) =>
    order.orderId || `#${order._id.toString().slice(-8).toUpperCase()}`;

export const getOrders = async (userId, {page, perPage, search}) => {
    const filter = {userId};
    if(search) filter.$or = [{orderId: {$regex: search, $options: 'i'}}];
    const skip = (page - 1) * perPage;
    const [total, orders] = await Promise.all([
        orderRepository.countOrders(filter),
        orderRepository.findOrders(filter, {skip, limit: perPage})
    ]);
    return {total, orders};
};

export const getOrder = async (orderId, userId) =>
    orderRepository.findOrderPopulated(orderId, userId);

export const cancelOrder = async (orderId, userId, reason) => {
    const order = await orderRepository.findOrderDoc(orderId, userId);
    if(!order) throw Object.assign(new Error('Order not found'), {status: 404});
    if(!CANCELLABLE_STATUSES.includes(order.orderStatus)) {
        throw Object.assign(new Error('Order cannot be cancelled at this stage'), {status: 400});
    }
    for(const item of order.orderItems) {
        if(item.status !== 'cancelled') {
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
    if(!order) throw Object.assign(new Error('Order not found'), {status: 404});
    const item = order.orderItems.id(itemId);
    if(!item) throw Object.assign(new Error('Item not found'), {status: 404});
    if(item.status !== 'processing') {
        throw Object.assign(new Error('Item cannot be cancelled at this stage'), {status: 400});
    }
    item.status = 'cancelled';
    item.cancellationReason = reason || '';
    console.log(`${item.productId}and ${item.variantIndex}and ${item.quantity}`)
    await productRepository.updateVariantStock(item.productId, item.variantIndex, item.quantity);
    if(order.orderItems.every(i => i.status === 'cancelled')) order.orderStatus = 'cancelled';
    await order.save();


};

export const requestReturn = async (orderId, userId, reason, imageUrl) => {
    const order = await orderRepository.findOrderDoc(orderId, userId);
    if(!order) throw Object.assign(new Error('Order not found'), {status: 404});
    assertReturnEligible(order);
    const now = new Date();
    for(const item of order.orderItems) {
        if(item.status === 'delivered') {
            item.status = 'return_requested';
            item.returnReason = reason.trim();
            item.returnImage = imageUrl;
            item.returnRequestedAt = now;
        }
    }
    order.orderStatus = 'return_requested';
    order.returnReason = reason.trim();
    order.returnImage = imageUrl;
    order.returnRequestedAt = now;
    order.returnRejectionReason = undefined;
    order.returnRejectedAt = undefined;
    order.returnAttempts = (order.returnAttempts || 0) + 1;
    await order.save();
};

export const cancelReturnRequest = async (orderId, userId) => {
    const order = await orderRepository.findOrderDoc(orderId, userId);
    if(!order) throw Object.assign(new Error('Order not found'), {status: 404});
    if(order.orderStatus !== 'return_requested') {
        throw Object.assign(new Error('No active return request to cancel'), {status: 400});
    }
    for(const item of order.orderItems) {
        if(item.status === 'return_requested') {
            item.status = 'delivered';
            clearItemReturnFields(item);
        }
    }
    order.orderStatus = 'delivered';
    clearOrderReturnFields(order);
    order.returnCancelledAt = new Date();
    await order.save();
};

export const getOrderForInvoice = async (orderId, userId) =>
    orderRepository.findOrderLean(orderId, userId);
