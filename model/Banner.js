import mongoose from 'mongoose';

const HEX_COLOR = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

const BannerSchema = new mongoose.Schema({
    title: { type: String, trim: true, maxlength: 100 },
    subtitle: { type: String, trim: true, maxlength: 200 },
    ctaText: { type: String, trim: true, maxlength: 30 },
    linkUrl: { type: String, trim: true },
    image: {
        url: { type: String, required: true },
        publicId: { type: String, required: true }
    },
    bgColor: {
        type: String,
        default: '#1a1a1a',
        validate: { validator: v => HEX_COLOR.test(v), message: 'Invalid hex color' }
    },
    textColor: {
        type: String,
        default: '#ffffff',
        validate: { validator: v => HEX_COLOR.test(v), message: 'Invalid hex color' }
    },
    order: { type: Number, default: 0, index: true },
    isActive: { type: Boolean, default: true, index: true }
}, { timestamps: true });

BannerSchema.index({ isActive: 1, order: 1 });

export default mongoose.model('Banner', BannerSchema);
