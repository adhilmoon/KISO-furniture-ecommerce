import crypto from 'crypto';

export const OTP_TTL_MS = 60_000;
export const OTP_LENGTH = 4;


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


export const verifyOtpToken = (submitted, stored, otpExpiresAt) => {
    if (!stored || submitted == null) return { ok: false, reason: 'missing' };
    if (isOtpExpired(otpExpiresAt)) return { ok: false, reason: 'expired' };
    const a = Buffer.from(String(submitted));
    const b = Buffer.from(String(stored));
    if (a.length !== b.length) return { ok: false, reason: 'mismatch' };
    if (!crypto.timingSafeEqual(a, b)) return { ok: false, reason: 'mismatch' };
    return { ok: true };
};


export const hashOtp = (otp) => {
    const salt = process.env.SESSION_SECRET || 'kiso-default-salt';
    return crypto.createHash('sha256').update(`${salt}:${otp}`).digest('hex');
};


export const compareOtpHash = (submittedHash, storedHash) => {
    if (!submittedHash || !storedHash) return false;
    const a = Buffer.from(submittedHash, 'hex');
    const b = Buffer.from(storedHash, 'hex');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
};
