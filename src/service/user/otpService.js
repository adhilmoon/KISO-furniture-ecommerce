import * as otpRepository from '../../repository/user/otpRepository.js';
import { sendOTP } from '../../utilities/sendEmail.js';
import { generateOtp, hashOtp, compareOtpHash } from '../../utilities/otp.js';
import { OTP } from '../../constants/index.js';

const buildError = (message, status = 400, extra = {}) =>
    Object.assign(new Error(message), { status, ...extra });

const ttlFor = (purpose) => OTP.TTL_MS[purpose] ?? OTP.TTL_MS.signup;

const remainingSeconds = (expiresAt) =>
    Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000));


export const issueOtp = async (email, purpose, data = {}) => {
    const existing = await otpRepository.findActive(email, purpose);
    if (existing) {
        const ageMs = Date.now() - new Date(existing.createdAt).getTime();
        if (ageMs < OTP.MIN_RESEND_SECONDS * 1000) {
            const wait = Math.ceil((OTP.MIN_RESEND_SECONDS * 1000 - ageMs) / 1000);
            throw buildError(`Please wait ${wait}s before requesting another OTP`, 429, {
                retryAfter: wait,
                remainingSeconds: remainingSeconds(existing.expiresAt)
            });
        }
    }

    const otp = generateOtp();
    const otpHash = hashOtp(otp);
    const expiresAt = new Date(Date.now() + ttlFor(purpose));

    const doc = await otpRepository.upsertOtp(email, purpose, {
        otpHash,
        expiresAt,
        data
    });

    await sendOTP(email, otp);

    return {
        id: doc._id,
        remainingSeconds: remainingSeconds(doc.expiresAt),
        ttlSeconds: Math.floor(ttlFor(purpose) / 1000)
    };
};


export const verifyOtp = async (email, purpose, submitted) => {
    const token = await otpRepository.findActive(email, purpose);
    if (!token) throw buildError('No active verification request. Please request a new OTP.', 400);
    if (token.isVerified) throw buildError('Already verified', 400);
    if (new Date(token.expiresAt).getTime() < Date.now()) {
        await otpRepository.remove(token._id);
        throw buildError('OTP expired. Please request a new one.', 400);
    }
    if (token.attempts >= OTP.MAX_ATTEMPTS) {
        await otpRepository.remove(token._id);
        throw buildError('Too many failed attempts. Please request a new OTP.', 429);
    }

    const submittedHash = hashOtp(submitted);
    if (!compareOtpHash(submittedHash, token.otpHash)) {
        const updated = await otpRepository.incrementAttempt(token._id);
        const attemptsLeft = Math.max(0, OTP.MAX_ATTEMPTS - updated.attempts);
        throw buildError(`Invalid OTP. ${attemptsLeft} attempts left.`, 400, { attemptsLeft });
    }

    const data = token.data || {};
    await otpRepository.remove(token._id);
    return { ok: true, data };
};

export const getStatus = async (email, purpose) => {
    const token = await otpRepository.findActive(email, purpose);
    if (!token) return { exists: false };
    return {
        exists: true,
        remainingSeconds: remainingSeconds(token.expiresAt),
        attemptsLeft: Math.max(0, OTP.MAX_ATTEMPTS - token.attempts),
        ttlSeconds: Math.floor(ttlFor(purpose) / 1000)
    };
};

export const clearOtp = (email, purpose) =>
    otpRepository.removeForEmail(email, purpose);
