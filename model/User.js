import mongoose from 'mongoose'
// const DEFAULT_USER_AVATAR = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
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
    phone: {
        type: Number,
        unique: true,
        sparse: true

    },
    password: {
        type: String,
        required: function () {
            return !this.googleId;
        }
    },
    isBlock: {
        type: Boolean,
        success: false
    },
    refferalCode: {
        type: String,
        unique: true,
        sparse: true
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true
    },
    avatar: {type: String},
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

const User = mongoose.model('User', Usersceama);
export default User
