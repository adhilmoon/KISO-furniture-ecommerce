
import Category from "../../model/Category.js"
import * as catValidators from "../../validators/adminCategories.js"


export const createCategory = async (data) => {
    const {categoryName, description} = data;
    const validation = catValidators.categorySchema.safeParse(data);

    if(!validation.success) {
        const errorMessage = validation.error.issues
            .map(issue => issue.message)
            .join(", ");

        throw new Error(errorMessage);
    }
    const newCategory = new Category({
        categoryName,
        description
    })

    return await newCategory.save()
}

export const updateCategory = async (data) => {

    const {id, categoryName, description} = data;
    const validation = catValidators.categorySchema.safeParse(data);

    if(!validation.success) {
        const errorMessage = validation.error.issues
            .map(issue => issue.message)
            .join(", ");

        throw new Error(errorMessage);
    }
    await Category.findOneAndUpdate(
        {_id: id}, {
        categoryName,
        description
    }
    )
}
export const disableCategory = async (categoryId) => {
    const {id} = categoryId;

    await Category.findByIdAndUpdate(
        {_id: id},
        {isActive: false}
    )
}

export const enableCategory = async (categoryId) => {
    const {id} = categoryId;
    await Category.findByIdAndUpdate(
        {_id: id},
        {isActive: true}
    )
}
