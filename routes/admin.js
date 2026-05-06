import express from "express";
const router = express.Router();
import * as adminauth from '../middleware/adminAuth.js';
import * as adminPages from "../controller/adminController/adminPagesController.js";
import * as adminController from "../controller/adminController/adminAuthController.js";
import * as adminCategory from "../controller/adminController/adminCategory.js";
import * as adminProduct from "../controller/adminController/adminProduct.js";
import * as adminOrderController from "../controller/adminController/adminOrderController.js";
import * as adminInventoryController from "../controller/adminController/adminInventoryController.js";
import { uploadProduct } from "../config/multer.js";

router.use(adminauth.noCache);

router.get("/login", adminauth.isLogin, adminPages.adminlogin);
router.post('/login', adminController.auth);
router.get('/dashboard', adminauth.isAdmin, adminPages.admindash);
router.get('/customers', adminauth.isAdmin, adminPages.users_mange);
router.get('/categories', adminauth.isAdmin, adminPages.adminCategory_load);
router.get('/products', adminauth.isAdmin, adminPages.adminProduct_Management);
router.get('/category/get/:id', adminauth.isAdmin, adminCategory.getCategory);
router.get('/product/add',  adminauth.isAdmin, adminPages.addProductPage);
router.post('/product/add', adminauth.isAdmin, uploadProduct.any(), adminProduct.addProduct);
router.get('/product/edit/:id', adminauth.isAdmin, adminPages.editProductPage);
router.post('/product/update/:id', adminauth.isAdmin, uploadProduct.any(), adminProduct.updateProduct);
router.patch('/product/disable/:id',adminauth.isAdmin,adminProduct.disableProduct)
router.patch('/product/enable/:id',adminauth.isAdmin,adminProduct.enableProduct)

router.get('/category/add', adminauth.isAdmin, adminPages.adminCategoryAdd_load);
router.get('/category/edit/:id', adminauth.isAdmin, adminPages.adminCategoryEdit_load);
router.post("/category/add", adminauth.isAdmin, adminCategory.addCategory);
router.patch("/category/update/:id", adminauth.isAdmin, adminCategory.updateCategories);
router.patch('/category/disable/:id', adminauth.isAdmin, adminCategory.disableCategories);
router.patch('/category/enable/:id', adminauth.isAdmin, adminCategory.enableCategories);
router.patch('/user/:id/block', adminauth.isAdmin, adminPages.toggleBlock);
router.get("/users/search", adminauth.isAdmin, adminController.load_data);
router.get('/logout', adminController.logout);

// Orders
router.get('/orders', adminauth.isAdmin, adminOrderController.getOrders);
router.get('/orders/:id', adminauth.isAdmin, adminOrderController.getOrderDetail);
router.patch('/orders/:id/status', adminauth.isAdmin, adminOrderController.updateOrderStatus);

// Inventory
router.get('/inventory', adminauth.isAdmin, adminInventoryController.getInventory);
router.patch('/inventory/stock', adminauth.isAdmin, adminInventoryController.updateStock);

export default router;