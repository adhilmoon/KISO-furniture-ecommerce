import { uploadToCloudinary, deleteFromCloudinary } from './uploadToCloudinary.js';



const toAsset = (uploaded) => ({
    url: uploaded.secure_url,
    publicId: uploaded.public_id
});

export const uploadImageAsset = async (file, folder) => {
    const uploaded = await uploadToCloudinary(file.buffer, folder);
    return toAsset(uploaded);
};

export const replaceImageAsset = async (existingUrl, file, folder) => {
    const asset = await uploadImageAsset(file, folder);
    if (existingUrl) await deleteFromCloudinary(existingUrl);
    return asset;
};

export const removeImageAsset = (existingUrl) => {
    if (!existingUrl) return Promise.resolve();
    return deleteFromCloudinary(existingUrl);
};
