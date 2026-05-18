import catchAsync from '../../utilities/catchAsync.js';
import { STATUS_CODES, MESSAGES } from '../../constants/index.js';
import * as walletService from '../../service/user/walletService.js';

export const getWalletPage = catchAsync(async (req, res) => {
    const userId = req.session.user._id;
    const page = parseInt(req.query.page) || 1;
    const perPage = 10;

    const { wallet, transactions, total } = await walletService.getWalletWithTransactions(userId, { page, perPage });

    res.render('user/wallet', {
        title: 'My Wallet - KISO',
        wallet,
        transactions,
        pageNum: page,
        totalPages: Math.ceil(total / perPage),
        isProfilePage: true,
        currentPage: 'wallet'
    });
});

export const getBalance = catchAsync(async (req, res) => {
    const userId = req.session.user._id;
    const balance = await walletService.getBalance(userId);
    res.json({ success: true, balance });
});

export const createTopupOrder = catchAsync(async (req, res) => {
    const userId = req.session.user._id;
    const { amount } = req.body;
    const order = await walletService.createTopupOrder(userId, amount);
    res.status(STATUS_CODES.OK).json({
        success: true,
        message: MESSAGES.WALLET_TOPUP_INITIATED,
        order,
        razorpayKeyId: process.env.RAZORPAY_KEY_ID
    });
});

export const verifyTopup = catchAsync(async (req, res) => {
    const userId = req.session.user._id;
    await walletService.verifyTopup(userId, req.body);
    res.status(STATUS_CODES.OK).json({
        success: true,
        message: MESSAGES.WALLET_TOPUP_SUCCESS
    });
});
