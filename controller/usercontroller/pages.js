
export const load_Home = (req, res) => {
    res.render("user/layout", {
        title: 'HOME',
        body: "/user/homepage" 
    });
};

export const login_page=(req,res)=>{
    res.render('user/login');
}