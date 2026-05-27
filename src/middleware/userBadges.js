import Cart from '../model/Cart.js';
import Wishlist from '../model/Wishlist.js';
import logger from '../utilities/logger.js';

/**
 * Injects cart/wishlist counts into res.locals so the header partial can
 * render nav badges. Cart count = total item quantity; wishlist count =
 * number of saved products. No-ops (zeros) for guests. Uses projected
 * lean reads to stay cheap on every request.
 */
export const injectUserBadges = async (req, res, next) => {
    res.locals.cartCount = 0;
    res.locals.wishlistCount = 0;

    const userId = req.session?.user?._id;
    if (!userId) return next();

    try {
        const [cart, wishlist] = await Promise.all([
            Cart.findOne({ userId }, { 'items.quantity': 1 }).lean(),
            Wishlist.findOne({ userId }, { items: 1 }).lean()
        ]);
        res.locals.cartCount = cart?.items?.reduce((sum, i) => sum + (i.quantity || 0), 0) || 0;
        res.locals.wishlistCount = wishlist?.items?.length || 0;
    } catch (error) {
        logger.error(`injectUserBadges error: ${error.message}`);
    }
    next();
};
