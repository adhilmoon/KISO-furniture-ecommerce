import * as userService from "../../service/userService.js"
import User from '../../model/User.js'
import Address from "../../model/Address.js"
import bcrypt from 'bcrypt'
import * as otpsender from '../../utilities/sendEmail.js'
import {STATUS_CODES,MESSAGES} from "../../constants/index.js";


export const signup_post = async (req, res) => {
    try {

        const {name, email, password, referralCode, isResend} = req.body;
        if(isResend) {
            const tempUser = req.session.tempUserData;
            if(!tempUser || tempUser.email !== email) {
                return res.status(STATUS_CODES.BAD_REQUEST).json({
                    success: false,
                    message: MESSAGES.SESSION_EXPIRED
                });
            }
            const newOtp = Math.floor(1000 + Math.random() * 9000).toString();
            console.log(`new OTP${newOtp}for this email${email}`)

            req.session.tempUserData.otp = newOtp;

            await otpsender.sendOTP(email, newOtp);
            return res.status(STATUS_CODES.OK).json({success: true, message: MESSAGES.NEW_OTP_SENT});
        }

        const userExist = await User.findOne({email: email});
        if(userExist) {
            return res.status(STATUS_CODES.BAD_REQUEST).json({
                success: false,
                message: MESSAGES.USER_ALREADY_EXISTS
            })
        }
        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        console.log(`new OTP${otp}for this email${email}`)
        req.session.tempUserData = {name, email, password, referralCode, otp};
        await otpsender.sendOTP(email, otp);

        return res.status(STATUS_CODES.OK).json({success: true, message: MESSAGES.OTP_SENT});


    } catch(error) {
        return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message || MESSAGES.SIGNUP_FAILED
        })
    }
}

export const loginauth = async (req, res) => {
    try {
        const {email, password} = req.body

        if(!email || !password) {
            return res.status(STATUS_CODES.BAD_REQUEST).json({success: false, message: MESSAGES.EMPTY_FIELDS});
        }
        const RegisterdUser = await User.findOne({email: email});
        if(RegisterdUser) {
            // Check if user is blocked
            if(RegisterdUser.isBlocked) {
                return res.status(STATUS_CODES.UNAUTHORIZED).json({
                    success: false,
                    message: MESSAGES.USER_ACCOUNT_BLOCKED
                });
            }

            const valid = await bcrypt.compare(password, RegisterdUser.password)

            if(valid) {
                req.session.user = {
                    _id: RegisterdUser._id,
                };

                req.session.save((err) => {
                    if(err) {
                        return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
                            success: false,
                            message: MESSAGES.SESSION_SAVE_ERROR
                        });
                    }

                    return res.status(STATUS_CODES.OK).json({
                        success: true,
                        message: MESSAGES.LOGIN_SUCCESS,
                        redirectUrl: "/user/homepage"
                    });
                });

            } else {
                return res.status(STATUS_CODES.UNAUTHORIZED).json({success: false, message: MESSAGES.INCORRECT_PASSWORD});
            }
        } else {

            return res.status(STATUS_CODES.UNAUTHORIZED).json({
                success: false,
                message: MESSAGES.INVALID_EMAIL_OR_PASSWORD
            });
        }

    } catch(error) {
        console.error(error);
        return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({success: false, message: MESSAGES.INTERNAL_SERVER_ERROR});
    }
}
export const logout = (req, res) => {

    req.session.destroy((error) => {
        if(error) {
            console.log("Session destroy error:", error);
            return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({success: false, message: "Logout failed"});
        }
         
        res.clearCookie('connect.sid', { path: '/' });
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');

        return res.status(STATUS_CODES.OK).json({
            success: true,
            message: "Logged out successfully",
            redirectUrl: "/"
        });
    });
};

export const verify_otp = async (req, res) => {
    try {
        const {otp: entereOtp} = req.body;

        const tempUser = req.session.tempUserData;

        if(!tempUser) {
            return res.status(STATUS_CODES.BAD_REQUEST).json({success: false, message: MESSAGES.SESSION_EXPIRED});
        }
        const {name, email, password, referralCode, otp: sessionOtp, purpose} = tempUser;
   
        if(String(sessionOtp) === String(entereOtp)) {

            if(purpose === 'forgot_password') {

                req.session.allowReset = true;
                return res.status(STATUS_CODES.OK).json({
                    success: true,
                    message: "OTP Verified",
                    redirectUrl: '/user/reset-password'
                });
            }
                   
            if(purpose==='update-email'){
                const {email}=req.session.tempUserData
                const userId=req.session.user._id;
                await User.findByIdAndUpdate(userId,{email})
                return res.status(STATUS_CODES.OK).json({success:true,message:"Email updated successfully"})
            }
            await userService.createUser({name, email, password, referralCode})
            delete req.session.tempUserData;
            return res.status(STATUS_CODES.CREATED).json({
                success: true,
                message: MESSAGES.USER_REGISTERED_SUCCESS,
                redirectUrl: '/user/login'
            });
        } else {
            return res.status(STATUS_CODES.BAD_REQUEST).json({
                success: false,
                message: MESSAGES.INVALID_OTP
            });
        }
    } catch(error) {
        console.error("OTP verification error:", error);
        return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: MESSAGES.VERIFICATION_FAILED
        });
    }

}




export const googleAuthCallback = (req, res) => {
    if(req.session) {
        req.session.user = {
            role: 'user',
            name: req.user.name,
            _id: req.user._id
        };
        res.redirect('/user/homepage');
    } else {
        res.redirect('/user/login')
    }
};
export const deleteAddress = async (req, res) => {
    try {
        const addressId = req.params.id;
        await Address.findByIdAndDelete(addressId);
        res.json({success: true, message: "Address deleted"});
    } catch(error) {
        res.status(500).json({success: false, message: "Server error"});
    }
};




export const forgot_password = async (req, res) => {
    try {
        const {email,isResend} = req.body;
        const user = await User.findOne({email});

        if(!user) {
            return res.status(STATUS_CODES.NOT_FOUND).json({success: false, message: "User not found"});
        }
        if(isResend) {
            const tempUser = req.session.tempUserData;
            if(!tempUser || tempUser.email !== email) {
                return res.status(STATUS_CODES.BAD_REQUEST).json({
                    success: false,
                    message: MESSAGES.SESSION_EXPIRED
                });
            }
            const newOtp = Math.floor(1000 + Math.random() * 9000).toString();
            console.log(`new OTP${newOtp}for this email${email}`)

            req.session.tempUserData.otp = newOtp;

            await otpsender.sendOTP(email, newOtp);
            return res.status(STATUS_CODES.OK).json({success: true, message: MESSAGES.NEW_OTP_SENT});
        }

        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        console.log(`this is otp : ${otp}for this mail ${email}`)

        req.session.tempUserData = {
            email,
            otp,
            purpose: 'forgot_password'
        };

        await otpsender.sendOTP(email, otp);
        return res.status(STATUS_CODES.OK).json({success: true, message: MESSAGES.OTP_SENT});

    } catch(error) {
        console.error(error);
        return res.status(500).json({success: false, message: "Server Error"});
    }
};
export const update_password = async (req, res) => {
    try {
        const {password} = req.body;
        const tempUser = req.session.tempUserData;

        if(!tempUser || !req.session.allowReset) {
            return res.status(403).json({success: false, message: "Unauthorized access"});
        }

        const hashedPassword = await bcrypt.hash(password, 10);


        await User.findOneAndUpdate(
            {email: tempUser.email},
            {password: hashedPassword}
        );


        delete req.session.tempUserData;
        delete req.session.allowReset;

        return res.status(STATUS_CODES.OK).json({
            success:true,
            message:'password successfully updated ',
            redirectUrl:'/user/login'
        })

    } catch(error) {
        console.error(error);
        return res.status(500).json({success: false, message: "Internal Server Error"});
    }
};