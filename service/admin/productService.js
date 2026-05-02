import { uploadToCloudinary } from "../../utilities/uploadToCloudinary.js";
import Product from "../../model/Product.js";
import logger from "../../utilities/logger.js";
import * as productValidators from "../../validators/adminProducts.js";


export const createProduct = async (body, files) => {
  const validation = productValidators.productSchema.safeParse(body);
  if(!validation.success) {
    const errorMessage = validation.error.issues
      .map(issue => issue.message)
      .join(", ");
    throw new Error(errorMessage);
  }

  const {productName, description, category, basePrice, material} = body;


  const getDim = (key) => {
    let val = body[`dimensions[${key}]`];
    if (val === undefined && body.dimensions) val = body.dimensions[key];
    return !isNaN(parseFloat(val)) ? parseFloat(val) : 0;
  };

  const dimensions = {
    width: getDim('width'),
    depth: getDim('depth'),
    height: getDim('height'),
  };



  let customAttributes = [];
  if(body.customAttributesJSON) {
    try {
      const parsed = JSON.parse(body.customAttributesJSON);

      customAttributes = parsed.filter(attr => attr.key && attr.key.trim() !== "");
    } catch(e) {
      console.error(e)
      customAttributes = [];
    }
  }




  let variantsData = [];
  if(body.variantsJSON) {
    try {
      variantsData = JSON.parse(body.variantsJSON);
    } catch(e) {
      console.error(e)
      variantsData = [];
    }
  }



  const variantFiles = files.filter(f => f.fieldname.startsWith('variants['));
  const variantUploadResult = await Promise.all(
    variantFiles.map(async (f) => {
      const match = f.fieldname.match(/variants\[(\d+)\]\[images\]/);
      if(!match) return;

      const idx = parseInt(match[1]);


      const result = await uploadToCloudinary(
        f.buffer,
        "kiso/products/variants"
      );

      return {idx, url: result.secure_url};
    })
  );


  const variantImageMap = {};

  variantUploadResult.forEach(item => {
    if(!item) return;
    if(!variantImageMap[item.idx]) variantImageMap[item.idx] = [];
    variantImageMap[item.idx].push(item.url);
  })

  const variants = variantsData.map((v, index) => ({
    optionType: v.optionType || "",
    optionValue: v.optionValue || "",
    price: parseFloat(v.price) || 0,
    stock: parseInt(v.stock, 10) || 0,
    images: variantImageMap[index] || [],
  }));
  variants.forEach((v, i) => {
    if(!v.images || v.images.length === 0) {
      throw new Error(`Variant #${i + 1} must have at least one image`);
    }
  });
  const sku =
    productName.substring(0, 3).toUpperCase() +
    "-" +
    Math.floor(1000 + Math.random() * 9000);

  const newProduct = new Product({
    productName: productName.trim(),
    description: description?.trim(),
    sku: sku,
    category,
    basePrice: parseFloat(basePrice) || 0,
    material: material?.trim() || '',
    dimensions,
    customAttributes,
    variants,
    isListed: true,
  });

  return await newProduct.save();
};




export const updateProduct = async (productId, body, files) => {
  const validation = productValidators.productSchema.safeParse(body);
  if(!validation.success) {
    const errorMessage = validation.error.issues
      .map(issue => issue.message)
      .join(", ");
    throw new Error(errorMessage);
  }

  const product = await Product.findById(productId);
  if(!product) throw new Error("Product not found");

  const {productName, description, category, basePrice} = body;

  product.productName = productName.trim() || product.productName;
  product.description = description ? description.trim() : product.description;
  product.category = category || product.category;
  product.basePrice = parseFloat(basePrice) || product.basePrice;


  const getUpdateDim = (key, fallback) => {
    let val = body[`dimensions[${key}]`];
    if (val === undefined && body.dimensions) val = body.dimensions[key];
    return !isNaN(parseFloat(val)) ? parseFloat(val) : fallback;
  };

  product.dimensions.width = getUpdateDim('width', product.dimensions.width);
  product.dimensions.depth = getUpdateDim('depth', product.dimensions.depth);
  product.dimensions.height = getUpdateDim('height', product.dimensions.height);

  if(body.customAttributesJSON) {
    try {
      const parsed = JSON.parse(body.customAttributesJSON);
      product.customAttributes = parsed.filter(attr => attr.key && attr.key.trim() !== "");
    } catch(e) {
      logger.debug(`customAttributes parse error: ${e.message}`);
    }
  }





  if(body.deletedVariantImages) {
    logger.debug(`deletedVariantImages raw: ${body.deletedVariantImages}`);
    try {
      const parsedDeletedVariantImages = JSON.parse(body.deletedVariantImages);
      logger.debug(`parsedDeletedVariantImages: ${JSON.stringify(parsedDeletedVariantImages)}`);

      product.variants.forEach(variant => {
        const vId = variant._id.toString();
        if(parsedDeletedVariantImages[vId] && Array.isArray(parsedDeletedVariantImages[vId])) {
          const beforeCount = variant.images.length;
          logger.debug(`Variant ${vId} BEFORE deletion: ${variant.images}`);

          variant.images = variant.images.filter(
            img => !parsedDeletedVariantImages[vId].includes(img)
          );

          const afterCount = variant.images.length;
          logger.debug(`Variant ${vId} AFTER deletion: ${variant.images}`);
          logger.debug(`Variant ${vId}: removed ${beforeCount - afterCount} images`);
        }
      });
    } catch(e) {
      logger.debug(`variant delete error: ${e.message}`);
    }
  }



  let incomingVariants = [];
  if(body.variantsJSON) {
    try {
      incomingVariants = JSON.parse(body.variantsJSON);
      logger.debug(`incomingVariants: ${JSON.stringify(incomingVariants)}`);
    } catch(e) {
      logger.debug(`variantsJSON parse error: ${e.message}`);
    }
  }

  const incomingVariantIds = incomingVariants.map(v => v._id).filter(id => id);
  logger.debug(`incomingVariantIds: ${incomingVariantIds}`);

  product.variants = product.variants.filter(v => incomingVariantIds.includes(v._id.toString()));


  const variantFiles = files.filter(f => f.fieldname.startsWith('variants['));
  const variantUploadResult = await Promise.all(
    variantFiles.map(async (f) => {
      const match = f.fieldname.match(/variants\[(\d+)\]\[images\]/);
      if(!match) return;
      const result = await uploadToCloudinary(f.buffer, "kiso/products/variants");
      return {idx: parseInt(match[1]), url: result.secure_url};
    })
  );


  const variantImageMap = {};

  variantUploadResult.forEach(item => {
    if(!item) return;
    if(!variantImageMap[item.idx]) variantImageMap[item.idx] = [];
    variantImageMap[item.idx].push(item.url);
  });


  incomingVariants.forEach((incVar, index) => {
    const uploadedImages = variantImageMap[index] || [];

    if(incVar._id) {
      const existingVariant = product.variants.find(v => v._id.toString() === incVar._id);
      if(existingVariant) {
        existingVariant.optionType = incVar.optionType;
        existingVariant.optionValue = incVar.optionValue;
        existingVariant.price = parseFloat(incVar.price) || 0;
        existingVariant.stock = parseInt(incVar.stock, 10) || 0;

        if(uploadedImages.length > 0) {
          existingVariant.images = [...(existingVariant.images || []), ...uploadedImages];
          logger.debug(`Added ${uploadedImages.length} images to variant ${incVar._id}`);
        }
      }
    } else {

      product.variants.push({
        optionType: incVar.optionType || "",
        optionValue: incVar.optionValue || "",
        price: parseFloat(incVar.price) || 0,
        stock: parseInt(incVar.stock, 10) || 0,
        images: uploadedImages,
      });
      logger.debug("Added new variant");
    }
  });



  logger.debug(`Final product variants: ${JSON.stringify(product.variants.map(v => ({
    id: v._id.toString(),
    imageCount: v.images.length
  })))}`);

  // Final validation: Ensure every variant has at least one image
  product.variants.forEach((v, index) => {
    if(!v.images || v.images.length === 0) {
      throw new Error(`Variant #${index + 1} must have at least one image`);
    }
  });

  return await product.save();
};
export const disableProduct = async (productId) => {
  return await Product.findByIdAndUpdate(
    productId,
    {isListed: false},
    {new: true}
  )
}

export const enableProduct = async (productId) => {

  return await Product.findByIdAndUpdate(
    productId,
    {isListed: true},
    {new: true}
  )
}