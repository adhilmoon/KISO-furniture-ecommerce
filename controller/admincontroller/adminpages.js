export const adminlogin = (req, res) => {
    res.render('admin/login', { 
        title: 'Admin Login',
        layout: 'layouts/admin' 
    });
};