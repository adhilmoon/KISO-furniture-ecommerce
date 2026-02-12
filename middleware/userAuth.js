import User from '../model/User.js';

export const userauth = async (req, res, next) => {
   
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    
    if (req.session && req.session.user) {
        // Verify user is not blocked
        try {
            const user = await User.findById(req.session.user._id);
            if (user && user.isBlocked) {
                // Destroy session with callback
                req.session.destroy((err) => {
                    if(err) console.log("Session destroy error:", err);
                });
                return res.redirect('/user/login?status=blocked&message=Your+account+has+been+blocked+by+administrator');
            }
        } catch (error) {
            console.log("Error checking user status:", error);
        }
        return next();
    } else {
        return res.redirect('/user/login');
    }
};
 
export const islogin = (req, res, next) => {
    try {
        if(req.session.user) {
            return res.redirect('/')
        }
        next()
    } catch(error) {
         console.log("something wrong in login", error)
    }

}

export const isUser = async (req, res, next) => {
    try {
        
        if (req.session.user && req.session.user.role === "user") {
            // Verify user is not blocked
            const user = await User.findById(req.session.user._id);
            if (user && user.isBlocked) {
                req.session.destroy((err) => {
                    if(err) console.log("Session destroy error:", err);
                });
                return res.redirect('/user/login?status=blocked&message=Your+account+has+been+blocked+by+administrator');
            }
            return next();
        }
        return res.redirect('/user/login'); 
    } catch (error) {
        console.log("User checking middleware error", error);
        res.status(500).send("Internal Server Error");
    }
}

export const noCache = (req, res, next) => {
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');
    next();
};