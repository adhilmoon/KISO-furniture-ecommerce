import { STATUS_CODES, MESSAGES } from "../constants/index.js";
import logger from "../utilities/logger.js";

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

    const statusCode = err.status || STATUS_CODES.INTERNAL_SERVER_ERROR;
    const message = err.message || MESSAGES.INTERNAL_SERVER_ERROR;

      console.error(err)

    if (req.xhr || req.headers.accept?.includes("application/json")) {
        return res.status(statusCode).json({
            success: false,
            message: message
        });
    }

    res.status(statusCode).render('404', {
        title: "Error - KISO",
        message: message
    });
};