import crypto from 'crypto';
import razorpay from '../../config/razorpay.js';
import * as walletRepository from '../../repository/user/walletRepository.js';
import { MESSAGES } from '../../constants/messages.js';

const buildError = (message, status) =>
    Object.assign(new Error(message), { status });

const sanitizeAmount = (amount) => {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
        throw buildError(MESSAGES.WALLET_INVALID_AMOUNT, 400);
    }
    return Math.round(value);
};

export const getWallet = async (userId) =>
    walletRepository.findOrCreateWallet(userId);

export const getWalletWithTransactions = async (userId, { page, perPage }) => {
    const wallet = await walletRepository.findOrCreateWallet(userId);
    const skip = (page - 1) * perPage;
    const [total, transactions] = await Promise.all([
        walletRepository.countTransactions(userId),
        walletRepository.findTransactions(userId, { skip, limit: perPage })
    ]);
    return { wallet, transactions, total };
};

export const creditWallet = async (userId, amount, source, { orderId, description } = {}) => {
    const value = sanitizeAmount(amount);
    const wallet = await walletRepository.findOrCreateWallet(userId);
    wallet.balance += value;
    await wallet.save();
    return walletRepository.createTransaction({
        walletId: wallet._id,
        userId,
        type: 'credit',
        amount: value,
        source,
        orderId,
        description: description || '',
        balanceAfter: wallet.balance
    });
};

export const debitWallet = async (userId, amount, source, { orderId, description } = {}) => {
    const value = sanitizeAmount(amount);
    const wallet = await walletRepository.findOrCreateWallet(userId);
    if (wallet.balance < value) {
        throw buildError(MESSAGES.WALLET_INSUFFICIENT_BALANCE, 400);
    }
    wallet.balance -= value;
    await wallet.save();
    return walletRepository.createTransaction({
        walletId: wallet._id,
        userId,
        type: 'debit',
        amount: value,
        source,
        orderId,
        description: description || '',
        balanceAfter: wallet.balance
    });
};

export const getBalance = async (userId) => {
    const wallet = await walletRepository.findWalletByUserId(userId);
    return wallet ? wallet.balance : 0;
};

export const createTopupOrder = async (userId, amount) => {
    const value = sanitizeAmount(amount);
    const options = {
        amount: value * 100,
        currency: 'INR',
        receipt: `wallet_topup_${userId}_${Date.now()}`,
        notes: { userId: String(userId), purpose: 'wallet_topup' }
    };
    return razorpay.orders.create(options);
};

export const verifyTopup = async (userId, { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount }) => {
    const sign = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expected = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(sign)
        .digest('hex');
    if (expected !== razorpay_signature) {
        throw buildError(MESSAGES.WALLET_TOPUP_FAILED, 400);
    }
    const value = sanitizeAmount(amount);
    await creditWallet(userId, value, 'wallet_topup', {
        description: `Top-up via Razorpay (${razorpay_payment_id})`
    });
};
