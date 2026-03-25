import express from "express"
const router = express.Router()
import * as adminauth from '../middleware/adminAuth.js'
import * as adminPages from "../controller/adminController/adminPagesController.js"
import * as adminController from "../controller/adminController/adminAuthController.js"
import * as adminCategory from "../controller/adminController/adminCategory.js"
router.use(adminauth.noCache)
router.get("/login", adminauth.isLogin, adminPages.adminlogin);
router.post('/login', adminController.auth);
router.get('/dashboard', adminauth.isAdmin, adminPages.admindash);
router.get('/customers', adminauth.isAdmin, adminPages.users_mange)
router.get('/categories', adminauth.isAdmin, adminPages.adminCategory_load)
router.get('/products',adminauth.isAdmin,adminPages.adminProduct_Management)
router.get('/category/get/:id', adminauth.isAdmin, adminCategory.getCategory)

router.post("/category/add", adminauth.isAdmin, adminCategory.addCategory);
router.patch("/category/update/:id", adminauth.isAdmin, adminCategory.updateCategories);
router.patch('/category/disable/:id', adminauth.isAdmin, adminCategory.disableCategories)
router.patch('/category/enable/:id', adminauth.isAdmin, adminCategory.enableCategories)
router.patch('/user/:id/block', adminauth.isAdmin, adminPages.toggleBlock);
router.get("/users/search", adminauth.isAdmin, adminController.load_data)
router.get('/logout', adminController.logout);

export default router