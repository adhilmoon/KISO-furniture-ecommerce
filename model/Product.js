import mongoose from "mongoose";
const schema = mongoose.Schema;

const productSchema = new schema({
  productName: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },
  offer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Offer",
    default: null,
  },
  basePrice: {
    type: Number,
    required: true,
    min: 0,
  },
  material: {
    type: String,
    default: "",
  },
  brand: {
    type: String,
    default: "",
    trim: true,
    index: true,
  },
  sku: {
    type: String,
    unique: true,
    sparse: true, 
  },

  // ── Dimensions (replaces the old generic `specs` Map) ───────────────────
  dimensions: {
    width:  { type: Number, default: 0 },
    depth:  { type: Number, default: 0 },
    height: { type: Number, default: 0 },
  },

  // ── Custom Attributes (replaces the old `attributes` Map) ───────────────

  customAttributes: [
    {
      key:   { type: String, required: true },
      value: { type: String, required: true },
    },
  ],

  variants: [
    {
      optionType:  { type: String, default: "" },  // e.g. "Color", "Size"
      optionValue: { type: String, default: "" },  // e.g. "Navy", "King"
      price:       { type: Number, required: true, min: 0 },
      stock:       { type: Number, required: true, default: 0, min: 0 },
      images:      [{ type: String }],
    },
  ],

  isListed: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

export default mongoose.model("Product", productSchema);
