import * as productService from "../../service/user/productService.js";

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
        console.error("Error fetching product detail:", error);
        res.status(404).render("404", { title: "Product Not Found" });
    }
};
