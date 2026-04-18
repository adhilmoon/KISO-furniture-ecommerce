import * as productService from "../../service/user/productService.js";
import { STATUS_CODES } from "../../constants/index.js";
import logger from "../../utilities/logger.js";

export const getProductDetail = async (req, res) => {
    try {
        const { id } = req.params;
        const { product, relatedProducts } = await productService.getProductDetail(id);

        res.render("user/product-detail", {
            title: `${product.productName} - KISO`,
            product,
            relatedProducts,
        });
    } catch (error) {
        logger.error(`Error fetching product detail: ${error.message}`);
        res.status(STATUS_CODES.NOT_FOUND).render("404", { title: "Product Not Found" });
    }
};
