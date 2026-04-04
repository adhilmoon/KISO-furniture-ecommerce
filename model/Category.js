import mongoose from "mongoose";
let schema = mongoose.Schema;

const categoryScheama = new schema({
    categoryName: {
        type: String,
        unique: true,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    isActieve: {
        type: Boolean,
        required: true,
        default: true
    },
    offer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Offer",
        default: null
    },
    variantAttributes: [{
        code: {type: String, required: true},
        label: {type: String, required: true},
        type: {
            type: String,
            enum: ["dropdown", "text", "number", "file"],
            required: true
        },
        required: {type: Boolean, default: false},
        filterable: {type: Boolean, default: false},
        options: [{ // used for dropdown types
            value: {type: String},
            label: {type: String}
        }]
    }]
}, {timestamps: true})

export default mongoose.model("Category", categoryScheama)