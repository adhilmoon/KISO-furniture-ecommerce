import express from "express";
const router = express.Router();

import * as userauth from "../middleware/userAuth.js";
import * as Pages from "../controller/usercontroller/pagesController.js";
import * as authController from "../controller/usercontroller/authController.js";
import * as profileController from "../controller/usercontroller/profileController.js";
import * as storeController from "../controller/usercontroller/storeController.js";
import * as productController from "../controller/usercontroller/productDetailsController.js";
import * as cartController from "../controller/usercontroller/cartController.js";
import {upload} from "../config/cloudinary.js";

import passport from "passport";




// No-cache middleware
router.use(userauth.noCache);

// Google OAuth
router.get("/login", userauth.islogin, Pages.login_page);
router.get("/auth/google", passport.authenticate("google", {scope: ["profile", "email"]}));
router.get("/auth/google/callback", passport.authenticate("google", {failureRedirect: '/user/login?error=Google authentication failed', keepSessionInfo: true}), authController.googleAuthCallback);

router.get("/homepage", userauth.userauth, Pages.user_home)
router.get("/signup", userauth.islogin, Pages.user_signup);


// Auth APIs
router.post("/login", userauth.checkUserExists, userauth.checkUserActive, authController.loginauth);
router.post("/signup", authController.signup_post);
router.post("/verify-otp", authController.verify_otp);
router.post("/forgot-password", authController.forgot_password);
router.get('/reset-password', Pages.reset_password_page)
router.patch("/reset-password", authController.update_password);
router.get("/settings", userauth.userauth, Pages.settings_page);
router.patch("/update-email", userauth.userauth, profileController.updateEmail)
router.patch("/change-password", userauth.userauth, profileController.changePassword);
router.get("/logout", authController.logout);
// Profile
router.get("/profile", userauth.userauth, Pages.user_profile);
router.patch("/update-profile", userauth.userauth, profileController.profile_Update);
// Profile Image Upload  
router.patch("/profile/image", userauth.userauth, upload.single("profileImage"), userauth.handleUploadErrors, profileController.uploadProfilePic);

// Address APIs (REST style)
router.get("/address", userauth.userauth, Pages.user_address);
router.post("/address/add", userauth.userauth, profileController.addAddress);
router.get("/address/get/:id", userauth.userauth, profileController.getAddress);
router.patch("/address/update/:id", userauth.userauth, profileController.updateAddress);
router.delete("/address/delete/:id", userauth.userauth, authController.deleteAddress);



//product listing page API
router.get("/store",Pages.user_store)
router.get('/store/filter-options', storeController.getFilterOptions)
router.get("/product/:id", productController.getProductDetail)

// Cart API
router.get("/cart", userauth.userauth,cartController.getCartPage);
router.post("/cart/add", userauth.userauth,cartController.addToCart);
router.patch("/cart/item/:itemId", userauth.userauth,cartController.updateQuantity);
router.delete("/cart/item/:itemId", userauth.userauth,cartController.removeItem);
router.delete("/cart", userauth.userauth, cartController.clearCart);

router.get("/session-check", (req, res) => {
  res.json({loggedIn: !!req.session.user});
});

export default router;
