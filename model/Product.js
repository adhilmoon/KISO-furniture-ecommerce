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
  basePrice: {
    type: Number,
    required: true,
    min: 0,
  },
  material: {
    type: String,
    default: "",
  },

  // ── Dimensions (replaces the old generic `specs` Map) ───────────────────
  dimensions: {
    width:  { type: Number, default: 0 },
    depth:  { type: Number, default: 0 },
    height: { type: Number, default: 0 },
  },

  // ── Custom Attributes (replaces the old `attributes` Map) ───────────────
  // Stored as a flat array of key-value pairs so we can add anything:
  //   [{ key: "Seat Height", value: "45 cm" }, { key: "Drawers", value: "3" }]
  customAttributes: [
    {
      key:   { type: String, required: true },
      value: { type: String, required: true },
    },
  ],

  // ── Main product images ──────────────────────────────────────────────────
  images: [{ type: String }],

  // ── Variants ─────────────────────────────────────────────────────────────
  // Each variant carries its own option type/value, price, stock, and images.
  // Example: { optionType: "Size", optionValue: "King", price: 850, stock: 10 }
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
