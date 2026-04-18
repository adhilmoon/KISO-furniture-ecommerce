import {v2 as cloudinary} from "cloudinary";
import multer from "multer";
import logger from "../utilities/logger.js";

// Env validation
const {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET
} = process.env;

if(!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  throw new Error(" Cloudinary environment variables missing");
}

// Cloudinary config
cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

logger.info("Cloudinary credentials loaded");

// Storage config
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
  if(!allowed.includes(file.mimetype)) {
    return cb(new Error("Invalid file type. Only JPG, PNG, WebP allowed."));
  }
  cb(null, true);
};

// Multer upload middleware
export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter,

});
export const uploadProduct = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter,
});


export const uploadToCloudinary = async (fileBuffer, folderName = "kiso_furniture") => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {folder: folderName},
      (error, result) => {
        if(error) return reject(error)
        resolve(result)
      }
    );
    uploadStream.end(fileBuffer)

  })
}