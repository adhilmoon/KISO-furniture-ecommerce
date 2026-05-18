import catchAsync from '../../utilities/catchAsync.js';
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
