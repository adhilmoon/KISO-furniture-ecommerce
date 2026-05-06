import catchAsync from '../../utilities/catchAsync.js';
import { STATUS_CODES } from '../../constants/index.js';
import * as inventoryService from '../../service/admin/adminInventoryService.js';
import Category from '../../model/Category.js';

export const getInventory = catchAsync(async (req, res) => {
  const page        = parseInt(req.query.page) || 1;
  const perPage     = 5;
  const search      = req.query.search?.trim() || '';
  const stockFilter = req.query.stock || '';
  const categoryId  = req.query.category || '';

  const categories = await Category.find({ isActive: true }, 'categoryName').lean();
  const { products, total } = await inventoryService.getInventory({ page, perPage, search, stockFilter, categoryId });

  const outOfStock = products.filter(p => p.stockStatus === 'out').length;
  const lowStock   = products.filter(p => p.stockStatus === 'low').length;

  res.render('admin/inventory', {
    title: 'Inventory Management',
    layout: 'layouts/admin',
    showSidebar: true,
    products,
    categories,
    pageNum: page,
    totalPages: Math.ceil(total / perPage),
    totalProducts: total,
    outOfStock,
    lowStock,
    search,
    stockFilter,
    categoryId
  });
});

export const updateStock = catchAsync(async (req, res) => {
  const { productId, variantIndex, stock } = req.body;
  if (stock === undefined || stock === '') {
    return res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: 'Stock value required' });
  }
  await inventoryService.updateVariantStock(productId, parseInt(variantIndex), stock);
  res.json({ success: true, message: 'Stock updated successfully' });
});
