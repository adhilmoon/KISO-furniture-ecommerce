import { MESSAGES, STATIC_PAGES, STATUS_CODES, SITE, PAGINATION, CONTACT_FORM } from '../../constants/index.js';
import catchAsync from '../../utilities/catchAsync.js';
import * as cartService from '../../service/user/cartService.js';
import * as storeService from '../../service/user/storeService.js';
import * as profileService from '../../service/user/profileService.js';
import * as bannerService from '../../service/admin/bannerService.js';
import * as roomService from '../../service/admin/roomService.js';
import { sendMail } from '../../utilities/sendEmail.js';
import logger from '../../utilities/logger.js';

const pickRandomImage = (arr) => arr[Math.floor(Math.random() * arr.length)];

export const user_home = catchAsync(async (req, res) => {
    const [productList, banners, rooms] = await Promise.all([
        storeService.getHomeProducts(),
        bannerService.getActiveBanners(),
        roomService.getActiveRooms()
    ]);
    const products = productList.map(product => {
        const allImages = product.variants?.flatMap(v => v.images) || [];
        return { ...product, img: pickRandomImage(allImages) };
    });
    res.render('user/homepage', { title: 'homepagePage', products, rooms, banners });
});

export const login_page = (req, res) => {
    res.render('user/login', { title: 'Login', query: req.query || {}, isLoggedIn: !!req.session.user });
};

export const reset_password_page = (req, res) => {
    if (!req.session.allowReset) {
        return res.redirect('/user/login?error=Session expired. Please try again.');
    }
    res.render('user/reset-password', { title: 'Forgot Password', query: req.query || {} });
};

export const user_profile = catchAsync(async (req, res) => {
    const userId = req.session.user._id;
    if (!userId) return res.redirect('/login');
    const user = await profileService.getUserById(userId);
    if (!user) return res.send(MESSAGES.USER_NOT_FOUND);
    return res.render('user/profile', { user, isProfilePage: true, title: 'My Profile' });
});

export const settings_page = (req, res) => {
    res.render('user/settings', { title: 'settings', isProfilePage: true, query: req.query || {} });
};

export const user_signup = (req, res) => {
    res.render('user/signup', { title: 'Sign Up - Kiso', user: req.session.user || null });
};

export const user_address = catchAsync(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const perPage = PAGINATION.USER_ADDRESS;
    const userId = req.session.user._id;
    const [user, { total, addresses }] = await Promise.all([
        profileService.getUserById(userId),
        profileService.getPaginatedAddresses(userId, page, perPage)
    ]);
    return res.render('user/address', {
        addresses,
        user,
        currentPage: page,
        totalPages: Math.ceil(total / perPage),
        title: 'My Addresses',
        isProfilePage: true
    });
});

export const user_store = catchAsync(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const perPage = PAGINATION.USER_STORE;
    const search = req.query.search || '';
    const categoryId = req.query.category || '';
    const minPrice = parseFloat(req.query.minPrice);
    const maxPrice = parseFloat(req.query.maxPrice);
    const sortKey = req.query.sort || 'newest';

    const [{ total: totalProducts, products }, priceRange, categories] = await Promise.all([
        storeService.getStoreProducts({ search, categoryId, minPrice, maxPrice, sortKey, page, perPage }),
        storeService.getPriceRange(),
        storeService.getCategories()
    ]);

    const cartItemMap = {};
    if (req.session.user) {
        const cart = await cartService.getCart(req.session.user._id);
        (cart?.items || []).forEach(item => {
            const key = `${item.productId?._id || item.productId}_${item.variantIndex}`;
            cartItemMap[key] = { itemId: String(item._id), quantity: item.quantity };
        });
    }

    if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.json({ success: true, products, totalProducts, currentPage: page, totalPages: Math.ceil(totalProducts / perPage) });
    }

    return res.render('user/store', {
        title: 'Store - KISO',
        products,
        currentPage: page,
        totalPages: Math.ceil(totalProducts / perPage),
        searchQuery: search,
        perPage,
        totalProducts,
        categories,
        activeFilters: { categoryId, minPrice, maxPrice },
        activeSort: sortKey,
        storeMinPrice: priceRange.min,
        storeMaxPrice: priceRange.max,
        cartItemMap
    });
});

export const static_page = (req, res) => {
    const slug = req.params.slug;
    const meta = STATIC_PAGES[slug];
    if (!meta) return res.status(STATUS_CODES.NOT_FOUND).render('404', { title: 'Not Found' });
    return res.render(`user/static/${slug}`, { title: meta.title });
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const submit_contact = catchAsync(async (req, res) => {
    const { name = '', email = '', subject = '', message = '' } = req.body || {};
    const cleanName = String(name).trim().slice(0, CONTACT_FORM.NAME_MAX);
    const cleanEmail = String(email).trim().slice(0, CONTACT_FORM.EMAIL_MAX);
    const cleanSubject = String(subject).trim().slice(0, CONTACT_FORM.SUBJECT_MAX) || 'Contact form message';
    const cleanMessage = String(message).trim().slice(0, CONTACT_FORM.MESSAGE_MAX);

    if (!cleanName || !cleanEmail || !cleanMessage) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: 'Name, email and message are required' });
    }
    if (!EMAIL_REGEX.test(cleanEmail)) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: 'Invalid email address' });
    }
    if (!SITE.contact.email) {
        logger.error('Contact form submitted but SITE.contact.email is empty');
        return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Contact endpoint not configured' });
    }

    const escape = (s) => s.replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' })[c]);
    const html = `
        <h2>New contact form message</h2>
        <p><strong>From:</strong> ${escape(cleanName)} &lt;${escape(cleanEmail)}&gt;</p>
        <p><strong>Subject:</strong> ${escape(cleanSubject)}</p>
        <hr>
        <pre style="font-family: inherit; white-space: pre-wrap;">${escape(cleanMessage)}</pre>
    `;
    await sendMail({
        to: SITE.contact.email,
        subject: `[KISO Contact] ${cleanSubject}`,
        html
    });
    return res.json({ success: true, message: 'Message sent. We will get back to you soon.' });
});
