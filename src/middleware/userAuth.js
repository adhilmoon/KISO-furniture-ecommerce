import User from "../model/User.js";
import {STATUS_CODES, MESSAGES} from "../constants/index.js";
import logger from "../utilities/logger.js";

const isJsonRequest = (req) => {
  return req.xhr || req.headers['content-type'] === 'application/json' ||
    (req.headers.accept && req.headers.accept.includes("application/json"));
};
export const noCache = (req, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  next();
};
export const userauth = async (req, res, next) => {
  res.header("Cache-Control", "private, no-cache, no-store, must-revalidate");

  try {
    if(!req.session.user) {
      if(isJsonRequest(req)) {
        return res.status(STATUS_CODES.UNAUTHORIZED).json({
          success: false,
          message: MESSAGES.UNAUTHORIZED_LOGIN
        });
      }
      return res.redirect("/user/login");
    }

    const user = await User.findById(req.session.user._id);

    if(!user) {
      delete req.session.user;
      return res.redirect("/user/login");
    }
    if(user.isBlocked) {
      delete req.session.user;

      if(isJsonRequest(req)) {
        return res.status(STATUS_CODES.FORBIDDEN).json({
          success: false,
          message: MESSAGES.ACCOUNT_BLOCKED,
        });
      }

      return res.redirect("/user/login?status=blocked");
    }
    req.currentUser = user;
    res.locals.user = user;
    next();
  } catch(error) {
    logger.error(`userauth middleware error: ${error.message}`);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(MESSAGES.INTERNAL_SERVER_ERROR);
  }
};


export const islogin = (req, res, next) => {
  try {
    if(req.session.user) {
      return res.redirect("/user/homepage");
    }
    next();
  } catch(error) {
    logger.error(`islogin middleware error: ${error.message}`);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(MESSAGES.SERVER_ERROR);
  }
};

export const handleUploadErrors = (err, req, res, next) => {
  if(err) {
    logger.error(`Upload Error: ${err.message}`);
    return res
      .status(STATUS_CODES.BAD_REQUEST)
      .json({success: false, message: err.message || "File upload failed"});
  }
  next();
};

export const checkUserExists = async (req, res, next) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    if (!email) {
      return res.status(STATUS_CODES.UNAUTHORIZED).json({
        success: false,
        message: MESSAGES.INVALID_EMAIL_OR_PASSWORD
      });
    }
    const user = await User.findOne({email});

    if(!user) {
      return res.status(STATUS_CODES.UNAUTHORIZED).json({
        success: false,
        message: MESSAGES.INVALID_EMAIL_OR_PASSWORD
      });
    }


    req.user = user;

    next();
  } catch(error) {
    logger.error(`checkUserExists error: ${error.message}`);
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: MESSAGES.SERVER_ERROR
    });
  }
};

export const setUser = async (req, res, next) => {
  try {
    if(req.session.user) {
      const user = await User.findById(req.session.user._id);
      res.locals.user = user || null;
    } else {
      res.locals.user = null;
    }
    next();
  } catch(error) {
    logger.error(`Global user middleware error: ${error.message}`);
    res.locals.user = null;
    next();
  }
};

export const checkUserActive = (req, res, next) => {
  try {
    const user = req.user;

    if(user?.isBlocked) {
      return res.status(STATUS_CODES.FORBIDDEN).json({
        success: false,
        message: MESSAGES.ACCOUNT_BLOCKED
      });
    }

    next();
  } catch(error) {
    logger.error(`checkUserActive error: ${error.message}`);
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: MESSAGES.SERVER_ERROR
    });
  }
};

export const checkTempdata = (req, res, next) => {
  try {
    if(!req.session.tempUserData) {
      if(isJsonRequest(req)) {
        return res.status(STATUS_CODES.UNAUTHORIZED).json({ success: false, message: MESSAGES.SESSION_EXPIRED });
      }
      return res.redirect("/user/login");
    }
    next();
  } catch(error) {
    logger.error(`checkTempdata middleware error: ${error.message}`);
    if(isJsonRequest(req)) {
      return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: MESSAGES.SERVER_ERROR });
    }
    return res.redirect("/user/login");
  }
}