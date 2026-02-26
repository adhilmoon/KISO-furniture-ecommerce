import express from "express";
const router = express.Router();

import * as userauth from "../middleware/userAuth.js";
import * as Pages from "../controller/usercontroller/pages.js";
import * as authController from "../controller/usercontroller/authController.js";
import * as profileController from "../controller/usercontroller/profileCtr.js";
import {upload} from "../config/cloudinary.js";
import passport from "passport";




// No-cache middleware
router.use(userauth.noCache);

// Google OAuth
router.get("/login", userauth.islogin, Pages.login_page);
router.get("/auth/google", passport.authenticate("google", {scope: ["profile", "email"]}));
router.get("/auth/google/callback", passport.authenticate("google", {failureRedirect: "/user/login"}), authController.googleAuthCallback);
router.get("/", Pages.load_Home);
router.get("/homepage",userauth.userauth,userauth.isUser,Pages.user_home)
router.get("/signup", userauth.islogin, Pages.user_signup);


// Auth APIs
router.post("/login", authController.loginauth);
router.post("/signup", authController.signup_post);
router.post("/verify-otp", authController.verify_otp);
router.post("/forgot-password", authController.forgot_password);
router.get('/reset-password',Pages.reset_password_page)
router.patch("/reset-password", authController.update_password);
router.get("/settings", userauth.userauth, userauth.isUser, Pages.settings_page);
router.patch("/update-email",userauth.userauth,userauth.isUser,profileController.updateEmail)
router.patch("/change-password", userauth.userauth, userauth.isUser, profileController.changePassword);
router.get("/logout", authController.logout);

// Profile
router.get("/profile",userauth.userauth,userauth.isUser,Pages.user_profile);
router.patch("/update-profile", userauth.userauth, userauth.isUser, profileController.profile_Update);
// Profile Image Upload
router.patch("/profile/image", userauth.userauth, userauth.isUser,upload.single("profileImage"),userauth.handleUploadErrors, profileController.uploadProfilePic);

// Address APIs (REST style)
router.get("/address", userauth.userauth, userauth.isUser, Pages.user_address);
router.post("/address/add", userauth.userauth, userauth.isUser, profileController.addAddress);
router.get("/address/get/:id", userauth.userauth, userauth.isUser, profileController.getAddress);
router.patch("/address/update/:id", userauth.userauth, userauth.isUser, profileController.updateAddress);
router.delete("/address/delete/:id", userauth.userauth, userauth.isUser, authController.deleteAddress);
router.get("/session-check", (req, res) => {
  res.json({ loggedIn: !!req.session.user });
});
// 404 page
router.use(Pages.page_notfound);

export default router;
