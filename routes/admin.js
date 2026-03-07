import express from "express"
const router =express.Router()
import * as adminauth from '../middleware/adminAuth.js'
import * as adminPages from "../controller/adminController/adminPagesController.js"
import * as adminController from "../controller/adminController/adminAuthController.js"
router.use(adminauth.noCache)
router.get("/login", adminauth.isLogin, adminPages.adminlogin);
router.post('/login', adminController.auth);
router.get('/dashboard', adminauth.isAdmin, adminPages.admindash);
router.get('/customers',adminauth.isAdmin,adminPages.users_mange)
router.patch('/user/:id/block', adminauth.isAdmin, adminPages.toggleBlock);
router.get("/users/search",adminauth.isAdmin,adminController.load_data)
router.get('/logout', adminController.logout);

export default router