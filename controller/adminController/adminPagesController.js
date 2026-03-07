import User from "../../model/User.js";
import Order from "../../model/Order.js";

export const adminlogin = (req, res) => {
    res.render('admin/login', {
        title: 'Admin Login',
        layout: 'layouts/admin',
        showSidebar: false
    });
};

export const toggleBlock = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        // Toggle block state
        user.isBlocked = !user.isBlocked;
        // Maintain status string for display
        user.status = user.isBlocked ? 'Blocked' : (user.isActive ? 'Active' : 'Inactive');

        await user.save();

        return res.json({ success: true, isBlocked: user.isBlocked, status: user.status });
    } catch (error) {
        console.error('Toggle block error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
}
export const admindash = (req, res) => {
    res.render('admin/dashboard', {
        title: 'Admin dashboard',
        layout: 'layouts/admin',
        showSidebar: true
    });
};
export const users_mange = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const perPage = 10;
        const skip = (page - 1) * perPage;
        const totalUsers = await User.countDocuments()
        const users = await User.find()
            .skip(skip)
            .limit(perPage)
            .sort({createdAt: -1})
            .lean();

        //Add order count for each users
        for(let user of users) {
            const ordercount = await Order.countDocuments({userId: user._id})
            user.ordercount = ordercount;
             user.status = user.isBlocked ? 'Blocked' : user.isActive ? 'Active' : 'Inactive';
        }
        res.render('admin/users', {
            title: "CustomerManagement",
            layout: 'layouts/admin',
            showSidebar: true,
            users,
            totalUsers,
            currentPage: page,
            totalPages: Math.ceil(totalUsers / perPage),
            perPage

        })
    } catch(error) {
        console.error('View customer error:', error);
        res.status(500).send('Server error');
    }

}





