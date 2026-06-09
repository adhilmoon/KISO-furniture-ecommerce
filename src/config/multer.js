import multer from "multer";
import { UPLOAD } from "../constants/index.js";


const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const fileFilter = (req, file, cb) => {
  if (!ALLOWED_TYPES.includes(file.mimetype)) {
    return cb(new Error("Invalid file type. Only JPG, PNG, and WebP are allowed."));
  }
  cb(null, true);
};

const storage = multer.memoryStorage();

// ── Multer Instances ──────────────────────────────────────────────────────────

/** General-purpose upload (e.g. profile pictures, banners) */
export const upload = multer({
  storage,
  limits: { fileSize: UPLOAD.PROFILE_MAX_BYTES },
  fileFilter,
});

/** Product image upload (larger limit) */
export const uploadProduct = multer({
  storage,
  limits: { fileSize: UPLOAD.PRODUCT_MAX_BYTES },
  fileFilter,
});
