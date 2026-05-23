import { hashPassword, verifyPassword, isStrongPassword, PASSWORD_RULES } from '../../utilities/password.js';
import { userRepository } from '../../repository/user/userRepository.js';
import * as referralService from './referralService.js';
import * as otpService from './otpService.js';
import { MESSAGES } from '../../constants/index.js';
import logger from '../../utilities/logger.js';

const buildError = (message, status = 400) =>
    Object.assign(new Error(message), { status });

export const userService = {


    async signup(data) {
        const { name, email, password, referralCode } = data;
        if (!email) throw buildError('Email is required', 400);
        if (!isStrongPassword(password)) {
            throw buildError(`Password must be ${PASSWORD_RULES.DESCRIPTION}.`, 400);
        }
        const existingUser = await userRepository.findByEmail(email);
        if (existingUser) throw buildError(MESSAGES.USER_ALREADY_EXISTS, 400);

        const hashedPassword = await hashPassword(password);
        const status = await otpService.issueOtp(email, 'signup', {
            name,
            email,
            hashedPassword,
            referralCode: referralCode || ''
        });
        return {
            success: true,
            message: MESSAGES.OTP_SENT,
            ...status
        };
    },

    async verifyOtp({ email, purpose, otp }) {
        if (!email || !purpose) throw buildError(MESSAGES.SESSION_EXPIRED, 400);
        const { data } = await otpService.verifyOtp(email, purpose, otp);

        if (purpose === 'signup') {
            const newReferralCode = await referralService.generateUniqueReferralCode();
            const newUser = await userRepository.createUser({
                name: data.name,
                email: data.email,
                password: data.hashedPassword,
                referralCode: newReferralCode
            });
            if (data.referralCode && String(data.referralCode).trim()) {
                try {
                    await referralService.applyReferralBonus(newUser._id, data.referralCode);
                } catch (e) {
                    logger.error(`Referral bonus failed for ${newUser._id}: ${e.message}`);
                }
            }
            return { success: true, message: MESSAGES.USER_REGISTERED_SUCCESS };
        }

        if (purpose === 'forgot_password') {
            return { success: true, allowReset: true };
        }

        if (purpose === 'update-email') {
            if (!data.userId || !data.email) throw buildError(MESSAGES.SESSION_EXPIRED, 400);
            const taken = await userRepository.findByEmailExcluding(data.email, data.userId);
            if (taken) throw buildError(MESSAGES.EMAIL_ALREADY_IN_USE, 400);
            await userRepository.updateUser(data.userId, { email: data.email });
            return { success: true, message: MESSAGES.EMAIL_UPDATED_SUCCESS };
        }

        throw buildError('Unsupported verification purpose', 400);
    },

    async verifyUserPassword(password, user) {
        const isValid = await verifyPassword(password, user.password);
        if (!isValid) throw buildError(MESSAGES.INCORRECT_PASSWORD, 400);
        return true;
    },

    async forgotPassword(email) {
        if (!email) throw buildError('Email is required', 400);
        const user = await userRepository.findByEmail(email);
        if (!user) throw buildError(MESSAGES.USER_NOT_FOUND, 404);
        const status = await otpService.issueOtp(email, 'forgot_password', { email });
        return {
            success: true,
            message: MESSAGES.OTP_SENT,
            ...status
        };
    },

    async updatePassword(email, newPassword) {
        if (!isStrongPassword(newPassword)) {
            throw buildError(`Password must be ${PASSWORD_RULES.DESCRIPTION}.`, 400);
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
