import express from "express"
const router=express.Router()
import * as Pages from "../controller/userController/pagesController.js"

router.get('/',Pages.user_home)

export default router