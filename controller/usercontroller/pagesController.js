import User from "../../model/User.js";
import Address from "../../model/Address.js";
import {STATUS_CODES, MESSAGES} from "../../constants/index.js";


const sampleProducts = [
    {
        name: "Classic Velvet Sofa",
        products: [
            "https://res.cloudinary.com/drns096or/image/upload/v1772372390/Classic_Velvet_Sofa_n0exb3.jpg",
            "https://res.cloudinary.com/drns096or/image/upload/v1772372390/Classic_Velvet_Sofa_n0exb3.jpg"
        ],
        rooms: [
            "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=80"
        ],
        price: 45000
    },
    {
        name: "Oak Wood Armchair",
        products: [
            "https://res.cloudinary.com/drns096or/image/upload/v1772372400/Oak_Wood_Armchair_kn7i1t.jpg",
            "https://res.cloudinary.com/drns096or/image/upload/v1772372400/Oak_Wood_Armchair_kn7i1t.jpg"
        ],
        rooms: [
            "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=1200&q=80"
        ],
        price: 12500
    },
    {
        name: "Bamboo Coffee Table",
        products: [
            "https://res.cloudinary.com/drns096or/image/upload/v1772372416/Bamboo_Coffee_Table_c3ifas.jpg",
            "https://res.cloudinary.com/drns096or/image/upload/v1772372416/Bamboo_Coffee_Table_c3ifas.jpg"
        ],
        rooms: [
            "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1200&q=80"
        ],
        price: 8200
    },
    {
        name: "Minimalist Dining Set",
        products: [
            "https://res.cloudinary.com/drns096or/image/upload/v1772372421/Minimalist_Dining_Set_ib9vrx.jpg",
            "https://res.cloudinary.com/drns096or/image/upload/v1772372421/Minimalist_Dining_Set_ib9vrx.jpg"
        ],
        rooms: [
            "https://images.unsplash.com/photo-1604578762246-41134e37f9cc?auto=format&fit=crop&w=1200&q=80"
        ],
        price: 65000
    }
];
export const load_Home = (req, res) => {
    res.render("user/homepage")
}




const pickRandomImage = (arr) => arr[Math.floor(Math.random() * arr.length)];

export const user_home = async (req, res) => {
    try {

        const products = sampleProducts.map((product) => ({
            ...product,
            img: pickRandomImage(product.products)
        }));

        const rooms = sampleProducts.map((product) => ({
            title: product.name,
            img: pickRandomImage(product.rooms) || pickRandomImage(product.products)
        }));


        res.render('user/homepage', {
            title: 'homepagePage',
            products,
            rooms
        });
    } catch(error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
};

export const login_page = (req, res) => {
    res.render('user/login', {
        title: 'Login',
        query: req.query || {},
        isLoggedIn: !!req.session.user
    });
}

export const reset_password_page = (req, res) => {
    res.render('user/reset-password', {
        title: 'Forgot Password',
        query: req.query || {}
    });
}


export const user_profile = async (req, res) => {
    try {
        const userId = req.session.user._id
        if(!userId) {
            return res.redirect('/login')
        }
        const user = await User.findById(userId)
        res.render('user/profile', {
            user: user,
            isProfilePage: true,
            title: "My Profile"
        })
        if(!user) {
            return res.send("in Db user not fount ")
        }
    } catch(error) {
        console.log(error)
        return res
            .status(STATUS_CODES.INTERNAL_SERVER_ERROR)
            .send(MESSAGES.INTERNAL_SERVER_ERROR);
    }

}
export const settings_page = (req, res) => {
    res.render('user/settings', {
        title: 'settings',
        isProfilePage: true,
        query: req.query || {}
    });
}

export const user_signup = (req, res) => {
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


        const totalAddresses = await Address.countDocuments({userId});


        const addresses = await Address.find({userId})
            .skip(skip)
            .limit(perPage)
            .sort({createdAt: -1});

        const user = await User.findById(userId);

        res.render('user/address', {
            addresses,
            user,
            currentPage: page,
            totalPages: Math.ceil(totalAddresses / perPage),
            title: "My Addresses",
            isProfilePage: true
        });
    } catch(error) {
        console.error(error);
    }
};
export const page_notfound = (req, res) => {

    res.status('404').render('404', {
        title: "Page Not Found - KISO"
    });
};