const e = require("express");
const { Products, Colors, Events } = require("../models");
const logger = require("../common/logger")("products-dao");

module.exports.saveProductDetails = async (insertObj) => {
  try {
    const data = new Products(insertObj);
    data.save();
    return data;
  } catch (e) {
    // logger.error(e);
    throw e;
  }
};

module.exports.deleteProductData = async (whereObj) => {
  try {
    const data = await Products.deleteMany(whereObj);
    return data;
  } catch (e) {
    // logger.error(e);
    throw e;
  }
};

module.exports.getProductDetails = async (brandId, limit) => {
  try {
    let data = []
    if (limit) {
      data = await Products.find({ brandId })
        .sort({ createdOn: -1 })
        .limit(limit * 1);
    } else {
      data = await Products.find({ brandId });
    }
    return data;
  } catch (e) {
    // logger.error(e);
    throw e;
  }
};

module.exports.getVendorProductDetails = async (vendorId, limit) => {
  try {
    let data = []
    if (limit) {
      data = await Products.find({ vendorId })
        .sort({ createdOn: -1 })
        .limit(limit * 1);
    } else {
      data = await Products.find({ vendorId });
    }
    return data;
  } catch (e) {
    // logger.error(e);
    throw e;
  }
};

module.exports.getAllProductDetails = async (page, limit) => {
  try {
    let data
    if (page && limit) {
      data = await Products.find({})
        .limit(limit)
        .skip((page - 1) * limit)
        .sort({ productStatus: 1, createdOn: -1 })
    } else {
      data = await Products.find({});
    }
    return data;
  } catch (e) {
    // logger.error(e);
    throw e;
  }
};

module.exports.getAllProductData = async (page, limit) => {
  try {
    let data = []
    if (page && limit) {
      data = await Products.find({ productStatus: "published" })
        .limit(limit * 1)
        .skip((page - 1) * limit);
    } else {
      data = await Products.find({ productStatus: "published" })
    }
    return data;
  } catch (e) {
    // logger.error(e);
    throw e;
  }
};

module.exports.getAllProductDataWithFilter = async (page, limit, sortObj, filterObj, count) => {
  try {
    let data = []
    if (!count) {
      data = await Products.find(filterObj)
        .sort(sortObj)
        .limit(limit * 1)
        .skip((page - 1) * limit);
    } else {
      data = await Products.count(filterObj)
        .sort(sortObj)
    }
    return data;
  } catch (e) {
    // logger.error(e);
    throw e;
  }
};

module.exports.findProduct = async (productId) => {
  try {
    const data = await Products.find({
      _id: productId,
    });
    return data;
  } catch (e) {
    // logger.error(e);
    throw e;
  }
};

module.exports.findOneProduct = async (productId) => {
  try {
    const data = await Products.findOne({
      _id: productId,
    });
    return data;
  } catch (e) {
    throw e;
  }
};

module.exports.updateProductStatus = async (brandId) => {
  try {
    let whereObj = { vendorId: brandId };
    let updateObj = {
      $set: {
        productStatus: "published",
        updatedOn: new Date().toISOString(),
      },
    };
    const data = await Products.updateMany(whereObj, updateObj);
    return data;
  } catch (e) {
    // logger.error(e);
    throw e;
  }
};

module.exports.updateProductDetails = async (productId, updateObj) => {
  try {
    let whereObj = { _id: productId };
    const data = await Products.updateOne(whereObj, updateObj);
    return data;
  } catch (e) {
    // logger.error(e);
    throw e;
  }
};

module.exports.getBrandProductsCount = async (vendorId) => {
  try {
    const count = await Products.countDocuments({ vendorId: vendorId });
    return count;
  } catch (e) {
    // logger.error(e);
    throw e;
  }
};

module.exports.getLatestAddedProductData = async (page, limit) => {
  try {
    const data = await Products.find({ productStatus: "published" })
      .sort({ createdOn: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    return data;
  } catch (e) {
    // logger.error(e);
    throw e;
  }
};


module.exports.searchProductBySearchKey = async (page, limit, key, count) => {
  try {
    const regex = new RegExp(key.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"), 'gi');
    let data = []
    const query = {
      $or: [
        { brandName: regex },
        { productName: regex },
        { categoryName: regex },
        { subCategoryName: regex }
      ],
      productStatus: "published",
      gender: "female"
    };
    if (count) {
      data = await Products.count(query)
    } else {
      data = await Products.find(query)
        .sort({ createdOn: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);
    }
    return data
  } catch (e) {
    // logger.error(e);
    throw e;
  }
};


module.exports.searchProductByName = async (key, page, limit) => {
  try {
    const regex = new RegExp(key.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"), 'gi');
    let data = []
    if (page && limit) {
      data = await Products.find({ productName: regex })
        .sort({ createdOn: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);
    } else {
      data = await Products.find({ productName: regex })
        .sort({ createdOn: -1 })
    }
    return data.filter((pr) => pr.productStatus === 'published');
  } catch (e) {
    // logger.error(e);
    throw e;
  }
};


module.exports.searchProductByCategoryName = async (key, page, limit) => {
  try {
    const regex = new RegExp(key.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"), 'gi');
    let data = []
    if (page && limit) {
      data = await Products.find({ categoryName: regex })
        .sort({ createdOn: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);
    } else {
      data = await Products.find({ categoryName: regex })
        .sort({ createdOn: -1 })
    }

    return data.filter((pr) => pr.productStatus === 'published');
  } catch (e) {
    // logger.error(e);
    throw e;
  }
};

module.exports.searchProductBySubCategoryName = async (key, page, limit) => {
  try {
    const regex = new RegExp(key.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"), 'gi');
    let data = []
    if (page && limit) {
      data = await Products.find({ subCategoryName: regex })
        .sort({ createdOn: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);
    } else {
      data = await Products.find({ subCategoryName: regex })
        .sort({ createdOn: -1 })
    }
    return data.filter((pr) => pr.productStatus === 'published');
  } catch (e) {
    // logger.error(e);
    throw e;
  }
};

module.exports.getProductByColorName = async (colorName, limit) => {
  try {
    const data = await Products.find({ colorName: colorName })
      .sort({ createdOn: -1 })
      .limit(limit * 1)
    return data
    return []
  } catch (e) {
    // logger.error(e);
    throw e;
  }
};


module.exports.getColorCode = async (colorNameParam) => {
  try {
    const data = await Colors.find({ colorName: colorNameParam });
    return data;
  } catch (e) {
    // logger.error(e);
    throw e;
  }
};

module.exports.saveEventProductDetails = async (insertObj) => {
  try {
    const data = new Events(insertObj);
    data.save();
    return data;
  } catch (e) {
    // logger.error(e);
    throw e;
  }
};

module.exports.getProductDetailsByPref = async (page, limit, brandArr, colorArr, count) => {
  try {
    let data = []
    let query = {}
    if (brandArr.length > 0 && colorArr.length > 0) {
      query = {
        $or: [
          {
            brandId: {
              $in: brandArr
            }
          },
          {
            colorName: {
              $in: colorArr
            }
          },
        ],
        productStatus: "published",
        gender: "female"
      };
    } else {
      if (brandArr.length > 0) {
        query = {
          brandId: {
            $in: brandArr
          },
          productStatus: "published",
          gender: "female"
        }
      }
      if (colorArr.length > 0) {
        query = {
          colorName: {
            $in: colorArr
          },
          productStatus: "published",
          gender: "female"
        }
      }
    }
    if (!count) {
      data = await Products.find(query)
        .sort({ createdOn: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);
    } else {
      data = await Products.count(query);
    }
    return data;
  } catch (e) {
    // logger.error(e);
    throw e;
  }
};