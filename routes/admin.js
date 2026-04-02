import express from "express";
const router = express.Router();
import * as adminauth from '../middleware/adminAuth.js';
import * as adminPages from "../controller/adminController/adminPagesController.js";
import * as adminController from "../controller/adminController/adminAuthController.js";
import * as adminCategory from "../controller/adminController/adminCategory.js";
import * as adminProduct from "../controller/adminController/adminProduct.js";
import { uploadProduct } from "../config/multerProduct.js";

router.use(adminauth.noCache);

router.get("/login", adminauth.isLogin, adminPages.adminlogin);
router.post('/login', adminController.auth);
router.get('/dashboard', adminauth.isAdmin, adminPages.admindash);
router.get('/customers', adminauth.isAdmin, adminPages.users_mange);
router.get('/categories', adminauth.isAdmin, adminPages.adminCategory_load);
router.get('/products', adminauth.isAdmin, adminPages.adminProduct_Management);
router.get('/category/get/:id', adminauth.isAdmin, adminCategory.getCategory);
router.get('/product/add',  adminauth.isAdmin, adminProduct.addProductPage);
router.post('/product/add', adminauth.isAdmin, uploadProduct.any(), adminProduct.addProduct);

router.get('/category/add', adminauth.isAdmin, adminPages.adminCategoryAdd_load);
router.get('/category/edit/:id', adminauth.isAdmin, adminPages.adminCategoryEdit_load);
router.post("/category/add", adminauth.isAdmin, adminCategory.addCategory);
router.patch("/category/update/:id", adminauth.isAdmin, adminCategory.updateCategories);
router.patch('/category/disable/:id', adminauth.isAdmin, adminCategory.disableCategories);
router.patch('/category/enable/:id', adminauth.isAdmin, adminCategory.enableCategories);
router.patch('/user/:id/block', adminauth.isAdmin, adminPages.toggleBlock);
router.get("/users/search", adminauth.isAdmin, adminController.load_data);
router.get('/logout', adminController.logout);

export default router;