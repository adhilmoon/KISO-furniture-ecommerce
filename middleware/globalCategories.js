import Category from '../model/Category.js';
import logger from '../utilities/logger.js';
import { SITE } from '../constants/index.js';

export const fetchGlobalCategories = async (req, res, next) => {
    res.locals.site = SITE;
    try {
        const categories = await Category.find({isActive: true}).sort({categoryName: 1});
        res.locals.globalCategories = categories;
        next();
    } catch(error) {
        logger.error(`Error fetching global categories: ${error.message}`);
        res.locals.globalCategories = [];
        next();
    }
};
