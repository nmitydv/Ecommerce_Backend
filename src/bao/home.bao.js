const Base = require("./base");
const logger = require("../common/logger")("home-bao");
const constants = require("../common/constants");
const { ProductsDao, ClosetDao, UserDao, AdminDao } = require("../dao");
const fs = require('fs');

class HomeBao extends Base {
  constructor() {
    super();
  }
  async getAllProducts(page, limit, params) {
    try {
      console.log(params, 'inside getAllProducts')
      // logger.info("inside getAllProducts");
      delete params.page;
      delete params.limit;
      let filters = params;

      let allProducts = await ProductsDao.getAllProductData(page, limit);
      let finalData = [];
      let maxPrice = -Infinity;
      allProducts.forEach((val) => {
        let obj = {
          productId: val._id,
          productName: val.productName,
          productPrice: val.productPrice,
          productDescription: val.productDescription,
          productColor: val.productColor,
          imageUrls: val.imageUrls,
          categoryId: val.categoryId,
          categoryName: val.categoryName,
          subCategoryId: val.subCategoryId,
          subCategoryName: val.subCategoryName,
          seasons: val.seasons,
          productSizes: val.productSizes,
          productButtonLink: val.productButtonLink,
          createdOn: val.createdOn,
        };
        finalData.push(obj);
        if (val.productPrice > maxPrice) {
          maxPrice = val.productPrice;
        }
      });

      if (filters.sortBy) {
        if (filters.sortBy === "lowPrice") {
          finalData.sort((a, b) => {
            return a.productPrice - b.productPrice;
          });
        } else if (filters.sortBy === "highPrice") {
          finalData.sort((a, b) => {
            return b.productPrice - a.productPrice;
          });
        } else {
          finalData.sort((a, b) => {
            return new Date(b.createdOn) - new Date(a.createdOn);
          });
        }
      }

      if (filters.categoryIds) {
        let categories = JSON.parse(filters.categoryIds);
        console.log(categories)
        if (categories.length > 0) {
          finalData = finalData.filter((data) =>
            categories.includes(data.categoryId)
          );
        }
      }

      if (filters.subCategoryIds) {
        let subCategories = JSON.parse(filters.subCategoryIds);
        if (subCategories.length > 0) {
          finalData = finalData.filter((data) =>
            subCategories.includes(data.subCategoryId)
          );
        }
      }

      // if (filters.brandIds) {
      //   let brands = JSON.parse(filters.brandIds);
      //   if (brands.length > 0) {
      //     finalData = finalData.filter((data) => brands.includes(data.brandId));
      //   }
      // }

      if (filters.season) {
        let seasonsList = JSON.parse(filters.season);
        if (seasonsList.length > 0) {
          finalData = finalData.filter((data) =>
            data.seasons.some((season) => seasonsList.includes(season))
          );
        }
      }

      if (filters.color) {
        let colors = JSON.parse(filters.color);
        finalData = finalData.filter((data) =>
          colors.includes(data.productColor)
        );
      }

      if (filters.size) {
        let sizes = JSON.parse(filters.size);
        if (sizes.length > 0) {
          finalData = finalData.filter((data) =>
            data.productSizes.some((size) => sizes.includes(size))
          );
        }
      }

      if (filters.price) {
        let priceRange = JSON.parse(filters.price);
        if (priceRange.length === 2) {
          finalData = finalData.filter(
            (data) =>
              data.productPrice >= priceRange[0] &&
              data.productPrice <= priceRange[1]
          );
        }
      }

      return {
        statusCode: constants.STATUS_CODES[200],
        statusMessage: constants.STATUS_MESSAGE[200],
        total: finalData.length,
        minPrice: 0,
        maxPrice: 6000,
        productDetails: finalData,
      };
    } catch (e) {
      // logger.error(e);
      throw e;
    }
  }

  async getAllProductsV1(page, limit, params) {
    try {
      console.log(params, 'inside getAllProductsV1')
      // logger.info("inside getAllProductsV1");
      delete params.page;
      delete params.limit;

      let filters = params;
      let allProducts = []
      if (params.optionId && params.optionId === 3) {
        let userPrefData = await UserDao.findUserPrefrences(params.userId)
        let prefBrands = []
        let prefColors = []
        if (userPrefData.length > 0 && userPrefData[0].prefrences) {
          userPrefData[0].prefrences.map((x) => {
            if (x.options && x.options.length > 0) {
              x.options.map((opt) => {
                if (opt.brandId) {
                  prefBrands.push(opt.brandId)
                }
                if (opt.colorId) {
                  prefColors.push(opt.colorName)
                }
              })
            }
          })
        }
        prefBrands = prefBrands.filter((item, pos) => prefBrands.indexOf(item) == pos);
        prefColors = prefColors.filter((item, pos) => prefColors.indexOf(item) == pos);
        await Promise.all(prefBrands.map(async (brand) => {
          const product = await ProductsDao.getProductDetails(brand, 1)
          if (product && product.length > 0) {
            allProducts.push(product[0])
          }
        }))
        await Promise.all(prefColors.map(async (color) => {
          const product = await ProductsDao.getProductByColorName(color, 1)
          if (product && product.length > 0) {
            allProducts.push(product[0])
          }
        }))
        allProducts = removeDuplicateProduct(allProducts)
      } else if (params.optionId && params.optionId === 4) {
        let userStylistRProducts = await UserDao.getAllRecommendedProductByUserId(params.userId)
        if (userStylistRProducts.length > 0) {
          await Promise.all(userStylistRProducts.map(async (prd) => {
            const prod = await ProductsDao.findProduct(prd.productId)
            if (prod && prod.length > 0) {
              prod[0].isDisliked = prd.dislike ? prd.dislike : false
              prod[0].note = prd.note ? prd.note : ''
              allProducts.push(prod[0])
            }
          }))
        }
      } else if (params.key) {
        let productDetails = await ProductsDao.searchProductByName(params.key);
        let productDetailsByCategory = await ProductsDao.searchProductByCategoryName(params.key);
        let productDetailsBySubCategory = await ProductsDao.searchProductBySubCategoryName(params.key);
        allProducts = [...productDetails, ...productDetailsByCategory, ...productDetailsBySubCategory];
        allProducts = removeDuplicateProduct(allProducts)
      } else {
        allProducts = await ProductsDao.getAllProductData(page);
      }
      let brandList = await ClosetDao.getBrands();
      const adminBrandList = await AdminDao.getAllBrands(1, 100)
      brandList = adminBrandList.length > 0 ? [...brandList, ...adminBrandList] : brandList
      let finalData = [];
      let maxPrice = -Infinity;
      await Promise.all(allProducts.map(async (val) => {
        const colorcode = await ProductsDao.getColorCode(val.productColor)
        let brandName = 'NA'
        const brandIndex = brandList.findIndex((brand) => {
          if (brand.brandId) {
            return brand.brandId == val.brandId
          } else {
            return brand._id.equals(val.brandId)
          }
        })
        if (brandIndex > -1) {
          brandName = brandList[brandIndex].brandName ? brandList[brandIndex].brandName : brandList[brandIndex].name ? brandList[brandIndex].name : 'NA'
        }
        let closetDetails = []
        if (params.userId) {
          closetDetails = await ClosetDao.findClosetDetails({
            userId: params.userId,
            productId: val._id
          })
        }
        const closet = closetDetails.length > 0 ? closetDetails[0] : {}
        let obj = {
          _id: val._id,
          productId: val._id,
          productName: val.productName,
          brandId: val.brandId,
          brandName,
          productPrice: val.productPrice,
          productDescription: val.productDescription,
          productColor: val.productColor,
          imageUrls: val.imageUrls,
          categoryId: val.categoryId,
          categoryName: val.categoryName,
          subCategoryId: val.subCategoryId,
          subCategoryName: val.subCategoryName,
          seasons: val.seasons,
          productSizes: val.productSizes,
          productButtonLink: val.productButtonLink,
          createdOn: val.createdOn,
          productColorCode: colorcode.length > 0 ? colorcode[0].colorCode : "00000",
          addedToCloset: closet && closet.productId ? true : false,
          closetItemId: closet ? closet._id : null
        };
        if (params.optionId && params.optionId === 4) {
          obj.isDisliked = val.isDisliked ? val.isDisliked : false
          obj.note = val.note ? val.note : ''
        }
        finalData.push(obj);
        if (val.productPrice > maxPrice) {
          maxPrice = val.productPrice;
        }
      }));

      if (filters.sortBy) {
        if (filters.sortBy === "lowPrice") {
          finalData.sort((a, b) => {
            return a.productPrice - b.productPrice;
          });
        } else if (filters.sortBy === "highPrice") {
          finalData.sort((a, b) => {
            return b.productPrice - a.productPrice;
          });
        } else {
          finalData.sort((a, b) => {
            return new Date(b.createdOn) - new Date(a.createdOn);
          });
        }
      }

      if (filters.categoryIds && filters.categoryIds.length > 0) {
        finalData = finalData.filter((data) => filters.categoryIds.includes(data.categoryId));
      }

      if (filters.subCategoryIds && filters.subCategoryIds.length > 0) {
        finalData = finalData.filter((data) => filters.subCategoryIds.includes(data.subCategoryId));
      }

      if (filters.brandIds && filters.brandIds.length > 0) {
        finalData = finalData.filter((data) => {
          const brandIndex = filters.brandIds.findIndex((ind) => ind == data.brandId)
          if (brandIndex > -1) {
            return data
          }
        });
      }

      if (filters.season && filters.season.length > 0) {
        finalData = finalData.filter((data) =>
          data.seasons.some((season) => filters.season.includes(season))
        );
      }

      if (filters.color && filters.color.length > 0) {
        finalData = finalData.filter((data) =>
          filters.color.includes(data.productColor)
        );
      }

      if (filters.colorCodes && filters.colorCodes.length > 0) {
        finalData = finalData.filter((data) =>
          filters.colorCodes.includes(data.productColor)
        );
      }

      if (filters.size && filters.size.length > 0) {
        finalData = finalData.filter((data) =>
          data.productSizes.some((size) => filters.size.includes(size))
        );
      }

      if (filters.price && filters.price.length === 2) {
        if (filters.price[0] === 6000) {
          finalData = finalData.filter(
            (data) =>
              data.productPrice >= filters.price[0]
          );
        } else {
          finalData = finalData.filter(
            (data) =>
              data.productPrice >= filters.price[0] &&
              data.productPrice <= filters.price[1]
          );
        }
      }
      if (params.optionId && params.optionId === 1) {
        finalData = finalData.sort((a, b) => new Date(b.createdOn) - new Date(a.createdOn))
      }
      if (params.optionId && params.optionId === 2) {
        finalData = finalData.sort((a, b) => new Date(a.createdOn) - new Date(b.createdOn))
      }
      if (params.optionId && (params.optionId === 4 || params.optionId === 3)) {
        finalData = finalData.sort((a, b) => new Date(b.createdOn) - new Date(a.createdOn))
      }
      return {
        statusCode: constants.STATUS_CODES[200],
        statusMessage: constants.STATUS_MESSAGE[200],
        total: finalData.length,
        minPrice: 0,
        maxPrice: 6000,
        productDetails: finalData,
      };
    } catch (e) {
      throw e;
    }
  }

  async getAllProductsV2(page, limit, params) {
    try {
      console.log(params, 'inside getAllProductsV2')
      params.page = params.page ? params.page : 1
      params.limit = params.limit ? params.limit : 20

      let filters = params;
      let allProducts = []
      let allProductsCount
      let sortQuery = {};
      let filterQuery = {
        productStatus: "published"
      };

      // SORT QUERY
      if (filters.sortBy === "lowPrice") {
        sortQuery = { productPrice: 1 };
      } else if (filters.sortBy === "highPrice") {
        sortQuery = { productPrice: -1 };
      } else {
        sortQuery = { createdOn: -1 };
      }

      if (params.optionId === 1) {
        sortQuery = { createdOn: -1 };
      } else if (params.optionId === 2) {
        sortQuery = { createdOn: 1 };
      } else if (params.optionId === 3 || params.optionId === 4) {
        sortQuery = { createdOn: -1 };
      }

      // FILTER QUERY

      if (filters.categoryIds && filters.categoryIds.length > 0) {
        filterQuery.categoryId = { $in: filters.categoryIds };
      }

      if (filters.subCategoryIds && filters.subCategoryIds.length > 0) {
        filterQuery.subCategoryId = { $in: filters.subCategoryIds };
      }

      if (filters.brandIds && filters.brandIds.length > 0) {
        filterQuery.brandId = { $in: filters.brandIds };
      }

      if (filters.season && filters.season.length > 0) {
        filterQuery.seasons = { $in: filters.season };
      }

      if (filters.color && filters.color.length > 0) {
        filterQuery.productColor = { $in: filters.color };
      }

      if (filters.size && filters.size.length > 0) {
        filterQuery.productSizes = { $in: filters.size };
      }

      if (filters.gender && filters.gender.length > 0) {
        filterQuery.gender = { $in: filters.gender };
      }

      if (filters.price && filters.price.length === 2) {
        if (filters.price[0] === 6000) {
          filterQuery.productPrice = { $gte: filters.price[0] };
        } else {
          filterQuery.productPrice = {
            $gte: filters.price[0],
            $lte: filters.price[1],
          };
        }
      }

      if (params.optionId && params.optionId === 3) {
        let userPrefData = await UserDao.findUserPrefrences(params.userId)
        let prefBrands = []
        let prefColors = []
        if (userPrefData.length > 0 && userPrefData[0].prefrences) {
          userPrefData[0].prefrences.map((x) => {
            if (x.options && x.options.length > 0) {
              x.options.map((opt) => {
                if (opt.brandId) {
                  prefBrands.push(opt.brandId)
                }
                if (opt.colorId) {
                  prefColors.push(opt.colorName)
                }
              })
            }
          })
        }
        prefBrands = prefBrands.filter((item, pos) => prefBrands.indexOf(item) == pos);
        prefColors = prefColors.filter((item, pos) => prefColors.indexOf(item) == pos);

        if (prefBrands.length == 0 && prefColors.length == 0) {
          allProducts = []
          allProductsCount = 0
        } else {
          allProducts = await ProductsDao.getProductDetailsByPref(page, limit, prefBrands, prefColors, false)
          allProductsCount = await ProductsDao.getProductDetailsByPref(page, limit, prefBrands, prefColors, true)
        }
      } else if (params.optionId && params.optionId === 4) {
        let userStylistRProducts = await UserDao.getAllRecommendedProductByUserId(params.userId, page, limit, false)
        allProductsCount = await UserDao.getAllRecommendedProductByUserId(params.userId, page, limit, true)
        if (userStylistRProducts.length > 0) {
          await Promise.all(userStylistRProducts.map(async (prd) => {
            const prod = await ProductsDao.findProduct(prd.productId)
            if (prod && prod.length > 0) {
              prod[0].isDisliked = prd.dislike ? prd.dislike : false
              prod[0].note = prd.note ? prd.note : ''
              allProducts.push(prod[0])
            }
          }))
        }
      } else if (params.key) {
        allProducts = await ProductsDao.searchProductBySearchKey(page, limit, params.key, false);
        allProductsCount = await ProductsDao.searchProductBySearchKey(page, limit, params.key, true);
      } else {
        filterQuery.gender = { $in: ["female"] };
        allProducts = await ProductsDao.getAllProductDataWithFilter(page, limit, sortQuery, filterQuery, false);
        allProductsCount = await ProductsDao.getAllProductDataWithFilter(page, limit, sortQuery, filterQuery, true);
      }

      let finalData = [];
      let maxPrice = -Infinity;
      await Promise.all(allProducts.map(async (val) => {
        const colorcode = await ProductsDao.getColorCode(val.productColor)
        let closetDetails = []
        if (params.userId) {
          closetDetails = await ClosetDao.findClosetDetails({
            userId: params.userId,
            productId: val._id
          })
        }
        const closet = closetDetails.length > 0 ? closetDetails[0] : {}
        let obj = {
          _id: val._id,
          productId: val._id,
          productName: val.productName,
          brandId: val.brandId,
          brandName: val.brandName,
          productPrice: val.productPrice,
          productDescription: val.productDescription,
          productColor: val.productColor,
          imageUrls: val.imageUrls,
          categoryId: val.categoryId,
          categoryName: val.categoryName,
          subCategoryId: val.subCategoryId,
          subCategoryName: val.subCategoryName,
          seasons: val.seasons,
          productSizes: val.productSizes,
          productButtonLink: val.productButtonLink,
          createdOn: val.createdOn,
          productColorCode: colorcode.length > 0 ? colorcode[0].colorCode : "00000",
          addedToCloset: closet && closet.productId ? true : false,
          closetItemId: closet ? closet._id : null,
          gender: val.gender ? val.gender : null,
          sizeSystem: val.sizeSystem ? val.sizeSystem : null
        };
        if (params.optionId && params.optionId === 4) {
          obj.isDisliked = val.isDisliked ? val.isDisliked : false
          obj.note = val.note ? val.note : ''
        }
        finalData.push(obj);
        if (val.productPrice > maxPrice) {
          maxPrice = val.productPrice;
        }
      }));
      return {
        statusCode: constants.STATUS_CODES[200],
        statusMessage: constants.STATUS_MESSAGE[200],
        total: allProductsCount,
        totalPage: Math.ceil(allProductsCount / 20),
        minPrice: 0,
        maxPrice: 6000,
        productDetails: finalData,
      };
    } catch (e) {
      // console.log(e)
      // // logger.error(e);
      throw e;
    }
  }


  async getProductDetails(productId, userId, personalStylistId) {
    try {
      // logger.info("inside getProductDetails", productId);
      let productDetails = await ProductsDao.findProduct(productId);
      if (productDetails.length > 0) {
        let brandList = await ClosetDao.getBrands();
        let vendorDetails = []
        if (productDetails[0].vendorId) {
          vendorDetails = await AdminDao.findAdminUserId(productDetails[0].vendorId)
        }
        const adminBrandList = await AdminDao.getAllBrands(1, 100)
        brandList = adminBrandList.length > 0 ? [...brandList, ...adminBrandList] : brandList
        let brandName = 'NA'
        const brandIndex = brandList.findIndex((brand) => {
          if (brand.brandId) {
            return brand.brandId == productDetails[0].brandId
          } else {
            return brand._id.equals(productDetails[0].brandId)
          }
        })
        if (brandIndex > -1) {
          brandName = brandList[brandIndex].brandName ? brandList[brandIndex].brandName : brandList[brandIndex].name ? brandList[brandIndex].name : 'NA'
        }
        let closetDetails = []
        if (userId) {
          closetDetails = await ClosetDao.findClosetDetails({
            userId: userId,
            productId: productDetails[0]._id
          })
        }
        const colorcode = await ProductsDao.getColorCode(productDetails[0].productColor)
        const closet = closetDetails.length > 0 ? closetDetails[0] : {}
        let recommendProduct = []
        if (userId && personalStylistId) {
          recommendProduct = await UserDao.getRecommendedProductByUserIdAndStylistId(userId, personalStylistId, productId)
        } else {
          recommendProduct = await UserDao.getRecommendedProductByUserId(userId, productId)
        }

        console.log(recommendProduct)
        return {
          statusCode: constants.STATUS_CODES[200],
          statusMessage: constants.STATUS_MESSAGE[200],
          productDetails: {
            productId: productDetails[0]._id,
            productName: productDetails[0].productName,
            productPrice: productDetails[0].productPrice,
            productDescription: productDetails[0].productDescription,
            brandId: productDetails[0].brandId,
            brandName,
            productColor: productDetails[0].productColor,
            productColorCode: colorcode.length > 0 ? colorcode[0].colorCode : "00000",
            imageUrls: productDetails[0].imageUrls,
            categoryId: productDetails[0].categoryId,
            categoryName: productDetails[0].categoryName,
            subCategoryId: productDetails[0].subCategoryId,
            subCategoryName: productDetails[0].subCategoryName,
            seasons: productDetails[0].seasons,
            productSizes: productDetails[0].productSizes,
            productButtonLink: productDetails[0].productButtonLink,
            createdOn: productDetails[0].createdOn,
            addedToCloset: closet && closet.productId ? true : false,
            closetItemId: closet ? closet._id : null,
            isDisliked: recommendProduct && recommendProduct.length > 0 ? recommendProduct[0].dislike ? recommendProduct[0].dislike : false : null,
            note: recommendProduct && recommendProduct.length > 0 ? recommendProduct[0].note ? recommendProduct[0].note : '' : '',
            vendorWhatsappNumber: vendorDetails && vendorDetails.length > 0 ? vendorDetails[0].whatsappNumber ? vendorDetails[0].whatsappNumber : null : null
          },
        };
      } else {
        return {
          statusCode: constants.STATUS_CODES[302],
          statusMessage: "product id not found",
        };
      }
    } catch (e) {
      console.log(e)
      // logger.error(e);
      throw e;
    }
  }

  async getPreferences() {
    try {
      const brandData = await ClosetDao.getBrands()
      let prefDetails = await UserDao.getQuestionPref();
      let prefArr = []
      await Promise.all(prefDetails.map(async (obj) => {
        let modifiedArray = []
        if (obj.identifier && obj.identifier === 'color') {
          modifiedArray = obj.options
        } else {
          brandData.filter((brand) => {
            if (obj.identifier == 'brands') {
              modifiedArray.push({
                optionId: brand.brandId,
                brandId: brand.brandId,
                brandName: brand.brandName,
                optionName: brand.brandName
              })
            } else {
              const identifierIndex = brand.category ? brand.category.findIndex((br) => br == obj.identifier) : -1
              if (identifierIndex > -1) {
                modifiedArray.push({
                  optionId: brand.brandId,
                  brandId: brand.brandId,
                  brandName: brand.brandName,
                  optionName: brand.brandName
                })
              }
            }
          })
        }
        prefArr.push({
          questionId: obj.questionId,
          question: obj.question,
          options: modifiedArray
        })
      }))
      return prefArr.sort((a, b) => a.questionId - b.questionId);
    } catch (e) {
      // logger.error(e);
      throw e;
    }
  }

  async getHomePageData(params) {
    try {
      // logger.info("inside getHomePageData");
      let productDetails = await ProductsDao.getLatestAddedProductData(1, 10);
      let allProductDetails = await ProductsDao.getAllProductData(1, 10)
      let userPrefData = await UserDao.findUserPrefrences(params.userId)
      let prefBrands = []
      let prefColors = []
      if (userPrefData.length > 0 && userPrefData[0].prefrences) {
        userPrefData[0].prefrences.map((x) => {
          if (x.options && x.options.length > 0) {
            x.options.map((opt) => {
              if (opt.brandId) {
                prefBrands.push(opt.brandId)
              }
              if (opt.colorId) {
                prefColors.push(opt.colorName)
              }
            })
          }
        })
      }
      prefBrands = prefBrands.filter((item, pos) => prefBrands.indexOf(item) == pos);
      prefColors = prefColors.filter((item, pos) => prefColors.indexOf(item) == pos);

      let userPrefProducts = []

      await Promise.all(prefBrands.map(async (brand) => {
        // if (typeof brand === 'number')
        const product = await ProductsDao.getProductDetails(brand.toString(), 1)
        if (product && product.length > 0) {
          userPrefProducts.push(product[0])
        }
      }))

      await Promise.all(prefColors.map(async (color) => {
        const product = await ProductsDao.getProductByColorName(color, 1)
        if (product && product.length > 0) {
          userPrefProducts.push(product[0])
        }
      }))

      userPrefProducts = removeDuplicateProduct(userPrefProducts)
      userPrefProducts = userPrefProducts.slice(0, 5)
      let results = [{
        statusCode: constants.STATUS_CODES[200],
        statusMessage: constants.STATUS_MESSAGE[200],
        optionId: 1,
        optionName: 'New Arrivals',
        fromStylist: false,
        sort: 1,
        products: productDetails.map((product) => {
          return {
            productId: product._id,
            productName: product.productName,
            productImage: product.imageUrls[0],
            createdOn: product.createdOn
          }
        })
      }, {
        statusCode: constants.STATUS_CODES[200],
        statusMessage: constants.STATUS_MESSAGE[200],
        optionId: 2,
        optionName: 'All Products',
        fromStylist: false,
        sort: 2,
        products: allProductDetails.map((product) => {
          return {
            productId: product._id,
            productName: product.productName,
            productImage: product.imageUrls[0],
            createdOn: product.createdOn
          }
        })
      }]
      if (params.userId) {
        let userStylistRProducts = await UserDao.getAllRecommendedProductByUserId(params.userId)
        results.push({
          statusCode: constants.STATUS_CODES[200],
          statusMessage: constants.STATUS_MESSAGE[200],
          optionId: 3,
          optionName: 'For You',
          fromStylist: false,
          sort: 3,
          products: userPrefProducts.map((product) => {
            return {
              productId: product._id,
              productName: product.productName,
              productImage: product.imageUrls[0],
              createdOn: product.createdOn
            }
          })
        })
        let userStylistRecommendedProducts = []
        if (userStylistRProducts.length > 0) {
          await Promise.all(userStylistRProducts.map(async (product) => {
            const prod = await ProductsDao.findProduct(product.productId)
            if (prod.length > 0) {
              userStylistRecommendedProducts.push({
                productId: prod[0]._id,
                productName: prod[0].productName,
                productImage: prod[0].imageUrls[0],
                createdOn: prod[0].createdOn,
                isDisliked: product.dislike ? product.dislike : false,
                note: product.note ? product.note : ''
              })
            }
          }))
        }
        results.push({
          statusCode: constants.STATUS_CODES[200],
          statusMessage: constants.STATUS_MESSAGE[200],
          optionId: 4,
          fromStylist: true,
          sort: 0,
          optionName: 'Recommended',
          products: userStylistRecommendedProducts
        })
      }
      return results.sort((a, b) => a.sort - b.sort);
    } catch (e) {
      // logger.error(e);
      throw e;
    }
  }

  async savePreferences(prefrenceDetails) {
    try {
      console.log(prefrenceDetails)
      // logger.info("inside savePreferences");
      let userDetails = await UserDao.findUserId(prefrenceDetails.userId);
      if (userDetails.length > 0) {
        if (prefrenceDetails.prefrences.length > 0) {
          let questionList = await UserDao.getQuestionPref()
          let invalidQuestion = false
          let invalidOption = false
          let instObj = {
            userId: prefrenceDetails.userId,
            prefrences: [],
            createdOn: new Date().toISOString(),
            updatedOn: new Date().toISOString(),
          }
          await Promise.all(prefrenceDetails.prefrences.map(async (x) => {
            const questionIndex = questionList.findIndex((ques) => ques.questionId === x.questionId)
            if (questionIndex > -1) {
              let optsArr = []
              await Promise.all(x.optionIds.map(async (op) => {
                const optionIndex = questionList[questionIndex].options.findIndex((opt) => opt.optionId === op)
                if (optionIndex > -1) {
                  optsArr.push(questionList[questionIndex].options[optionIndex])
                } else {
                  let brandOpt = await AdminDao.findBrandDetails({
                    brandId: op
                  })
                  if (brandOpt && brandOpt.length > 0) {
                    optsArr.push({
                      optionId: brandOpt[0].brandId,
                      brandId: brandOpt[0].brandId,
                      brandName: brandOpt[0].brandName,
                      optionName: brandOpt[0].brandName
                    })
                  } else {
                    invalidOption = true
                  }
                }
              }))
              instObj.prefrences.push({
                questionId: x.questionId,
                question: questionList[questionIndex].question,
                options: optsArr
              })
            } else {
              invalidQuestion = true
            }
            return x;
          }))

          if (invalidQuestion) {
            return {
              statusCode: constants.STATUS_CODES[321],
              statusMessage: constants.STATUS_MESSAGE[321],
            };
          }
          if (invalidOption) {
            return {
              statusCode: constants.STATUS_CODES[322],
              statusMessage: constants.STATUS_MESSAGE[322],
            };
          }
          let result = []
          if (userDetails[0].isPreferences) {
            result = await UserDao.updateUserPref(prefrenceDetails.userId, instObj.prefrences);
            result = result[0]
          } else {
            result = await UserDao.saveUserPref(instObj);
          }
          if (result && result.userId) {
            result.statusCode = constants.STATUS_CODES[200],
              result.statusMessage = constants.STATUS_MESSAGE[200]
          }
          await UserDao.updateUserPrefProfileDetails(prefrenceDetails.userId, true)
          let sortedResult = result.prefrences.sort((a, b) => a.questionId - b.questionId)
          return [{
            _id: result._id,
            userId: result.userId,
            prefrences: sortedResult
          }]
        } else {
          return {
            statusCode: constants.STATUS_CODES[320],
            statusMessage: constants.STATUS_MESSAGE[320],
          };
        }
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

  async getSearchData(searchKey) {
    try {
      // logger.info("inside getSearchData");
      let productDetails = await ProductsDao.searchProductByName(searchKey, 1, 10);
      let productDetailsByCategory = await ProductsDao.searchProductByCategoryName(searchKey, 1, 10);
      let productDetailsBySubCategory = await ProductsDao.searchProductBySubCategoryName(searchKey, 1, 10);
      let results = [...productDetails, ...productDetailsByCategory, ...productDetailsBySubCategory];
      let modifiedArray = results.reduce((arr, product) => {
        const index = arr.findIndex((x) => x.productName === product.productName)
        if (index < 0) {
          arr.push({
            productId: product._id,
            productName: product.productName,
            categoryName: product.categoryName,
            subCategoryName: product.subCategoryName,
            productImage: product.imageUrls[0],
            createdOn: product.createdOn
          })
        }
        return arr
      }, [])
      return {
        statusCode: constants.STATUS_CODES[200],
        statusMessage: constants.STATUS_MESSAGE[200],
        total: modifiedArray.length,
        minPrice: 0,
        maxPrice: 6000,
        productDetails: modifiedArray
      }
    } catch (e) {
      // logger.error(e);
      throw e;
    }
  }

  async postEventProductData(params) {
    try {
      if (params.name === 'product-referral') {
        let productDetails = await ProductsDao.findProduct(params.metaData.productId);
        if (productDetails && productDetails.length > 0) {
          if (productDetails[0].vendorId) {
            let insertObj = {
              name: params.name,
              metaData: {
                productId: productDetails[0]._id,
                productName: productDetails[0].productName,
                productPrice: productDetails[0].productPrice,
                vendorId: productDetails[0].vendorId,
                vendorName: productDetails[0].vendorName,
                brandId: productDetails[0].brandId,
              },
              createdOn: new Date().toISOString(),
              updatedOn: new Date().toISOString(),
            }
            await ProductsDao.saveEventProductDetails(insertObj)
          }
        }
      }
      return {
        statusCode: constants.STATUS_CODES[200],
        statusMessage: constants.STATUS_MESSAGE[200],
        productId: params.productId
      }
    } catch (e) {
      // logger.error(e);
      throw e;
    }
  }

  async getVimeoVideo(params) {
    try {
      const userData = await UserDao.findUserId(params.userId)
      let modVideoData = []
      let modifiedVideoIds = []
      const videoCount = await UserDao.findVideoCount()
      let page = params.page ? params.page : 1
      let limit = params.limit ? params.limit : 10
      let videoData = []
      let viewData = []
      if (userData.length == 0) {
        const stylistData = await UserDao.findStylistById(params.userId)
        if (stylistData.length == 0) {
          return {
            statusCode: constants.STATUS_CODES[302],
            statusMessage: "user not found",
          };
        } else {
          viewData = await UserDao.getVideoViewForUser(params.userId)
          if (viewData.length > 0) {
            viewData.map((x) => {
              modifiedVideoIds.push(x.videoId)
            })
          }
          videoData = await UserDao.findVideoData(page, limit, modifiedVideoIds)
          if (videoData.length > 0) {
            await Promise.all(videoData.map(async (vd) => {
              modVideoData.push({
                _id: vd._id,
                name: vd.name,
                videoLink: vd.videoLink,
                thumbnail: vd.thumbnail,
                duration: vd.duration,
                createdOn: vd.createdOn,
                updatedOn: vd.updatedOn,
                view: vd.view
              })
            }))
          }
        }
      } else {
        viewData = await UserDao.getVideoViewForUser(params.userId)
        if (viewData.length > 0) {
          viewData.map((x) => {
            modifiedVideoIds.push(x.videoId)
          })
        }
        videoData = await UserDao.findVideoData(page, limit, modifiedVideoIds)
        if (videoData.length > 0) {
          await Promise.all(videoData.map(async (vd) => {
            modVideoData.push({
              _id: vd._id,
              name: vd.name,
              videoLink: vd.videoLink,
              thumbnail: vd.thumbnail,
              duration: vd.duration,
              createdOn: vd.createdOn,
              updatedOn: vd.updatedOn,
              view: vd.view
            })
          }))
        }
      }
      return {
        statusCode: constants.STATUS_CODES[200],
        statusMessage: constants.STATUS_MESSAGE[200],
        totalCount: videoCount,
        // videoData: modVideoData.sort((a, b) => b.createdOn - a.createdOn)
        videoData: modVideoData
      }
    } catch (e) {
      // logger.error(e);
      throw e;
    }
  }

  async postVideoView(params) {
    try {
      const userData = await UserDao.findUserId(params.userId)
      let videoData = []
      if (userData.length == 0) {
        const stylistData = await UserDao.findStylistById(params.userId)
        if (stylistData == 0) {
          return {
            statusCode: constants.STATUS_CODES[302],
            statusMessage: "user not found",
          };
        } else {
          let insertObj = {
            userId: params.userId,
            videoId: params.videoId,
            createdOn: new Date().toISOString(),
            updatedOn: new Date().toISOString(),
          };
          videoData = await UserDao.addViewToVideo(insertObj)
        }
      } else {
        let insertObj = {
          userId: params.userId,
          videoId: params.videoId,
          createdOn: new Date().toISOString(),
          updatedOn: new Date().toISOString(),
        };
        videoData = await UserDao.addViewToVideo(insertObj)
      }
      return {
        statusCode: constants.STATUS_CODES[200],
        statusMessage: constants.STATUS_MESSAGE[200],
        videoData: params.videoId
      }
    } catch (e) {
      // logger.error(e);
      throw e;
    }
  }

}
function removeDuplicates(arr) {
  var result = arr.reduce((unique, o) => {
    if (!unique.some(obj => obj.brandId === o.brandId)) {
      unique.push(o);
    }
    return unique;
  }, []);
  return result
}

function removeDuplicateProduct(arr) {
  var result = arr.reduce((unique, o) => {
    if (!unique.some(obj => obj._id.equals(o._id))) {
      unique.push(o);
    }
    return unique;
  }, []);
  return result
}


module.exports = HomeBao;
