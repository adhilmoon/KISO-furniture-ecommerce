import Order from '../../model/Order.js';

export const findOrders = async (filter, { skip, limit }) =>
    Order.find(filter)
        .populate('orderItems.productId', 'productName variants')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

export const countOrders = async (filter) => Order.countDocuments(filter);

export const findOrderDoc = async (id, userId) =>
    Order.findOne({ _id: id, userId });

export const findOrderPopulated = async (id, userId) =>
    Order.findOne({ _id: id, userId })
        .populate('orderItems.productId', 'productName variants images')
        .lean();

export const findOrderLean = async (id, userId) =>
    Order.findOne({ _id: id, userId })
        .populate('orderItems.productId', 'productName')
        .lean();

export const findOrderWithItems = async (id, userId) =>
    Order.findOne({ _id: id, userId }).populate('orderItems.productId');

export const createOrder = async (data) => Order.create(data);
