
import Category from "../../model/Category.js"


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
export const disableCategory= async(categoryId)=>{
    const{id}=categoryId;

    await Category.findByIdAndUpdate(
        {_id:id},
        {isActieve:false}
    )
}

export const enableCategory=async(categoryId)=>{
    const{id}=categoryId;
    await Category.findByIdAndUpdate(
        {_id:id},
        {isActieve:true}
    )
}
