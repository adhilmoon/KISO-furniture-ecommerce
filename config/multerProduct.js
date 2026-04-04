import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";


const productStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
   
    const isVariantImage = file.fieldname.startsWith("variants[");

    return {
      folder: isVariantImage ? "kiso/products/variants" : "kiso/products/main",
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
      resource_type: "auto",
      quality: "auto:good",
      fetch_format: "auto",

      public_id: `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`,
    };
  },
});

const fileFilter = (req, file, cb) => {
  const allowedMimes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
  if (!allowedMimes.includes(file.mimetype)) {
    return cb(new Error("Invalid file type. Only JPG, PNG, and WebP are allowed."));
  }
  cb(null, true);
};


export const uploadProduct = multer({
  storage: productStorage,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB per file
  fileFilter,
});
