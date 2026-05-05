import multer from "multer";

// ── Allowed MIME Types ────────────────────────────────────────────────────────
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const fileFilter = (req, file, cb) => {
  if (!ALLOWED_TYPES.includes(file.mimetype)) {
    return cb(new Error("Invalid file type. Only JPG, PNG, and WebP are allowed."));
  }
  cb(null, true);
};

// ── Shared In-Memory Storage ──────────────────────────────────────────────────
const storage = multer.memoryStorage();

// ── Multer Instances ──────────────────────────────────────────────────────────

/** General-purpose upload (e.g. profile pictures) — 5 MB limit */
export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
});

/** Product image upload — 8 MB limit */
export const uploadProduct = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter,
});
