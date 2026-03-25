import mongoose from "mongoose";
let schema = mongoose.Schema;

const productSchema = new schema({
  productName: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true
  },
  basePrice: {
    type: Number,
    required: true
  },

  attributes: {
    type: Map,
    of: [String],
    default: {}
  },

  variants: [{
    sku: {type: String, required: true, unique: true},
    attributes: {type: Map, of: String},
    price: {type: Number, required: true},
    stock: {type: Number, required: true, default: 0},
    images: [{type: String}]
  }],

  specs: {
    type: Map,
    of: schema.Types.Mixed,
    default: {}
  },
  images: [{type: String}],
  isListed: {
    type: Boolean,
    default: true
  }
}, {timestamps: true});

export default mongoose.model("Product", productSchema);
