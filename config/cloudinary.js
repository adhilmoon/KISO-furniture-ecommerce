import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";

// Env validation
const { 
  CLOUDINARY_CLOUD_NAME, 
  CLOUDINARY_API_KEY, 
  CLOUDINARY_API_SECRET 
} = process.env;

if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  throw new Error(" Cloudinary environment variables missing");
}

// Cloudinary config
cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

console.log("..>>Cloudinary credentials loaded<<..");

// Storage config
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    return {
      folder: "kiso/users/profile",
      allowed_formats: ["jpg", "png", "jpeg", "webp"],
      resource_type: "auto",
      quality: "auto:best",
      fetch_format: "auto",
      public_id: `${Date.now()}-${file.originalname}`,
    };
  },
});

// Multer upload middleware
export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "image/webp",
    ];

    if (!allowedMimes.includes(file.mimetype)) {
      return cb(
        new Error(
          "Invalid file type. Only JPG, PNG, and WebP are allowed."
        )
      );
    }

    cb(null, true);
  },
});
