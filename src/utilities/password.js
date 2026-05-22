import bcrypt from 'bcrypt';

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12;

export const PASSWORD_RULES = Object.freeze({
    MIN_LENGTH: 8,
    DESCRIPTION: 'at least 8 characters with an uppercase letter, a lowercase letter, a number, and a symbol'
});

const STRENGTH_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

export const isStrongPassword = (plain) =>
    typeof plain === 'string' && STRENGTH_REGEX.test(plain);

export const hashPassword = (plain) => bcrypt.hash(plain, SALT_ROUNDS);

export const verifyPassword = (plain, hash) => {
    if (!plain || !hash) return Promise.resolve(false);
    return bcrypt.compare(plain, hash);
};
