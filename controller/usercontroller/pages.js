import User from "../../model/User.js";
import Address from "../../model/Address.js";

export const load_Home = (req, res) => {
    res.render("user/layout", {
        title: 'HOME',
        body: "homepage"
    });
};


export const user_home = async (req, res) => {
    try {
        res.render('user/homepage', {title: 'home page', products: [], rooms: [], user: req.session.user || req.user || null});
    } catch(error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
};

export const login_page = (req, res) => {
    res.render('user/login', {
        title: 'Login'
    });
}
export const user_profiel = async(req, res) => {
    const currentUser = req.session.user;
    const user = await User.findById(currentUser)
    res.render('user/profile', {
        user: user,
        isProfilePage:true,
        title:"My Profile"
    })
}
export const user_singup = (req, res) => {
    res.render('user/signup', {
        title: "Sign Up - Kiso",
        user: req.session.user || null,
    
    });
}

export const user_address=async(req,res)=>{
    
    const userId=req.session.user._id;
     const addresses = await Address.findById(userId);

    const user=await User.findById(userId)
    res.render('user/address',{
        addresses:addresses , 
        title:"addresses",
        isProfilePage: true,
        user:user
    })

}
export const page_notfound=(req,res)=>{
    res.render('user/pagenotfont',{
        title:"pagenotfor"
    })
}
