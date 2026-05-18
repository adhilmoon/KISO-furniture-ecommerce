import { STATUS_CODES, MESSAGES } from '../../constants/index.js';
import catchAsync from '../../utilities/catchAsync.js';
import * as adminPageService from '../../service/admin/adminPageService.js';
import * as dashboardService from '../../service/admin/dashboardService.js';

export const adminlogin = (req, res)  => {
    res.render('admin/login', {
        title: 'Admin Login',
        layout: 'layouts/admin',
        showSidebar: false
    });
};

export const toggleBlock = catchAsync(async (req, res) => {
    const result = await adminPageService.toggleUserBlock(req.params.id);
    return res.json({ success: true, ...result });
});

export const admindash = catchAsync(async (req, res) => {
    const period = req.query.period || 'monthly';
    const { startDate, endDate } = req.query;
    const [stats, chart, top] = await Promise.all([
        adminPageService.getDashboardStats(),
        dashboardService.getChartData({ period, startDate, endDate }),
        dashboardService.getTopAnalytics({ period, startDate, endDate, limit: 10 })
    ]);
    res.render('admin/dashboard', {
        title: 'Admin dashboard',
        layout: 'layouts/admin',
        showSidebar: true,
        period,
        startDate: startDate || '',
        endDate: endDate || '',
        chart,
        topProducts: top.products,
        topCategories: top.categories,
        ...stats
    });
});

export const dashboardChartData = catchAsync(async (req, res) => {
    const period = req.query.period || 'monthly';
    const { startDate, endDate } = req.query;
    const chart = await dashboardService.getChartData({ period, startDate, endDate });
    res.json({ success: true, chart });
});

export const users_mange = catchAsync(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const perPage = 10;
    const { total: totalUsers, users } = await adminPageService.getUsers(page, perPage);
    res.render('admin/users', {
        title: 'CustomerManagement',
        layout: 'layouts/admin',
        showSidebar: true,
        users,
        totalUsers,
        currentPage: page,
        totalPages: Math.ceil(totalUsers / perPage),
        perPage
    });
});

export const adminCategory_load = catchAsync(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const perPage = 5;
    const search = req.query.search || '';
    const { total: totalCategories, categories } = await adminPageService.getCategoryPage({ search, page, perPage });
    if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.json({ success: true, categories, totalCategories, currentPage: page, totalPages: Math.ceil(totalCategories / perPage) });
    }
    res.render('admin/category', {
        title: 'categoryManagement',
        layout: 'layouts/admin',
        showSidebar: true,
        categories,
        totalCategories,
        currentPage: page,
        perPage,
        totalPages: Math.ceil(totalCategories / perPage),
        searchQuery: search
    });
});

export const adminCategoryAdd_load = (req, res) => {
    res.render('admin/category-add', {
        title: "Add Category",
        layout: "layouts/admin",
        showSidebar: true,
        category: null // Indicates it's an add operation
    });
};

export const adminCategoryEdit_load = catchAsync(async (req, res) => {
    const category = await adminPageService.getCategoryById(req.params.id);
    if (!category) return res.status(STATUS_CODES.NOT_FOUND).send(MESSAGES.CATEGORY_NOT_FOUND);
    res.render('admin/category-add', { title: 'Edit Category', layout: 'layouts/admin', showSidebar: true, category });
});

export const adminProduct_Management = catchAsync(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const perPage = 5;
    const search = req.query.search || '';
    const { total: totalProducts, products } = await adminPageService.getProductPage({ search, page, perPage });
    if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.json({ success: true, products, totalProducts, currentPage: page, totalPages: Math.ceil(totalProducts / perPage) });
    }
    res.render('admin/product', {
        title: 'productManagment',
        layout: 'layouts/admin',
        showSidebar: true,
        currentPage: page,
        perPage,
        totalProducts,
        products,
        searchQuery: search,
        totalPages: Math.ceil(totalProducts / perPage)
    });
});

export const addProductPage = catchAsync(async (req, res) => {
    const categories = await adminPageService.getActiveCategories();
    res.render('admin/product-add', { title: 'Add Product', layout: 'layouts/admin', showSidebar: true, categories });
});

export const editProductPage = catchAsync(async (req, res) => {
    const [product, categories] = await Promise.all([
        adminPageService.getProductForEdit(req.params.id),
        adminPageService.getActiveCategories()
    ]);
    if (!product) return res.status(STATUS_CODES.NOT_FOUND).send(MESSAGES.PRODUCT_NOT_FOUND);
    res.render('admin/product-edit', { title: 'Edit Product', layout: 'layouts/admin', showSidebar: true, categories, product });
});

