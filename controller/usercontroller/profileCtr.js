import User from "../../model/User.js";
import Address from "../../model/Address.js";
import { STATUS_CODES } from "../../constants/statusCodes.js";
import { MESSAGES } from "../../constants/messages.js";

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
            { avatar: imageUrl }, 
            { new: true }
        );
        if (!updatedUser) {
            return res.status(STATUS_CODES.NOT_FOUND).json({ success: false, message: MESSAGES.USER_NOT_FOUND });
        }
        req.session.user.avatar = imageUrl;
        return res.status(STATUS_CODES.OK).json({ 
            success: true, 
            message: MESSAGES.PROFILE_PIC_UPDATED, 
            avatar: imageUrl 
        });
    } catch(error) {
        console.error("Upload Error:", error);
        return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message || MESSAGES.ERROR_UPLOADING_CLOUDINARY }); 
    }
};

//update user profile 

export const profiel_Update = async (req, res) => {
    try {
        const {name, phone} = req.body
        const userId = req.session.user?._id;

        if(!userId) {
            return res.status(STATUS_CODES.UNAUTHORIZED).json({success: false, message: MESSAGES.USER_NOT_AUTHENTICATED});
        }


        const updatedUser = await User.findByIdAndUpdate(userId, {
            name: name,
            phone: phone
        },
            {new: true}
        )
        if (!updatedUser) {
            return res.status(STATUS_CODES.NOT_FOUND).json({ success: false, message: MESSAGES.USER_NOT_FOUND });
        }
        req.session.user.name = name
        return res.status(STATUS_CODES.OK).json({success: true, message: MESSAGES.PROFILE_UPDATED_SUCCESS,user: updatedUser})

    } catch(error) {
        console.error("Profile update error:", error);
        return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({success: false, message: MESSAGES.INTERNAL_SERVER_ERROR_PROFILE})
        
    }


}
// add adderess

export const addAddress = async (req, res) => {
    try {
        const userId = req.session.user._id;
        const { fullName, mobile, houseName, pincode, city, state, type } = req.body;
        if (!fullName || !mobile || !pincode || !city||!state) {
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

    } catch (error) {
        console.error("Add Address Error:", error);
        return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: MESSAGES.INTERNAL_SERVER_ERROR_ADDRESS });
    }
};

// Get single address by ID
export const getAddress = async (req, res) => {
    try {
        const { id } = req.params;
        const address = await Address.findById(id);
        
        if (!address) {
            return res.status(STATUS_CODES.NOT_FOUND).json({ 
                success: false, 
                message: "Address not found" 
            });
        }
        
        return res.status(STATUS_CODES.OK).json({ 
            success: true, 
            address 
        });
    } catch (error) {
        console.error("Get Address Error:", error);
        return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: "Failed to fetch address" });
    }
};

// Update address by ID
export const updateAddress = async (req, res) => {
    try {
        const { id } = req.params;
        const { fullName, mobile, houseName, pincode, city, state, type } = req.body;
        
        if (!fullName || !mobile || !pincode || !city || !state) {
            return res.status(STATUS_CODES.BAD_REQUEST).json({ 
                success: false, 
                message: "Required fields are missing" 
            });
        }
        
        const updatedAddress = await Address.findByIdAndUpdate(
            id,
            {
                fullName,
                mobile,
                houseName,
                pincode,
                city,
                state,
                type: type || "Home"
            },
            { new: true }
        );
        
        if (!updatedAddress) {
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
    } catch (error) {
        console.error("Update Address Error:", error);
        return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: MESSAGES.INTERNAL_SERVER_ERROR_ADDRESS });
    }
};