const Base = require("./base");
const logger = require("../common/logger")("outfit-bao");
const constants = require("../common/constants");
const { ClosetDao, UserDao, OutfitDao } = require("../dao");
const { S3Service } = require("../services");

class OutfitBao extends Base {
  constructor() {
    super();
  }

  async createOutfit(outfitData) {
    try {
      // logger.info("inside createOutfit");
      let userDetails = await UserDao.findUserId(outfitData.userId);
      if (userDetails.length == 0) {
        let stylistData = await UserDao.findStylistById(outfitData.userId)
        if (stylistData.length == 0) {
          return {
            statusCode: constants.STATUS_CODES[302],
            statusMessage: constants.STATUS_MESSAGE[302],
          };
        }
      }
      if (outfitData.closetItemIds.length > 0) {
        let uploadResultOutfit = {}
        const checkImgO = await checkBase64Img(outfitData.outfitImageType)
        if (checkImgO) {
          let base64DataC = outfitData.outfitImageType.match(
            /^data:([A-Za-z-+\/]+);base64,(.+)$/
          );
          uploadResultOutfit = await S3Service.uploadClosetPicToS3(base64DataC)

        }
        let finalData = [];
        let whereObj = {
          userId: outfitData.userId,
          _id: { $in: outfitData.closetItemIds },
        };
        let closetDetails = await ClosetDao.findClosetDetails(whereObj);
        if (closetDetails.length > 0) {
          await Promise.all(closetDetails.map(async (element) => {
            let uploadResult = {}
            const checkImg = await checkBase64Img(element.itemImageUrl)
            if (checkImg) {
              let base64DataC = element.itemImageUrl.match(
                /^data:([A-Za-z-+\/]+);base64,(.+)$/
              );
              uploadResult = await S3Service.uploadClosetPicToS3(base64DataC)
              await ClosetDao.updateClosetDetails({
                _id: element._id
              }, {
                itemImageUrl: uploadResult.Location
              })
            }
            let obj = {
              userId: element.userId,
              closetItemId: element._id,
              itemImageUrl: uploadResult.Location ? uploadResult.Location : element.itemImageUrl,
              categoryId: element.categoryId,
              categoryName: element.categoryName,
              subCategoryId: element.subCategoryId,
              subCategoryName: element.subCategoryName,
              brandId: element.brandId,
              brandName: element.brandName,
              season: element.season,
              colorCode: element.colorCode,
            };
            finalData.push(obj);
          }));
        } else {
          return {
            statusCode: constants.STATUS_CODES[311],
            statusMessage: constants.STATUS_MESSAGE[311],
          };
        }
        let insertObj = {
          userId: outfitData.userId,
          closetItemIds: outfitData.closetItemIds,
        };
        let existingMatch = await OutfitDao.findSameOutfits(insertObj);
        if (existingMatch.length > 0) {
          return {
            statusCode: constants.STATUS_CODES[310],
            statusMessage: constants.STATUS_MESSAGE[310],
          };
        }
        insertObj = {
          userId: outfitData.userId,
          closetItemIds: outfitData.closetItemIds,
          outfitImageType: uploadResultOutfit.Location ? uploadResultOutfit.Location : outfitData.outfitImageType,
          name: outfitData.name,
          description: outfitData.description ? outfitData.description : 'NA',
          seasons: outfitData.seasons && outfitData.seasons.length > 0 ? outfitData.seasons : [],
          imageData: outfitData.imageData,
          createdOn: new Date().toISOString(),
          updatedOn: new Date().toISOString(),
        };
        let outfitDetails = await OutfitDao.saveOutfitDetails(insertObj);

        return {
          statusCode: constants.STATUS_CODES[200],
          statusMessage: constants.STATUS_MESSAGE[200],
          userId: outfitData.userId,
          outfitId: outfitDetails._id,
          finalData,
          imageData: outfitDetails.imageData,
          outfitImageType: outfitDetails.outfitImageType,
        };
      } else {
        return {
          statusCode: constants.STATUS_CODES[309],
          statusMessage: constants.STATUS_MESSAGE[309],
        };
      }
    } catch (e) {
      console.log(e);
      // logger.error(e);
      throw e;
    }
  }

  async removeOutfitItem(userId, outfitId) {
    try {
      // logger.info("inside removeOutfitItem");
      let userDetails = await UserDao.findUserId(userId);
      if (userDetails.length == 0) {
        let stylistData = await UserDao.findStylistById(userId)
        if (stylistData.length == 0) {
          return {
            statusCode: constants.STATUS_CODES[302],
            statusMessage: constants.STATUS_MESSAGE[302],
          };
        }
      }
      let whereObj = {
        userId,
        _id: outfitId,
      };
      let outfitData = await OutfitDao.findSameOutfits(whereObj);
      if (outfitData.length > 0) {
        await OutfitDao.deleteOutfitItem(whereObj);
        return {
          statusCode: constants.STATUS_CODES[200],
          statusMessage: "item deleted successfully",
        };
      } else {
        return {
          statusCode: constants.STATUS_CODES[308],
          statusMessage: constants.STATUS_MESSAGE[308],
        };
      }
    } catch (e) {
      // logger.error(e);
      throw e;
    }
  }

  async findOutfitList(userId, closetItemId) {
    try {
      // logger.info("inside findOutfitList");
      console.log(userId, closetItemId, "FINDOUTFIT")
      let userDetails = await UserDao.findUserId(userId);
      if (userDetails.length == 0) {
        let stylistData = await UserDao.findStylistById(userId)
        if (stylistData.length == 0) {
          return {
            statusCode: constants.STATUS_CODES[302],
            statusMessage: constants.STATUS_MESSAGE[302],
          };
        }
      }
      let closetDetails = await ClosetDao.findClosetId(closetItemId);
      if (closetDetails.length > 0) {
        let whereObj = {
          userId,
          closetItemIds: { $all: [closetItemId] },
        };
        let outfitDetails = await OutfitDao.findSameOutfits(whereObj);
        let finalOutfitDetails = [];
        await Promise.all(
          outfitDetails.map(async (element) => {
            let closetDetailsList = [];
            await Promise.all(
              element.closetItemIds.map(async (element) => {
                let closetDetails = await ClosetDao.findClosetId(element);
                let obj = {
                  userId: closetDetails[0].userId,
                  closetItemId: closetDetails[0]._id,
                  itemImageUrl: closetDetails[0].itemImageUrl,
                  categoryId: closetDetails[0].categoryId,
                  categoryName: closetDetails[0].categoryName,
                  subCategoryId: closetDetails[0].subCategoryId,
                  subCategoryName: closetDetails[0].subCategoryName,
                  brandId: closetDetails[0].brandId,
                  brandName: closetDetails[0].brandName,
                  season: closetDetails[0].season,
                  colorCode: closetDetails[0].colorCode,
                };
                closetDetailsList.push(obj);
              })
            );
            let obj = {
              outfitId: element._id,
              userId: element.userId,
              closetDetailsList,
              outfitImageType: element.outfitImageType,
              name: element.name,
              description: element.description,
              seasons: element.seasons,
              imageData: element.imageData,
            };
            finalOutfitDetails.push(obj);
          })
        );
        return {
          statusCode: constants.STATUS_CODES[200],
          statusMessage: constants.STATUS_MESSAGE[200],
          outfitList: finalOutfitDetails,
        };
      } else {
        return {
          statusCode: constants.STATUS_CODES[308],
          statusMessage: constants.STATUS_MESSAGE[308],
        };
      }
    } catch (e) {
      console.log(e)
      // logger.error(e);
      throw e;
    }
  }

  async getOutfitDetails(userId) {
    try {
      let userDetails = await UserDao.findUserId(userId);
      if (userDetails.length == 0) {
        let stylistData = await UserDao.findStylistById(userId)
        if (stylistData.length == 0) {
          return {
            statusCode: constants.STATUS_CODES[302],
            statusMessage: constants.STATUS_MESSAGE[302],
          };
        }
      }
      let outfitDetails = await OutfitDao.findOutfitByUserId(userId);
      if (outfitDetails.length > 0) {
        let finalOutfitDetails = [];
        await Promise.all(outfitDetails.map(async (element) => {
          let closetDetailsList = [];
          let uploadResultOutfit = {}
          const checkImg = await checkBase64Img(element.outfitImageType)
          if (checkImg) {
            let base64DataO = element.outfitImageType.match(
              /^data:([A-Za-z-+\/]+);base64,(.+)$/
            );
            uploadResultOutfit = await S3Service.uploadClosetPicToS3(base64DataO)
            await OutfitDao.updateOutfitDetails({
              _id: element._id
            }, {
              outfitImageType: uploadResultOutfit.Location
            })
          }
          await Promise.all(element.closetItemIds.map(async (element) => {
            let uploadResult = {}
            let closetDetails = await ClosetDao.findClosetId(element);
            if (closetDetails.length > 0 && closetDetails[0].itemImageUrl) {
              const checkImg = await checkBase64Img(closetDetails[0].itemImageUrl)
              if (checkImg) {
                let base64DataC = closetDetails[0].itemImageUrl.match(
                  /^data:([A-Za-z-+\/]+);base64,(.+)$/
                );
                uploadResult = await S3Service.uploadClosetPicToS3(base64DataC)
                await ClosetDao.updateClosetDetails({
                  _id: closetDetails[0]._id
                }, {
                  itemImageUrl: uploadResult.Location
                })
              }
            }
            let obj = {
              userId: closetDetails[0].userId,
              closetItemId: closetDetails[0]._id,
              itemImageUrl: uploadResult.Location ? uploadResult.Location : closetDetails[0].itemImageUrl,
              categoryId: closetDetails[0].categoryId,
              categoryName: closetDetails[0].categoryName,
              subCategoryId: closetDetails[0].subCategoryId,
              subCategoryName: closetDetails[0].subCategoryName,
              brandId: closetDetails[0].brandId,
              brandName: closetDetails[0].brandName,
              season: closetDetails[0].season,
              colorCode: closetDetails[0].colorCode,
            };
            closetDetailsList.push(obj);
          }));
          let obj = {
            outfitId: element._id,
            userId: element.userId,
            closetDetailsList,
            outfitImageType: uploadResultOutfit.Location ? uploadResultOutfit.Location : element.outfitImageType,
            name: element.name,
            description: element.description,
            seasons: element.seasons,
            imageData: element.imageData,
            createdDate: element.createdOn,
            modifiedDate: element.updatedOn,
          };
          finalOutfitDetails.push(obj);
        }));
        return {
          statusCode: constants.STATUS_CODES[200],
          statusMessage: constants.STATUS_MESSAGE[200],
          outfitList: finalOutfitDetails.length > 0 ? finalOutfitDetails.sort((a, b) => new Date(a.createdDate) - new Date(b.createdDate)) : [],
        };
      } else {
        return {
          statusCode: constants.STATUS_CODES[200],
          statusMessage: constants.STATUS_MESSAGE[200],
          outfitDetails,
        };
      }
    } catch (e) {
      console.log(e)
      // logger.error(e);
      throw e;
    }
  }

  async getOneOutfitDetails(userId, outfitId) {
    try {
      // logger.info("inside getOutfitDetails");
      let userDetails = await UserDao.findUserId(userId);
      if (userDetails.length == 0) {
        let stylistData = await UserDao.findStylistById(userId)
        if (stylistData.length == 0) {
          return {
            statusCode: constants.STATUS_CODES[302],
            statusMessage: constants.STATUS_MESSAGE[302],
          };
        }
      }
      let insertObj = {
        userId,
        _id: outfitId,
      };
      let outfitDetails = await OutfitDao.findSameOutfits(insertObj);
      if (outfitDetails.length > 0) {
        let finalOutfitDetails = [];
        await Promise.all(
          outfitDetails.map(async (element) => {
            let closetDetailsList = [];
            await Promise.all(
              element.closetItemIds.map(async (element) => {
                let closetDetails = await ClosetDao.findClosetId(element);
                let obj = {
                  userId: closetDetails[0].userId,
                  closetItemId: closetDetails[0]._id,
                  itemImageUrl: closetDetails[0].itemImageUrl,
                  categoryId: closetDetails[0].categoryId,
                  categoryName: closetDetails[0].categoryName,
                  subCategoryId: closetDetails[0].subCategoryId,
                  subCategoryName: closetDetails[0].subCategoryName,
                  brandId: closetDetails[0].brandId,
                  brandName: closetDetails[0].brandName,
                  season: closetDetails[0].season,
                  colorCode: closetDetails[0].colorCode,
                };
                closetDetailsList.push(obj);
              })
            );
            let obj = {
              outfitId: element._id,
              userId: element.userId,
              closetDetailsList,
              outfitImageType: element.outfitImageType,
              name: element.name,
              description: element.description,
              seasons: element.seasons,
              imageData: element.imageData,
            };
            finalOutfitDetails.push(obj);
          })
        );
        return {
          statusCode: constants.STATUS_CODES[200],
          statusMessage: constants.STATUS_MESSAGE[200],
          outfitList: finalOutfitDetails,
        };
      } else {
        return {
          statusCode: constants.STATUS_CODES[312],
          statusMessage: constants.STATUS_MESSAGE[312],
        };
      }
    } catch (e) {
      console.log(e)
      // logger.error(e);
      throw e;
    }
  }

  async editOutfitDetails(outfitData) {
    try {
      // logger.info("inside createOutfit");
      let userDetails = await UserDao.findUserId(outfitData.userId);
      if (userDetails.length == 0) {
        let stylistData = await UserDao.findStylistById(outfitData.userId)
        if (stylistData.length == 0) {
          return {
            statusCode: constants.STATUS_CODES[302],
            statusMessage: constants.STATUS_MESSAGE[302],
          };
        }
      }

      let whereObj = {
        userId: outfitData.userId,
        _id: outfitData.outfitId,
      };
      let outfitDetails = await OutfitDao.findSameOutfits(whereObj);
      if (outfitDetails.length > 0) {
        let updateObj = {
          closetItemIds: outfitData.closetItemIds,
          outfitImageType: outfitData.outfitImageType,
          name: outfitData.name,
          description: outfitData.description ? outfitData.description : 'NA',
          seasons: outfitData.seasons && outfitData.seasons.length > 0 ? outfitData.seasons : [],
          imageData: outfitData.imageData,
          updatedOn: new Date().toISOString(),
        };
        await OutfitDao.updateOutfitDetails(whereObj, updateObj);
        console.log(whereObj)
        let getOutfitDetails = await OutfitDao.findSameOutfits(whereObj);

        return {
          statusCode: constants.STATUS_CODES[200],
          statusMessage: constants.STATUS_MESSAGE[200],
          outfitId: getOutfitDetails[0]._id,
          userId: getOutfitDetails[0].userId,
          outfitImageType: getOutfitDetails[0].outfitImageType,
          name: getOutfitDetails[0].name,
          description: getOutfitDetails[0].description,
          seasons: getOutfitDetails[0].seasons,
          imageData: getOutfitDetails[0].imageData,
        };
      } else {
        return {
          statusCode: constants.STATUS_CODES[312],
          statusMessage: constants.STATUS_MESSAGE[312],
        };
      }
    } catch (e) {
      // logger.error(e);
      throw e;
    }
  }
}

async function checkBase64Img(image) {
  let url = image.replace(/^(data:)[^,]+,/, '');
  const regex = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
  return regex.test(url);
}

module.exports = OutfitBao;
