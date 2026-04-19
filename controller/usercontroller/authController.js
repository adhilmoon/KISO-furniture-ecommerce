import {userService} from "../../service/user/userService.js"
import {STATUS_CODES, MESSAGES} from "../../constants/index.js";
import logger from "../../utilities/logger.js";



export const signup_post = async (req, res) => {
    try {
        const {name, email, password, referralCode, isResend} = req.body;
        const result = await userService.signup({name, email, password, referralCode}, isResend)
        if(isResend) {
            req.session.tempUserData.otp = result.otp
            return res.status(STATUS_CODES.OK).json(result)
        }
        req.session.tempUserData = result.tempData;

        return res.status(STATUS_CODES.OK).json({
            success: true,
            message: MESSAGES.OTP_SENT
        })


    } catch(error) {
        logger.error(`Signup Error ${error.message}`)
        return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message || MESSAGES.SIGNUP_FAILED
        });
    }
}

export const verify_otp = async (req, res) => {
    try {
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
    } catch(error) {
        logger.error(`OTP verification error: ${error.message}`);
        return res.status(STATUS_CODES.BAD_REQUEST).json({
            success: false,
            message: error.message || MESSAGES.VERIFICATION_FAILED
        });
    }

}


export const loginauth = async (req, res) => {
    try {
        const {password} = req.body;
        const user = req.user;

        await userService.verifyPassword(password, user);
        req.session.user = {_id: user._id};
        req.session.save((err) => {
            if(err) {
                const error = new Error(MESSAGES.SESSION_SAVE_ERROR);
                error.statusCode = STATUS_CODES.INTERNAL_SERVER_ERROR;
               
            }

            return res.status(STATUS_CODES.OK).json({
                success: true,
                message: MESSAGES.LOGIN_SUCCESS,
                redirectUrl: "/user/homepage"
            });
        });

    } catch(error) {
        logger.error(`Login Auth Error: ${error.message}`);
        return res.status(error.statusCode || STATUS_CODES.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message || MESSAGES.LOGIN_FAILED
        });
    }
};
export const logout = (req, res) => {
    try {
        req.session.destroy((error) => {
            if(error) {
                logger.error(`Session destroy error: ${error.message}`);
                return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({success: false, message: MESSAGES.LOGOUT_FAILED});
            }

            res.clearCookie('connect.sid', {path: '/'});
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');

            return res.status(STATUS_CODES.OK).json({
                success: true,
                message: MESSAGES.LOGOUT_SUCCESS,
                redirectUrl: "/"
            });
        });
    } catch(error) {
         logger.error(`Logout Error: ${error.message}`);
        return res.status(STATUS_CODES.UNAUTHORIZED).json({
            success: false,
            message: MESSAGES.SOMETHING_WENT_WRONG
        });
    }

};





export const googleAuthCallback = (req, res) => {
    try {
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
    } catch(error) {
        logger.error(`Google auth error: ${error.message}`);
        return res.redirect('/user/login?error=Something went wrong');
    }

};
export const deleteAddress = async (req, res) => {
    try {
        const addressId = req.params.id;
        await userService.deleteAddress(addressId)
        res.json({success: true, message: MESSAGES.ADDRESS_DELETED});
    } catch(error) {
         logger.error(`delete Address controller: ${error.message}`);
        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({success: false, message: MESSAGES.SERVER_ERROR});
    }
};




export const forgot_password = async (req, res) => {
    try {
        const { email, isResend } = req.body;

       
        const result = await userService.forgotPassword(email, isResend);

        req.session.tempUserData = result.tempData;

        return res.status(STATUS_CODES.OK).json({
            success: true,
            message: result.message
        });

    } catch (error) {
        logger.error(`Forgot password error: ${error.message}`);
        return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: MESSAGES.INTERNAL_SERVER_ERROR
        });
    }
};
export const update_password = async (req, res) => {
    try {
        const { password } = req.body;
        const tempUser = req.session.tempUserData;

        if (!tempUser || !req.session.allowReset) {
            const error = new Error(MESSAGES.UNAUTHORIZED_ACCESS);
            error.statusCode = STATUS_CODES.FORBIDDEN;
            throw error;
        }

       
        const result = await userService.updatePassword(tempUser.email, password);

       
        delete req.session.tempUserData;
        delete req.session.allowReset;

        return res.status(STATUS_CODES.OK).json({
            ...result,
            redirectUrl: '/user/login'
        });

    } catch (error) {
        logger.error(`Update password error: ${error.message}`);
        return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: MESSAGES.INTERNAL_SERVER_ERROR
        });
    }
};