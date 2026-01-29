function adminauth(req, res, next) {
    if(req.session.Admin && req.session.Admin.role === 'admin') {
        next()
    } else {
        res.redirect('admin/login')
    }


}

const isLogin = (req, res, next) => {
    try {
        if (req.session.Admin) {
            // ✅ സെഷൻ ഉണ്ടെങ്കിൽ ലോഗിൻ പേജ് കാണിക്കരുത്, ഡാഷ്‌ബോർഡിലേക്ക് വിടുക
            return res.redirect('/admin/dashboard'); 
        }
        next(); // സെഷൻ ഇല്ലെങ്കിൽ മാത്രം ലോഗിൻ പേജിലേക്ക് വിടുക
    } catch (error) {
        console.log(error.message);
    }
};

function isAdmin(req, res, next) {
    if(req.session.Admin && req.session.Admin.role != 'user') {
        next()
    } else {
        res.redirect('admin/login')
    }
}
 const noCache = (req, res, next) => {
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');
    next();
};
export {adminauth, isLogin, isAdmin,noCache}