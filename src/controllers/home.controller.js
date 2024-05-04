const Joi = require("joi");
const { _200, _error } = require("../common/httpHelper");
const logger = require("../common/logger")("admin-controller");
const { validateSchema } = require("../common/validator");
const { HomeBao } = require("../bao");

module.exports.GET_allProducts = async (req, res) => {
  try {
    // logger.info("inside GET_allProducts");
    const schemaVerifyFilters = Joi.object().keys({
      page: Joi.number().optional(),
      limit: Joi.number().optional(),
      sortBy: Joi.string().valid("lowPrice", "highPrice", "latest").optional(),
      categoryIds: Joi.string().optional(),
      subCategoryIds: Joi.string().optional(),
      brandIds: Joi.string().optional(),
      season: Joi.string().optional(),
      color: Joi.string().optional(),
      size: Joi.string().optional(),
      price: Joi.string().optional(),
    });
    const { page = 1, limit = 100 } = req.query;
    let params = await validateSchema(req.query, schemaVerifyFilters);
    const homeBao = new HomeBao();
    const result = await homeBao.getAllProducts(page, limit, params);
    return _200(res, result);
  } catch (e) {
    throw _sendGenericError(res, e);
  }
};

module.exports.POST_allProducts = async (req, res) => {
  try {
    // logger.info("inside POST_allProducts");
    const schemaVerifyFilters = Joi.object().keys({
      userId: Joi.string().optional(),
      page: Joi.number().optional(),
      limit: Joi.number().optional(),
      sortBy: Joi.string().valid("lowPrice", "highPrice", "latest").optional(),
      categoryIds: Joi.array().items(Joi.number().optional()),
      subCategoryIds: Joi.array().items(Joi.number().optional()),
      brandIds: Joi.array().items(Joi.alternatives(Joi.string(), Joi.number().optional())),
      season: Joi.array().items(Joi.string().optional()),
      color: Joi.array().items(Joi.string().optional()),
      colorCodes: Joi.array().items(Joi.string().optional()),
      size: Joi.array().items(Joi.string().optional()),
      price: Joi.array().items(Joi.number().optional()),
      key: Joi.string().optional(),
      optionId: Joi.number().optional()
    });
    const { page = 1, limit = 20 } = req.body;
    let params = await validateSchema(req.body, schemaVerifyFilters);
    const homeBao = new HomeBao();
    const result = await homeBao.getAllProductsV1(page, limit, params);
    return _200(res, result);
  } catch (e) {
    console.log(e)
    // throw _sendGenericError(res, e);
  }
};

module.exports.POST_allProductsv2 = async (req, res) => {
  try {
    // logger.info("inside POST_allProducts");
    const schemaVerifyFilters = Joi.object().keys({
      userId: Joi.string().optional(),
      page: Joi.number().optional(),
      limit: Joi.number().optional(),
      sortBy: Joi.string().valid("lowPrice", "highPrice", "latest").optional(),
      categoryIds: Joi.array().items(Joi.number().optional()),
      subCategoryIds: Joi.array().items(Joi.number().optional()),
      brandIds: Joi.array().items(Joi.alternatives(Joi.string(), Joi.number().optional())),
      season: Joi.array().items(Joi.string().optional()),
      color: Joi.array().items(Joi.string().optional()),
      colorCodes: Joi.array().items(Joi.string().optional()),
      size: Joi.array().items(Joi.string().optional()),
      price: Joi.array().items(Joi.number().optional()),
      gender: Joi.array().items(Joi.string().optional()),
      sizeSystem: Joi.string().optional(),
      key: Joi.string().optional(),
      optionId: Joi.number().optional()
    });
    const { page = 1, limit = 20 } = req.body;
    let params = await validateSchema(req.body, schemaVerifyFilters);
    const homeBao = new HomeBao();
    const result = await homeBao.getAllProductsV2(page, limit, params);
    return _200(res, result);
  } catch (e) {
    throw _sendGenericError(res, e);
  }
};

module.exports.GET_productDetails = async (req, res) => {
  try {
    // logger.info("inside GET_productDetails");
    const schemaVerify = Joi.object().keys({
      userId: Joi.string().optional(),
      personalStylistId: Joi.string().optional(),
      productId: Joi.string().required(),
    });
    let params = await validateSchema(req.query, schemaVerify);
    const homeBao = new HomeBao();
    const result = await homeBao.getProductDetails(params.productId, params.userId, params.personalStylistId);
    return _200(res, result);
  } catch (e) {
    throw _sendGenericError(res, e);
  }
};

module.exports.GET_preferences = async (req, res) => {
  try {
    // logger.info("inside GET_preferences");
    const homeBao = new HomeBao();
    const result = await homeBao.getPreferences();
    return _200(res, result);
  } catch (e) {
    throw _sendGenericError(res, e);
  }
};

module.exports.GET_homePageData = async (req, res) => {
  try {
    // logger.info("inside GET_homePageData");
    const schemaVerifyHomePageData = Joi.object().keys({
      userId: Joi.string().optional(),
      personalStylistId: Joi.string().optional()
    });
    let params = await validateSchema(req.query, schemaVerifyHomePageData);
    const homeBao = new HomeBao();
    const result = await homeBao.getHomePageData(params);
    return _200(res, result);
  } catch (e) {
    throw _sendGenericError(res, e);
  }
};

module.exports.POST_savePreferences = async (req, res) => {
  try {
    // logger.info("inside POST_savePreferences");
    const schemaVerifySavePrefrences = Joi.object().keys({
      userId: Joi.string().required(),
      prefrences: Joi.array().items(Joi.object().keys({
        questionId: Joi.number().required(),
        optionIds: Joi.array().items(Joi.alternatives(Joi.string(), Joi.number()))
      })).required()
    });
    let params = await validateSchema(req.body, schemaVerifySavePrefrences);
    const homeBao = new HomeBao();
    const result = await homeBao.savePreferences(params);
    return _200(res, result);
  } catch (e) {
    throw _sendGenericError(res, e);
  }
};

module.exports.GET_search = async (req, res) => {
  try {
    // logger.info("inside GET_searchData");
    const schemaVerify = Joi.object().keys({
      key: Joi.string().required(),
    });
    let params = await validateSchema(req.query, schemaVerify);
    const homeBao = new HomeBao();
    const result = await homeBao.getSearchData(params.key);
    return _200(res, result);
  } catch (e) {
    throw _sendGenericError(res, e);
  }
};

module.exports.POST_eventProduct = async (req, res) => {
  try {
    // logger.info("inside GET_searchData");
    const schemaVerify = Joi.object().keys({
      name: Joi.string().required(),
      metaData: Joi.object().keys({
        productId: Joi.string().required()
      }).required()
    });
    let params = await validateSchema(req.body, schemaVerify);
    const homeBao = new HomeBao();
    const result = await homeBao.postEventProductData(params);
    return _200(res, result);
  } catch (e) {
    throw _sendGenericError(res, e);
  }
};

module.exports.GET_vimeoVideo = async (req, res) => {
  try {
    // logger.info("inside GET_vimeoVideo");
    const schemaVerify = Joi.object().keys({
      userId: Joi.string().required(),
      page: Joi.number().required(),
      limit: Joi.number().optional()
    });
    let params = await validateSchema(req.query, schemaVerify);
    const homeBao = new HomeBao();
    const result = await homeBao.getVimeoVideo(params);
    return _200(res, result);
  } catch (e) {
    throw _sendGenericError(res, e);
  }
};

module.exports.POST_viewVimeoVideo = async (req, res) => {
  try {
    // logger.info("inside POST_viewVimeoVideo");
    const schemaVerify = Joi.object().keys({
      userId: Joi.string().required(),
      videoId: Joi.string().required()
    });
    let params = await validateSchema(req.body, schemaVerify);
    const homeBao = new HomeBao();
    const result = await homeBao.postVideoView(params);
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
