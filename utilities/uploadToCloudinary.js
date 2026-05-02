import cloudinary from "../config/cloudinary.js";

const DEFAULT_FOLDER = "kiso_furniture";

/**
 * Uploads a file buffer to Cloudinary.
 * @param {Buffer} fileBuffer - The raw file buffer to upload.
 * @param {string} [folderName] - Destination folder in Cloudinary.
 * @returns {Promise<object>} Cloudinary upload result.
 */
export const uploadToCloudinary = (fileBuffer, folderName = DEFAULT_FOLDER) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: folderName },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(fileBuffer);
  });
};
