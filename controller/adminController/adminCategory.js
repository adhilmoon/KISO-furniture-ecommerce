
import { STATUS_CODES, MESSAGES } from "../../constants/index.js";
import * as categoryService from "../../service/admin/categoryService.js"
import Category from "../../model/Category.js"
import logger from "../../utilities/logger.js";
// add category
export const addCategory = async (req, res) => {
    try {
        const {categoryName, description} = req.body

        if(!categoryName) {
            return res.status(STATUS_CODES.BAD_REQUEST).json({
                success: false,
                message: MESSAGES.REQUIRED_FIELDS_MISSING
            })
        }

        await categoryService.createCategory({categoryName, description})
        return res.status(STATUS_CODES.CREATED).json({
            success: true,
            message: MESSAGES.CATEGORY_CREATED_SUCCESS,
        })
    } catch(error) {
        logger.error(`Add Category Error: ${error.message}`);
        return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
            success: false,
            message:error.message || "add category facing truble"
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
                message: MESSAGES.CATEGORY_ALREADY_EXISTS
            })
        }

        if(!categoryName) {
            return res.status(STATUS_CODES.BAD_REQUEST).json({
                success: false,
                message: MESSAGES.REQUIRED_FIELDS_MISSING
            })
        }
        await categoryService.updateCategory({id, categoryName, description})
        return res.status(STATUS_CODES.OK).json({
            success: true,
            message: MESSAGES.CATEGORY_UPDATED_SUCCESS
        })

    } catch(error) {
        return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
            success: false,
             message: error.message || "edit category facing trouble"
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
            message: MESSAGES.CATEGORY_DISABLED_SUCCESS
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
            message: MESSAGES.CATEGORY_ENABLED_SUCCESS
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
        if(!category.isActive) {
            return res.status(STATUS_CODES.BAD_REQUEST).json({
                success: false,
                message: MESSAGES.UNAUTHORIZED_ACCESS
            })
        }
        if(!category) {
            return res.status(STATUS_CODES.NOT_FOUND).json({
                success: false,
                message: MESSAGES.CATEGORY_NOT_FOUND
            });
        }
        return res.status(STATUS_CODES.OK).json({
            success: true,
            category
        })
    } catch(error) {
        logger.error(`Get Category Error: ${error.message}`);
        return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({success: false, message: MESSAGES.FETCH_CATEGORY_FAILED});
    }

}