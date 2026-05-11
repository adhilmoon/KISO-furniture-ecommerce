import User from "../../model/User.js";
import Address from "../../model/Address.js";
import Product from "../../model/Product.js";
import {MESSAGES} from "../../constants/index.js";
import Category from "../../model/Category.js";
import catchAsync from "../../utilities/catchAsync.js";
import * as cartServiece from '../../service/user/cartService.js'






const sampleProducts = [
    {
        name: "Classic Velvet Sofa",
        products: [
            "https://res.cloudinary.com/drns096or/image/upload/v1772372390/Classic_Velvet_Sofa_n0exb3.jpg",
            "https://res.cloudinary.com/drns096or/image/upload/v1772372390/Classic_Velvet_Sofa_n0exb3.jpg"
        ],
        rooms: [
            "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=80"
        ],
        price: 45000
    },
    {
        name: "Oak Wood Armchair",
        products: [
            "https://res.cloudinary.com/drns096or/image/upload/v1772372400/Oak_Wood_Armchair_kn7i1t.jpg",
            "https://res.cloudinary.com/drns096or/image/upload/v1772372400/Oak_Wood_Armchair_kn7i1t.jpg"
        ],
        rooms: [
            "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=1200&q=80"
        ],
        price: 12500
    },
    {
        name: "Bamboo Coffee Table",
        products: [
            "https://res.cloudinary.com/drns096or/image/upload/v1772372416/Bamboo_Coffee_Table_c3ifas.jpg",
            "https://res.cloudinary.com/drns096or/image/upload/v1772372416/Bamboo_Coffee_Table_c3ifas.jpg"
        ],
        rooms: [
            "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1200&q=80"
        ],
        price: 8200
    },
    {
        name: "Minimalist Dining Set",
        products: [
            "https://res.cloudinary.com/drns096or/image/upload/v1772372421/Minimalist_Dining_Set_ib9vrx.jpg",
            "https://res.cloudinary.com/drns096or/image/upload/v1772372421/Minimalist_Dining_Set_ib9vrx.jpg"
        ],
        rooms: [
            "https://images.unsplash.com/photo-1604578762246-41134e37f9cc?auto=format&fit=crop&w=1200&q=80"
        ],
        price: 65000
    }
];





const pickRandomImage = (arr) => arr[Math.floor(Math.random() * arr.length)];

export const user_home = catchAsync(async (req, res) => {
    const activeCategories = await Category.find({isActive: true}).select('_id').lean();
    const activeCategoryIds = activeCategories.map(c => c._id);

    const productList = await Product.find({
        isListed: true,
        category: {$in: activeCategoryIds},
        variants: {
            $exists: true, $not: {
                $size: 0
            }
        }
    })
        .limit(4)
        .populate("category")
        .lean();

    const products = productList.map((product) => {

        const allImages = product.variants?.flatMap(v => v.images) || [];
        return {
            ...product,
            img: pickRandomImage(allImages)
        };
    });

    const rooms = sampleProducts.map((product) => ({
        title: product.name,
        img: pickRandomImage(product.rooms) || pickRandomImage(product.products)
    }));


    res.render('user/homepage', {
        title: 'homepagePage',
        products,
        rooms
    });
});

export const login_page = (req, res) => {
    res.render('user/login', {
        title: 'Login',
        query: req.query || {},
        isLoggedIn: !!req.session.user
    });
}

export const reset_password_page = (req, res) => {
    res.render('user/reset-password', {
        title: 'Forgot Password',
        query: req.query || {}
    });
}


export const user_profile = catchAsync(async (req, res) => {
    const userId = req.session.user._id
    if(!userId) {
        return res.redirect('/login')
    }
    const user = await User.findById(userId)
    if(!user) {
        return res.send(MESSAGES.USER_NOT_FOUND)
    }
    return res.render('user/profile', {
        user: user,
        isProfilePage: true,
        title: "My Profile"
    })
});

export const settings_page = (req, res) => {
    res.render('user/settings', {
        title: 'settings',
        isProfilePage: true,
        query: req.query || {}
    });
}

export const user_signup = (req, res) => {
    res.render('user/signup', {
        title: "Sign Up - Kiso",
        user: req.session.user || null,

    });
}

export const user_address = catchAsync(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const perPage = 5;
    const skip = (page - 1) * perPage;

    const userId = req.session.user._id;


    const totalAddresses = await Address.countDocuments({userId});


    const addresses = await Address.find({userId})
        .skip(skip)
        .limit(perPage)
        .sort({createdAt: -1});

    const user = await User.findById(userId);

    return res.render('user/address', {
        addresses,
        user,
        currentPage: page,
        totalPages: Math.ceil(totalAddresses / perPage),
        title: "My Addresses",
        isProfilePage: true
    });
});

export const user_store = catchAsync(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const perPage = 6;
    const skip = (page - 1) * perPage;

    const searchQuery = req.query.search || "";
    const categoryId = req.query.category || "";
    const minPrice = parseFloat(req.query.minPrice);
    const maxPrice = parseFloat(req.query.maxPrice);

    // ── Build filter ──────────────────────────────────────────────────
    const activeCategories = await Category.find({isActive: true}).select('_id').lean();
    const activeCategoryIds = activeCategories.map(c => c._id);

    const filter = {
        isListed: true,
        category: {$in: activeCategoryIds},
        variants: {
            $exists: true,
            $not: {$size: 0}
        }
    };

    if(searchQuery) {
        filter.productName = {$regex: searchQuery, $options: "i"};
    }

    if(categoryId) {
        if(activeCategoryIds.some(id => id.toString() === categoryId)) {
            filter.category = categoryId;
        } else {
            filter.category = null;
        }
    }

    // Improved Price Filtering
    if(!isNaN(minPrice) || !isNaN(maxPrice)) {
        filter['variants.price'] = {};
        if(!isNaN(minPrice)) filter['variants.price'].$gte = minPrice;
        if(!isNaN(maxPrice)) filter['variants.price'].$lte = maxPrice;
    }

    // ── Sorting Logic ──────────────────────────────────────────────────
    const sortKey = req.query.sort || 'newest';
    const sortMapping = {
        'price-low': {'variants.price': 1},
        'price_asc': {'variants.price': 1},
        'price-high': {'variants.price': -1},
        'price_desc': {'variants.price': -1},
        'a-z': {productName: 1},
        'name_asc': {productName: 1},
        'z-a': {productName: -1},
        'name_desc': {productName: -1},
        'newest': {createdAt: -1}
    };
    const sortCriteria = sortMapping[sortKey] || sortMapping['newest'];


    // ── Query ──────────────────────────────────────────────────────────
    const totalProducts = await Product.countDocuments(filter);
    const products = await Product.find(filter)
        .populate({
            path: 'category',
            match: {isActive: true},
            select: 'categoryName'
        })
        .skip(skip)
        .limit(perPage)
        .sort(sortCriteria)
        .lean();

    products.forEach(product => {
        product.totalQuantity = Array.isArray(product.variants)
            ? product.variants.reduce((sum, v) => sum + (v.stock || 0), 0)
            : 0;
    });


    // ── Get Global Price Range for Slider ───────────────────────────────
    const priceStats = await Product.aggregate([
        {$match: {isListed: true}},
        {$unwind: "$variants"},
        {
            $group: {
                _id: null,
                minPrice: {$min: "$variants.price"},
                maxPrice: {$max: "$variants.price"}
            }
        }
    ]);
    const cartItemMap = {};
    if (req.session.user) {
        const cart = await cartServiece.getCart(req.session.user._id);
        (cart?.items || []).forEach(item => {
            const key = `${item.productId?._id || item.productId}_${item.variantIndex}`;
            cartItemMap[key] = { itemId: String(item._id), quantity: item.quantity };
        });
    }
    const storeMinPrice = priceStats.length > 0 ? priceStats[0].minPrice : 0;
    const storeMaxPrice = priceStats.length > 0 ? priceStats[0].maxPrice : 100000;

    const categories = await Category.find({isActive: true}, 'categoryName _id').lean();

    const activeFilters = {categoryId, minPrice, maxPrice};

    if(req.xhr || req.headers.accept?.includes("application/json")) {
        return res.json({
            success: true,
            products,
            totalProducts,
            currentPage: page,
            totalPages: Math.ceil(totalProducts / perPage),
        });
    }

    return res.render('user/store', {
        title: 'Store - KISO',
        products,
        currentPage: page,
        totalPages: Math.ceil(totalProducts / perPage),
        searchQuery,
        perPage,
        totalProducts,
        categories,
        activeFilters,
        activeSort: sortKey,
        storeMinPrice,
        storeMaxPrice,
        cartItemMap
    });
});
