const {PersonalStylist, StylistRecommendedProducts } = require("../models");

module.exports.findStylistId = async (personalStylistId) => {
  try {
    const data = await PersonalStylist.findOne({ _id: personalStylistId });
    return data
  } catch (e) {
    throw e;
  }
}
module.exports.getStylistRecommenededProducts = async (personalStylistId) => {
  try {
    const data = await StylistRecommendedProducts.find({ personalStylistId });
    return data
  } catch (e) {
    throw e;
  }
}

module.exports.getAllRecommendedProducts = async () => {
  try {
    const data = await StylistRecommendedProducts.find()
    return data;
  } catch (e) {
    throw e;
  }
};

module.exports.getStylistCount = async () => {
  try {
    const count = await PersonalStylist.countDocuments()
    return count
  } catch (e) {
    throw e;
  }
}

module.exports.getAllStylists = async (page, limit) => {
  try {
    const data = await PersonalStylist.find()
      .limit(limit * 1)
      .skip((page - 1) * limit);
    return data;
  } catch(e) {
    throw e;
  }
};
