import express from "express";
const router = express.Router();
import * as adminauth from '../middleware/adminAuth.js';
import * as adminPages from "../controller/adminController/adminPagesController.js";
import * as adminController from "../controller/adminController/adminAuthController.js";
import * as adminCategory from "../controller/adminController/adminCategory.js";
import * as adminProduct from "../controller/adminController/adminProduct.js";
import * as adminOrderController from "../controller/adminController/adminOrderController.js";
import * as adminInventoryController from "../controller/adminController/adminInventoryController.js";
import * as adminCouponController from "../controller/adminController/adminCouponController.js";
import * as adminOfferController from "../controller/adminController/adminOfferController.js";
import * as adminSalesReportController from "../controller/adminController/adminSalesReportController.js";
import * as adminBannerController from "../controller/adminController/adminBannerController.js";
import * as adminRoomController from "../controller/adminController/adminRoomController.js";
import { uploadProduct, upload } from "../config/multer.js";

// Apply no-cache to all routes
router.use(adminauth.noCache);

// ============================================
// PUBLIC ROUTES
// ============================================
router.get("/login", adminauth.isLogin, adminPages.adminlogin);
router.post('/login', adminController.auth);

// ============================================
// PROTECTED ROUTES (Admin auth required)
// ============================================
router.use(adminauth.isAdmin);

// Dashboard
router.get('/dashboard', adminPages.admindash);
router.get('/dashboard/chart-data', adminPages.dashboardChartData);
router.get('/logout', adminController.logout);

// Customer Management
router.get('/customers', adminPages.users_mange);
router.get("/users/search", adminController.load_data);
router.patch('/user/:id/block', adminPages.toggleBlock);

// Category Management
router.get('/categories', adminPages.adminCategory_load);
router.get('/category/add', adminPages.adminCategoryAdd_load);
router.get('/category/edit/:id', adminPages.adminCategoryEdit_load);
router.get('/category/get/:id', adminCategory.getCategory);
router.post("/category/add", adminCategory.addCategory);
router.patch("/category/update/:id", adminCategory.updateCategories);
router.patch('/category/disable/:id', adminCategory.disableCategories);
router.patch('/category/enable/:id', adminCategory.enableCategories);

// Product Management
router.get('/products', adminPages.adminProduct_Management);
router.get('/product/add', adminPages.addProductPage);
router.post('/product/add', uploadProduct.any(), adminProduct.addProduct);
router.get('/product/edit/:id', adminPages.editProductPage);
router.post('/product/update/:id', uploadProduct.any(), adminProduct.updateProduct);
router.patch('/product/disable/:id', adminProduct.disableProduct);
router.patch('/product/enable/:id', adminProduct.enableProduct);

// Order Management
router.get('/orders', adminOrderController.getOrders);
router.get('/orders/:id', adminOrderController.getOrderDetail);
router.patch('/orders/:id/status', adminOrderController.updateOrderStatus);
router.patch('/orders/:id/mark-paid', adminOrderController.markCODPaid);
router.patch('/orders/:id/approve-return', adminOrderController.approveReturn);
router.patch('/orders/:id/reject-return', adminOrderController.rejectReturn);

// Inventory Management
router.get('/inventory', adminInventoryController.getInventory);
router.patch('/inventory/stock', adminInventoryController.updateStock);

// Coupon Management
router.get('/coupons', adminCouponController.getCoupons);
router.post('/coupons', adminCouponController.createCoupon);
router.delete('/coupons/:id', adminCouponController.deleteCoupon);
router.patch('/coupons/:id/toggle', adminCouponController.toggleCouponActive);

// Offer Management
router.get('/offers', adminOfferController.getOffers);
router.post('/offers', adminOfferController.createOffer);
router.delete('/offers/:id', adminOfferController.deleteOffer);
router.patch('/offers/:id/toggle', adminOfferController.toggleOfferActive);

// Banner Management
router.get('/banners', adminBannerController.getBanners);
router.post('/banners', upload.single('image'), adminBannerController.createBanner);
router.patch('/banners/reorder', adminBannerController.reorderBanners);
router.post('/banners/:id', upload.single('image'), adminBannerController.updateBanner);
router.delete('/banners/:id', adminBannerController.deleteBanner);
router.patch('/banners/:id/toggle', adminBannerController.toggleBannerActive);

// Room Management
router.get('/rooms', adminRoomController.getRooms);
router.post('/rooms', upload.single('image'), adminRoomController.createRoom);
router.patch('/rooms/reorder', adminRoomController.reorderRooms);
router.post('/rooms/:id', upload.single('image'), adminRoomController.updateRoom);
router.delete('/rooms/:id', adminRoomController.deleteRoom);
router.patch('/rooms/:id/toggle', adminRoomController.toggleRoomActive);

// Sales Reports
router.get('/sales-report', adminSalesReportController.getSalesReportPage);
router.get('/sales-report/download/pdf', adminSalesReportController.downloadSalesReportPdf);
router.get('/sales-report/download/excel', adminSalesReportController.downloadSalesReportExcel);

export default router;