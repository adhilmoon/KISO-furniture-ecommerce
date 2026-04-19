import express from "express"
const router=express.Router()
import * as Pages from "../controller/usercontroller/pagesController.js"

router.get('/',Pages.user_home)

export default router