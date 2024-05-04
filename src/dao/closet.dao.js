const { Categories, Brands, Colors, Closet, Sizes, Products, QuestionPref } = require("../models");
const logger = require("../common/logger")("closet-dao");

module.exports.getCategories = async () => {
  try {
    const data = await Categories.find({});
    data.sort((a, b) => a.categoryName.localeCompare(b.categoryName));
    data.forEach((category) => {
      category.subCategory.sort((a, b) =>
        a.subCategoryName.localeCompare(b.subCategoryName)
      );
    });
    return data;
  } catch (e) {
    // logger.error(e);
    throw e;
  }
};

module.exports.getBrands = async () => {
  try {
    const data = await Brands.find({});
    return data.sort((a, b) => a.brandName.localeCompare(b.brandName));
  } catch (e) {
    // logger.error(e);
    throw e;
  }
};

module.exports.getColors = async () => {
  try {
    const data = await Colors.find({});
    return data.sort((a, b) => a.colorName.localeCompare(b.colorName));
  } catch (e) {
    // logger.error(e);
    throw e;
  }
};

module.exports.getSizes = async () => {
  try {
    const data = await Sizes.find({});
    return data;
  } catch (e) {
    // logger.error(e);
    throw e;
  }
};

module.exports.saveClosetDetails = async (insertObj) => {
  try {
    const data = new Closet(insertObj);
    data.save();
    return data;
  } catch (e) {
    // logger.error(e);
    throw e;
  }
};

module.exports.getClosetDetails = async (userId, sort, limit, page) => {
  try {
    let data = []
    if (sort === 'desc') {
      data = await Closet.find({ userId: userId })
        .sort({ createdOn: 1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);;
    } else {
      data = await Closet.find({ userId: userId })
        .sort({ createdOn: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);;;
    }
    return data;
  } catch (e) {
    console.log(e)
    // logger.error(e);
    throw e;
  }
};

module.exports.findClosetId = async (closetId) => {
  try {
    const data = await Closet.find({ _id: closetId });
    return data;
  } catch (e) {
    // logger.error(e);
    throw e;
  }
};

module.exports.deleteClosetItem = async (whereObj) => {
  try {
    const data = await Closet.deleteOne(whereObj);
    return data;
  } catch (e) {
    // logger.error(e);
    throw e;
  }
};

module.exports.deleteClosetItems = async (whereObj) => {
  try {
    const data = await Closet.deleteMany(whereObj);
    return data;
  } catch (e) {
    // logger.error(e);
    throw e;
  }
};

module.exports.findByCategoryId = async (whereObj) => {
  try {
    const data = await Closet.find(whereObj);
    return data;
  } catch (e) {
    // logger.error(e);
    throw e;
  }
};

module.exports.updateClosetDetails = async (whereObj, updateObj) => {
  try {
    const data = await Closet.updateOne(whereObj, updateObj);
    return data;
  } catch (e) {
    // logger.error(e);
    throw e;
  }
};

module.exports.findClosetDetails = async (whereObj) => {
  try {
    const data = await Closet.find(whereObj);
    return data;
  } catch (e) {
    // logger.error(e);
    throw e;
  }
};

module.exports.getClosetItemsCount = async (userId) => {
  try {
    const count = await Closet.countDocuments({ userId });
    const categoryStat = await Closet.aggregate([
      { $match: { userId } },
      { $group: { _id: "$categoryName", count: { $sum: 1 } } },
    ]);
    let categoryStats = categoryStat.map(({ _id, count }) => ({
      [_id]: count,
    }));

    const brandStat = await Closet.aggregate([
      { $match: { userId } },
      { $group: { _id: "$brandName", count: { $sum: 1 } } },
    ]);
    let brandStats = brandStat.map(({ _id, count }) => ({
      [_id]: count,
    }));

    const seasonStat = await Closet.aggregate([
      { $match: { userId } },
      { $unwind: "$season" },
      { $group: { _id: "$season", count: { $sum: 1 } } },
    ]);

    let seasonStats = seasonStat.map(({ _id, count }) => ({
      [_id]: count,
    }));

    const colorStat = await Closet.aggregate([
      { $match: { userId } },
      { $unwind: "$colorCode" },
      { $group: { _id: "$colorCode", count: { $sum: 1 } } },
    ]);

    let colorStats = colorStat.map(({ _id, count }) => ({
      [_id]: count,
    }));

    // provides colorName, code, Id and count per user
    const colorUsage = await Closet.aggregate([
      { $match: { userId } },
      { $unwind: "$colorCode" },
      { $group: { _id: "$colorCode", count: { $sum: 1 } } },
      {
        $lookup: {
          from: "colors",
          localField: "_id",
          foreignField: "colorCode",
          as: "colorInfo",
        },
      },
      {
        $project: {
          _id: 0,
          colorId: { $arrayElemAt: ["$colorInfo.colorId", 0] },
          colorCode: "$_id",
          colorName: { $arrayElemAt: ["$colorInfo.colorName", 0] },
          count: 1,
        },
      },
    ]);

    const priveValueStat = await Closet.aggregate([
      { $match: { userId } },
      { $group: { _id: "$productId", count: { $sum: 1 } } },
    ]);

    let totalVal = 0
    await Promise.all(priveValueStat.map(async (x) => {
      const values = await Products.find({ _id: x._id })
      if (values && values.length > 0) {
        totalVal += values[0].productPrice
      }
    }))
    const priceStat = await Closet.aggregate([
      { $match: { userId } },
      { $match: { productId: { $exists: false } } }, // Exclude documents with 'productId' since already been calculated
      { $group: { _id: null, total: { $sum: "$price" } } }, // Sum the 'price' field for all matching documents
    ]);
    
    const totalPrice = priceStat.length > 0 ? priceStat[0].total : 0;    
    totalVal += totalPrice;

    let totalAverageValue = count ? totalVal / count : 0;

    return {
      count,
      categoryStats: categoryStats,
      brandStats: brandStats,
      seasonStats: seasonStats,
      colorStats: colorStats,
      totalProductValue: totalVal,
      totalAverageValue,
      colorUsage,
    };
  } catch (e) {
    // logger.error(e);
    throw e;
  }
};

module.exports.getPopularBrands = async () => {
  try {
    const brandStat = await Closet.aggregate([
      {
        $group: {
          _id: {
            brandName: "$brandName",
            userId: "$userId"
          }, totalObj: { $sum: 1 }
        }
      },
    ]);
    return brandStat
  } catch (e) {
    // logger.error(e);
    throw e;
  }
};

module.exports.getClosetAll = async (whereObj) => {
  try {
    const data = await Closet.find({
      $expr: { $gt: [{ $strLenCP: "$itemImageUrl" }, 200] }
    });
    return data;
  } catch (e) {
    // logger.error(e);
    throw e;
  }
};

module.exports.insertBrand = async (insertObj) => {
  try {
    const data = new Brands(insertObj);
    data.save();
    return data;
  } catch (e) {
    // logger.error(e);
    throw e;
  }
};

module.exports.updateBrands = async (id, obj) => {
  try {
    let whereObj = {
      _id: id
    }
    let updateObj = {
      brandId: obj
    }
    const data = await Brands.updateOne(whereObj, updateObj);
    return data
  } catch (e) {
    // logger.error(e);
    throw e;
  }
};

module.exports.getBrandByName = async (name) => {
  try {
    const data = await Brands.find({
      brandName: name
    });
    return data
  } catch (e) {
    // logger.error(e);
    throw e;
  }
};

module.exports.updateBrandCategory = async (brandId, arr) => {
  try {
    const data = await Brands.updateOne({
      brandId: brandId
    }, {
      category: arr
    });
    return data
  } catch (e) {
    // logger.error(e);
    throw e;
  }
};