import crypto from 'crypto';

export const OTP_TTL_MS = 60_000;
export const OTP_LENGTH = 4;

/**
 * Generates a numeric OTP of OTP_LENGTH digits using a cryptographically
 * strong RNG. Always zero-padded so leading zeros are preserved.
 */
export const generateOtp = () => {
    const max = 10 ** OTP_LENGTH;
    return crypto.randomInt(0, max).toString().padStart(OTP_LENGTH, '0');
};

export const createOtpToken = () => ({
    otp: generateOtp(),
    otpExpiresAt: Date.now() + OTP_TTL_MS
});

export const isOtpExpired = (otpExpiresAt) =>
    !otpExpiresAt || Date.now() > otpExpiresAt;

/**
 * Constant-time match between submitted OTP and stored OTP, plus expiry
 * check. Returns one of:
 *   { ok: true }
 *   { ok: false, reason: 'expired' | 'mismatch' | 'missing' }
 */
export const verifyOtpToken = (submitted, stored, otpExpiresAt) => {
    if (!stored || submitted == null) return { ok: false, reason: 'missing' };
    if (isOtpExpired(otpExpiresAt)) return { ok: false, reason: 'expired' };
    const a = Buffer.from(String(submitted));
    const b = Buffer.from(String(stored));
    if (a.length !== b.length) return { ok: false, reason: 'mismatch' };
    if (!crypto.timingSafeEqual(a, b)) return { ok: false, reason: 'mismatch' };
    return { ok: true };
};
