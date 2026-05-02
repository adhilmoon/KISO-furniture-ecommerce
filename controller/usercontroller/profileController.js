import User from "../../model/User.js";
import Address from "../../model/Address.js";
import {STATUS_CODES, MESSAGES} from "../../constants/index.js";
import * as otpsender from '../../utilities/sendEmail.js'
import bcrypt from 'bcrypt'
import { uploadToCloudinary, deleteFromCloudinary } from "../../utilities/uploadToCloudinary.js";
import logger from "../../utilities/logger.js";
import {userService} from "../../service/user/userService.js";
import catchAsync from "../../utilities/catchAsync.js";


export const uploadProfilePic = catchAsync(async (req, res) => {

    if (!req.file) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({
            success: false,
            message: MESSAGES.PLEASE_UPLOAD_IMAGE
        });
    }

    const userId = req.session.user._id;

    // ── Delete old avatar from Cloudinary if one exists ───────────────────────
    const currentUser = await User.findById(userId).select("avatar avatarId");
    if (currentUser?.avatar) {
        await deleteFromCloudinary(currentUser.avatar);
    }

    // ── Upload new avatar ─────────────────────────────────────────────────────
    const result = await uploadToCloudinary(req.file.buffer, "kiso/users/profile");
    const imageUrl = result.secure_url;
    const publicId = result.public_id;

    const updatedUser = await User.findByIdAndUpdate(
        userId,
        { avatar: imageUrl, avatarId: publicId },
        { new: true }
    );

    if (!updatedUser) {
        return res.status(STATUS_CODES.NOT_FOUND).json({
            success: false,
            message: MESSAGES.USER_NOT_FOUND
        });
    }

    if (req.session.user) {
        req.session.user.avatar = imageUrl;
    }

    return res.status(STATUS_CODES.OK).json({
        success: true,
        message: MESSAGES.PROFILE_PIC_UPDATED,
        avatar: imageUrl
    });
});


export const profile_Update = catchAsync(async (req, res) => {
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
});


export const addAddress = catchAsync(async (req, res) => {
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
});


export const getAddress = catchAsync(async (req, res) => {
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
});


export const updateAddress = catchAsync(async (req, res) => {
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
});

export const updateEmail = catchAsync(async (req, res) => {
    const {email, password, isResend} = req.body
    const userId = req.session.user._id;
    const user = await User.findById(userId)

    if (user.googleId) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({
            success: false,
            message: "Account managed by Google. Email cannot be changed here."
        });
    }

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
});

export const changePassword = catchAsync(async (req, res) => {
    const {currentPassword, newPassword} = req.body
    const userId = req.session.user._id;
    const user = await User.findById(userId)

    if (user.googleId) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({
            success: false,
            message: "Account managed by Google. Password cannot be changed here."
        });
    }

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
});