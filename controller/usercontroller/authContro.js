import * as userService from "../../service/userService.js"
import User from '../../model/User.js'
import bcrypt from 'bcrypt'
import * as otpsender from '../../utilities/sendEmail.js'


export const signup_post = async (req, res) => {
    try {
        console.log(req.body)
        const {name, email, password,referralCode,isResend} = req.body;
        if (isResend) {
            const tempUser = req.session.tempUserData;
            if (!tempUser || tempUser.email !== email) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Session expired. Please signup again." 
                });
            }
            const newOtp = Math.floor(1000 + Math.random() * 9000).toString();
    
            req.session.tempUserData.otp = newOtp;

            await otpsender.sendOTP(email, newOtp);
            return res.status(200).json({ success: true, message: "New OTP sent successfully" });
        }
 
        const userExist = await User.findOne({email: email});
        if(userExist) {
            return res.status(400).json({
                success: false,
                message: "User already exists with this email  "
            })
        }
        const otp = Math.floor(1000 + Math.random() * 9000).toString();

        req.session.tempUserData = {name, email, password,referralCode, otp};
        await otpsender.sendOTP(email, otp);

        return res.status(200).json({success: true, message: "OTP sent to email"});


    } catch(error) {
        return res.status(500).json({
            success: false,
            message: error.message || "signup fiald "
        })
    }
}

export const loginauth = async (req, res) => {
    try {
        const {email, password} = req.body

        if(!email || !password) {
            return res.status(400).json({success: false, message: "Empty Fields"});
        }
        const RegisterdUser = await User.findOne({email: email});
        if(RegisterdUser) {
            const valid = await bcrypt.compare(password, RegisterdUser.password)

            if(valid) {
                req.session.user = {role: 'user', name: RegisterdUser.name, _id: RegisterdUser._id}
                req.session.save((err) => {
                    if(err) {
                        return res.status(500).json({success: false, message: "Session save error"})
                    }
                })
                return res.status(200).json({
                    success: true,
                    message: "Login successful",
                    redirectUrl: "/user/homepage"
                })
            } else {
                return res.status(401).json({success: false, message: "Incorrect password"});
            }
        } else {

            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

    } catch(error) {
        console.error(error);
        return res.status(500).json({success: false, message: "Internal Server Error"});
    }
}
export const logout = (req, res) => {

    req.session.destroy((error) => {
        if(error) {
            console.log("Session destroy error:", error);
            return res.redirect('/user/homepage');
        }


        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');


        return res.redirect('/');
    });
};

export const verify_otp = async (req, res) => {
    try {
        const {entereOtp} = req.body;
        const tempUser = req.session.tempUserData;
        if (!tempUser) {
            return res.status(400).json({ success: false, message: "Session expired!" });
        }
        const {name, email, password,referralCode, otp} = tempUser
        if(otp === entereOtp) {
             await userService.createUser({name, email, password,referralCode})
            delete req.session.tempUserData;
            return res.status(201).json({
                success: true,
                message: "User registered successfully!",
                redirectUrl: '/user/login'
            });
        }else{
            return res.status(400).json({ 
                success: false, 
                message: "Invalid OTP. Please try again." 
            });
        }
    } catch(error) {
         console.error("OTP verification error:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Verification failed. Please try again later." 
        });
    }

}


// google auth

export const googleAuthCallback = (req, res) => {
    if(req.session){
      req.session.user = { 
            role: 'user', 
            name: req.user.name, 
            _id: req.user._id 
        };
        res.redirect('/user/homepage');
    }else{
        res.redirect('/user/login')
    }
   
};

