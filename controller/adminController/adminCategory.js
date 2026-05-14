import { STATUS_CODES, MESSAGES } from '../../constants/index.js';
import * as categoryService from '../../service/admin/categoryService.js';
import catchAsync from '../../utilities/catchAsync.js';

// add category
export const addCategory = catchAsync(async (req, res) => {
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
})
//update cate gory 
export const updateCategories = catchAsync(async (req, res) => {
    const {id} = req.params;
    const {categoryName, description} = req.body;
    const isDublicate = await categoryService.isDublicate(categoryName,id)
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
})

// delete cate gory

export const disableCategories = catchAsync(async (req, res) => {
    const {id} = req.params;

    await categoryService.disableCategory({id})
    return res.status(STATUS_CODES.OK).json({
        success: true,
        message: MESSAGES.CATEGORY_DISABLED_SUCCESS
    })
})
export const enableCategories = catchAsync(async (req, res) => {
    const {id} = req.params;
    await categoryService.enableCategory({id})
    return res.status(STATUS_CODES.OK).json({
        success: true,
        message: MESSAGES.CATEGORY_ENABLED_SUCCESS
    })
})

export const getCategory = catchAsync(async (req, res) => {
    const category = await categoryService.getCategoryById(req.params.id);
    if (!category) {
        return res.status(STATUS_CODES.NOT_FOUND).json({ success: false, message: MESSAGES.CATEGORY_NOT_FOUND });
    }
    if (!category.isActive) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: MESSAGES.UNAUTHORIZED_ACCESS });
    }
    return res.status(STATUS_CODES.OK).json({ success: true, category });
});