import logger from "../utilities/logger.js";
import * as adminRepository from "../repository/admin/adminRepository.js";

const noCache = (req, res, next) => {
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');
    next();
};


const isLogin = (req, res, next) => {
    try {
        if (req.session.Admin) {
            return res.redirect('/admin/dashboard');
        }
        next();
    } catch (error) {
        logger.error(`isLogin Middleware Error: ${error.message}`);
        next(error);
    }
};

const isAdmin = async (req, res, next) => {
    try {
        const sessionAdmin = req.session.Admin;
        if (!sessionAdmin || sessionAdmin.role !== 'admin' || !sessionAdmin._id) {
            return res.redirect('/admin/login');
        }
        const admin = await adminRepository.findAdminById(sessionAdmin._id);
        if (!admin) {
            return req.session.destroy(() => res.redirect('/admin/login'));
        }
        req.admin = admin;
        return next();
    } catch (error) {
        logger.error(`isAdmin Middleware Error: ${error.message}`);
        return res.redirect('/admin/login');
    }
};

export { isLogin, isAdmin, noCache };
