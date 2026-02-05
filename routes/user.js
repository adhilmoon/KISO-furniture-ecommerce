import express from "express"
const router = express.Router()
import * as userauth from "../middleware/userAuth.js"
import * as Pages from "../controller/usercontroller/pages.js";
import * as userController from "../controller/usercontroller/authContro.js"
import passport from "passport";



router.get('/auth/google',passport.authenticate('google',{scope:["profile","email"]}))
router.get('/auth/google/callback',passport.authenticate('google',{failureRedirect: '/user/login' }),userController.googleAuthCallback)
router.use(userauth.noCache)
router.get('/home', userauth.userauth, Pages.load_Home);
router.get('/login', userauth.islogin, Pages.login_page)
router.post('/login', userController.loginauth)
router.get('/homepage', userauth.isUser, Pages.user_home)
router.get('/signup', userauth.islogin, Pages.user_singup)
router.post('/signup', userController.signup_post)
router.post('/veryfy-otp', userController.verify_otp)
router.get('/profile', userauth.userauth, Pages.user_profiel)
router.get('/logout', userController.logout)


export default router