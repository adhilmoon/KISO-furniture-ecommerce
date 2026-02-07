

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







