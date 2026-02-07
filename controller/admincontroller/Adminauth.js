

import Admin from "../../model/Admin.js"
import bcrypt from 'bcrypt'

export const auth = async (req, res) => {
    try {
        const {email, password} = req.body;
        if(!email || !password) {
            return res.status(400).json({success: false, message: "Empty Fields"});
        }
        const UserExist = await Admin.findOne({email: email});
        const posswordhas = await bcrypt.hash(password, 12)
        if(UserExist) {
            const isMatch = bcrypt.compare(UserExist.password, posswordhas)

            if(isMatch) {
                req.session.Admin = {role: 'admin'};
                return res.status(200).json({ 
                    success: true, 
                    message: "Login successful", 
                    redirectUrl: '/admin/dashboard' 
                });
            } else {
                return res.status(401).json({ success: false, message: "Invalid password" });
            }
        } else {
            return res.status(401).json({ success: false, message: 'Wrong admin credentials' })
        }
    } catch(error) {
        console.error("Auth Error:", error);
       res.status(500).json({ success: false, message: "Admin auth Server error" });
    }
}

//////////----------//////////////////////

export const logout = (req, res) => {
    req.session.destroy((err) => {
        if(err) {
            console.log("Session destroy error:", err);
            return res.redirect('/admin/dashboard');
        }

        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.redirect('/admin/login');
    });
};

