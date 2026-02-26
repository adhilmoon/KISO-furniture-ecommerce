import User from "../../model/User.js";
import Address from "../../model/Address.js";
import {STATUS_CODES} from "../../constants/statusCodes.js";
import {MESSAGES} from "../../constants/messages.js";
import * as otpsender from '../../utilities/sendEmail.js'
import bcrypt from 'bcrypt'


export const uploadProfilePic = async (req, res) => {
    try {
        console.log(req.file)
        if(!req.file) {
            return res.status(STATUS_CODES.BAD_REQUEST).json({success: false, message: MESSAGES.PLEASE_UPLOAD_IMAGE});
        }

        const userId = req.session.user._id;
        const imageUrl = req.file.path;

        // Database Update
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {avatar: imageUrl},
            {new: true}
        );
        if(!updatedUser) {
            return res.status(STATUS_CODES.NOT_FOUND).json({success: false, message: MESSAGES.USER_NOT_FOUND});
        }
        if(req.session.user) {
            req.session.user.avatar = imageUrl;
        }

        return res.status(STATUS_CODES.OK).json({
            success: true,
            message: MESSAGES.PROFILE_PIC_UPDATED,
            avatar: imageUrl
        });
    } catch(error) {
        console.error("Upload Error:", error);
        return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({success: false, message: error.message || MESSAGES.ERROR_UPLOADING_CLOUDINARY});
    }
};

//update user profile 

export const profile_Update = async (req, res) => {
    try {
        const {name, phone} = req.body
        const userId = req.session.user?._id;

        if(!userId) {
            return res.status(STATUS_CODES.UNAUTHORIZED).json({success: false, message: MESSAGES.USER_NOT_AUTHENTICATED});
        }
        const currentUser = await User.findById(userId)
        if(!currentUser) {
            return res.status(STATUS_CODES.NOT_FOUND).json({
                success: false,
                message: MESSAGES.USER_NOT_FOUND
            })
        }

        if(currentUser.naem === name && currentUser.phone === phone) {
            return res.status(STATUS_CODES.BAD_REQUEST).json({
                success: false,
                message: "No changes detected. Please update at least one field."
            })
        }
        if(!name && !phone) {
            return res.status(STATUS_CODES.BAD_REQUEST).json({
                success: false,
                message: "Name and phone are required"
            });
        }
        const updatedUser = await User.findByIdAndUpdate(userId, {
            name: name,
            phone: phone
        },
            {new: true}
        )
        if(!updatedUser) {
            return res.status(STATUS_CODES.NOT_FOUND).json({success: false, message: MESSAGES.USER_NOT_FOUND});
        }
        req.session.user.name = name
        return res.status(STATUS_CODES.OK).json({success: true, message: MESSAGES.PROFILE_UPDATED_SUCCESS, user: updatedUser})

    } catch(error) {
        console.error("Profile update error:", error);
        return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({success: false, message: MESSAGES.INTERNAL_SERVER_ERROR_PROFILE})

    }


}
// add adderess

export const addAddress = async (req, res) => {
    try {
        const userId = req.session.user._id;
        const {fullName, mobile, houseName, pincode, city, state, type} = req.body;
        if(!fullName || !mobile || !pincode || !city || !state) {
            return res.status(STATUS_CODES.BAD_REQUEST).json({
                success: false,
                message: "Required fields are missing"
            });
        }

        const newAddress = new Address({
            userId,
            fullName,
            mobile,
            houseName,
            pincode,
            city,
            state,
            type: type || "Home"
        });

        await newAddress.save();

        return res.status(STATUS_CODES.OK).json({
            success: true,
            message: MESSAGES.ADDRESS_ADDED_SUCCESS
        });

    } catch(error) {
        console.error("Add Address Error:", error);
        return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({success: false, message: MESSAGES.INTERNAL_SERVER_ERROR_ADDRESS});
    }
};

// Get single address by ID
export const getAddress = async (req, res) => {
    try {
        const {id} = req.params;
        const address = await Address.findOne({
            _id: id,
            userId: req.session.user._id
        });


        if(!address) {
            return res.status(STATUS_CODES.NOT_FOUND).json({
                success: false,
                message: "Address not found"
            });
        }

        return res.status(STATUS_CODES.OK).json({
            success: true,
            address
        });
    } catch(error) {
        console.error("Get Address Error:", error);
        return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({success: false, message: "Failed to fetch address"});
    }
};

// Update address by ID
export const updateAddress = async (req, res) => {
    try {
        const {id} = req.params;
        const {fullName, mobile, houseName, pincode, city, state, type} = req.body;

        if(!fullName || !mobile || !pincode || !city || !state) {
            return res.status(STATUS_CODES.BAD_REQUEST).json({
                success: false,
                message: "Required fields are missing"
            });
        }

        const updatedAddress = await Address.findOneAndUpdate(
            {_id: id, userId: req.session.user._id},
            {
                fullName,
                mobile,
                houseName,
                pincode,
                city,
                state,
                type: type || "Home"
            },
            {new: true}
        );

        if(!updatedAddress) {
            return res.status(STATUS_CODES.NOT_FOUND).json({
                success: false,
                message: "Address not found"
            });
        }

        return res.status(STATUS_CODES.OK).json({
            success: true,
            message: "Address updated successfully",
            address: updatedAddress
        });
    } catch(error) {
        console.error("Update Address Error:", error);
        return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({success: false, message: MESSAGES.INTERNAL_SERVER_ERROR_ADDRESS});
    }
};

export const updateEmail = async (req, res) => {
    try {
        const {email, password, isResend} = req.body
        const userId = req.session.user._id;
        const user = await User.findById(userId)

        const isMatch = await bcrypt.compare(password, user.password)
        if(!isMatch) {
            return res.status(STATUS_CODES.BAD_REQUEST).json({success: false, message: "Incorrect password"})
        }
        const emailexist = await User.findOne({email, _id: {$ne: userId}})
        if(emailexist) {
            return res.status(STATUS_CODES.BAD_REQUEST).json({success: false, message: "Email already in use"})
        }
        if(isResend) {
            const tempUser = req.session.tempUserData;
            if(!tempUser || tempUser.email !== email) {
                return res.status(STATUS_CODES.BAD_REQUEST).json({
                    success: false,
                    message: MESSAGES.SESSION_EXPIRED
                });
            }
            const newOtp = Math.floor(1000 + Math.random() * 9000).toString();
            console.log(`new OTP${newOtp}for this email${email}`)

            req.session.tempUserData.otp = newOtp;

            await otpsender.sendOTP(email, newOtp);
            return res.status(STATUS_CODES.OK).json({success: true, message: MESSAGES.NEW_OTP_SENT});
        }
        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        console.log(`this is otp : ${otp}for this mail ${email}`)

        req.session.tempUserData = {
            email,
            otp,
            purpose: 'update-email'
        };

        await otpsender.sendOTP(email, otp);
        return res.status(STATUS_CODES.OK).json({success: true, message: MESSAGES.OTP_SENT});




    } catch(error) {
        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json(MESSAGES.INTERNAL_SERVER_ERROR)
    }
}

export const changePassword = async (req, res) => {
    try {
        const {currentPassword, newPassword} = req.body
        const userId = req.session.user._id;
        const user = await User.findById(userId)
        const password = user.password;
        if(!password) {
            return res.status(STATUS_CODES.OK).json({
                redirectUrl: '/user/reset-password'
            })
        }
        const isMatch = await bcrypt.compare(currentPassword, user.password)
        if(!isMatch) {
            return res.status(STATUS_CODES.BAD_REQUEST).json(MESSAGES.INCORRECT_PASSWORD)
        }
        const hashedPassword = await bcrypt.hash(newPassword, 12)
        user.password = hashedPassword;
        await user.save()
        return res.status(STATUS_CODES.OK).json({success: true, message: "Password updated successfully"});
    } catch(error) {
        console.log("change password issue")
        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json(MESSAGES.INTERNAL_SERVER_ERROR)
    }
}