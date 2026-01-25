import express from "express"
const router =express.Router()

import * as Pages from "../controller/usercontroller/pages.js";

router.get('/home',Pages.load_Home);


export default router