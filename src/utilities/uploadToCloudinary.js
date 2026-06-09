import cloudinary from "../config/cloudinary.js";
import logger from "../utilities/logger.js";

const DEFAULT_FOLDER = "kiso_furniture";

// ── Magic-byte signatures for allowed image types ─────────────────────────────
const MAGIC_BYTES = [
  { type: "image/jpeg", bytes: [0xff, 0xd8, 0xff] },
  { type: "image/png",  bytes: [0x89, 0x50, 0x4e, 0x47] },
  { type: "image/webp", bytes: [0x52, 0x49, 0x46, 0x46] }, // "RIFF"
];

/**
 * Checks whether a buffer matches a known image magic-byte signature.
 * Prevents spoofed MIME types from reaching Cloudinary.
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

/**
 * Extracts the Cloudinary public_id from a secure URL.
 * e.g. "https://res.cloudinary.com/<cloud>/image/upload/v123/kiso/products/abc.webp"
 *   → "kiso/products/abc"
 * @param {string} url - Cloudinary secure_url.
 * @returns {string|null}
 */
export const extractPublicId = (url) => {
  try {
    const parts = url.split("/upload/");
    if (parts.length < 2) return null;
    // Strip optional version segment (v1234567890/) then file extension
    const withoutVersion = parts[1].replace(/^v\d+\//, "");
    return withoutVersion.replace(/\.[^/.]+$/, "");
  } catch {
    return null;
  }
};

/**
 * Deletes one or more images from Cloudinary by their secure URLs.
 * Skips non-Cloudinary URLs. Errors are logged but never thrown so a
 * failed delete never blocks the main operation.
 * @param {string|string[]} urls - One or more Cloudinary secure_url strings.
 * @returns {Promise<void>}
 */
export const deleteFromCloudinary = async (urls) => {
  const list = Array.isArray(urls) ? urls : [urls];
  const cloudinaryUrls = list.filter(
    (u) => typeof u === "string" && u.includes("res.cloudinary.com")
  );

  await Promise.allSettled(
    cloudinaryUrls.map(async (url) => {
      const publicId = extractPublicId(url);
      if (!publicId) {
        logger.warn(`deleteFromCloudinary: could not extract public_id from "${url}"`);
        return;
      }
      const result = await cloudinary.uploader.destroy(publicId);
      logger.info(`Cloudinary delete "${publicId}": ${result.result}`);
    })
  );
};
