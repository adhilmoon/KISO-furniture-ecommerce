import {userService} from "../../service/user/userService.js"
import {STATUS_CODES, MESSAGES} from "../../constants/index.js";
import logger from "../../utilities/logger.js";
import catchAsync from "../../utilities/catchAsync.js";



export const signup_post = catchAsync(async (req, res) => {
    const {name, email, password, referralCode, isResend} = req.body;
    const result = await userService.signup({name, email, password, referralCode}, isResend)
    if(isResend) {
        req.session.tempUserData.otp = result.otp
        req.session.tempUserData.otpExpiresAt = result.otpExpiresAt;
        return res.status(STATUS_CODES.OK).json(result)
    }
    req.session.tempUserData = result.tempData;

    return res.status(STATUS_CODES.OK).json({
        success: true,
        message: MESSAGES.OTP_SENT
    })
});

export const verify_otp = catchAsync(async (req, res) => {
    const {otp: enteredOtp} = req.body;
    const tempUser = req.session.tempUserData;

    const result = await userService.verifyOtp(enteredOtp, tempUser, tempUser?.purpose)

    if(tempUser?.purpose === 'forgot_password') {
        req.session.allowReset = true;
        return res.status(STATUS_CODES.OK).json({
            success: true,
            message: MESSAGES.OTP_VERIFIED,
            redirectUrl: '/user/reset-password'
        });
    }
    if(tempUser?.purpose === 'update-email') {
        delete req.session.tempUserData;
        return res.status(STATUS_CODES.OK).json(result);
    }
    delete req.session.tempUserData;
    return res.status(STATUS_CODES.CREATED).json({
        success: true,
        message: MESSAGES.USER_REGISTERED_SUCCESS,
        redirectUrl: '/user/login'
    });
});


export const loginauth = catchAsync(async (req, res) => {
    const {password} = req.body;
    const user = req.user;

    await userService.verifyPassword(password, user);

    req.session.user = {_id: user._id};
    req.session.save((err) => {
        if(err) {
            logger.error(`Session save error: ${err.message}`);
        }
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
        if(error) {
            logger.error(`Session save error on user logout: ${error.message}`);
            return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({success: false, message: MESSAGES.LOGOUT_FAILED});
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
    if(req.session) {
        req.session.user = {
            role: 'user',
            name: req.user.name,
            _id: req.user._id
        };
        res.redirect('/user/homepage?message= Google Authenticated');
    } else {
        res.redirect('/user/login?error=Google authentication failed')
    }
});

export const deleteAddress = catchAsync(async (req, res) => {
    const addressId = req.params.id;
    await userService.deleteAddress(addressId)
    res.json({success: true, message: MESSAGES.ADDRESS_DELETED});
});




export const forgot_password = catchAsync(async (req, res) => {
    const { email, isResend } = req.body;


    const result = await userService.forgotPassword(email, isResend);

    req.session.tempUserData = result.tempData;

    return res.status(STATUS_CODES.OK).json({
        success: true,
        message: result.message
    });
});

export const update_password = catchAsync(async (req, res) => {
    const { password } = req.body;
    const tempUser = req.session.tempUserData;

    if (!tempUser || !req.session.allowReset) {
        const error = new Error(MESSAGES.UNAUTHORIZED_ACCESS);
        error.status = STATUS_CODES.FORBIDDEN;
        throw error;
    }


    const result = await userService.updatePassword(tempUser.email, password);


    delete req.session.tempUserData;
    delete req.session.allowReset;

    return res.status(STATUS_CODES.OK).json({
        ...result,
        redirectUrl: '/user/login'
    });
});