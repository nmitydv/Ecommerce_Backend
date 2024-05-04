const { AdminUser, Brands, Events, Video } = require("../models");

module.exports.findEmailId = async (emailIdObj) => {
  try {
    // const data = await AdminUser.find({ emailId: emailId, isActive: true });
    const data = await AdminUser.find(emailIdObj);
    return data;
  } catch (e) {
    // logger.error(e);
    throw e;
  }
};

module.exports.updatePasswordDetails = async (emailId, passkeyDetail) => {
  try {
    let whereObj = { emailId };
    let updateObj = {
      $set: {
        saltKey: passkeyDetail.saltKey,
        saltKeyIv: passkeyDetail.saltKeyIv,
        encryptedData: passkeyDetail.encryptedData,
        updatedOn: new Date().toISOString(),
      },
    };
    const data = await AdminUser.updateOne(whereObj, updateObj);
    return data;
  } catch (e) {
    // logger.error(e);
    throw e;
  }
};

module.exports.getBrandUserCount = async () => {
  try {
    const count = await AdminUser.countDocuments({ role: "brand" });
    return count;
  } catch (e) {
    // logger.error(e);
    throw e;
  }
};

module.exports.saveUserDetails = async (insertObj) => {
  try {
    const data = new AdminUser(insertObj);
    data.save();
    return data;
  } catch (e) {
    // logger.error(e);
    throw e;
  }
};

module.exports.getAllBrands = async (page, limit) => {
  try {
    let data = []
    if (page && limit) {
      data = await AdminUser.find({ role: "brand" })
        .limit(limit * 1)
        .skip((page - 1) * limit);
    } else {
      data = await AdminUser.find({ role: "brand" })
    }
    return data;
  } catch (e) {
    // logger.error(e);
    throw e;
  }
};

module.exports.findAdminUserId = async (adminUserId) => {
  try {
    const data = await AdminUser.find({ _id: adminUserId, isActive: true });
    return data;
  } catch (e) {
    // logger.error(e);
    throw e;
  }
};

module.exports.findBrandUserId = async (brandObj, useInOperator = false) => {
  try {
    // const data = await AdminUser.find({
    //   _id: brandUserId,
    //   isActive: true,
    //   role: "brand",
    // });
    // Added $in operator to match 'brand' or 'admin' roles in addition to other criteria.
    if (useInOperator) {
      const data = await AdminUser.find({
        ...brandObj,
        role: { $in: ['brand', 'admin'] }
      });
      return data;
    } else {
      const data = await AdminUser.find(brandObj);
      return data;
    }
  } catch (e) {
    // logger.error(e);
    throw e;
  }
};

module.exports.deleteBrandAccount = async (whereObj) => {
  try {
    const data = await AdminUser.deleteMany(whereObj);
    return data;
  } catch (e) {
    // logger.error(e);
    throw e;
  }
};

module.exports.updateUserLastActive = async (whereObj, updateObj) => {
  try {
    const data = await AdminUser.updateMany({}, updateObj);
    return data;
  } catch (e) {
    // logger.error(e);
    throw e;
  }
};


module.exports.updateAdminProfile = async (emailId, updateObj) => {
  try {
    let whereObj = { emailId };
    let updateObjSet = {
      $set: updateObj,
    };
    const data = await AdminUser.updateOne(whereObj, updateObjSet);
    return data;
  } catch (e) {
    // logger.error(e);
    throw e;
  }
};


module.exports.findBrandDetails = async (brandObj) => {
  try {
    const data = await Brands.find(brandObj);
    return data;
  } catch (e) {
    // logger.error(e);
    throw e;
  }
};

module.exports.getProductReferralsData = async (params, startDate, endDate) => {
  try {
    const brandData = await AdminUser.find({
      _id: params.brandId,
      role: "brand"
    })
    const aggDataOverall = await Events.aggregate([
      {
        $match: {
          createdOn: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          }
        }
      },
      {
        $group: {
          _id: null,
          totalPrice: {
            $sum: {
              $toDouble: "$metaData.productPrice"
            }
          }
        }
      }
    ])
    const aggData = await Events.aggregate([
      {
        $match: {
          "metaData.vendorId": params.brandId,
          "createdOn": {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          },
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%d", date: "$createdOn" } },
          productPrice: { $sum: "$metaData.productPrice" },
          totalProducts: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: null,
          vendorId: { $first: "$metaData.vendorId" },
          vendorName: { $first: "$metaData.vendorName" },
          totalPrice: { $sum: "$productPrice" },
          result: { $push: { k: "$_id", v: { productPrice: "$productPrice", totalProducts: "$totalProducts" } } }
        }
      },
      {
        $sort: { _id: 1 }
      },
      {
        $project: {
          vendorId: 1,
          vendorName: 1,
          totalPrice: 1,
          result: { $arrayToObject: "$result" }
        }
      }
    ])
    let finalResult = {}
    if (brandData.length > 0) {
      finalResult.brandId = brandData[0]._id
      finalResult.brandName = brandData[0].name
    }
    if (aggData.length > 0) {
      finalResult.totalPrice = aggData[0].totalPrice
      finalResult.overallPrice = aggDataOverall.length > 0 ? aggDataOverall[0].totalPrice : 0
      let monthArr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31]
      const resultArr = monthArr.map((mn) => {
        let updatedMn = mn
        if (mn < 10) {
          updatedMn = "0" + mn
        }
        const resultObj = {
          day: mn,
          productPrice: 0,
          totalProducts: 0
        };
        if (aggData[0].result[updatedMn] && aggData[0].result[updatedMn].productPrice) {
          resultObj.productPrice = aggData[0].result[updatedMn].productPrice;
          resultObj.totalProducts = aggData[0].result[updatedMn].totalProducts;
        }
        return resultObj;
      })
      finalResult.result = resultArr
    } else {
      finalResult.totalPrice = 0
      finalResult.overallPrice = 0
      finalResult.result = []
    }
    return finalResult
  } catch (e) {
    console.log(e)
    // logger.error(e);
    return []
  }
};


module.exports.updateAdminUserDetails = async (userId, updateObj) => {
  try {
    let whereObj = { _id: userId };
    let updateObjSet = {
      $set: updateObj,
    };
    const data = await AdminUser.updateOne(whereObj, updateObjSet);
    return data;
  } catch (e) {
    // logger.error(e);
    throw e;
  }
};


module.exports.findVideoDataByLink = async (videoLink) => {
  try {
    const data = await Video.find({ videoLink: videoLink });
    return data;
  } catch (e) {
    // logger.error(e);
    throw e;
  }
};

module.exports.addVideoLinkData = async (insertObj) => {
  try {
    const data = new Video(insertObj);
    data.save();
    return data;
  } catch (e) {
    // logger.error(e);
    throw e;
  }
};


module.exports.findVideoData = async (adminUserId, page, limit) => {
  try {
    const data = await Video.find({adminUserId})
      .limit(limit * 1)
      .skip((page - 1) * limit);
    return data;
  } catch (e) {
    // logger.error(e);
    throw e;
  }
};

module.exports.removeVideoData = async (videoId) => {
  try {
    const data = await Video.deleteOne({ _id: videoId })
    return data;
  } catch (e) {
    // logger.error(e);
    throw e;
  }
};