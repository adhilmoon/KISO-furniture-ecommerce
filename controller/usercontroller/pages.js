
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
export const user_profiel = (req, res) => {
    const currentUser = req.session.user;
    res.render('user/profile', {
        user: currentUser
    })
}
export const user_singup = (req, res) => {
    res.render('user/signup', {
        title: "Sign Up - Kiso",
        user: req.session.user || null
    });
}


