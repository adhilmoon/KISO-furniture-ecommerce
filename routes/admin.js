import express from "express"
const router =express.Router()
import * as adminauth from '../middleware/adminAuth.js'
import * as adminpages from "../controller/admincontroller/adminpages.js"
router.use(adminauth.noCache)
router.get("/login", adminauth.isLogin, adminpages.adminlogin);
router.post('/login', adminpages.auth);
router.get('/dashboard', adminauth.isAdmin, adminpages.admindash);
router.get('/logout', adminpages.logout);

export default router