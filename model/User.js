import mongoose from 'mongoose'
// const DEFAULT_USER_AVATAR = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
const UserSchema = new mongoose.Schema({
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
    phone: {
        type: String,
        sparse: true, 
        default: null
    },
    password: {
        type: String,
        required: function () {
            return !this.googleId;
        }
    },

    referralCode: {
        type: String,
        unique: true,
        sparse: true
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true
    },
    avatar: {
        type: String,
    },

    isBlocked: {
        type: Boolean,
        default: false
    },
    referredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
    },
    isActive: {
        type: Boolean,
        default: true
    }

},
    {
        timestamps: true,
    }


)

const User = mongoose.model('User', UserSchema
);
export default User
