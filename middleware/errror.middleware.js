import { STATUS_CODES, MESSAGES } from "../constants/index.js";
import logger from "../utilities/logger.js";



export const globalErrorHandler = (err, req, res, next) => {
    logger.error(`Unhandled Error: ${err.message}\n${err.stack}`);

    const statusCode = err.status || STATUS_CODES.INTERNAL_SERVER_ERROR;
    const message = err.message || MESSAGES.INTERNAL_SERVER_ERROR;

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