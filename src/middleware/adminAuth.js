import logger from "../utilities/logger.js";

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

const isAdmin = (req, res, next) => {
    if (req.session.Admin && req.session.Admin.role === "admin") {
        return next();
    }
    return res.redirect("/admin/login");
};

export { isLogin,isAdmin,noCache}