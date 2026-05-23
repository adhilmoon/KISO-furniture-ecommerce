import express from "express";
const router = express.Router();

import * as userauth from "../middleware/userAuth.js";
import * as Pages from "../controller/userController/pagesController.js";
import * as authController from "../controller/userController/authController.js";
import * as profileController from "../controller/userController/profileController.js";
import * as storeController from "../controller/userController/storeController.js";
import * as productController from "../controller/userController/productDetailsController.js";
import * as cartController from "../controller/userController/cartController.js";
import * as wishlistController from "../controller/userController/wishlistController.js";
import * as paymentController from "../controller/userController/paymentController.js";
import * as buyNowController from "../controller/userController/buyNowController.js";
import * as otpController from "../controller/userController/otpController.js";
import * as orderController from "../controller/userController/orderController.js";
import * as couponController from "../controller/userController/couponController.js";
import * as walletController from "../controller/userController/walletController.js";
import { upload } from "../config/multer.js";
import passport from "passport";

// Apply no-cache to all routes
router.use(userauth.noCache);

// ============================================
// PUBLIC ROUTES (No auth required)
// ============================================
router.get("/login", userauth.islogin, Pages.login_page);
router.get("/signup", userauth.islogin, Pages.user_signup);
router.get('/reset-password', Pages.reset_password_page);
router.get("/store", Pages.user_store);
router.get('/store/filter-options', storeController.getFilterOptions);
router.get("/product/:id", productController.getProductDetail);
router.get("/page/:slug", Pages.static_page);
router.post("/contact", Pages.submit_contact);

// Google OAuth
router.get("/auth/google", passport.authenticate("google", {scope: ["profile", "email"]}));
router.get("/auth/google/callback", passport.authenticate("google", {failureRedirect: '/user/login?error=Google authentication failed', keepSessionInfo: true}), authController.googleAuthCallback);

// Auth APIs
router.post("/login", userauth.checkUserExists, userauth.checkUserActive, authController.loginauth);
router.post("/signup", authController.signup_post);
router.post("/verify-otp", authController.verify_otp);
router.get("/otp/status", otpController.getOtpStatus);
router.post("/forgot-password", authController.forgot_password);
router.patch("/reset-password", authController.update_password);

// ============================================
// PROTECTED ROUTES (Auth required for all below)
// ============================================
router.use(userauth.userauth); // This applies to everything after this line

// Home & Settings
router.get("/homepage", Pages.user_home);
router.get("/settings", Pages.settings_page);
router.get("/logout", authController.logout);

// Profile
router.get("/profile", Pages.user_profile);
router.patch("/update-profile", profileController.profile_Update);
router.patch("/update-email", profileController.updateEmail);
router.patch("/change-password", profileController.changePassword);
router.patch("/profile/image", upload.single("profileImage"), userauth.handleUploadErrors, profileController.uploadProfilePic);

// Address Management
router.get("/address", Pages.user_address);
router.post("/address/add", profileController.addAddress);
router.get("/address/get/:id", profileController.getAddress);
router.patch("/address/update/:id", profileController.updateAddress);
router.patch("/address/default/:id", profileController.setDefaultAddress);
router.delete("/address/delete/:id", authController.deleteAddress);

// Cart & Checkout
router.get("/cart", cartController.getCartPage);
router.get("/checkout", cartController.getCheckoutPage);
router.get("/checkout/payment", paymentController.getPaymentPage);
router.post("/cart/add", cartController.addToCart);
router.patch("/cart/item/:itemId", cartController.updateQuantity);
router.delete("/cart/item/:itemId", cartController.removeItem);
router.delete("/cart", cartController.clearCart);

// Buy Now (single-item express checkout)
router.post("/buy-now", buyNowController.startBuyNow);
router.delete("/buy-now", buyNowController.cancelBuyNow);

// Coupon
router.post("/coupon/apply", couponController.applyCoupon);
router.delete("/coupon", couponController.removeCoupon);

// Wallet
router.get("/wallet", walletController.getWalletPage);
router.get("/wallet/balance", walletController.getBalance);
router.post("/wallet/topup/create-order", walletController.createTopupOrder);
router.post("/wallet/topup/verify", walletController.verifyTopup);

// Payment
router.post("/payment/create-order", paymentController.createOrder);
router.post("/payment/verify", paymentController.verifyPayment);
router.post("/payment/cod", paymentController.placeCODOrder);
router.post("/payment/wallet", paymentController.placeWalletOrder);
router.get("/order/confirmation/:orderId", paymentController.getOrderConfirmation);
router.get("/payment/failed", paymentController.getPaymentFailed);

// Order Management
router.get("/orders", orderController.getOrders);
router.get("/orders/:id", orderController.getOrderDetail);
router.post("/orders/:id/cancel", orderController.cancelOrder);
router.post("/orders/:id/items/:itemId/cancel", orderController.cancelItem);
router.post("/orders/:id/return", upload.single("returnImage"), userauth.handleUploadErrors, orderController.returnOrder);
router.post("/orders/:id/return/cancel", orderController.cancelReturnRequest);
router.get("/orders/:id/invoice", orderController.downloadInvoice);

// Wishlist
router.get("/wishlist", wishlistController.getWishlistPage);
router.post("/wishlist/toggle", wishlistController.toggleWishlist);
router.post("/wishlist/add-all", wishlistController.addAllToCart);
router.delete("/wishlist/item/:productId", wishlistController.removeItem);

// Session check
router.get("/session-check", (req, res) => {
  res.json({loggedIn: !!req.session.user});
});

export default router;