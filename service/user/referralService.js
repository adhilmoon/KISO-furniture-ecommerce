import User from '../../model/User.js';
import * as walletService from './walletService.js';
import { MESSAGES } from '../../constants/messages.js';

const REFERRAL_BONUS_REFERRER = 100;
const REFERRAL_BONUS_NEW_USER = 50;

const buildError = (message, status) =>
    Object.assign(new Error(message), { status });

export const generateUniqueReferralCode = async () => {
    let code;
    let exists = true;
    while (exists) {
        code = Math.random().toString(36).substring(2, 10).toUpperCase();
        exists = await User.exists({ referralCode: code });
    }
    return code;
};

export const findReferrerByCode = async (code) => {
    if (!code || !code.trim()) return null;
    return User.findOne({ referralCode: code.trim().toUpperCase() });
};

export const applyReferralBonus = async (newUserId, referrerCode) => {
    const referrer = await findReferrerByCode(referrerCode);
    if (!referrer) throw buildError(MESSAGES.REFERRAL_INVALID, 400);
    if (String(referrer._id) === String(newUserId)) throw buildError(MESSAGES.REFERRAL_INVALID, 400);

    await User.findByIdAndUpdate(newUserId, { referredBy: referrer._id });

    await walletService.creditWallet(referrer._id, REFERRAL_BONUS_REFERRER, 'referral_bonus', {
        description: `Referral bonus for inviting a new user`
    });
    await walletService.creditWallet(newUserId, REFERRAL_BONUS_NEW_USER, 'referral_bonus', {
        description: `Welcome bonus for joining via referral`
    });

    return { referrerId: referrer._id, referrerBonus: REFERRAL_BONUS_REFERRER, newUserBonus: REFERRAL_BONUS_NEW_USER };
};
