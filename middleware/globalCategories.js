import Category from '../model/Category.js';

export const fetchGlobalCategories = async (req, res, next) => {
    try {
        const categories = await Category.find({isActive: true}).sort({categoryName: 1});
        res.locals.globalCategories = categories;
        next();
    } catch(error) {
        console.error('Error fetching global categories:', error);
        res.locals.globalCategories = [];
        next();
    }
};
