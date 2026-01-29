import Admin from "../../model/adminmodel.js"
import bcrypt from 'bcrypt'

export const adminlogin = (req, res) => {
    res.render('admin/login', {
        title: 'Admin Login',
        layout: 'layouts/admin',
        showSidebar: false
    });
};
export const admindash = (req, res) => {
    res.render('admin/dashboard', {
        title: 'Admin dashboard',
        layout: 'layouts/admin',
        showSidebar: true
    });
};



export const auth = async (req, res) => {
    try {
        console.log(req.body)
        const {email, password} = req.body;
        if(!email || !password) {
            return res.render("admin/login", {message: "Empty Fields"})
        }
        const UserExist = await Admin.findOne({email: email});

        if(UserExist) {
            const isMatch = (password === "Kiso@123")
            console.log(isMatch)
            if(isMatch) {
                req.session.Admin = {role: 'admin'};
                return res.redirect('/admin/dashboard')
            } else {
                return res.render('admin/login', {message: "invalid password"})
            }
        } else {
            return res.render('admin/login', {message: 'Wrong admin credentials '})
        }
    } catch(error) {
        res.status(500).send("Admin auth Server error")
    }
}

export const logout = (req, res) => {
    req.session.destroy((err) => {
        if(err) {
            console.log("Session destroy error:", err);
            return res.redirect('/admin/dashboard');
        }


        res.redirect('/admin/login');
    });
};




