import User from "../../model/User.js";
import Address from "../../model/Address.js";
import {STATUS_CODES, MESSAGES} from "../../constants/index.js";
import * as otpsender from '../../utilities/sendEmail.js'
import bcrypt from 'bcrypt'
import {uploadToCloudinary} from "../../config/cloudinary.js";
import logger from "../../utilities/logger.js";
import {userService} from "../../service/user/userService.js";


export const uploadProfilePic = async (req, res) => {
    try {

        if(!req.file) {
            return res.status(STATUS_CODES.BAD_REQUEST).json({success: false, message: MESSAGES.PLEASE_UPLOAD_IMAGE});
        }

        const userId = req.session.user._id;
        const result = await uploadToCloudinary(req.res.buffer, "kiso/users/profile");
        const imageUrl = result.secure_url;

        // Database Update
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {avatar: imageUrl},
            {new: true}
        );
        if(!updatedUser) {
            return res.status(STATUS_CODES.NOT_FOUND).json({success: false, message: MESSAGES.USER_NOT_FOUND});
        }
        if(req.session.user) {
            req.session.user.avatar = imageUrl;
        }

        return res.status(STATUS_CODES.OK).json({
            success: true,
            message: MESSAGES.PROFILE_PIC_UPDATED,
            avatar: imageUrl
        });
    } catch(error) {
        logger.error(`Upload Error: ${error.message}`);
        return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({success: false, message: error.message || MESSAGES.ERROR_UPLOADING_CLOUDINARY});
    }
};



export const profile_Update = async (req, res) => {
    try {
        const {name, phone} = req.body
        const userId = req.session.user?._id;

        if(!userId) {
            return res.status(STATUS_CODES.UNAUTHORIZED).json({success: false, message: MESSAGES.USER_NOT_AUTHENTICATED});
        }
        const currentUser = await User.findById(userId)
        if(!currentUser) {
            return res.status(STATUS_CODES.NOT_FOUND).json({
                success: false,
                message: MESSAGES.USER_NOT_FOUND
            })
        }

        if(currentUser.name === name && currentUser.phone === phone) {
            return res.status(STATUS_CODES.BAD_REQUEST).json({
                success: false,
                message: MESSAGES.NO_CHANGES_DETECTED
            })
        }
        if(!name && !phone) {
            return res.status(STATUS_CODES.BAD_REQUEST).json({
                success: false,
                message: MESSAGES.NAME_PHONE_REQUIRED
            });
        }
        const updatedUser = await User.findByIdAndUpdate(userId, {
            name: name,
            phone: phone
        },
            {new: true}
        )
        if(!updatedUser) {
            return res.status(STATUS_CODES.NOT_FOUND).json({success: false, message: MESSAGES.USER_NOT_FOUND});
        }
        req.session.user.name = name
        return res.status(STATUS_CODES.OK).json({success: true, message: MESSAGES.PROFILE_UPDATED_SUCCESS, user: updatedUser})

    } catch(error) {
        logger.error(`Profile update error: ${error.message}`);
        return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({success: false, message: MESSAGES.INTERNAL_SERVER_ERROR_PROFILE})

    }


}


export const addAddress = async (req, res) => {
    try {
        const userId = req.session.user._id;
        const {fullName, mobile, houseName, pincode, city, state, type} = req.body;
        if(!fullName || !mobile || !pincode || !city || !state) {
            return res.status(STATUS_CODES.BAD_REQUEST).json({
                success: false,
                message: MESSAGES.REQUIRED_FIELDS_MISSING
            });
        }

        const newAddress = new Address({
            userId,
            fullName,
            mobile,
            houseName,
            pincode,
            city,
            state,
            type: type || "Home"
        });

        await newAddress.save();

        return res.status(STATUS_CODES.OK).json({
            success: true,
            message: MESSAGES.ADDRESS_ADDED_SUCCESS
        });

    } catch(error) {
        logger.error(`Add Address Error: ${error.message}`);
        return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({success: false, message: MESSAGES.INTERNAL_SERVER_ERROR_ADDRESS});
    }
};


export const getAddress = async (req, res) => {
    try {
        const {id} = req.params;
        const address = await Address.findOne({
            _id: id,
            userId: req.session.user._id
        });


        if(!address) {
            return res.status(STATUS_CODES.NOT_FOUND).json({
                success: false,
                message: MESSAGES.ADDRESS_NOT_FOUND
            });
        }

        return res.status(STATUS_CODES.OK).json({
            success: true,
            address
        });
    } catch(error) {
        logger.error(`Get Address Error: ${error.message}`);
        return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({success: false, message: MESSAGES.FETCH_ADDRESS_FAILED});
    }
};


export const updateAddress = async (req, res) => {
    try {
        const {id} = req.params;
        const {fullName, mobile, houseName, pincode, city, state, type} = req.body;

        if(!fullName || !mobile || !pincode || !city || !state) {
            return res.status(STATUS_CODES.BAD_REQUEST).json({
                success: false,
                message: MESSAGES.REQUIRED_FIELDS_MISSING
            });
        }

        const updatedAddress = await Address.findOneAndUpdate(
            {_id: id, userId: req.session.user._id},
            {
                fullName,
                mobile,
                houseName,
                pincode,
                city,
                state,
                type: type || "Home"
            },
            {new: true}
        );

        if(!updatedAddress) {
            return res.status(STATUS_CODES.NOT_FOUND).json({
                success: false,
                message: MESSAGES.ADDRESS_NOT_FOUND
            });
        }

        return res.status(STATUS_CODES.OK).json({
            success: true,
            message: MESSAGES.ADDRESS_UPDATED_SUCCESS,
            address: updatedAddress
        });
    } catch(error) {
        logger.error(`Update Address Error: ${error.message}`);
        return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({success: false, message: MESSAGES.INTERNAL_SERVER_ERROR_ADDRESS});
    }
};

export const updateEmail = async (req, res) => {
    try {
        const {email, password, isResend} = req.body
        const userId = req.session.user._id;
        const user = await User.findById(userId)

        const isMatch = await bcrypt.compare(password, user.password)
        if(!isMatch) {
            return res.status(STATUS_CODES.BAD_REQUEST).json({success: false, message: MESSAGES.INCORRECT_PASSWORD})
        }
        const emailexist = await User.findOne({email, _id: {$ne: userId}})
        if(emailexist) {
            return res.status(STATUS_CODES.BAD_REQUEST).json({success: false, message: MESSAGES.EMAIL_ALREADY_IN_USE})
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
           

            req.session.tempUserData.otp = newOtp;

            await otpsender.sendOTP(email, newOtp);
            return res.status(STATUS_CODES.OK).json({success: true, message: MESSAGES.NEW_OTP_SENT});
        }
        const otp = Math.floor(1000 + Math.random() * 9000).toString();
      
        req.session.tempUserData = {
            email,
            otp,
            purpose: 'update-email'
        };

        await otpsender.sendOTP(email, otp);
        return res.status(STATUS_CODES.OK).json({success: true, message: MESSAGES.OTP_SENT});




    } catch(error) {
        logger.error(`Update email : ${error.message}`);
        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({success: false, message: MESSAGES.INTERNAL_SERVER_ERROR})
    }
}

export const changePassword = async (req, res) => {
    try {
        const {currentPassword, newPassword} = req.body
        const userId = req.session.user._id;
        const user = await User.findById(userId)
        const password = user.password;
        if(!password) {
            return res.status(STATUS_CODES.OK).json({
                redirectUrl: '/user/reset-password'
            })
        }
        const isMatch = await bcrypt.compare(currentPassword, user.password)
        if(!isMatch) {
            return res.status(STATUS_CODES.BAD_REQUEST).json({success: false, message: MESSAGES.INCORRECT_PASSWORD})
        }
        
        await userService.updatePassword(user.email, newPassword);

        return res.status(STATUS_CODES.OK).json({success: true, message: MESSAGES.PASSWORD_UPDATED_SUCCESS});
    } catch(error) {
        logger.error(`Change password error: ${error.message}`);
        return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({success: false, message: MESSAGES.INTERNAL_SERVER_ERROR})
    }
}