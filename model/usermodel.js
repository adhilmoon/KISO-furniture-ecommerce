import mongoose from 'mongoose'

const Usersceama = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    isBlock: {
        type: Boolean,
        success: false
    },
    refferalCode: {
        type: String,
        unique: ture
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true,
    },
    avatar: {type: String, default: DEFAULT_USER_AVATAR},
    isBlocked: {
        type: Boolean,
        default: false,
    },
    referredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
    },

},
    {
        timestamps: true,
    }


)

export default mongoose.model('User',Usersceama)