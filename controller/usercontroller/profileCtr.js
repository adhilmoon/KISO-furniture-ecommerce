import User from "../../model/User.js";
import Address from "../../model/Address.js";




export const uploadProfilePic = async (req, res) => {
    try {
        console.log(req.file)
        if(!req.file) {
            return res.status(400).send("Please upload an image");
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
            return res.status(404).json({ success: false, message: "User not found" });
        }
        req.session.user.avatar = imageUrl;
        return res.status(200).json({ 
            success: true, 
            message: "Profile picture updated successfully!", 
            avatar: imageUrl 
        });
    } catch(error) {
        console.error("Upload Error:", error);
        return res.status(500).json({ success: false, message: "Error uploading to Cloudinary" }); }
};

//update user profile 

export const profiel_Update = async (req, res) => {
    try {
        const {name, phone} = req.body
        const userId = req.session.user?._id;

        if(!userId) {
            return res.status(401).json({success: false, message: "User not authenticated"});
        }


        const updatedUser = await User.findByIdAndUpdate(userId, {
            name: name,
            phone: phone
        },
            {new: true}
        )
        if (!updatedUser) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        req.session.user.name = name
        return res.status(200).json({success: true, message: "Updated successfully",user: updatedUser})

    } catch(error) {
        console.error("Profile update error:", error);
        return res.status(500).json({success: false, message: "interenal server error"})
        
    }


}
// add adderess

export const addAddress = async (req, res) => {
    try {
        const userId = req.session.user._id;
        const { fullName, mobile, houseName, pincode, city, state } = req.body;

        
        const newAddress = new Address({
            userId,
            fullName,
            mobile,
            houseName,
            pincode,
            city,
            state
        });

        await newAddress.save();

        return res.status(200).json({ 
            success: true, 
            message: "Address added successfully!" 
        });

    } catch (error) {
        console.error("Add Address Error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};