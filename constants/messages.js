export const MESSAGES = Object.freeze({
    // Admin Auth Messages
    EMPTY_FIELDS: "Please enter both email and password.",
    ADMIN_LOGIN_SUCCESS: "Login successful",
    INVALID_PASSWORD: "Password is incorrect. Please try again.",
    WRONG_ADMIN_CREDENTIALS: "Email or password is incorrect. Please check and try again.",
    ADMIN_AUTH_SERVER_ERROR: "Admin auth Server error",

    // User Auth Messages
    SESSION_EXPIRED: "Session expired. Please signup again.",
    NEW_OTP_SENT: "New OTP sent successfully",
    USER_ALREADY_EXISTS: "User already exists with this email",
    OTP_SENT: "OTP sent to email",
    SIGNUP_FAILED: "Signup failed. Please try again.",
    INCORRECT_PASSWORD: "Password is incorrect. Please try again.",
    INVALID_EMAIL_OR_PASSWORD: "Email or password is incorrect. Please check and try again.",
    USER_ACCOUNT_BLOCKED: "Your account has been blocked by the administrator. Please contact support.",
    LOGIN_SUCCESS: "Login successful",
    USER_REGISTERED_SUCCESS: "User registered successfully!",
    INVALID_OTP: "Invalid OTP. Please try again.",
    VERIFICATION_FAILED: "Verification failed. Please try again later.",
    SESSION_SAVE_ERROR: "Session save error",
    INTERNAL_SERVER_ERROR: "Internal Server Error",

    // Profile & Avatar Messages
    PLEASE_UPLOAD_IMAGE: "Please upload an image",
    USER_NOT_FOUND: "User not found",
    PROFILE_PIC_UPDATED: "Profile picture updated successfully!",
    ERROR_UPLOADING_CLOUDINARY: "Error uploading to Cloudinary",
    USER_NOT_AUTHENTICATED: "User not authenticated",
    PROFILE_UPDATED_SUCCESS: "Updated successfully",
    INTERNAL_SERVER_ERROR_PROFILE: "Internal server error",
    NO_CHANGES_DETECTED: "No changes detected. Please update at least one field.",
    NAME_PHONE_REQUIRED: "Name and phone are required",

    // Category Messages
    REQUIRED_FIELDS_MISSING: "Required fields are missing",
    CATEGORY_CREATED_SUCCESS: "Category created successfully",
    CATEGORY_UPDATED_SUCCESS: "Category updated successfully",
    CATEGORY_DISABLED_SUCCESS: "Category disabled successfully",
    CATEGORY_ENABLED_SUCCESS: "Category enabled successfully",
    CATEGORY_ALREADY_EXISTS: "Category name already exists",
    CATEGORY_NOT_FOUND: "Category not found",
    FETCH_CATEGORY_FAILED: "Failed to fetch category",
    LOAD_USERS_FAILED: "Failed to load users",

    // General Auth & Session Messages
    UNAUTHORIZED_ACCESS: "Unauthorized access",
    SERVER_ERROR: "Server error",
    SOMETHING_WENT_WRONG: "Something went wrong",
    LOGOUT_SUCCESS: "Logged out successfully",
    LOGOUT_FAILED: "Logout failed",
    EMAIL_UPDATED_SUCCESS: "Email updated successfully",
    OTP_VERIFIED: "OTP Verified",
    PASSWORD_UPDATED_SUCCESS: "Password updated successfully",
    EMAIL_ALREADY_IN_USE: "Email already in use",

    // Address Messages
    ADDRESS_ADDED_SUCCESS: "Address added successfully!",
    ADDRESS_DELETED: "Address deleted",
    ADDRESS_NOT_FOUND: "Address not found",
    FETCH_ADDRESS_FAILED: "Failed to fetch address",
    ADDRESS_UPDATED_SUCCESS: "Address updated successfully",
    PRODUCT_NOT_FOUND: "Product not found",
    INTERNAL_SERVER_ERROR_ADDRESS: "Internal server error",

    // Cart Messages
    ADDED_TO_CART: "Added to cart",
    CART_UPDATED: "Cart updated",
    ITEM_REMOVED: "Item removed",
    CART_CLEARED: "Cart cleared",

    // Middleware Messages
    UNAUTHORIZED_LOGIN: "Unauthorized: Please login.",
    ACCOUNT_BLOCKED: "Your account is blocked.",

    // General Error Messages
    PAGE_NOT_FOUND: "Page not found. The requested resource does not exist.",
    ROUTE_NOT_FOUND: "The page you are looking for might have been removed or is temporarily unavailable.",
    GO_BACK_HOME: "Click here to return to the homepage.",
});
