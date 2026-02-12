import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

// Configuration with validation
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
  console.error('❌ Cloudinary config incomplete:');
  console.error('   CLOUDINARY_CLOUD_NAME:', cloudName ? '✓' : '✗ missing');
  console.error('   CLOUDINARY_API_KEY:', apiKey ? '✓' : '✗ missing');
  console.error('   CLOUDINARY_API_SECRET:', apiSecret ? '✓' : '✗ missing');
} else {
  console.log('✓ Cloudinary credentials loaded');
}

cloudinary.config({ 
  cloud_name: cloudName, 
  api_key: apiKey, 
  api_secret: apiSecret 
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: 'kiso_uploads',
      allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
      resource_type: 'auto',
      quality: 'auto:best',
      fetch_format: 'auto'
    }
  }
});

export const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if(!allowedMimes.includes(file.mimetype)) {
      return cb(new Error('Invalid file type. Only JPG, PNG, and WebP are allowed.'));
    }
    cb(null, true);
  }
});