import Product from "../../model/Product.js";
import Category from "../../model/Category.js";
import { STATUS_CODES} from "../../constants/index.js";
import catchAsync from "../../utilities/catchAsync.js";

export const getFilterOptions = catchAsync(async (req, res) => {
    const categoryDocs = await Category.find({isActive:true}).select('categoryName');
    const categories = categoryDocs.map(c => c.categoryName); 
    
    const materials = await Product.distinct('material');
    const finishes = await Product.distinct('finish');
    
    
    const colors = await Product.distinct('variants.color');

    return res.status(STATUS_CODES.OK).json({
      success: true,
      data: {
        categories,
        materials,
        finishes,
        colors
      }
    });
});