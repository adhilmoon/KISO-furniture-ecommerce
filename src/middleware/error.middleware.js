import multer from "multer";
import { STATUS_CODES, MESSAGES, UPLOAD } from "../constants/index.js";
import logger from "../utilities/logger.js";

const mb = (bytes) => `${(bytes / (1024 * 1024)).toFixed(0)} MB`;

// Handle 404 - Page Not Found
export const pageNotFound = (req, res, next) => {
    res.status(STATUS_CODES.NOT_FOUND).render('404', {
        title: "Page Not Found - KISO",
        layout:req.path.startsWith("/admin")?"layouts/admin" : "layouts/user",
    });
};

// Handle 500 - Global Error Handler
export const globalErrorHandler = (err, req, res, next) => {
    logger.error(`Unhandled Error: ${err.message}\n${err.stack}`);

    const isJson = req.xhr || req.headers.accept?.includes("application/json");

    // ── Multer errors (file size / type) → always 400 ────────────────────────
    if (err instanceof multer.MulterError) {
        const message =
            err.code === "LIMIT_FILE_SIZE"
                ? `File is too large. Maximum allowed size is ${mb(UPLOAD.PROFILE_MAX_BYTES)} for profiles/banners and ${mb(UPLOAD.PRODUCT_MAX_BYTES)} for products.`
                : `Upload error: ${err.message}`;

        return isJson
            ? res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message })
            : res.status(STATUS_CODES.BAD_REQUEST).render("404", { title: "Upload Error - KISO", message });
    }

    // ── File validation errors thrown by uploadToCloudinary ──────────────────
    if (err.message?.startsWith("Upload failed:") || err.message?.startsWith("Invalid file type")) {
        const message = err.message;
        return isJson
            ? res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message })
            : res.status(STATUS_CODES.BAD_REQUEST).render("404", { title: "Upload Error - KISO", message });
    }

    // ── Generic errors ────────────────────────────────────────────────────────
    const statusCode = err.status || STATUS_CODES.INTERNAL_SERVER_ERROR;
    const message = err.message || MESSAGES.INTERNAL_SERVER_ERROR;

    if (isJson) {
        const body = { success: false, message };
        if (Array.isArray(err.issues)) body.issues = err.issues;
        return res.status(statusCode).json(body);
    }

    res.status(statusCode).render('404', {
        title: "Error - KISO",
        message,
        layout: req.path.startsWith('/admin') ? 'layouts/admin' : 'layouts/user'
    });
};