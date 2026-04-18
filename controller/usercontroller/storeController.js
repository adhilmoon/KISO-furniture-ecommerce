import Product from "../../model/Product.js";
import Category from "../../model/Category.js";
import { STATUS_CODES, MESSAGES } from "../../constants/index.js";
import logger from "../../utilities/logger.js";

export const getFilterOptions = async (req, res) => {
  try {

    const categoryDocs = await Category.find().select('categoryName');
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
  } catch (error) {
    logger.error(`Error fetching filter options: ${error.message}`);
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: MESSAGES.SERVER_ERROR });
  }
};