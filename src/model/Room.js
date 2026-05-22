import mongoose from 'mongoose';

const RoomSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true, maxlength: 80 },
    linkUrl: { type: String, trim: true, default: '/user/store' },
    image: {
        url: { type: String, required: true },
        publicId: { type: String, required: true }
    },
    order: { type: Number, default: 0, index: true },
    isActive: { type: Boolean, default: true, index: true }
}, { timestamps: true });

RoomSchema.index({ isActive: 1, order: 1 });

export default mongoose.model('Room', RoomSchema);
