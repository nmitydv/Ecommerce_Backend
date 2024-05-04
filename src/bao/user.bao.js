const Base = require("./base");
const logger = require("../common/logger")("user-bao");
const constants = require("../common/constants");
const { UserDao, ProductsDao, ClosetDao, AdminDao, OutfitDao } = require("../dao");
const { S3Service } = require("../services");
class UserBao extends Base {
  constructor() {
    super();
  }

  async getUserDetails(userId, personalStylistId) {
    try {
      // logger.info("inside getUserDetails", userId);
      let userDetails
      if (personalStylistId) {
        userDetails = await UserDao.findStylistById(personalStylistId);
      } else {
        userDetails = await UserDao.findUserId(userId);
      }
      console.log(userDetails)
      let personalStylisDetails = []
      let res;
      if (userDetails.length > 0) {
        if (userDetails[0].personalStylistId) {
          personalStylisDetails = await UserDao.findStylistById(userDetails[0].personalStylistId)
        }
        let outfitDetails = await OutfitDao.findOutfitByUserId(userId);
        let finalOutfitDetails = [];
        if (outfitDetails.length > 0) {
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
                    createdOn: closetDetails[0].createdOn,
                    updatedOn: closetDetails[0].updatedOn,
                    price: closetDetails[0].price,
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
                createdDate: element.createdOn,
                modifiedDate: element.updatedOn,
              };
              finalOutfitDetails.push(obj);
            })
          );
        }
        const closetDetails = await ClosetDao.getClosetDetails(userId, 'asc', 100, 1);
        let data = [];
        closetDetails.map((element) => {
          let obj = {
            userId: element.userId,
            closetItemId: element._id,
            itemImageUrl: element.itemImageUrl,
            categoryId: element.categoryId,
            categoryName: element.categoryName,
            subCategoryId: element.subCategoryId,
            subCategoryName: element.subCategoryName,
            brandId: element.brandId,
            brandName: element.brandName,
            season: element.season,
            colorCode: element.colorCode,
            createdOn: element.createdOn,
            updatedOn: element.updatedOn,
            price: element.price,
          };
          data.push(obj);
        });

        const closetItemsCountByCategory =
          await ClosetDao.getClosetItemsCount(userId);

        res = {
          statusCode: constants.STATUS_CODES[200],
          statusMessage: constants.STATUS_MESSAGE[200],
          userId: userDetails[0].userId,
          emailId: userDetails[0].emailId,
          name: userDetails[0].name == undefined ? null : userDetails[0].name,
          gender:
            userDetails[0].gender == undefined ? null : userDetails[0].gender,
          profilePicUrl:
            userDetails[0].profilePicUrl == undefined
              ? null
              : userDetails[0].profilePicUrl,
          isProfileCreated: userDetails[0].isProfileCreated ? userDetails[0].isProfileCreated : false,
          whatsappNumber: userDetails[0].whatsappNumber ? userDetails[0].whatsappNumber : null,
          totalClosetItems: closetItemsCountByCategory.count,
          categoryStats: closetItemsCountByCategory.categoryStats,
          brandStats: closetItemsCountByCategory.brandStats,
          seasonStats: closetItemsCountByCategory.seasonStats,
          colorStats: closetItemsCountByCategory.colorUsage,
          totalProductValue: closetItemsCountByCategory.totalProductValue,
          totalOutfits: await OutfitDao.getOutfitCount(
            userDetails[0].userId
          ),
          createdOn: userDetails[0].createdOn,
          updatedOn: userDetails[0].updatedOn,
          outfitDetails: finalOutfitDetails,
          closetDetails: data,
          averageOrderValue: closetItemsCountByCategory.totalAverageValue 
        };
        if (personalStylistId) {
          res.personalStylistId = userDetails[0]._id
        } else {
          res.isPreferences = userDetails[0].isPreferences,
            res.hasPersonalStylist = userDetails[0].personalStylistId ? true : false,
            res.personalStylistId = userDetails[0].personalStylistId ? userDetails[0].personalStylistId : null,
            res.personalStylistDetails = personalStylisDetails && personalStylisDetails.length > 0 ? personalStylisDetails : []
        }
      } else {
        res = {
          statusCode: constants.STATUS_CODES[302],
          statusMessage: constants.STATUS_MESSAGE[302],
        };
      }
      return res;
    } catch (e) {
      // logger.error(e);
      throw e;
    }
  }

  async postUserProfile(userData) {
    try {
      console.log(userData)
      let userDetails
      if (userData.personalStylistId) {
        userDetails = await UserDao.findStylistById(userData.personalStylistId);
      } else {
        userDetails = await UserDao.findUserId(userData.userId);
      }
      if (userDetails.length > 0) {
        if (userData.base64ImgString != null && userData.isImageUpated) {
          let base64Data = userData.base64ImgString.match(
            /^data:([A-Za-z-+\/]+);base64,(.+)$/
          );
          if (base64Data.length !== 3) {
            return {
              statusCode: constants.STATUS_CODES[304],
              statusMessage: constants.STATUS_MESSAGE[304],
            };
          }
          const uploadFileResult = await S3Service.uploadProfilePicToS3(
            base64Data
          );
          if (userData.personalStylistId) {
            await UserDao.updateStylistProfilePic(
              userData.personalStylistId,
              uploadFileResult.Location
            );
          } else {
            await UserDao.updateUserProfilePic(
              userData.userId,
              uploadFileResult.Location
            );
          }
        }
        if (userData.isImageUpated && (userData.base64ImgString == null || !userData.base64ImgString)) {
          if (userData.personalStylistId) {
            await UserDao.updateStylistProfilePic(
              userData.personalStylistId,
              ""
            );
          } else {
            await UserDao.updateUserProfilePic(
              userData.userId,
              ""
            );
          }
        }
        if (userData.personalStylistId) {
          await UserDao.updateStylistProfileDetails(userData.personalStylistId, userData);
        } else {
          await UserDao.updateUserProfileDetails(userData.userId, userData);
        }
        let updatedUserProfileData

        if (userData.personalStylistId) {
          updatedUserProfileData = await UserDao.findStylistById(
            userData.personalStylistId
          );
        } else {
          updatedUserProfileData = await UserDao.findUserId(
            userData.userId
          );
        }
        return {
          statusCode: constants.STATUS_CODES[200],
          statusMessage: constants.STATUS_MESSAGE[200],
          userId: updatedUserProfileData[0].userId,
          personalStylistId: userData.personalStylistId ? updatedUserProfileData[0]._id : null,
          emailId: updatedUserProfileData[0].emailId,
          name: updatedUserProfileData[0].name,
          gender: updatedUserProfileData[0].gender,
          profilePicUrl: updatedUserProfileData[0].profilePicUrl,
          isProfileCreated: updatedUserProfileData[0].isProfileCreated,
        };
      } else {
        return {
          statusCode: constants.STATUS_CODES[302],
          statusMessage: constants.STATUS_MESSAGE[302],
        };
      }
    } catch (e) {
      // logger.error(e);
      throw e;
    }
  }

  async uploadChatMedia(userData) {
    try {
      let userDetails;
  
      if (userData.personalStylistId) {
        userDetails = await UserDao.findStylistById(userData.personalStylistId);
      } else {
        userDetails = await UserDao.findUserId(userData.userId);
      }

      if (userDetails.length > 0 && userData.base64MediaString != null) {
        let base64Data = userData.base64MediaString.match(
          /^data:([A-Za-z-+\/]+);base64,(.+)$/
        );
  
        if (base64Data && base64Data.length === 3) {
          const contentType = base64Data[1];;
          const isImage = contentType.startsWith("image/");

          const mediaUrl = await S3Service.uploadMediaToS3(base64Data[2], contentType, isImage);
          
          return {
            statusCode: constants.STATUS_CODES[200],
            statusMessage: constants.STATUS_MESSAGE[200],
            emailId: userDetails[0].emailId,
            imageUrl: mediaUrl,
          };
        }
      } 
  
      return {
        statusCode: constants.STATUS_CODES[304],
        statusMessage: constants.STATUS_MESSAGE[304],
      };
    } catch (e) {
      console.error("Error:", e);
      throw e;
    }
  }

  async getPresignedURL(userData){
    try {
      let userDetails
      if (userData.personalStylistId) {
        userDetails = await UserDao.findStylistById(userData.personalStylistId);
      } else {
        userDetails = await UserDao.findUserId(userData.userId);
      }
      if (userDetails.length > 0) {
        const presignedUrl = await S3Service.uploadVideoToS3()
        return {
          statusCode: constants.STATUS_CODES[200],
          statusMessage: constants.STATUS_MESSAGE[200],
          emailId: userDetails[0].emailId,
          presignedUrl
        };
      } else {
        return {
          statusCode: constants.STATUS_CODES[302],
          statusMessage: constants.STATUS_MESSAGE[302],
        };
      }
    } catch (e) {
      // logger.error(e);
      throw e;
    }
  }

  async getUserPrefrencesDetails(userId) {
    try {
      // logger.info("inside getUserPrefrencesDetails", userId);
      console.log(userId)
      let userPrefDetails = await UserDao.findUserPrefrences(userId);
      let res;
      if (userPrefDetails.length > 0) {
        res = {
          statusCode: constants.STATUS_CODES[200],
          statusMessage: constants.STATUS_MESSAGE[200],
          userId: userPrefDetails[0].userId,
          prefrences: userPrefDetails[0].prefrences.sort((a, b) => a.questionId - b.questionId)
        };
      } else {
        res = {
          statusCode: constants.STATUS_CODES[200],
          statusMessage: constants.STATUS_MESSAGE[200],
          userId: userId,
          prefrences: []
        };
      }
      return res;
    } catch (e) {
      // logger.error(e);
      throw e;
    }
  }

  async postPersonalStylist(stylistData) {
    try {
      // logger.info("inside postPersonalStylist", stylistData);
      let stylistDetails = await UserDao.findStylistByEmail(stylistData.emailId.toLowerCase());
      if (stylistDetails.length === 0) {
        let insertObj = {
          emailId: stylistData.emailId.toLowerCase(),
          name: stylistData.name,
          isActive: true,
          createdOn: new Date().toISOString(),
          updatedOn: new Date().toISOString(),
        };
        stylistDetails = await UserDao.saveStylistDetails(insertObj)
      }
      await UserDao.updateUserStylistDetails(stylistData.userId, stylistDetails[0]._id.toString())
      return {
        statusCode: constants.STATUS_CODES[200],
        statusMessage: constants.STATUS_MESSAGE[200],
        userId: stylistData.userId,
        emailId: stylistData.emailId,
        name: stylistData.name,
      };
    } catch (e) {
      // logger.error(e);
      throw e;
    }
  }

  async removePersonalStylist(userData) {
    try {
      // logger.info("inside postPersonalStylist", userData);
      let userDetails = await UserDao.findUserId(userData.userId);
      if (userDetails.length > 0) {
        await UserDao.updateUserPersonalStylistIdToNull(userData.userId)
      } else {
        return {
          statusCode: constants.STATUS_CODES[302],
          statusMessage: constants.STATUS_MESSAGE[302],
        };
      }
      return {
        statusCode: constants.STATUS_CODES[200],
        statusMessage: constants.STATUS_MESSAGE[200],
        userId: userData.userId,
      };
    } catch (e) {
      // logger.error(e);
      throw e;
    }
  }

  async getStylistClients(params) {
    try {
      // logger.info("inside getStylistClients", params);
      let clientDetails = await UserDao.findStylistClient(params.personalStylistId);
      if (clientDetails.length > 0) {
        return {
          statusCode: constants.STATUS_CODES[200],
          statusMessage: constants.STATUS_MESSAGE[200],
          clientDetails: clientDetails.map((x) => {
            return {
              userId: x.userId,
              emailId: x.emailId,
              profilePicUrl: x.profilePicUrl,
              name: x.name
            }

          }),
        };
      } else {
        return {
          statusCode: constants.STATUS_CODES[302],
          statusMessage: constants.STATUS_MESSAGE[302],
        };
      }
    } catch (e) {
      // logger.error(e);
      throw e;
    }
  }

  async postRecommendProductToClient(params) {
    try {
      // logger.info("inside postRecommendProductToClient", params);
      await Promise.all(params.userIds.map(async (user) => {
        const checkIfExist = await UserDao.getRecommendedProduct({
          personalStylistId: params.personalStylistId,
          userId: user,
          productId: params.productId
        })
        if (checkIfExist.length <= 0) {
          let insertObj = {
            userId: user,
            personalStylistId: params.personalStylistId,
            productId: params.productId,
            createdOn: new Date().toISOString(),
            updatedOn: new Date().toISOString(),
          }
          if (params.note) {
            insertObj.note = params.note
          }
          await UserDao.saveRecommendedProduct(insertObj)
        }
      }))
      return {
        statusCode: constants.STATUS_CODES[200],
        statusMessage: constants.STATUS_MESSAGE[200],
        recommendedProductDetails: params
      };
    } catch (e) {
      // logger.error(e);
      throw e;
    }
  }

  async postChangeRecommendedProductStatus(params) {
    try {
      // logger.info("inside postChangeRecommendedProductStatus", params);
      const rProduct = await UserDao.getRecommendedProductByUserId(params.userId, params.productId)
      console.log(rProduct)
      if (rProduct && rProduct.length > 0) {
        await UserDao.updateRecommendedProductStatus(params.userId, params.productId, params.dislike)
      }
      return {
        statusCode: constants.STATUS_CODES[200],
        statusMessage: constants.STATUS_MESSAGE[200],
        recommendedProductDetails: params
      };
    } catch (e) {
      // logger.error(e);
      throw e;
    }
  }

  async getRecommendationToClient(params) {
    try {
      // logger.info("inside getRecommendationToClient", params);
      const recommendedProducts = await UserDao.getAllRecommendedProduct(params)
      let productDetailsArr = []
      let recommendedProductDetails = []
      if (recommendedProducts.length > 0) {
        let brandList = await ClosetDao.getBrands();
        const adminBrandList = await AdminDao.getAllBrands(1, 100)
        brandList = adminBrandList.length > 0 ? [...brandList, ...adminBrandList] : brandList
        let brandName = 'NA'
        await Promise.all(recommendedProducts.map(async (x) => {
          const productDetails = await ProductsDao.findProduct(x.productId)
          if (productDetails.length > 0) {
            productDetails[0].isDisliked = x.dislike ? x.dislike : false
            productDetails[0].note = x.note ? x.note : ''
            productDetailsArr.push(productDetails[0])
          }
        }))
        recommendedProductDetails = await Promise.all(productDetailsArr.map(async (prd) => {
          const brandIndex = brandList.findIndex((brand) => {
            if (brand.brandId) {
              return brand.brandId == prd.brandId
            } else {
              return brand._id.equals(prd.brandId)
            }
          })
          if (brandIndex > -1) {
            brandName = brandList[brandIndex].brandName ? brandList[brandIndex].brandName : brandList[brandIndex].name ? brandList[brandIndex].name : 'NA'
          }
          const colorcode = await ProductsDao.getColorCode(prd.productColor)
          return {
            productId: prd._id,
            productName: prd.productName,
            productPrice: prd.productPrice,
            productDescription: prd.productDescription,
            brandId: prd.brandId,
            brandName,
            productColor: prd.productColor,
            productColorCode: colorcode.length > 0 ? colorcode[0].colorCode : "00000",
            imageUrls: prd.imageUrls,
            categoryId: prd.categoryId,
            categoryName: prd.categoryName,
            subCategoryId: prd.subCategoryId,
            subCategoryName: prd.subCategoryName,
            seasons: prd.seasons,
            productSizes: prd.productSizes,
            productButtonLink: prd.productButtonLink,
            createdOn: prd.createdOn,
            isDisliked: prd.isDisliked,
            note: prd.note ? prd.note : ''
          }
        }))
        recommendedProductDetails = recommendedProductDetails.sort((a, b) => b.createdOn - a.createdOn)
        return {
          statusCode: constants.STATUS_CODES[200],
          statusMessage: constants.STATUS_MESSAGE[200],
          userId: params.userId,
          personalStylistId: params.personalStylistId,
          recommendedProductDetails: recommendedProductDetails
        };
      }
      return {
        statusCode: constants.STATUS_CODES[200],
        statusMessage: constants.STATUS_MESSAGE[200],
        userId: params.userId,
        personalStylistId: params.personalStylistId,
        recommendedProductDetails: recommendedProductDetails
      };
    } catch (e) {
      // logger.error(e);
      throw e;
    }
  }
}

module.exports = UserBao;
