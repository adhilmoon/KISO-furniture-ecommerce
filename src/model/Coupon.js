import mongoose from 'mongoose';

const CouponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    index: true
  },
  description: { type: String, trim: true },
  discountType: {
    type: String,
    enum: ['percentage', 'flat'],
    required: true
  },
  discountValue: {
    type: Number,
    required: true,
    min: 0
  },
  minPurchase: {
    type: Number,
    default: 0,
    min: 0
  },
  maxDiscount: {
    type: Number,
    default: 0,
    min: 0
  },
  usageLimit: {
    type: Number,
    default: 0,
    min: 0
  },
  perUserLimit: {
    type: Number,
    default: 1,
    min: 0
  },
  usedCount: {
    type: Number,
    default: 0,
    min: 0
  },
  usedBy: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    usedAt: { type: Date, default: Date.now }
  }],
  expiresAt: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  }
}, { timestamps: true });

CouponSchema.index({ code: 1, isActive: 1 });

export default mongoose.model('Coupon', CouponSchema);
