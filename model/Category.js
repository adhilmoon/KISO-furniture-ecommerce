import mongoose from "mongoose";
let schema = mongoose.Schema;

const categoryScheama = new schema({
    categoryName: {
        type: String,
        unique: true,
        required: true
    },
    slug:{
        type:String,
        required:true,
        unique:true
    },
    description: {
        type: String,
        required: true
    },
    isActive: {
        type: Boolean,
        required: true,
        default: true
    },
    offer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Offer",
        default: null
    },
    
}, {timestamps: true})

export default mongoose.model("Category", categoryScheama)