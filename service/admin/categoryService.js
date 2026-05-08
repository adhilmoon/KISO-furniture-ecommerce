
import Category from "../../model/Category.js"
import * as catValidators from "../../validators/adminCategories.js"
import normalize from "../../utilities/normalizeCategory.js"


export const createCategory = async (data) => {
    const {categoryName, description} = data;
    const slug=normalize(categoryName);
    console.log(slug)
    const exist = await Category.findOne({ slug })

    if(exist){
       throw new Error(`Category already exists as ${exist.categoryName}`)
    }

    const validation = catValidators.categorySchema.safeParse(data);
   
    if(!validation.success) {
        const errorMessage = validation.error.issues
            .map(issue => issue.message)
            .join(", ");

        throw new Error(errorMessage);
    }
    const newCategory = new Category({
        categoryName,
        slug,
        description
    })

    return await newCategory.save()
}

export const updateCategory = async (data) => {

    const {id, categoryName, description} = data;
    const slug=normalize(categoryName)
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
        slug,
        description
    }
    )
}
export const isDublicate=(name,id)=>{
    const slugName=normalize(name)
    Category.findOne({
            slug: {$regex:slugName},
            _id: {$ne: id}
        })
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
