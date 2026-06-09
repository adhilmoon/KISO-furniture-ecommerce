import { STATUS_CODES } from '../../constants/statusCodes.js';
import { MESSAGES } from '../../constants/messages.js';
import catchAsync from '../../utilities/catchAsync.js';
import * as adminAuthService from '../../service/admin/adminAuthService.js';

export const auth = catchAsync(async (req, res) => {
    const { email, password } = req.body;
    await adminAuthService.adminLogin(email, password);
    req.session.Admin = { role: 'admin' };
    return res.status(STATUS_CODES.OK).json({
        success: true,
        message: MESSAGES.ADMIN_LOGIN_SUCCESS,
        redirectUrl: '/admin/dashboard'
    });
});



export const logout = catchAsync(async (req, res) => {
     req.session.destroy((err) => {
        if(err) {
            throw err;
        }

        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');

        return res.status(STATUS_CODES.OK).json({
            success: true,
            message: MESSAGES.LOGOUT_SUCCESS,
            redirectUrl: "/admin/login"
        });
    })
});

export const load_data = catchAsync(async (req, res) => {
    const query = (req.query.q || '').trim();
    const users = await adminAuthService.searchUsersWithOrderCounts(query);
    return res.status(STATUS_CODES.OK).json({ users });
});
