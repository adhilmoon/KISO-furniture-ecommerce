import Product from '../../model/Product.js';
import Category from '../../model/Category.js';

const getActiveCategoryIds = async () => {
    const cats = await Category.find({ isActive: true }).select('_id').lean();
    return cats.map(c => c._id);
};

export const getHomeProducts = async () => {
    const activeCategoryIds = await getActiveCategoryIds();
    return Product.find({
        isListed: true,
        category: { $in: activeCategoryIds },
        variants: { $exists: true, $not: { $size: 0 } }
    }).limit(4).populate('category').lean();
};

export const getStoreProducts = async ({ search, categoryId, minPrice, maxPrice, sortKey, page, perPage }) => {
    const activeCategoryIds = await getActiveCategoryIds();
    const skip = (page - 1) * perPage;

    const filter = {
        isListed: true,
        category: { $in: activeCategoryIds },
        variants: { $exists: true, $not: { $size: 0 } }
    };

    if (search) filter.productName = { $regex: search, $options: 'i' };
    if (categoryId) {
        filter.category = activeCategoryIds.some(id => id.toString() === categoryId) ? categoryId : null;
    }
    if (!isNaN(minPrice) || !isNaN(maxPrice)) {
        filter['variants.price'] = {};
        if (!isNaN(minPrice)) filter['variants.price'].$gte = minPrice;
        if (!isNaN(maxPrice)) filter['variants.price'].$lte = maxPrice;
    }

    const sortMapping = {
        'price-low': { 'variants.price': 1 },
        'price_asc': { 'variants.price': 1 },
        'price-high': { 'variants.price': -1 },
        'price_desc': { 'variants.price': -1 },
        'a-z': { productName: 1 },
        'name_asc': { productName: 1 },
        'z-a': { productName: -1 },
        'name_desc': { productName: -1 },
        'newest': { createdAt: -1 }
    };
    const sort = sortMapping[sortKey] || sortMapping['newest'];

    const [total, products] = await Promise.all([
        Product.countDocuments(filter),
        Product.find(filter)
            .populate({ path: 'category', match: { isActive: true }, select: 'categoryName' })
            .skip(skip)
            .limit(perPage)
            .sort(sort)
            .lean()
    ]);

    products.forEach(p => {
        p.totalQuantity = Array.isArray(p.variants)
            ? p.variants.reduce((s, v) => s + (v.stock || 0), 0)
            : 0;
    });

    return { total, products };
};

export const getPriceRange = async () => {
    const stats = await Product.aggregate([
        { $match: { isListed: true } },
        { $unwind: '$variants' },
        { $group: { _id: null, min: { $min: '$variants.price' }, max: { $max: '$variants.price' } } }
    ]);
    return { min: stats[0]?.min || 0, max: stats[0]?.max || 100000 };
};

export const getFilterOptions = async () => {
    const [categories, materials, finishes, colors] = await Promise.all([
        Category.find({ isActive: true }).select('categoryName'),
        Product.distinct('material'),
        Product.distinct('finish'),
        Product.distinct('variants.color')
    ]);
    return { categories: categories.map(c => c.categoryName), materials, finishes, colors };
};

export const getCategories = async () =>
    Category.find({ isActive: true }, 'categoryName _id').lean();
