import express from "express"
const router =express.Router()

import * as Pages from "../controller/usercontroller/pages.js";

router.get('/home',Pages.load_Home);
router.get('/login',Pages.login_page)


export default router