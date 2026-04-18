import express from "express";
const router = express.Router();

import * as userauth from "../middleware/userAuth.js";
import * as Pages from "../controller/userController/pagesController.js";
import * as authController from "../controller/usercontroller/authController.js";
import * as profileController from "../controller/userController/profileController.js";
import * as storeController from "../controller/usercontroller/storeController.js";
import {upload} from "../config/cloudinary.js";

import passport from "passport";




// No-cache middleware
router.use(userauth.noCache);

// Google OAuth
router.get("/login", userauth.islogin, Pages.login_page);
router.get("/auth/google", passport.authenticate("google", {scope: ["profile", "email"]}));
router.get("/auth/google/callback", passport.authenticate("google", {failureRedirect: '/user/login?error=Google authentication failed',keepSessionInfo:true}), authController.googleAuthCallback);

router.get("/homepage",userauth.userauth,userauth.isUser,Pages.user_home)
router.get("/signup", userauth.islogin, Pages.user_signup);


// Auth APIs
router.post("/login",userauth.checkUserExists,userauth.checkUserActive,authController.loginauth);
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

import * as productController from "../controller/usercontroller/productController.js";
import * as cartController from "../controller/usercontroller/cartController.js";

//product listing page API
router.get("/store",Pages.user_store)
router.get('/store/filter-options',storeController.getFilterOptions)
router.get("/product/:id", productController.getProductDetail)

// Cart API
router.get("/cart", userauth.userauth, userauth.isUser, cartController.getCartPage);
router.post("/cart/add", userauth.userauth, userauth.isUser, cartController.addToCart);
router.patch("/cart/item/:itemId", userauth.userauth, userauth.isUser, cartController.updateQuantity);
router.delete("/cart/item/:itemId", userauth.userauth, userauth.isUser, cartController.removeItem);
router.delete("/cart", userauth.userauth, userauth.isUser, cartController.clearCart);

router.get("/session-check", (req, res) => {
  res.json({ loggedIn: !!req.session.user });
});

export default router;
