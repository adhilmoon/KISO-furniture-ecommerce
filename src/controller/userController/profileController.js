
import { STATUS_CODES, MESSAGES } from '../../constants/index.js';
import * as profileService from '../../service/user/profileService.js';
import catchAsync from '../../utilities/catchAsync.js';

export const uploadProfilePic = catchAsync(async (req, res) => {
    if (!req.file) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: MESSAGES.PLEASE_UPLOAD_IMAGE });
    }
    const userId = req.session.user._id;
    const updatedUser = await profileService.uploadProfilePic(userId, req.file);
    if (!updatedUser) {
        return res.status(STATUS_CODES.NOT_FOUND).json({ success: false, message: MESSAGES.USER_NOT_FOUND });
    }
    if (req.session.user) req.session.user.avatar = updatedUser.avatar;
    return res.status(STATUS_CODES.OK).json({ success: true, message: MESSAGES.PROFILE_PIC_UPDATED, avatar: updatedUser.avatar });
});


export const profile_Update = catchAsync(async (req, res) => {
    const { name, phone } = req.body;
    const userId = req.session.user?._id;
    if (!userId) {
        return res.status(STATUS_CODES.UNAUTHORIZED).json({ success: false, message: MESSAGES.USER_NOT_AUTHENTICATED });
    }
    const updatedUser = await profileService.updateProfile(userId, name, phone);
    req.session.user.name = name;
    return res.status(STATUS_CODES.OK).json({ success: true, message: MESSAGES.PROFILE_UPDATED_SUCCESS, user: updatedUser });
});


export const addAddress = catchAsync(async (req, res) => {
    const userId = req.session.user._id;
    const { fullName, mobile, houseName, pincode, city, state, type, isDefault } = req.body;
    if (!fullName || !mobile || !pincode || !city || !state) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: MESSAGES.REQUIRED_FIELDS_MISSING });
    }
    await profileService.addAddress(userId, { fullName, mobile, houseName, pincode, city, state, type, isDefault });
    return res.status(STATUS_CODES.OK).json({ success: true, message: MESSAGES.ADDRESS_ADDED_SUCCESS });
});


export const getAddress = catchAsync(async (req, res) => {
    const address = await profileService.getAddress(req.params.id, req.session.user._id);
    return res.status(STATUS_CODES.OK).json({ success: true, address });
});


export const updateAddress = catchAsync(async (req, res) => {
    const { id } = req.params;
    const userId = req.session.user._id;
    const { fullName, mobile, houseName, pincode, city, state, type, isDefault } = req.body;
    if (!fullName || !mobile || !pincode || !city || !state) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: MESSAGES.REQUIRED_FIELDS_MISSING });
    }
    const updated = await profileService.updateAddress(id, userId, { fullName, mobile, houseName, pincode, city, state, type, isDefault });
    return res.status(STATUS_CODES.OK).json({ success: true, message: MESSAGES.ADDRESS_UPDATED_SUCCESS, address: updated });
});

export const setDefaultAddress = catchAsync(async (req, res) => {
    await profileService.setDefaultAddress(req.params.id, req.session.user._id);
    return res.status(STATUS_CODES.OK).json({ success: true, message: 'Default address updated successfully' });
});

export const updateEmail = catchAsync(async (req, res) => {
    const { email, password, isResend } = req.body;
    const userId = req.session.user._id;
    const result = await profileService.initiateEmailUpdate(userId, email, password, isResend, req.session.tempUserData);
    if (isResend) {
        req.session.tempUserData.otp = result.otp;
        req.session.tempUserData.otpExpiresAt = result.otpExpiresAt;
        return res.status(STATUS_CODES.OK).json({ success: true, message: MESSAGES.NEW_OTP_SENT });
    }
    req.session.tempUserData = { userId, email, otp: result.otp, otpExpiresAt: result.otpExpiresAt, purpose: 'update-email' };
    return res.status(STATUS_CODES.OK).json({ success: true, message: MESSAGES.OTP_SENT });
});

export const changePassword = catchAsync(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.session.user._id;
    const result = await profileService.changePassword(userId, currentPassword, newPassword);
    if (result?.redirectUrl) return res.status(STATUS_CODES.OK).json(result);
    return res.status(STATUS_CODES.OK).json({ success: true, message: MESSAGES.PASSWORD_UPDATED_SUCCESS });
});