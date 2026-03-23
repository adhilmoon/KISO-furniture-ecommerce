import {STATUS_CODES} from "../constants/statusCodes.js";
import Category from "../model/Category.js"


export const createCategory = async (data) => {
    const{categoryName, description} = data;

    const newCategory = new Category({
        categoryName,
        description
    })

    return await newCategory.save()
}

export const updateCategory = async (data) => {
    
    const{id,categoryName,description}=data;
    await Category.findOneAndUpdate(
        {_id: id}, {
        categoryName,
        description
    }
    )
}
export const deleteCategory= async(categoryId)=>{
    const{id}=categoryId;
    const category=await Category.findById({_id:id})
    if(!category.isActieve){
        return res.status(STATUS_CODES.BAD_REQUEST).json({
            success:false,
            message:"its alredy inactieved ..!!!"
        })
    }
    await Category.findByIdAndUpdate(
        {_id:id},
        {isActieve:false}
    )
}
