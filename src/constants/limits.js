// Pagination
export const PAGINATION = Object.freeze({
    USER_STORE: 6,
    USER_ORDERS: 8,
    USER_ADDRESS: 5,
    USER_WALLET: 10,
    ADMIN_DEFAULT: 10,
    ADMIN_ORDERS: 5,
    ADMIN_INVENTORY: 5,
    ADMIN_USERS: 10,
    ADMIN_CATEGORIES: 5,
    ADMIN_PRODUCTS: 5,
    ADMIN_OFFERS: 10,
    ADMIN_COUPONS: 10,
    ADMIN_BANNERS: 10,
    ADMIN_ROOMS: 12
});


export const CART = Object.freeze({
    MAX_PER_USER: 3
});

export const ORDER = Object.freeze({
    MAX_RETURN_ATTEMPTS: 3,
    RETURN_WINDOW_DAYS: 30,
    CANCELLABLE_STATUSES: Object.freeze(['pending', 'confirmed', 'processing']),
    RETURN_FINAL_STATUSES: Object.freeze(['returned'])
});


export const RETURN = Object.freeze({
    IMAGE_REQUIRED_REASONS: Object.freeze(['damaged', 'wrong_item', 'defective']),
    REASON_DETAIL_MIN: 5,
    REASON_DETAIL_MAX: 300
});


export const PRODUCT = Object.freeze({
    MIN_PRICE: 0.01,
    MIN_VARIANT_IMAGES: 3,
    MAX_VARIANT_IMAGES: 5
});


export const INVENTORY = Object.freeze({
    LOW_STOCK_THRESHOLD: 5
});

export const DASHBOARD = Object.freeze({
    TOP_ANALYTICS_LIMIT: 10,
    SALES_REPORT_ORDER_LIMIT: 1000
});


export const CONTACT_FORM = Object.freeze({
    NAME_MAX: 100,
    EMAIL_MAX: 150,
    SUBJECT_MAX: 150,
    MESSAGE_MAX: 2000
});


export const UPLOAD = Object.freeze({
    PROFILE_MAX_BYTES: 5 * 1024 * 1024,
    PRODUCT_MAX_BYTES: 8 * 1024 * 1024
});


export const OTP = Object.freeze({
    LENGTH: 4,
    MAX_ATTEMPTS: 5,
    MIN_RESEND_SECONDS: 30,
    TTL_MS: Object.freeze({
        signup: 2 * 60 * 1000,           // 2 min
        forgot_password: 60 * 1000,      // 1 min
        'update-email': 60 * 1000        // 1 min
    })
});
