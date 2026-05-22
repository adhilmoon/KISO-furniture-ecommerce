import catchAsync from '../../utilities/catchAsync.js';
import { STATUS_CODES } from '../../constants/index.js';
import * as buyNowService from '../../service/user/buyNowService.js';

export const startBuyNow = catchAsync(async (req, res) => {
    const { productId, variantIndex, quantity } = req.body;
    // Validate up-front so any error surfaces before storing in session
    await buyNowService.buildInstantBuyCart({ productId, variantIndex, quantity });

    req.session.instantBuy = {
        productId,
        variantIndex: Number(variantIndex) || 0,
        quantity: parseInt(quantity, 10) || 1
    };
    return res.status(STATUS_CODES.OK).json({
        success: true,
        redirectUrl: '/user/checkout'
    });
});

export const cancelBuyNow = catchAsync(async (req, res) => {
    buyNowService.clearInstantBuy(req);
    res.status(STATUS_CODES.OK).json({ success: true });
});
