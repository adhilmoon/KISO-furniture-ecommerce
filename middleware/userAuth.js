import User from "../model/User.js";


export const userauth = async (req, res, next) => {
  res.header("Cache-Control", "private, no-cache, no-store, must-revalidate");

  try {
    if(!req.session.user) {
      return res.redirect("/user/login");
    }

    const user = await User.findById(req.session.user._id);

    if(user.isBlocked) {
      req.session.destroy((err) => {
        if(err) console.error("Session destroy error:", err);
      });

      return res.redirect(
        "/user/login?status=blocked&message=Your+account+has+been+blocked"
      );
    }


    req.currentUser = user;
    res.locals.user=user;
    next();
  } catch(error) {
    console.error("userauth middleware error:", error);
    res.status(500).send("Internal Server Error");
  }
};


export const islogin = (req, res, next) => {
  try {
    if(req.session.user) {
      return res.redirect("/user/homepage");
    }
    next();
  } catch(error) {
    console.error("islogin middleware error:", error);
    res.status(500).send("Server error");
  }
};


export const isUser = (req, res, next) => {
  try {
    if(req.session.user ) {
      return next();
    }

    return res.redirect("/user/login");
  } catch(error) {
    console.error("isUser middleware error:", error);
    res.status(500).send("Internal Server Error");
  }
};


export const noCache = (req, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.set("Pragma", "no-cache"); 
  res.set("Expires", "0");
  next();
};
export const handleUploadErrors = (err, req, res, next) => {
    if(err) {
        console.error("Upload Error:", err.message);
        return res
            .status(400)
            .json({success: false, message: err.message || "File upload failed"});
    }
    next();
};