import User from "../../model/User.js";
import Address from "../../model/Address.js";


const sampleProducts = [
    {
        name: "Classic Velvet Sofa",
        products: [
            "https://images.unsplash.com/photo-1493666438817-866a91353ca9?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80"
        ],
        rooms: [
            "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=80"
        ],
        price: 45000
    },
    {
        name: "Oak Wood Armchair",
        products: [
            "https://images.unsplash.com/photo-1598191950976-59910be4996a?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=1200&q=80"
        ],
        rooms: [
            "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=1200&q=80"
        ],
        price: 12500
    },
    {
        name: "Bamboo Coffee Table",
        products: [
            "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1581428982868-e410dd047a90?auto=format&fit=crop&w=1200&q=80"
        ],
        rooms: [
            "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1200&q=80"
        ],
        price: 8200
    },
    {
        name: "Minimalist Dining Set",
        products: [
            "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1617806118233-18e1db207fa6?auto=format&fit=crop&w=1200&q=80"
        ],
        rooms: [
            "https://images.unsplash.com/photo-1604578762246-41134e37f9cc?auto=format&fit=crop&w=1200&q=80"
        ],
        price: 65000
    }
];
export const load_Home = (req, res) => {
    res.render("user/layout", {
        title: 'HOME',
        body: "homepage"
    });
};


// Helper function to pick random image
const pickRandomImage = (arr) => arr[Math.floor(Math.random() * arr.length)];

export const user_home = async (req, res) => {
    try {
        // Mapping products with a single image for display
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
            body: "homepage", 
            products,
            rooms,
            user: req.session.user || null
        });
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
