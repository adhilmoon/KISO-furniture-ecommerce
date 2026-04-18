import User from "../../model/User.js";
import Order from "../../model/Order.js";
import Category from "../../model/Category.js";
import Product from "../../model/Product.js";
import { STATUS_CODES, MESSAGES } from "../../constants/index.js";
import logger from "../../utilities/logger.js";

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
        if(!user) return res.status(STATUS_CODES.NOT_FOUND).json({success: false, message: MESSAGES.USER_NOT_FOUND});

        // Toggle block state
        user.isBlocked = !user.isBlocked;
        // Maintain status string for display
        user.status = user.isBlocked ? 'Blocked' : (user.isActive ? 'Active' : 'Inactive');

        await user.save();

        return res.json({success: true, isBlocked: user.isBlocked, status: user.status});
    } catch(error) {
        logger.error(`Toggle block error: ${error.message}`);
        return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({success: false, message: MESSAGES.SERVER_ERROR});
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
        logger.error(`View customer error: ${error.message}`);
        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(MESSAGES.SERVER_ERROR);
    }

}

export const adminCategory_load = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const searchQuery = req.query.search || "";
        const perPage = 5;
        const skip = (page - 1) * perPage;

        const filter = {};
        if(searchQuery) {
            filter.categoryName = {$regex: searchQuery, $options: 'i'};
        }
        const totalCategories = await Category.countDocuments()
        const categories = await Category.find(filter)
            .skip(skip)
            .limit(perPage)
            .sort({createdAt: -1})
            .lean()
   if(req.xhr||req.headers.accept?.includes('application/json')){
       return res.json({
          success:true,
          categories,
          totalCategories,
          currentPage:page,
          totalPages:Math.ceil(totalCategories/perPage)
       })
   }
        res.render('admin/category', {
            title: "categoryManagement",
            layout: "layouts/admin",
            showSidebar: true,
            categories,
            totalCategories,
            currentPage: page,
            perPage,
            totalPages: Math.ceil(totalCategories / perPage),
            searchQuery,

        })

    } catch(error) {
        logger.error(`Category management side error: ${error.message}`);
        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(MESSAGES.SERVER_ERROR);
    }
}

export const adminCategoryAdd_load = async (req, res) => {
    try {
        res.render('admin/category-add', {
            title: "Add Category",
            layout: "layouts/admin",
            showSidebar: true,
            category: null // Indicates it's an add operation
        });
    } catch(error) {
        logger.error(`Error loading add category page: ${error.message}`);
        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(MESSAGES.SERVER_ERROR);
    }
};

export const adminCategoryEdit_load = async (req, res) => {
    try {
        const categoryId = req.params.id;
        const category = await Category.findById(categoryId).lean();

        if(!category) {
            return res.status(STATUS_CODES.NOT_FOUND).send(MESSAGES.CATEGORY_NOT_FOUND);
        }

        res.render('admin/category-add', {
            title: "Edit Category",
            layout: "layouts/admin",
            showSidebar: true,
            category // Pass existing data
        });
    } catch(error) {
        logger.error(`Error loading edit category page: ${error.message}`);
        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(MESSAGES.SERVER_ERROR);
    }
};

export const adminProduct_Management = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const searchQuery = req.query.search || "";
        const perPage = 5;
        const skip = (page - 1) * perPage;

        const filter = {};
        if(searchQuery) {
            filter.productName = {$regex: searchQuery, $options: "i"}
        }
        const totalProducts = await Product.countDocuments(filter);
        const products = await Product.find(filter)
            .populate('category', 'categoryName')
            .skip(skip)
            .limit(perPage)
            .sort({createdAt: -1})
            .lean()
        products.forEach(product => {
            if(product.variants && Array.isArray(product.variants)){
               product.totalQuantity = product.variants.reduce((sum, v) => {
                 return  sum + (v.stock||0)}
                ,0)
            }else{
                product.totalQuantity =0;
            }
           
        });
        if(req.xhr || req.headers.accept?.includes('application/json')) {
            return res.json({
                success: true,
                products,
                totalProducts,
                currentPage: page,
                totalPages: Math.ceil(totalProducts / perPage)
            });
        }
        res.render('admin/product', {
            title: "productManagment",
            layout: "layouts/admin",
            showSidebar: true,
            currentPage: page,
            perPage,
            totalProducts,
            products,
            searchQuery,
            totalPages: Math.ceil(totalProducts / perPage)

        })
    } catch(error) {
        logger.error(`Product management side error: ${error.message}`);
        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(MESSAGES.SERVER_ERROR);
    }
}

export const addProductPage = async (req, res) => {
    try {
        const categories = await Category.find({isActive: true})
            .lean();
        res.render("admin/product-add", {
            title: "Add Product",
            layout: "layouts/admin",
            showSidebar: true,
            categories,
        });
    } catch(error) {
        logger.error(`addProductPage error: ${error.message}`);
        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(MESSAGES.SERVER_ERROR);
    }
};

export const editProductPage = async (req, res) => {
    try {
        const productId = req.params.id;
        const product = await Product.findById(productId)
            .populate('category', 'categoryName')
            .lean();
        if(!product) {
            return res.status(STATUS_CODES.NOT_FOUND).send(MESSAGES.PRODUCT_NOT_FOUND);
        }
        const categories = await Category.find({isActive: true}).lean();
        res.render("admin/product-edit", {
            title: "Edit Product",
            layout: "layouts/admin",
            showSidebar: true,
            categories,
            product
        });
    } catch(error) {
        logger.error(`editProductPage error: ${error.message}`);
        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(MESSAGES.SERVER_ERROR);
    }
};

