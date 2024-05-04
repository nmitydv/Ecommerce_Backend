const { User, QuestionPref, UserPref, PersonalStylist, StylistRecommendedProducts, Video, VideoView } = require("../models");
const logger = require("../common/logger")("user-dao");
const { ObjectId } = require('mongodb');


module.exports.findUserId = async (userId) => {
  try {
    const data = await User.find({ userId });
    return data;
  } catch (e) {
    // logger.error(e);
    throw e;
  }
};

module.exports.saveUserDetails = async (insertObj) => {
  try {
    const data = new User(insertObj);
    data.save();
    return data;
  } catch (e) {
    // logger.error(e);
    throw e;
  }
};

module.exports.findUserEmailId = async (emailId) => {
  try {
    const data = await User.find({ emailId });
    return data;
  } catch (e) {
    // logger.error(e);
    throw e;
  }
};

module.exports.updateUserProfilePic = async (userId, profilePicUrl) => {
  try {
    let whereObj = { userId };
    let updateObj = {
      $set: {
        profilePicUrl,
        isProfileCreated: true,
        updatedOn: new Date().toISOString(),
      },
    };
    const data = await User.updateOne(whereObj, updateObj);
    return data;
  } catch (e) {
    // logger.error(e);
    throw e;
  }
};

module.exports.updateUserProfileDetails = async (userId, profileDetails) => {
  try {
    let whereObj = { userId };
    let updateObj = {
      $set: {
        emailId: profileDetails.emailId,
        name: profileDetails.name,
        gender: profileDetails.gender.toLowerCase(),
        isProfileCreated: true,
        updatedOn: new Date().toISOString(),
      },
    };
    const data = await User.updateOne(whereObj, updateObj);
    return data;
  } catch (e) {
    // logger.error(e);
    throw e;
  }
};

module.exports.deleteUserAccount = async (whereObj) => {
  try {
    const data = await User.deleteMany(whereObj);
    return data;
  } catch (e) {
    // logger.error(e);
    throw e;
  }
};

module.exports.findUserInstaId = async (instaId) => {
  try {
    const data = await User.find({ instaId });
    return data;
  } catch (e) {
    // logger.error(e);
    throw e;
  }
};

module.exports.getUserCount = async () => {
  try {
    const result = await User.aggregate([
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          maleCount: {
            $sum: {
              $cond: { if: { $eq: ["$gender", "male"] }, then: 1, else: 0 },
            },
          },
          femaleCount: {
            $sum: {
              $cond: { if: { $eq: ["$gender", "female"] }, then: 1, else: 0 },
            },
          },
        },
      },
    ]);

    return {
      totalCount: result[0].count,
      maleCount: result[0].maleCount,
      femaleCount: result[0].femaleCount,
    };
  } catch (e) {
    // logger.error(e);
    throw e;
  }
};

module.exports.getVendorUserCount = async (vendorId) => {
  try {
    const result = await User.countDocuments({adminUserId: vendorId});
    return result;
  } catch (e) {
    throw e;
  }
}

module.exports.getAllUsers = async (page, limit) => {
  try {
    const data = await User.find()
      .limit(limit * 1)
      .skip((page - 1) * limit);
    return data;
  } catch (e) {
    // logger.error(e);
    throw e;
  }
};

module.exports.getAllVendorUsers = async (vendorId, page, limit) => {
  try {
    const data = await User.find({adminUserId: vendorId})
      .limit(limit * 1)
      .skip((page - 1) * limit);
    return data;
  } catch (e) {
    // logger.error(e);
    throw e;
  }
};

module.exports.updateUserLastActive = async (userId, updateObj) => {
  try {
    let whereObj = { userId };
    const data = await User.updateMany(whereObj, updateObj);
    return data;
  } catch (e) {
    // logger.error(e);
    throw e;
  }
};

module.exports.getQuestionPref = async () => {
  try {
    const data = await QuestionPref.find({});
    return data;
  } catch (e) {
    // logger.error(e);
    throw e;
  }
};

module.exports.saveUserPref = async (insertObj) => {
  try {
    const data = new UserPref(insertObj);
    data.save();
    return data;
  } catch (e) {
    // // logger.error(e);
    throw e;
  }
};

module.exports.updateUserPrefProfileDetails = async (userId, isPref) => {
  try {
    let whereObj = { userId };
    let updateObj = {
      $set: {
        isPreferences: isPref,
        updatedOn: new Date().toISOString(),
      },
    };
    const data = await User.updateOne(whereObj, updateObj);
    return data;
  } catch (e) {
    // logger.error(e);
    throw e;
  }
};


module.exports.updateQuestion = async (id, options) => {
  try {
    let whereObj = { _id: id };
    let updateObj = {
      $set: {
        options: options,
        updatedOn: new Date().toISOString(),
      },
    };
    await QuestionPref.updateOne(whereObj, updateObj);
    return true;
  } catch (e) {
    // logger.error(e);
    throw e;
  }
};

module.exports.updateUserPref = async (userId, pref) => {
  try {
    let whereObj = { userId };
    let updateObj = {
      $set: {
        prefrences: pref,
        updatedOn: new Date().toISOString(),
      },
    };
    await UserPref.updateOne(whereObj, updateObj);
    const data = await UserPref.find({ userId: userId })
    return data;
  } catch (e) {
    console.log(e)
    // // logger.error(e);
    throw e;
  }
};

module.exports.findUserPrefrences = async (userId) => {
  try {
    const data = await UserPref.find({ userId });
    return data;
  } catch (e) {
    // logger.error(e);
    throw e;
  }
};

module.exports.findStylistById = async (stylistId) => {
  try {
    const data = await PersonalStylist.find({ _id: stylistId });
    return data;
  } catch (e) {
    // logger.error(e);
    throw e;
  }
};

module.exports.findStylistByEmail = async (emailId) => {
  try {
    const data = await PersonalStylist.find({ emailId: emailId });
    return data;
  } catch (e) {
    // logger.error(e);
    throw e;
  }
};

module.exports.saveStylistDetails = async (insertObj) => {
  try {
    const data = new PersonalStylist(insertObj);
    data.save();
    return data;
  } catch (e) {
    // // logger.error(e);
    throw e;
  }
};

module.exports.updateUserStylistDetails = async (userId, personalStylistId) => {
  try {
    let whereObj = { userId };
    let updateObj = {
      $set: {
        personalStylistId: personalStylistId,
        updatedOn: new Date().toISOString(),
      },
    };
    console.log(whereObj, updateObj)
    const data = await User.updateOne(whereObj, updateObj);
    return data;
  } catch (e) {
    // logger.error(e);
    throw e;
  }
};

module.exports.updateUserPersonalStylistIdToNull = async (userId) => {
  try {
    let whereObj = { userId };
    let updateObj = {
      $set: {
        personalStylistId: null,
        updatedOn: new Date().toISOString(),
      },
    };
    const data = await User.updateOne(whereObj, updateObj);
    return data;
  } catch (e) {
    // logger.error(e);
    throw e;
  }
};

module.exports.findStylistEmailId = async (emailId) => {
  try {
    const data = await PersonalStylist.find({ emailId });
    return data;
  } catch (e) {
    // logger.error(e);
    throw e;
  }
};

module.exports.findStylistClient = async (personalStylistId) => {
  try {
    const data = await User.find({ personalStylistId: personalStylistId });
    return data;
  } catch (e) {
    // logger.error(e);
    throw e;
  }
};

module.exports.saveRecommendedProduct = async (insertObj) => {
  try {
    const data = new StylistRecommendedProducts(insertObj);
    data.save();
    return data;
  } catch (e) {
    // logger.error(e);
    throw e;
  }
};

module.exports.getRecommendedProduct = async (params) => {
  try {
    const data = await StylistRecommendedProducts.find({
      personalStylistId: params.personalStylistId,
      userId: params.userId,
      productId: params.productId
    });
    return data;
  } catch (e) {
    // logger.error(e);
    throw e;
  }
};

module.exports.getAllRecommendedProduct = async (params) => {
  try {
    const data = await StylistRecommendedProducts.find({
      personalStylistId: params.personalStylistId,
      userId: params.userId
    });
    return data;
  } catch (e) {
    // logger.error(e);
    throw e;
  }
};

module.exports.getAllRecommendedProductByUserId = async (userId, page, limit, count) => {
  try {
    let data = []

    if (page && limit) {
      if (!count) {
        data = await StylistRecommendedProducts.find({
          userId: userId
        }).sort({ createdOn: -1 })
          .limit(limit * 1)
          .skip((page - 1) * limit);;
      } else {
        data = await StylistRecommendedProducts.count({
          userId: userId
        })
      }
    } else {
      data = await StylistRecommendedProducts.find({
        userId: userId
      });
    }
    return data;
  } catch (e) {
    // logger.error(e);
    throw e;
  }
};

module.exports.getRecommendedProductByUserId = async (userId, productId) => {
  try {
    const data = await StylistRecommendedProducts.find({
      userId: userId,
      productId: productId
    });
    return data;
  } catch (e) {
    // logger.error(e);
    throw e;
  }
};

module.exports.getRecommendedProductByUserIdAndStylistId = async (userId, stylistId, productId) => {
  try {
    const data = await StylistRecommendedProducts.find({
      userId: userId,
      productId: productId,
      personalStylistId: stylistId
    });
    return data;
  } catch (e) {
    // logger.error(e);
    throw e;
  }
};

module.exports.updateStylistProfilePic = async (personalStylistId, profilePicUrl) => {
  try {
    let whereObj = { _id: personalStylistId };
    let updateObj = {
      $set: {
        profilePicUrl,
        isProfileCreated: true,
        updatedOn: new Date().toISOString(),
      },
    };
    const data = await PersonalStylist.updateOne(whereObj, updateObj);
    return data;
  } catch (e) {
    // logger.error(e);
    throw e;
  }
};

module.exports.updateStylistProfileDetails = async (personalStylistId, profileDetails) => {
  try {
    let whereObj = { _id: personalStylistId };
    let updateObj = {
      $set: {
        emailId: profileDetails.emailId,
        name: profileDetails.name,
        gender: profileDetails.gender.toLowerCase(),
        isProfileCreated: true,
        updatedOn: new Date().toISOString(),
      },
    };
    const data = await PersonalStylist.updateOne(whereObj, updateObj);
    return data;
  } catch (e) {
    // logger.error(e);
    throw e;
  }
};

module.exports.updateRecommendedProductStatus = async (userId, productId, dislike) => {
  try {
    let whereObj = { userId: userId, productId: productId };
    let updateObj = {
      $set: {
        dislike: dislike,
        updatedOn: new Date().toISOString(),
      },
    };
    const data = await StylistRecommendedProducts.updateOne(whereObj, updateObj);
    return data;
  } catch (e) {
    // logger.error(e);
    throw e;
  }
};

module.exports.findVideoData = async (page, limit, arrayOfVideoIds) => {
  try {
    const arrayOfVideoObjectIds = arrayOfVideoIds.map(videoId => new ObjectId(videoId));
    const data = await Video.aggregate([
      {
        $addFields: {
          isCustomSort: {
            $cond: {
              if: { $in: ['$_id', arrayOfVideoObjectIds] },
              then: 0,
              else: 1
            }
          },
          view: {
            $cond: {
              if: { $in: ['$_id', arrayOfVideoObjectIds] },
              then: true,
              else: false
            }
          }
        }
      },
      {
        $sort: {
          isCustomSort: 1,
          view: 1,
          createdOn: -1
        }
      },
      {
        $facet: {
          sortedData: [
            {
              $match: { view: false }
            },
            {
              $sort: { createdOn: -1 }
            }
          ],
          viewTrueData: [
            {
              $match: { view: true }
            }
          ]
        }
      },
      {
        $project: {
          finalData: {
            $concatArrays: ['$sortedData', '$viewTrueData']
          }
        }
      },
      {
        $unwind: '$finalData'
      },
      {
        $replaceRoot: {
          newRoot: '$finalData'
        }
      },
      {
        $skip: (page - 1) * limit
      },
      {
        $limit: limit
      }
    ]);
    return data;
  } catch (e) {
    console.log(e)
    // logger.error(e);
    throw e;
  }
};

module.exports.addViewToVideo = async (insertObj) => {
  try {
    const data = new VideoView(insertObj);
    data.save();
    return data;
  } catch (e) {
    // logger.error(e);
    throw e;
  }
};

module.exports.getVideoView = async (videoId, userId) => {
  try {
    const data = await VideoView.find({
      videoId: videoId,
      userId: userId
    })
    return data;
  } catch (e) {
    // logger.error(e);
    throw e;
  }
};

module.exports.findVideoCount = async () => {
  try {
    const data = await Video.countDocuments()
    return data;
  } catch (e) {
    // logger.error(e);
    throw e;
  }
};


module.exports.getVideoViewForUser = async (userId) => {
  try {
    const data = await VideoView.find({
      userId: userId
    })
    return data;
  } catch (e) {
    // logger.error(e);
    throw e;
  }
};
