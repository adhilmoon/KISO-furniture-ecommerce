
import Product from "../../model/Product.js";
import Category from "../../model/Category.js";

export const getFilterOptions = async (req, res) => {
  try {

    const categoryDocs = await Category.find().select('categoryName');
    const categories = categoryDocs.map(c => c.categoryName); 
    
    const materials = await Product.distinct('material');
    const finishes = await Product.distinct('finish');
    
    
    const colors = await Product.distinct('variants.color');

    return res.status(200).json({
      success: true,
      data: {
        categories,
        materials,
        finishes,
        colors
      }
    });
  } catch (error) {
    console.error("Error fetching filter options:", error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};