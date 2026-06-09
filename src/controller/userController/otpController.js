import catchAsync from '../../utilities/catchAsync.js';
import { STATUS_CODES } from '../../constants/index.js';
import * as otpService from '../../service/user/otpService.js';

const ALLOWED_PURPOSES = ['signup', 'forgot_password', 'update-email'];

export const getOtpStatus = catchAsync(async (req, res) => {
    const email = (req.query.email || '').trim();
    const purpose = (req.query.purpose || 'signup').trim();

    if (!email || !ALLOWED_PURPOSES.includes(purpose)) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({
            success: false,
            message: 'Invalid email or purpose'
        });
    }

    const status = await otpService.getStatus(email, purpose);
    return res.status(STATUS_CODES.OK).json({ success: true, ...status });
});
