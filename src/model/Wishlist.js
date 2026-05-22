import mongoose from "mongoose";

const WishlistItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  variantIndex: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
}, { _id: true, timestamps: true });

const WishlistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    items: [WishlistItemSchema],
  },
  { timestamps: true }
);

WishlistSchema.index({ userId: 1, "items.productId": 1, "items.variantIndex": 1 });

export default mongoose.model("Wishlist", WishlistSchema);
