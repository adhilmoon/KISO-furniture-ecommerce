import mongoose from 'mongoose';
import Product from '../../model/Product.js';
import { INVENTORY } from '../../constants/index.js';

const { LOW_STOCK_THRESHOLD } = INVENTORY;

const stockMatchStage = (stockFilter) => {
  if (stockFilter === 'out') return [{ $match: { totalStock: 0 } }];
  if (stockFilter === 'low') return [{ $match: { totalStock: { $gt: 0, $lte: LOW_STOCK_THRESHOLD } } }];
  return [];
};

export const getInventory = async ({ page, perPage, search, stockFilter, categoryId }) => {
  const match = {};
  if (search) match.productName = { $regex: search, $options: 'i' };
  if (categoryId && mongoose.Types.ObjectId.isValid(categoryId)) {
    match.category = new mongoose.Types.ObjectId(categoryId);
  }

  const pipeline = [
    { $match: match },
    {
      $addFields: {
        totalStock: {
          $sum: {
            $map: { input: { $ifNull: ['$variants', []] }, as: 'v', in: '$$v.stock' }
          }
        }
      }
    },
    ...stockMatchStage(stockFilter),
    {
      $facet: {
        items: [
          { $sort: { createdAt: -1 } },
          { $skip: (page - 1) * perPage },
          { $limit: perPage },
          { $lookup: { from: 'categories', localField: 'category', foreignField: '_id', as: 'category' } },
          { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
          { $project: { 'category.categoryName': 1, productName: 1, variants: 1, totalStock: 1, createdAt: 1 } }
        ],
        meta: [{ $count: 'total' }]
      }
    }
  ];

  const [agg] = await Product.aggregate(pipeline);
  const products = agg?.items || [];
  const total = agg?.meta?.[0]?.total || 0;

  products.forEach(p => {
    p.stockStatus = p.totalStock === 0 ? 'out' : p.totalStock <= LOW_STOCK_THRESHOLD ? 'low' : 'ok';
  });

  return { products, total };
};

export const updateVariantStock = async (productId, variantIndex, newStock) => {
  const product = await Product.findById(productId);
  if (!product) throw new Error('Product not found');
  if (!product.variants[variantIndex]) throw new Error('Variant not found');
  product.variants[variantIndex].stock = Math.max(0, parseInt(newStock) || 0);
  await product.save();
  return product;
};
