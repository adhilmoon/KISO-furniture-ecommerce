import { uploadToCloudinary, deleteFromCloudinary } from './uploadToCloudinary.js';

const toAsset = (uploaded) => ({
    url: uploaded.secure_url,
    publicId: uploaded.public_id,
    width: uploaded.width,
    height: uploaded.height,
    bytes: uploaded.bytes,
    format: uploaded.format
});

const buildError = (message, status = 400) =>
    Object.assign(new Error(message), { status });

/**
 * Validates the uploaded Cloudinary result against rules. On failure,
 * deletes the just-uploaded asset and throws a 400 error.
 *
 * rules: { minWidth, minHeight, maxBytes, aspectRatio: { ratio, tolerance } }
 */
const enforceRules = async (uploaded, rules = {}) => {
    const { minWidth, minHeight, maxBytes, aspectRatio } = rules;
    const fail = async (message) => {
        await deleteFromCloudinary(uploaded.secure_url);
        throw buildError(message, 400);
    };

    if (minWidth && uploaded.width < minWidth) {
        await fail(`Image width must be at least ${minWidth}px (got ${uploaded.width}px)`);
    }
    if (minHeight && uploaded.height < minHeight) {
        await fail(`Image height must be at least ${minHeight}px (got ${uploaded.height}px)`);
    }
    if (maxBytes && uploaded.bytes > maxBytes) {
        const mb = (uploaded.bytes / (1024 * 1024)).toFixed(2);
        await fail(`Image file size ${mb} MB exceeds the limit of ${(maxBytes / (1024 * 1024)).toFixed(0)} MB`);
    }
    if (aspectRatio?.ratio) {
        const actual = uploaded.width / uploaded.height;
        const target = aspectRatio.ratio;
        const tolerance = aspectRatio.tolerance ?? 0.1;
        if (Math.abs(actual - target) > tolerance * target) {
            await fail(
                `Image aspect ratio ${actual.toFixed(2)} is outside the allowed range (target ${target.toFixed(2)})`
            );
        }
    }
};

export const uploadImageAsset = async (file, folder, rules = {}) => {
    const uploaded = await uploadToCloudinary(file.buffer, folder);
    await enforceRules(uploaded, rules);
    return toAsset(uploaded);
};

export const replaceImageAsset = async (existingUrl, file, folder, rules = {}) => {
    const asset = await uploadImageAsset(file, folder, rules);
    if (existingUrl) await deleteFromCloudinary(existingUrl);
    return asset;
};

export const removeImageAsset = (existingUrl) => {
    if (!existingUrl) return Promise.resolve();
    return deleteFromCloudinary(existingUrl);
};
