import { MESSAGES } from '../../constants/index.js';
import catchAsync from '../../utilities/catchAsync.js';
import * as cartService from '../../service/user/cartService.js';
import * as storeService from '../../service/user/storeService.js';
import * as profileService from '../../service/user/profileService.js';

const sampleRooms = [
    { title: 'Classic Velvet Sofa', img: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=80' },
    { title: 'Oak Wood Armchair', img: 'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=1200&q=80' },
    { title: 'Bamboo Coffee Table', img: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1200&q=80' },
    { title: 'Minimalist Dining Set', img: 'https://images.unsplash.com/photo-1604578762246-41134e37f9cc?auto=format&fit=crop&w=1200&q=80' }
];

const pickRandomImage = (arr) => arr[Math.floor(Math.random() * arr.length)];

export const user_home = catchAsync(async (req, res) => {
    const productList = await storeService.getHomeProducts();
    const products = productList.map(product => {
        const allImages = product.variants?.flatMap(v => v.images) || [];
        return { ...product, img: pickRandomImage(allImages) };
    });
    res.render('user/homepage', { title: 'homepagePage', products, rooms: sampleRooms });
});

export const login_page = (req, res) => {
    res.render('user/login', { title: 'Login', query: req.query || {}, isLoggedIn: !!req.session.user });
};

export const reset_password_page = (req, res) => {
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
    const perPage = 5;
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
    const perPage = 6;
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
