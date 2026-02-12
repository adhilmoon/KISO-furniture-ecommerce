function adminauth(req, res, next) {
    if(req.session.Admin && req.session.Admin.role === 'admin') {
        next()
     } else {
         return res.redirect('/admin/login')
     }


}

const isLogin = (req, res, next) => {
    try {
        if (req.session.Admin) {
           
            return res.redirect('/admin/dashboard'); 
        }
        next(); 
    } catch (error) {
        console.log(error.message);
    }
};

function isAdmin(req, res, next) {
    if(req.session.Admin && req.session.Admin.role != 'user') {
        next()
     } else {
         return res.redirect('/admin/login')
     }
}
 const noCache = (req, res, next) => {
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');
    next();
};
export {adminauth, isLogin, isAdmin,noCache}