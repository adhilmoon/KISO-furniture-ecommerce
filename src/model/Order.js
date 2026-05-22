import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  },
  
  // Shipping Information
  shippingAddress: {
    name: { type: String, required: true },
    phone: { type: Number, required: true },
    streetAddress: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: Number, required: true },
    landmark: { type: String },
    addressType: { 
      type: String, 
      enum: ['home', 'work', 'other'],
      default: 'home'
    }
  },

  // Order Items
  orderItems: [{
    productId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Product', 
      required: true 
    },
    quantity: { 
      type: Number, 
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    originalPrice: { type: Number, min: 0 },
    offerDiscount: { type: Number, default: 0, min: 0 },
    offerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Offer' },
    status: {
      type: String, 
      enum: ['processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'return_requested', 'returned'],
      default: 'processing'
    },
    // Milestone timestamps
    shippedAt: { type: Date },
    deliveredAt: { type: Date },
    cancellationReason: { type: String },
    // Return tracking (only if status is 'returned')
    returnReason: { type: String },
    returnImage: { type: String },
    returnRequestedAt: { type: Date }
  }],

  // Payment Information
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
  },
  paymentMethod: {
    type: String,
    enum: ['razorpay', 'cod', 'wallet'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  
  // Pricing
  subtotal: { 
    type: Number,
    required: true,
    min: 0
  },
  shippingCost: { 
    type: Number,
    default: 0,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  couponId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coupon'
  },
  couponCode: { type: String },
  couponDiscount: { type: Number, default: 0, min: 0 },
  walletPaid: { type: Number, default: 0, min: 0 },
  grandTotal: { 
    type: Number,
    required: true,
    min: 0
  },

  // Order Status
  orderStatus: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'return_requested', 'returned', 'return_rejected'],
    default: 'pending',
    index: true
  },

  // Additional Info
  orderId: { type: String, sparse: true, unique: true, index: true },
  cancellationReason: { type: String },
  returnReason: { type: String },
  returnImage: { type: String },
  returnApprovedAt: { type: Date },
  returnRequestedAt: { type: Date },
  returnRejectionReason: { type: String },
  returnRejectedAt: { type: Date },
  returnCancelledAt: { type: Date },
  returnAttempts: { type: Number, default: 0 },
  notes: { type: String },

}, { timestamps: true });

// Index for faster queries
OrderSchema.index({ userId: 1, createdAt: -1 });

OrderSchema.pre('save', async function() {
  if (this.isNew && !this.orderId) {
    const d = new Date();
    const yy = String(d.getFullYear()).slice(-2);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.orderId = `KISO${yy}${mm}${dd}${rand}`;
  }
});


const Order = mongoose.model('Order', OrderSchema);

export default Order;

