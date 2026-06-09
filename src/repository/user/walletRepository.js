import Wallet from '../../model/Wallet.js';
import WalletTransaction from '../../model/WalletTransaction.js';

export const findWalletByUserId = async (userId) =>
    Wallet.findOne({ userId });

export const findOrCreateWallet = async (userId) => {
    let wallet = await Wallet.findOne({ userId });
    if (!wallet) wallet = await Wallet.create({ userId, balance: 0 });
    return wallet;
};

export const findWalletDoc = async (userId) => Wallet.findOne({ userId });

export const createTransaction = async (data) =>
    WalletTransaction.create(data);

export const findTransactions = async (userId, { skip, limit }) =>
    WalletTransaction.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('orderId', 'orderId grandTotal')
        .lean();

export const countTransactions = async (userId) =>
    WalletTransaction.countDocuments({ userId });
