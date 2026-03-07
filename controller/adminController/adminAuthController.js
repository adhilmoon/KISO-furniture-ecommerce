
import Admin from "../../model/Admin.js"
import bcrypt from 'bcrypt'
import { STATUS_CODES } from "../../constants/statusCodes.js";
import { MESSAGES } from "../../constants/messages.js";
import User from "../../model/User.js";
import Order from "../../model/Order.js";

export const auth = async (req, res) => {
    try {
        const {email, password} = req.body;
        if(!email || !password) {
            return res.status(STATUS_CODES.BAD_REQUEST).json({success: false, message: MESSAGES.EMPTY_FIELDS});
        }
        const UserExist = await Admin.findOne({email: email});
     
        if(UserExist) {
            const isMatch = await bcrypt.compare(password, UserExist.password)

            if(isMatch) {
                req.session.Admin = {role: 'admin'};
                return res.status(STATUS_CODES.OK).json({ 
                    success: true, 
                    message: MESSAGES.ADMIN_LOGIN_SUCCESS, 
                    redirectUrl: '/admin/dashboard' 
                });
            } else {
                return res.status(STATUS_CODES.UNAUTHORIZED).json({ success: false, message: MESSAGES.INVALID_PASSWORD });
            }
        } else {
            return res.status(STATUS_CODES.UNAUTHORIZED).json({ success: false, message: MESSAGES.WRONG_ADMIN_CREDENTIALS })
        }
    } catch(error) {
        console.error("Auth Error:", error);
       res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: MESSAGES.ADMIN_AUTH_SERVER_ERROR });
    }
}

//////////----------//////////////////////

export const logout = (req, res) => {
    req.session.destroy((err) => {
        if(err) {
            console.log("Session destroy error:", err);
            return res.status(500).json({success: false, message: "Logout failed"});
        }

        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        
        return res.status(200).json({
            success: true,
            message: "Logged out successfully",
            redirectUrl: "/admin/login"
        });
    });
};

export const load_data = async (req, res) => {
    try {
        const query = (req.query.q || "").trim();
        const searchFilter = query
            ? {
                $or: [
                    { name: { $regex: query, $options: "i" } },
                    { email: { $regex: query, $options: "i" } }
                ]
            }
            : {};

        const users = await User.find(searchFilter)
            .sort({ createdAt: -1 })
            .lean();

        const userIds = users.map((user) => user._id);
        const orderCountRows = userIds.length
            ? await Order.aggregate([
                { $match: { userId: { $in: userIds } } },
                { $group: { _id: "$userId", count: { $sum: 1 } } }
            ])
            : [];

        const orderCountMap = new Map(
            orderCountRows.map((item) => [String(item._id), item.count])
        );

        const usersWithMeta = users.map((user) => ({
            ...user,
            ordercount: orderCountMap.get(String(user._id)) || 0,
            status: user.isBlocked ? "Blocked" : user.isActive ? "Active" : "Inactive"
        }));

        return res.status(STATUS_CODES.OK).json({ users: usersWithMeta });
    } catch (error) {
        console.error("Load users search error:", error);
        return res
            .status(STATUS_CODES.INTERNAL_SERVER_ERROR)
            .json({ success: false, message: "Failed to load users" });
    }
}
