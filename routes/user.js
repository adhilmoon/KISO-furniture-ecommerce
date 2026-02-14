import express from "express"
const router = express.Router()
import * as userauth from "../middleware/userAuth.js"
import * as Pages from "../controller/usercontroller/pages.js";
import * as userController from "../controller/usercontroller/authContro.js"
import * as profileCtr from "../controller/usercontroller/profileCtr.js"
import {upload} from '../config/cloudinary.js'
import passport from "passport";

// Multer error handling middleware
const handleUploadErrors = (err, req, res, next) => {
    if(err) {
        console.error("Upload Error:", err.message);
        return res.status(400).json({success: false, message: err.message || 'File upload failed'});
    }
    next();
};


router.use(userauth.noCache)

router.get('/auth/google', passport.authenticate('google', {scope: ["profile", "email"]}))
router.get('/auth/google/callback', passport.authenticate('google', {failureRedirect: '/user/login'}), userController.googleAuthCallback)
router.get('/',userauth.userauth,userauth.isUser, Pages.load_Home)
router.get('/home', userauth.userauth,userauth.isUser, Pages.load_Home);
router.get('/login', userauth.islogin, Pages.login_page)
router.get('/signup', userauth.islogin, Pages.user_singup)
router.get('/forgot-password-page', Pages.forgot_password_page)
router.post('/login', userController.loginauth)
router.post('/signup', userController.signup_post)
router.post('/veryfy-otp', userController.verify_otp)
router.post('/forgot-password', userController.forgot_password)
router.patch('/reset-password', userController.update_password)

router.get('/homepage', userauth.userauth, userauth.isUser, Pages.user_home)
router.get('/profile', userauth.userauth, userauth.isUser, Pages.user_profiel)
router.get('/address', userauth.userauth, userauth.isUser, Pages.user_address)
router.get('/logout', userController.logout)


router.patch('/update-profile', userauth.userauth, userauth.isUser, profileCtr.profiel_Update)
router.patch('/upload-profile-image', userauth.userauth, userauth.isUser, upload.single('profileImage'),handleUploadErrors, profileCtr.uploadProfilePic)
router.patch('/address/add',userauth.userauth, userauth.isUser,profileCtr.addAddress)
router.get('/address/get/:id',userauth.userauth,userauth.isUser,profileCtr.getAddress)
router.patch('/address/update/:id',userauth.userauth,userauth.isUser,profileCtr.updateAddress)
router.delete('/address/delete/:id',userauth.userauth,userauth.isUser,userController.deleteAddress)

router.get('/pagenotfont', Pages.page_notfound)



export default router