import { hashPassword, verifyPassword, isStrongPassword, PASSWORD_RULES } from '../../utilities/password.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../../utilities/uploadToCloudinary.js';
import { userRepository } from '../../repository/user/userRepository.js';
import * as otpService from './otpService.js';
import { MESSAGES, CLOUDINARY_FOLDERS } from '../../constants/index.js';

export const uploadProfilePic = async (userId, file) => {
    const user = await userRepository.findById(userId);
    if (user?.avatar) await deleteFromCloudinary(user.avatar);
    const result = await uploadToCloudinary(file.buffer, CLOUDINARY_FOLDERS.PROFILE);
    return userRepository.updateUser(userId, { avatar: result.secure_url, avatarId: result.public_id });
};

const NAME_REGEX = /^[A-Za-z][A-Za-z\s'-]{0,48}[A-Za-z]$/;

export const isValidName = (name) =>
    typeof name === 'string' && NAME_REGEX.test(name.trim());

export const updateProfile = async (userId, name, phone) => {
    const user = await userRepository.findById(userId);
    if (!user) throw Object.assign(new Error(MESSAGES.USER_NOT_FOUND), { status: 404 });
    if (!name && !phone) throw Object.assign(new Error(MESSAGES.NAME_PHONE_REQUIRED), { status: 400 });
    if (!isValidName(name)) {
        throw Object.assign(new Error(MESSAGES.INVALID_NAME), { status: 400 });
    }
    name = name.trim();
    if (user.name === name && user.phone === phone) {
        throw Object.assign(new Error(MESSAGES.NO_CHANGES_DETECTED), { status: 400 });
    }
    return userRepository.updateUser(userId, { name, phone });
};

export const addAddress = async (userId, data) => {
    const { fullName, mobile, houseName, pincode, city, state, type, isDefault } = data;
    const count = await userRepository.countAddresses(userId);
    const makeDefault = count === 0 || isDefault === true || isDefault === 'on';
    if (makeDefault && count > 0) await userRepository.updateManyAddresses({ userId }, { isDefault: false });
    return userRepository.createAddress({
        userId, fullName, mobile, houseName, pincode, city, state,
        type: type || 'Home',
        isDefault: makeDefault
    });
};

export const getAddress = async (id, userId) => {
    const address = await userRepository.findOneAddress({ _id: id, userId });
    if (!address) throw Object.assign(new Error(MESSAGES.ADDRESS_NOT_FOUND), { status: 404 });
    return address;
};

export const updateAddress = async (id, userId, data) => {
    const { fullName, mobile, houseName, pincode, city, state, type, isDefault } = data;
    const makeDefault = isDefault === true || isDefault === 'on';
    if (makeDefault) await userRepository.updateManyAddresses({ userId }, { isDefault: false });
    const updated = await userRepository.findAndUpdateAddress(
        { _id: id, userId },
        { fullName, mobile, houseName, pincode, city, state, type: type || 'Home', ...(makeDefault && { isDefault: true }) }
    );
    if (!updated) throw Object.assign(new Error(MESSAGES.ADDRESS_NOT_FOUND), { status: 404 });
    return updated;
};

export const setDefaultAddress = async (id, userId) => {
    const address = await userRepository.findOneAddress({ _id: id, userId });
    if (!address) throw Object.assign(new Error(MESSAGES.ADDRESS_NOT_FOUND), { status: 404 });
    await userRepository.updateManyAddresses({ userId }, { isDefault: false });
    address.isDefault = true;
    await address.save();
};

export const getAddresses = async (userId, options = {}) =>
    userRepository.findAddressesByUserId(userId, options);

export const getPaginatedAddresses = async (userId, page, perPage) => {
    const skip = (page - 1) * perPage;
    const [total, addresses] = await Promise.all([
        userRepository.countAddresses(userId),
        userRepository.findAddressesByUserId(userId, { skip, limit: perPage, sort: { createdAt: -1 } })
    ]);
    return { total, addresses };
};

export const getUserById = async (id) => userRepository.findById(id);

export const initiateEmailUpdate = async (userId, email, password) => {
    const user = await userRepository.findById(userId);
    if (!user) throw Object.assign(new Error(MESSAGES.USER_NOT_FOUND), { status: 404 });
    if (user.googleId) throw Object.assign(new Error('Account managed by Google. Email cannot be changed here.'), { status: 400 });
    const isMatch = await verifyPassword(password, user.password);
    if (!isMatch) throw Object.assign(new Error(MESSAGES.INCORRECT_PASSWORD), { status: 400 });
    const emailExists = await userRepository.findByEmailExcluding(email, userId);
    if (emailExists) throw Object.assign(new Error(MESSAGES.EMAIL_ALREADY_IN_USE), { status: 400 });

    const status = await otpService.issueOtp(email, 'update-email', { userId: String(userId), email });
    return status;
};

export const changePassword = async (userId, currentPassword, newPassword) => {
    const user = await userRepository.findById(userId);
    if (!user) throw Object.assign(new Error(MESSAGES.USER_NOT_FOUND), { status: 404 });
    if (user.googleId) throw Object.assign(new Error('Account managed by Google. Password cannot be changed here.'), { status: 400 });
    if (!user.password) return { redirectUrl: '/user/reset-password' };
    const isMatch = await verifyPassword(currentPassword, user.password);
    if (!isMatch) throw Object.assign(new Error(MESSAGES.INCORRECT_PASSWORD), { status: 400 });
    if (!isStrongPassword(newPassword)) {
        throw Object.assign(new Error(`New password must be ${PASSWORD_RULES.DESCRIPTION}.`), { status: 400 });
    }
    const sameAsCurrent = await verifyPassword(newPassword, user.password);
    if (sameAsCurrent) {
        throw Object.assign(new Error('New password must differ from the current password.'), { status: 400 });
    }
    const hashed = await hashPassword(newPassword);
    await userRepository.updatePassword(user.email, hashed);
    return null;
};
