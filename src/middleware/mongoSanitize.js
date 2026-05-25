import logger from '../utilities/logger.js';

const isPlainObject = (v) =>
    v !== null && typeof v === 'object' && !Array.isArray(v);

const sanitize = (obj, opts, ctx) => {
    if (Array.isArray(obj)) {
        for (const item of obj) sanitize(item, opts, ctx);
        return;
    }
    if (!isPlainObject(obj)) return;
    for (const key of Object.keys(obj)) {
        if (key.startsWith('$') || key.includes('.')) {
            if (opts.warn) {
                logger.warn(`mongoSanitize stripped key="${key}" on ${ctx.method} ${ctx.url}`);
            }
            delete obj[key];
            continue;
        }
        sanitize(obj[key], opts, ctx);
    }
};

export const mongoSanitizeMiddleware = (opts = { warn: true }) => (req, _res, next) => {
    const ctx = { method: req.method, url: req.originalUrl };
    if (req.body) sanitize(req.body, opts, ctx);
    if (req.params) sanitize(req.params, opts, ctx);
    next();
};

export const sanitizeValue = (v) => {
    if (typeof v === 'string') return v;
    if (v == null) return v;
    return String(v);
};
