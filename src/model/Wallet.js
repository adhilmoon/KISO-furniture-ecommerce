import mongoose from 'mongoose';

const WalletSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  balance: {
    type: Number,
    default: 0,
    min: 0
  }
}, { timestamps: true });

export default mongoose.model('Wallet', WalletSchema);
