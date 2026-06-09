import mongoose from "mongoose";

const PendingOtpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        index: true
    },
    purpose: {
        type: String,
        enum: ['signup', 'forgot_password', 'update-email'],
        required: true
    },
    otpHash: { type: String, required: true },
    attempts: { type: Number, default: 0 },
    isVerified: { type: Boolean, default: false },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
    expiresAt: { type: Date, required: true }
}, { timestamps: true });


PendingOtpSchema.index({ email: 1, purpose: 1 }, { unique: true });


PendingOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('PendingOtp', PendingOtpSchema);
