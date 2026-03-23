
import {STATUS_CODES} from "../../constants/statusCodes.js";
import * as categoryService from "../../service/categoryService.js"
import Category from "../../model/Category.js"
// add category
export const addCategory = async (req, res) => {
    try {
        const {categoryName, description} = req.body

        if(!categoryName) {
            return res.status(STATUS_CODES.BAD_REQUEST).json({
                success: false,
                message: "Required fields are missing"
            })
        }

        await categoryService.createCategory({categoryName, description})
        return res.status(STATUS_CODES.CREATED).json({
            success: true,
            message: "success fully Category created",
        })
    } catch(error) {
        console.log("ERROR 👉", error);
        return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "add category facing truble"
        })
    }

}
//update cate gory 
export const updateCategories = async (req, res) => {
    try {
        const {id} = req.params;
        const {categoryName, description} = req.body;
        const isDublicate = await Category.findOne({
            categoryName: {$regex: categoryName, $options: "i"},
            _id: {$ne: id}
        })
        if(isDublicate) {
            return res.status(STATUS_CODES.BAD_REQUEST).json({
                success: false,
                message: "Is already exist"
            })
        }

        if(!categoryName) {
            return res.status(STATUS_CODES.BAD_REQUEST).json({
                success: false,
                message: "Required fields are missing"
            })
        }
        await categoryService.updateCategory({id, categoryName, description})
        return res.status(STATUS_CODES.OK).json({
            success: true,
            message: "category updated successfully"
        })

    } catch(error) {
        return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "edit category facing truble"
        })
    }
}

// delete cate gory

export const disableCategories = async (req, res) => {
    try {
        const {id} = req.params;

        await categoryService.disableCategory({id})
        return res.status(STATUS_CODES.OK).json({
            success: true,
            message: "success fully category disabled"
        })



    } catch(error) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({
            success: false,
            message: "deletside probelm"

        })
    }
}
export const enableCategories = async (req, res) => {
    try {
        const {id} = req.params;
        await categoryService.enableCategory({id})
        return res.status(STATUS_CODES.OK).json({
            success: true,
            message: "success fully category enabled"
        })

    } catch(error) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({
            success: false,
            message: "deletside probelm"

        })
    }
}

export const getCategory = async (req, res) => {
    try {
        const {id} = req.params;
        const category = await Category.findOne({_id: id})
        if(!category.isActieve) {
            return res.status(STATUS_CODES.BAD_REQUEST).json({
                success: false,
                message: 'now canot access this category'
            })
        }
        if(!category) {
            return res.status(STATUS_CODES.NOT_FOUND).json({
                success: false,
                message: "category not found"
            });
        }
        return res.status(STATUS_CODES.OK).json({
            success: true,
            category
        })
    } catch(error) {
        console.error("Get Category Error:", error);
        return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({success: false, message: "Failed to fetch category"});
    }

}