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
    const shortUid = String(userId).slice(-8);
    const options = {
        amount: value * 100,
        currency: 'INR',
        receipt: `wtu_${shortUid}_${Date.now()}`,
        notes: { userId: String(userId), purpose: 'wallet_topup' }
    };
    return razorpay.orders.create(options);
};

export const verifyTopup = async (userId, { razorpay_order_id, razorpay_payment_id, razorpay_signature }) => {
    if (typeof razorpay_signature !== 'string') throw buildError(MESSAGES.WALLET_TOPUP_FAILED, 400);
    const sign = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expected = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(sign)
        .digest('hex');
    const expectedBuf = Buffer.from(expected, 'hex');
    let sigBuf;
    try { sigBuf = Buffer.from(razorpay_signature, 'hex'); }
    catch { throw buildError(MESSAGES.WALLET_TOPUP_FAILED, 400); }
    if (expectedBuf.length !== sigBuf.length || !crypto.timingSafeEqual(expectedBuf, sigBuf)) {
        throw buildError(MESSAGES.WALLET_TOPUP_FAILED, 400);
    }
    const rzpOrder = await razorpay.orders.fetch(razorpay_order_id);
    if (!rzpOrder) throw buildError(MESSAGES.WALLET_TOPUP_FAILED, 400);
    if (String(rzpOrder.notes?.userId || '') !== String(userId)) {
        throw buildError(MESSAGES.WALLET_TOPUP_FAILED, 403);
    }
    const paidPaise = rzpOrder.amount_paid || rzpOrder.amount;
    const amountRupees = Math.round(paidPaise / 100);
    if (!paidPaise || amountRupees <= 0) throw buildError(MESSAGES.WALLET_TOPUP_FAILED, 400);
    await creditWallet(userId, amountRupees, 'wallet_topup', {
        description: `Top-up via Razorpay (${razorpay_payment_id})`
    });
};
