import Product from '../../model/Product.js';
import { CART } from '../../constants/index.js';

const { MAX_PER_USER } = CART;

const buildError = (message, status = 400) =>
    Object.assign(new Error(message), { status });

/**
 * Validates a single-item buy-now request and returns the cart-shape
 * structure expected by checkout/payment views and order placement.
 */
export const buildInstantBuyCart = async ({ productId, variantIndex, quantity }) => {
    if (!productId) throw buildError('Product is required');
    const idx = Number(variantIndex) || 0;
    const qty = Math.max(1, Math.min(parseInt(quantity, 10) || 1, MAX_PER_USER));

    const product = await Product.findById(productId).populate('category').lean();
    if (!product || !product.isListed || (product.category && !product.category.isActive)) {
        throw buildError('Product is not available', 400);
    }
    const variant = product.variants?.[idx];
    if (!variant) throw buildError('Variant not available', 400);
    if (variant.stock <= 0) throw buildError('Out of stock', 400);
    if (qty > variant.stock) throw buildError(`Only ${variant.stock} unit(s) available`, 400);

    return {
        isInstantBuy: true,
        items: [{
            productId: product,
            variantIndex: idx,
            quantity: qty,
            price: variant.price
        }]
    };
};

export const isInstantBuyActive = (req) => Boolean(req.session?.instantBuy);

export const clearInstantBuy = (req) => {
    if (req.session) delete req.session.instantBuy;
};
