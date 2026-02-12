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
    status: { 
      type: String, 
      enum: ['processing', 'shipped', 'delivered', 'cancelled', 'returned'],
      default: 'processing'
    },
    // Milestone timestamps
    shippedAt: { type: Date },
    deliveredAt: { type: Date },
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
  grandTotal: { 
    type: Number,
    required: true,
    min: 0
  },

  // Order Status
  orderStatus: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending',
    index: true
  },

  // Additional Info
  notes: { type: String },
  
}, { timestamps: true });

// Index for faster queries
OrderSchema.index({ userId: 1, createdAt: -1 });


const Order = mongoose.model('Order', OrderSchema);

export default Order;

