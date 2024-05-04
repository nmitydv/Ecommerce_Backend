const Joi = require("joi");
const { _200, _error } = require("../common/httpHelper");
const logger = require("../common/logger")("user-controller");
const { validateSchema } = require("../common/validator");
const { UserBao } = require("../bao");

module.exports.GET_userDetails = async (req, res) => {
  try {
    // logger.info("inside GET_userDetails");
    const schemaVerifyUserId = Joi.object().keys({
      userId: Joi.string().optional(),
      personalStylistId: Joi.string().optional()
    });
    let params = await validateSchema(req.query, schemaVerifyUserId);
    const userBao = new UserBao();
    const result = await userBao.getUserDetails(params.userId, params.personalStylistId);
    // logger.info("result", result);
    return _200(res, result);
  } catch (e) {
    throw _sendGenericError(res, e);
  }
};

module.exports.POST_userProfile = async (req, res) => {
  try {
    // logger.info("inside POST_userProfile");
    const schemaVerifyUserProfile = Joi.object().keys({
      userId: Joi.string().optional(),
      personalStylistId: Joi.string().optional(),
      emailId: Joi.string().required(),
      name: Joi.string().required(),
      gender: Joi.string().required(),
      base64ImgString: Joi.string().allow(null),
      isImageUpated: Joi.boolean().optional()
    });
    let params = await validateSchema(req.body, schemaVerifyUserProfile);
    const userBao = new UserBao();
    const result = await userBao.postUserProfile(params);
    // logger.info("result", result);
    return _200(res, result);
  } catch (e) {
    console.log(e)
    throw _sendGenericError(res, e);
  }
};

module.exports.POST_uploadChatMedia = async (req, res) => {
  try {
    const schemaVerifyUserProfile = Joi.object().keys({
      userId: Joi.string().optional(),
      personalStylistId: Joi.string().optional(),
      base64MediaString: Joi.string().allow(null),
    });
    let params = await validateSchema(req.body, schemaVerifyUserProfile);
    const userBao = new UserBao();
    const result = await userBao.uploadChatMedia(params);
    // logger.info("result", result);
    return _200(res, result);
  } catch (e) {
    console.log(e)
    throw _sendGenericError(res, e);
  }
};

module.exports.GET_presignedURL = async (req, res) => {
  try {
    const schemaVerifyUserProfile = Joi.object().keys({
      userId: Joi.string().optional(),
      personalStylistId: Joi.string().optional(),
    });
    let params = await validateSchema(req.query, schemaVerifyUserProfile);
    const userBao = new UserBao();
    const result = await userBao.getPresignedURL(params);
    return _200(res, result);
  } catch (e) {
    console.log(e)
    throw _sendGenericError(res, e);
  }
}

module.exports.GET_userPrefrences = async (req, res) => {
  try {
    // logger.info("inside GET_userPrefrences");
    const schemaVerifyUserId = Joi.object().keys({
      userId: Joi.string().required(),
    });
    let params = await validateSchema(req.query, schemaVerifyUserId);
    const userBao = new UserBao();
    const result = await userBao.getUserPrefrencesDetails(params.userId);
    // logger.info("result", result);
    return _200(res, result);
  } catch (e) {
    throw _sendGenericError(res, e);
  }
};


module.exports.POST_personalStylist = async (req, res) => {
  try {
    // logger.info("inside POST_personalStylist");
    const schemaVerifyUserProfile = Joi.object().keys({
      userId: Joi.string().required(),
      emailId: Joi.string().required(),
      name: Joi.string().required(),
    });
    let params = await validateSchema(req.body, schemaVerifyUserProfile);
    const userBao = new UserBao();
    const result = await userBao.postPersonalStylist(params);
    // logger.info("result", result);
    return _200(res, result);
  } catch (e) {
    throw _sendGenericError(res, e);
  }
};

module.exports.POST_removeStylist = async (req, res) => {
  try {
    // logger.info("inside POST_removeStylist");
    const schemaVerifyUserProfile = Joi.object().keys({
      userId: Joi.string().required()
    });
    let params = await validateSchema(req.body, schemaVerifyUserProfile);
    const userBao = new UserBao();
    const result = await userBao.removePersonalStylist(params);
    // logger.info("result", result);
    return _200(res, result);
  } catch (e) {
    throw _sendGenericError(res, e);
  }
};


module.exports.GET_clients = async (req, res) => {
  try {
    // logger.info("inside GET_clients");
    const schemaGetClients = Joi.object().keys({
      personalStylistId: Joi.string().required()
    });
    let params = await validateSchema(req.query, schemaGetClients);
    const userBao = new UserBao();
    const result = await userBao.getStylistClients(params);
    // logger.info("result", result);
    return _200(res, result);
  } catch (e) {
    throw _sendGenericError(res, e);
  }
};


module.exports.POST_recommendToClient = async (req, res) => {
  try {
    // logger.info("inside POST_recommendToClient");
    const schemaGetClients = Joi.object().keys({
      personalStylistId: Joi.string().required(),
      userIds: Joi.array().items(Joi.string().required()),
      productId: Joi.string().required(),
      note: Joi.string().optional()
    });
    let params = await validateSchema(req.body, schemaGetClients);
    const userBao = new UserBao();
    const result = await userBao.postRecommendProductToClient(params);
    // logger.info("result", result);
    return _200(res, result);
  } catch (e) {
    throw _sendGenericError(res, e);
  }
};


module.exports.GET_recommendToClient = async (req, res) => {
  try {
    // logger.info("inside GET_recommendToClient");
    const schemaGetRecommendationToClients = Joi.object().keys({
      personalStylistId: Joi.string().required(),
      userId: Joi.string().required(),
    });
    let params = await validateSchema(req.query, schemaGetRecommendationToClients);
    const userBao = new UserBao();
    const result = await userBao.getRecommendationToClient(params);
    // logger.info("result", result);
    return _200(res, result);
  } catch (e) {
    throw _sendGenericError(res, e);
  }
};


module.exports.POST_changeRecommendedProductStatus = async (req, res) => {
  try {
    // logger.info("inside POST_changeRecommendedProductStatus");
    const schemaDislikeRecommendProduct = Joi.object().keys({
      productId: Joi.string().required(),
      userId: Joi.string().required(),
      dislike: Joi.boolean().required()
    });
    let params = await validateSchema(req.body, schemaDislikeRecommendProduct);
    const userBao = new UserBao();
    const result = await userBao.postChangeRecommendedProductStatus(params);
    // logger.info("result", result);
    return _200(res, result);
  } catch (e) {
    throw _sendGenericError(res, e);
  }
};

function _sendGenericError(res, e) {
  return _error(res, {
    message: e,
    type: "generic",
  });
}
