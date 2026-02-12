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

    // Address Messages
    ADDRESS_ADDED_SUCCESS: "Address added successfully!",
    INTERNAL_SERVER_ERROR_ADDRESS: "Internal server error",
});
