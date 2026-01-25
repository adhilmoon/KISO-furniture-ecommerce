import express from "express"
const router =express.Router()
import * as adminpages from "../controller/admincontroller/adminpages.js"

router.get("/login",adminpages.adminlogin)


export default router