import cloudinary from "../config/cloudinary.js";

const DEFAULT_FOLDER = "kiso_furniture";

// ── Magic-byte signatures for allowed image types ─────────────────────────────
const MAGIC_BYTES = [
  { type: "image/jpeg", bytes: [0xff, 0xd8, 0xff] },
  { type: "image/png",  bytes: [0x89, 0x50, 0x4e, 0x47] },
  { type: "image/webp", bytes: [0x52, 0x49, 0x46, 0x46] }, // "RIFF"
];

/**
 * Checks whether a buffer matches a known image magic-byte signature.
 * This prevents spoofed MIME types from reaching Cloudinary.
 * @param {Buffer} buffer
 * @returns {boolean}
 */
const isValidImageBuffer = (buffer) => {
  return MAGIC_BYTES.some(({ bytes }) =>
    bytes.every((byte, i) => buffer[i] === byte)
  );
};

/**
 * Uploads a file buffer to Cloudinary after validating the buffer contents.
 * @param {Buffer} fileBuffer - The raw file buffer to upload.
 * @param {string} [folderName] - Destination folder in Cloudinary.
 * @returns {Promise<object>} Cloudinary upload result.
 * @throws {Error} If the buffer is empty or not a valid image.
 */
export const uploadToCloudinary = (fileBuffer, folderName = DEFAULT_FOLDER) => {
  // ── Buffer validation ────────────────────────────────────────────────────────
  if (!fileBuffer || fileBuffer.length === 0) {
    return Promise.reject(new Error("Upload failed: file buffer is empty."));
  }

  if (!isValidImageBuffer(fileBuffer)) {
    return Promise.reject(
      new Error("Upload failed: file content does not match an allowed image type (JPEG, PNG, WebP).")
    );
  }

  // ── Upload ───────────────────────────────────────────────────────────────────
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
