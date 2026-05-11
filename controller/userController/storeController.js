import { STATUS_CODES } from '../../constants/index.js';
import catchAsync from '../../utilities/catchAsync.js';
import * as storeService from '../../service/user/storeService.js';

export const getFilterOptions = catchAsync(async (req, res) => {
    const data = await storeService.getFilterOptions();
    return res.status(STATUS_CODES.OK).json({ success: true, data });
});