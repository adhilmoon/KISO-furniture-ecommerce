import mongoose from 'mongoose';

const OfferSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: { type: String, trim: true },
  type: {
    type: String,
    enum: ['product', 'category', 'referral'],
    required: true,
    index: true
  },
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
  maxDiscount: {
    type: Number,
    default: 0,
    min: 0
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    default: null,
    index: true
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null,
    index: true
  },
  startsAt: {
    type: Date,
    default: Date.now
  },
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

OfferSchema.index({ type: 1, isActive: 1, expiresAt: 1 });

export default mongoose.model('Offer', OfferSchema);
