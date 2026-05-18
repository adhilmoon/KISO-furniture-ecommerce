import mongoose from 'mongoose';

const WalletTransactionSchema = new mongoose.Schema({
  walletId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Wallet',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['credit', 'debit'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  source: {
    type: String,
    enum: ['refund_cancel', 'refund_return', 'checkout_pay', 'admin_credit', 'admin_debit', 'referral_bonus'],
    required: true
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  description: { type: String, trim: true },
  balanceAfter: { type: Number, required: true, min: 0 }
}, { timestamps: true });

WalletTransactionSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model('WalletTransaction', WalletTransactionSchema);
