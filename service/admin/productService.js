import {uploadToCloudinary} from "../../config/cloudinary.js";
import Product from "../../model/Product.js";


export const createProduct = async (body, files) => {

  const {productName, description, category, basePrice, material} = body;

 
  const dimensions = {
    width: parseFloat(body['dimensions[width]'] || 0) || 0,
    depth: parseFloat(body['dimensions[depth]'] || 0) || 0,
    height: parseFloat(body['dimensions[height]'] || 0) || 0,
  };



  let customAttributes = [];
  if(body.customAttributesJSON) {
    try {
      const parsed = JSON.parse(body.customAttributesJSON);
     
      customAttributes = parsed.filter(attr => attr.key && attr.key.trim() !== "");
    } catch(e) {
      customAttributes = [];
    }
  }


 
 
  let variantsData = [];
  if(body.variantsJSON) {
    try {
      variantsData = JSON.parse(body.variantsJSON);
    } catch(e) {
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
    material:       material?.trim() || '',
    dimensions,
    customAttributes,
    variants,
    isListed: true,
  });

  return await newProduct.save();
};




export const updateProduct = async (productId, body, files) => {
  const product = await Product.findById(productId);
  if (!product) throw new Error("Product not found");

  const { productName, description, category, basePrice, material } = body;

  product.productName = productName.trim() || product.productName;
  product.description = description ? description.trim() : product.description;
  product.category = category || product.category;
  product.basePrice = parseFloat(basePrice) || product.basePrice;


  product.dimensions.width = parseFloat(body['dimensions[width]']) || product.dimensions.width || 0;
  product.dimensions.depth = parseFloat(body['dimensions[depth]']) || product.dimensions.depth || 0;
  product.dimensions.height = parseFloat(body['dimensions[height]']) || product.dimensions.height || 0;

  if (body.customAttributesJSON) {
    try {
      const parsed = JSON.parse(body.customAttributesJSON);
      product.customAttributes = parsed.filter(attr => attr.key && attr.key.trim() !== "");
    } catch(e) {
      console.log("customAttributes parse error:", e);
    }
  }

  


 
  if (body.deletedVariantImages) {
    console.log("deletedVariantImages raw:", body.deletedVariantImages);
    try {
      const parsedDeletedVariantImages = JSON.parse(body.deletedVariantImages);
      console.log("parsedDeletedVariantImages:", parsedDeletedVariantImages);
      
      product.variants.forEach(variant => {
        const vId = variant._id.toString();
        if (parsedDeletedVariantImages[vId] && Array.isArray(parsedDeletedVariantImages[vId])) {
          const beforeCount = variant.images.length;
          console.log(`Variant ${vId} BEFORE deletion:`, variant.images);
          
          variant.images = variant.images.filter(
            img => !parsedDeletedVariantImages[vId].includes(img)
          );
          
          const afterCount = variant.images.length;
          console.log(`Variant ${vId} AFTER deletion:`, variant.images);
          console.log(`Variant ${vId}: removed ${beforeCount - afterCount} images`);
        }
      });
    } catch (e) {
      console.log("variant delete error:", e);      
    }
  }

  
 
  let incomingVariants = [];
  if (body.variantsJSON) {
    try { 
      incomingVariants = JSON.parse(body.variantsJSON); 
      console.log("incomingVariants:", incomingVariants);
    } catch(e) {
      console.log("variantsJSON parse error:", e);
    }
  }

  const incomingVariantIds = incomingVariants.map(v => v._id).filter(id => id);
  console.log("incomingVariantIds:", incomingVariantIds);

  product.variants = product.variants.filter(v => incomingVariantIds.includes(v._id.toString()));

 
  const variantFiles = files.filter(f => f.fieldname.startsWith('variants['));
  const variantUploadResult = await Promise.all(
    variantFiles.map(async (f) => {
      const match = f.fieldname.match(/variants\[(\d+)\]\[images\]/);
      if(!match) return;
      const result = await uploadToCloudinary(f.buffer, "kiso/products/variants");
      return { idx: parseInt(match[1]), url: result.secure_url };
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
    
    if (incVar._id) {
      const existingVariant = product.variants.find(v => v._id.toString() === incVar._id);
      if (existingVariant) {
        existingVariant.optionType = incVar.optionType;
        existingVariant.optionValue = incVar.optionValue;
        existingVariant.price = parseFloat(incVar.price) || 0;
        existingVariant.stock = parseInt(incVar.stock, 10) || 0;
        
        if (uploadedImages.length > 0) {
          existingVariant.images = [...(existingVariant.images || []), ...uploadedImages];
          console.log(`Added ${uploadedImages.length} images to variant ${incVar._id}`);
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
      console.log("Added new variant");
    }
  });



  console.log("Final product variants:", product.variants.map(v => ({
    id: v._id.toString(),
    imageCount: v.images.length
  })));

  return await product.save();
};
export const disableProduct = async (productId) => {
    return await Product.findByIdAndUpdate(
           productId,
          {isListed:false},
          {new:true}
      )
  }
  
 export const enableProduct = async (productId) => {
      
     return await Product.findByIdAndUpdate(
         productId,
          {isListed: true},
          {new:true}
      )
  }