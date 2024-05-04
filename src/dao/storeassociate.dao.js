const { StoreAssociate } = require("../models");

module.exports.findEmailId = async (emailIdObj) => {
  try {
    const data = await StoreAssociate.find(emailIdObj);
    return data;
  } catch (e) {
    throw e;
  }
};

module.exports.saveStoreAssociateDetails = async (insertObj) => {
  try {
    const data = new StoreAssociate(insertObj);
    await data.save();
    return data;
  } catch (e) {
    throw e;
  }
};

module.exports.findStoreAssociateByEmail = async (emailId) => {
  try {
    const data = await StoreAssociate.find({ emailId: emailId });
    return data;
  } catch (e) {
    // logger.error(e);
    throw e;
  }
};

module.exports.deleteStoreAssociateAccounts = async (whereObj) => {
  try {
    const data = await StoreAssociate.deleteMany(whereObj);
    return data;
  } catch (e) {
    // logger.error(e);
    throw e;
  }
};

module.exports.getStoreAssociateCount = async (emailId) => {
  try {
    const count = await StoreAssociate.countDocuments({vendorEmailId: emailId})
    return count
  } catch (e) {
    throw e;
  }
}

module.exports.getAllStoreAssociates = async (vendorId, page, limit) => {
  try {
    const data = await StoreAssociate.find({vendorId})
      .limit(limit * 1)
      .skip((page - 1) * limit);
    return data;
  } catch(e) {
    throw e;
  }
};
