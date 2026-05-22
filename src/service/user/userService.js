import { sendOTP } from '../../utilities/sendEmail.js';
import { createOtpToken, verifyOtpToken } from '../../utilities/otp.js';
import { hashPassword, verifyPassword, isStrongPassword, PASSWORD_RULES } from '../../utilities/password.js';
import { userRepository } from '../../repository/user/userRepository.js';
import * as referralService from './referralService.js';
import { MESSAGES } from '../../constants/index.js';
import logger from '../../utilities/logger.js';

export const userService = {

    async signup(data, isResend = false) {
        const { name, email, password, refferralCode } = data;
        if (isResend) {
            const { otp, otpExpiresAt } = createOtpToken();
            await sendOTP(email, otp);
            return { success: true, message: MESSAGES.NEW_OTP_SENT, otp, otpExpiresAt };
        }
        if (!isStrongPassword(password)) {
            throw Object.assign(new Error(`Password must be ${PASSWORD_RULES.DESCRIPTION}.`), { status: 400 });
        }
        const existingUser = await userRepository.findByEmail(email);
        if (existingUser) {
            throw new Error(MESSAGES.USER_ALREADY_EXISTS);
        }
        const { otp, otpExpiresAt } = createOtpToken();
        await sendOTP(email, otp);

        return {
            success: true,
            message: MESSAGES.OTP_SENT,
            tempData: { name, email, password, refferralCode, otp, otpExpiresAt }
        };
    },

    async verifyOtp(enteredOtp, tempUser, purpose) {
        if (!tempUser) {
            throw new Error(MESSAGES.SESSION_EXPIRED);
        }
        const result = verifyOtpToken(enteredOtp, tempUser.otp, tempUser.otpExpiresAt);
        if (!result.ok) {
            throw new Error(MESSAGES.INVALID_OTP);
        }
        if (purpose === 'forgot_password') {
            return { success: true, allowReset: true };
        }
        if (purpose === 'update-email') {
            if (!tempUser.userId || !tempUser.email) {
                throw new Error(MESSAGES.SESSION_EXPIRED);
            }
            const taken = await userRepository.findByEmailExcluding(tempUser.email, tempUser.userId);
            if (taken) {
                throw new Error(MESSAGES.EMAIL_ALREADY_IN_USE);
            }
            await userRepository.updateUser(tempUser.userId, { email: tempUser.email });
            return { success: true, message: MESSAGES.EMAIL_UPDATED_SUCCESS };
        }
        const hashedPassword = await hashPassword(tempUser.password);
        const newReferralCode = await referralService.generateUniqueReferralCode();
        const newUser = await userRepository.createUser({
            name: tempUser.name,
            email: tempUser.email,
            password: hashedPassword,
            referralCode: newReferralCode
        });
        const referredByCode = tempUser.refferralCode || tempUser.referralCode;
        if (referredByCode && String(referredByCode).trim()) {
            try {
                await referralService.applyReferralBonus(newUser._id, referredByCode);
            } catch (e) {
                logger.error(`Referral bonus failed for ${newUser._id}: ${e.message}`);
                // referral failure must not block signup; ignore invalid codes
            }
        }

        return { success: true, message: MESSAGES.USER_REGISTERED_SUCCESS };
    },

    async verifyUserPassword(password, user) {
        const isValid = await verifyPassword(password, user.password);
        if (!isValid) {
            throw new Error(MESSAGES.INCORRECT_PASSWORD);
        }
        return true;
    },

    async forgotPassword(email, isResend = false) {
        const user = await userRepository.findByEmail(email);
        if (!user) throw new Error(MESSAGES.USER_NOT_FOUND);

        const { otp, otpExpiresAt } = createOtpToken();
        await sendOTP(email, otp);

        return {
            success: true,
            message: isResend ? MESSAGES.NEW_OTP_SENT : MESSAGES.OTP_SENT,
            tempData: { email, otp, otpExpiresAt, purpose: 'forgot_password' }
        };
    },

    async updatePassword(email, newPassword) {
        if (!isStrongPassword(newPassword)) {
            throw Object.assign(new Error(`Password must be ${PASSWORD_RULES.DESCRIPTION}.`), { status: 400 });
        }
        const hashedPassword = await hashPassword(newPassword);
        await userRepository.updatePassword(email, hashedPassword);
        return { success: true, message: MESSAGES.PASSWORD_UPDATED_SUCCESS };
    },

    async deleteAddress(addressId) {
        await userRepository.deleteAddress(addressId);
        return { success: true, message: MESSAGES.ADDRESS_DELETED };
    }
};
