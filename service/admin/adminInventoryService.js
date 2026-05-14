import Product from '../../model/Product.js';

export const getInventory = async ({ page, perPage, search, stockFilter, categoryId }) => {
  const filter = {};
  if (search) filter.productName = { $regex: search, $options: 'i' };
  if (categoryId) filter.category = categoryId;

  const total = await Product.countDocuments(filter);
  const products = await Product.find(filter)
    .populate('category', 'categoryName')
    .sort({ createdAt: -1 })
    .skip((page - 1) * perPage)
    .limit(perPage)
    .lean();

  products.forEach(p => {
    p.totalStock = p.variants?.reduce((s, v) => s + (v.stock || 0), 0) || 0;
    p.stockStatus = p.totalStock === 0 ? 'out' : p.totalStock <= 5 ? 'low' : 'ok';
  });

  const filtered = stockFilter === 'low' ? products.filter(p => p.stockStatus === 'low')
                 : stockFilter === 'out' ? products.filter(p => p.stockStatus === 'out')
                 : products;

  return { products: filtered, total };
};

export const updateVariantStock = async (productId, variantIndex, newStock) => {
  const product = await Product.findById(productId);
  if (!product) throw new Error('Product not found');
  if (!product.variants[variantIndex]) throw new Error('Variant not found');
  product.variants[variantIndex].stock = Math.max(0, parseInt(newStock) || 0);
  await product.save();
  return product;
};
