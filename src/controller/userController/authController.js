import { userService } from "../../service/user/userService.js";
import { STATUS_CODES, MESSAGES } from "../../constants/index.js";
import logger from "../../utilities/logger.js";
import catchAsync from "../../utilities/catchAsync.js";

export const signup_post = catchAsync(async (req, res) => {
    const { name, email, password, referralCode } = req.body;
    const result = await userService.signup({ name, email, password, referralCode });
    return res.status(STATUS_CODES.OK).json({
        success: true,
        message: MESSAGES.OTP_SENT,
        remainingSeconds: result.remainingSeconds,
        ttlSeconds: result.ttlSeconds
    });
});

export const verify_otp = catchAsync(async (req, res) => {
    const { email, purpose = 'signup', otp } = req.body;
    const result = await userService.verifyOtp({ email, purpose, otp });

    if (purpose === 'forgot_password') {
        req.session.allowReset = true;
        req.session.resetEmail = email;
        return res.status(STATUS_CODES.OK).json({
            success: true,
            message: MESSAGES.OTP_VERIFIED,
            redirectUrl: '/user/reset-password'
        });
    }

    if (purpose === 'update-email') {
        return res.status(STATUS_CODES.OK).json({
            success: true,
            message: result?.message || MESSAGES.EMAIL_UPDATED_SUCCESS
        });
    }

    return res.status(STATUS_CODES.CREATED).json({
        success: true,
        message: MESSAGES.USER_REGISTERED_SUCCESS,
        redirectUrl: '/user/login'
    });
});

export const loginauth = catchAsync(async (req, res) => {
    const { password } = req.body;
    const user = req.user;

    await userService.verifyUserPassword(password, user);

    req.session.user = { _id: user._id };
    req.session.save((err) => {
        if (err) logger.error(`Session save error: ${err.message}`);
        return res.status(STATUS_CODES.OK).json({
            success: true,
            message: MESSAGES.LOGIN_SUCCESS,
            redirectUrl: "/user/homepage"
        });
    });
});

export const logout = catchAsync(async (req, res) => {
    delete req.session.user;
    req.session.save((error) => {
        if (error) {
            logger.error(`Session save error on user logout: ${error.message}`);
            return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: MESSAGES.LOGOUT_FAILED });
        }
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        return res.status(STATUS_CODES.OK).json({
            success: true,
            message: MESSAGES.LOGOUT_SUCCESS,
            redirectUrl: "/"
        });
    });
});

export const googleAuthCallback = catchAsync(async (req, res) => {
    if (req.session) {
        req.session.user = { role: 'user', name: req.user.name, _id: req.user._id };
        res.redirect('/user/homepage?message= Google Authenticated');
    } else {
        res.redirect('/user/login?error=Google authentication failed');
    }
});

export const deleteAddress = catchAsync(async (req, res) => {
    const addressId = req.params.id;
    await userService.deleteAddress(addressId);
    res.json({ success: true, message: MESSAGES.ADDRESS_DELETED });
});

export const forgot_password = catchAsync(async (req, res) => {
    const { email } = req.body;
    const result = await userService.forgotPassword(email);
    return res.status(STATUS_CODES.OK).json({
        success: true,
        message: result.message,
        remainingSeconds: result.remainingSeconds,
        ttlSeconds: result.ttlSeconds
    });
});

export const update_password = catchAsync(async (req, res) => {
    const { password } = req.body;
    if (!req.session.allowReset || !req.session.resetEmail) {
        const error = new Error(MESSAGES.UNAUTHORIZED_ACCESS);
        error.status = STATUS_CODES.FORBIDDEN;
        throw error;
    }
    const result = await userService.updatePassword(req.session.resetEmail, password);

    delete req.session.allowReset;
    delete req.session.resetEmail;

    return res.status(STATUS_CODES.OK).json({
        ...result,
        redirectUrl: '/user/login'
    });
});
