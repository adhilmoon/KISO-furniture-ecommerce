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
        title: 'Login',
        query: req.query || {}
    });
}

export const forgot_password_page = (req, res) => {
    res.render('user/forgot-password', {
        title: 'Forgot Password',
        query: req.query || {}
    });
}
export const user_profiel = async (req, res) => {
    const currentUser = req.session.user;
    const user = await User.findById(currentUser)
    res.render('user/profile', {
        user: user,
        isProfilePage: true,
        title: "My Profile"
    })
}
export const user_singup = (req, res) => {
    res.render('user/signup', {
        title: "Sign Up - Kiso",
        user: req.session.user || null,

    });
}

export const user_address = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const perPage = 5; 
        const skip = (page - 1) * perPage;
        
        const userId = req.session.user._id;

       
        const totalAddresses = await Address.countDocuments({ userId });

     
        const addresses = await Address.find({ userId })
            .skip(skip)
            .limit(perPage)
            .sort({ createdAt: -1 });

        const user = await User.findById(userId);

        res.render('user/address', {
            addresses,
            user,
            currentPage: page,
            totalPages: Math.ceil(totalAddresses / perPage),
            title: "My Addresses",
            isProfilePage: true
        });
    } catch (error) {
        console.error(error);
    }
};
export const page_notfound = (req, res) => {
    res.render('user/pagenotfont', {
        title: "pagenotfor"
    })
}
