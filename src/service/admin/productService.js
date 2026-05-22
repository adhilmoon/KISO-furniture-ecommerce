import { uploadToCloudinary, deleteFromCloudinary } from "../../utilities/uploadToCloudinary.js";
import Product from "../../model/Product.js";
import logger from "../../utilities/logger.js";
import * as productValidators from "../../validators/adminProducts.js";
import { PRODUCT, CLOUDINARY_FOLDERS } from "../../constants/index.js";

const { MIN_PRICE, MIN_VARIANT_IMAGES, MAX_VARIANT_IMAGES } = PRODUCT;

const parseJsonField = (raw, label) => {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    logger.error(`${label} parse failure: ${e.message}`);
    throw Object.assign(new Error(`Invalid ${label} format`), { status: 400 });
  }
};


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
  const parsedAttrs = parseJsonField(body.customAttributesJSON, 'customAttributesJSON');
  if (Array.isArray(parsedAttrs)) {
    customAttributes = parsedAttrs.filter(attr => attr.key && attr.key.trim() !== "");
  }

  let variantsData = [];
  const parsedVariants = parseJsonField(body.variantsJSON, 'variantsJSON');
  if (Array.isArray(parsedVariants)) {
    variantsData = parsedVariants;
  }



  const variantFiles = files.filter(f => f.fieldname.startsWith('variants['));
  const variantUploadResult = await Promise.all(
    variantFiles.map(async (f) => {
      const match = f.fieldname.match(/variants\[(\d+)\]\[images\]/);
      if(!match) return;

      const idx = parseInt(match[1]);


      const result = await uploadToCloudinary(
        f.buffer,
        CLOUDINARY_FOLDERS.PRODUCT_VARIANTS
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

  const variants = variantsData.map((v, index) => {
    const price = parseFloat(v.price);
    if (isNaN(price) || price < MIN_PRICE) {
      throw new Error(`Variant #${index + 1} price must be greater than 0`);
    }
    return {
      optionType: v.optionType || "",
      optionValue: v.optionValue || "",
      price,
      stock: parseInt(v.stock, 10) || 0,
      images: variantImageMap[index] || [],
    };
  });
  variants.forEach((v, i) => {
    const count = v.images?.length || 0;
    if(count < 3) {
      throw new Error(`Variant #${i + 1} must have at least ${MIN_VARIANT_IMAGES} images`);
    }
    if(count > 5) {
      throw new Error(`Variant #${i + 1} can have maximum ${MAX_VARIANT_IMAGES} images`);
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
  const parsedBase = parseFloat(basePrice);
  if (isNaN(parsedBase) || parsedBase < MIN_PRICE) {
    throw new Error("Base price must be greater than 0");
  }
  product.basePrice = parsedBase;


  const getUpdateDim = (key, fallback) => {
    let val = body[`dimensions[${key}]`];
    if (val === undefined && body.dimensions) val = body.dimensions[key];
    return !isNaN(parseFloat(val)) ? parseFloat(val) : fallback;
  };

  product.dimensions.width = getUpdateDim('width', product.dimensions.width);
  product.dimensions.depth = getUpdateDim('depth', product.dimensions.depth);
  product.dimensions.height = getUpdateDim('height', product.dimensions.height);

  const parsedAttrsUpd = parseJsonField(body.customAttributesJSON, 'customAttributesJSON');
  if (Array.isArray(parsedAttrsUpd)) {
    product.customAttributes = parsedAttrsUpd.filter(attr => attr.key && attr.key.trim() !== "");
  }





  const parsedDeletedVariantImages = parseJsonField(body.deletedVariantImages, 'deletedVariantImages');
  if (parsedDeletedVariantImages && typeof parsedDeletedVariantImages === 'object') {
    const urlsToDelete = [];
    product.variants.forEach(variant => {
      const vId = variant._id.toString();
      const toRemove = parsedDeletedVariantImages[vId];
      if (Array.isArray(toRemove)) {
        urlsToDelete.push(...toRemove);
        variant.images = variant.images.filter(img => !toRemove.includes(img));
      }
    });
    if (urlsToDelete.length > 0) {
      await deleteFromCloudinary(urlsToDelete);
    }
  }

  let incomingVariants = [];
  const parsedIncoming = parseJsonField(body.variantsJSON, 'variantsJSON');
  if (Array.isArray(parsedIncoming)) {
    incomingVariants = parsedIncoming;
  }

  const incomingVariantIds = incomingVariants.map(v => v._id).filter(id => id);
  logger.debug(`incomingVariantIds: ${incomingVariantIds}`);

  product.variants = product.variants.filter(v => incomingVariantIds.includes(v._id.toString()));


  const variantFiles = files.filter(f => f.fieldname.startsWith('variants['));
  const variantUploadResult = await Promise.all(
    variantFiles.map(async (f) => {
      const match = f.fieldname.match(/variants\[(\d+)\]\[images\]/);
      if(!match) return;
      const result = await uploadToCloudinary(f.buffer, CLOUDINARY_FOLDERS.PRODUCT_VARIANTS);
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
    const price = parseFloat(incVar.price);
    if (isNaN(price) || price < MIN_PRICE) {
      throw new Error(`Variant #${index + 1} price must be greater than 0`);
    }

    if(incVar._id) {
      const existingVariant = product.variants.find(v => v._id.toString() === incVar._id);
      if(existingVariant) {
        existingVariant.optionType = incVar.optionType;
        existingVariant.optionValue = incVar.optionValue;
        existingVariant.price = price;
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
        price,
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

  product.variants.forEach((v, index) => {
    const count = v.images.length;
    if(count < MIN_VARIANT_IMAGES) {
      throw new Error(`Variant #${index + 1} must have at least ${MIN_VARIANT_IMAGES} images`);
    }
    if(count > MAX_VARIANT_IMAGES) {
      throw new Error(`Variant #${index + 1} can have maximum ${MAX_VARIANT_IMAGES} images`);
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