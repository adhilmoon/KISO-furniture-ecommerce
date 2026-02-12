import mongoose from "mongoose";

const addressSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    fullName: {type: String, required: true},
    mobile: {type: String, required: true},
    houseName: {type: String, required: true},
    pincode: {type: String, required: true},
    city: {type: String, required: true},
    state: {type: String, required: true},
    isDefault: {type: Boolean, default: false},
    type: {
        type: String,
        enum: ['Home', 'Work', 'Other'], // ഈ വാല്യൂസ് മാത്രമേ അനുവദിക്കൂ
        default: 'Home'
    },
}, {timestamps: true});

const Address = mongoose.model('Address', addressSchema);
export default Address;