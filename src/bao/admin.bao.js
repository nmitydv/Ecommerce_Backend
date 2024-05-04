const Base = require("./base");
const { v4: uuidv4 } = require("uuid");
const logger = require("../common/logger")("admin-bao");
const constants = require("../common/constants");
const nodemailer = require("nodemailer");
const moment = require("moment-timezone");
const { CryptoService } = require("../services");
const path = require("path");
const ejs = require('ejs');
const {
  AdminDao,
  UserDao,
  ClosetDao,
  OutfitDao,
  ProductsDao,
  StylistDao,
  StoreAssociateDao,
} = require("../dao");

class AdminBao extends Base {
  constructor() {
    super();
  }

  async adminLogin(emailId, password) {
    try {
      // logger.info("inside adminLogin", emailId);
      const emailRegex =
        /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      const isValidEmail = emailRegex.test(emailId);
      if (!isValidEmail) {
        return {
          statusCode: constants.STATUS_CODES[314],
          statusMessage: constants.STATUS_MESSAGE[314],
        };
      }

      let findEmailId = await AdminDao.findEmailId({ emailId: emailId });
      if (findEmailId.length > 0) {
        let decryptedPassword = await CryptoService.decryptKey(
          findEmailId[0].saltKey,
          findEmailId[0].saltKeyIv,
          findEmailId[0].encryptedData
        );

        if (password === decryptedPassword) {
          const utcNow = moment.utc();
          let updateObj = {
            lastActive: utcNow,
            updatedOn: new Date().toISOString(),
            isActive: true
          };
          await AdminDao.updateAdminProfile(emailId, updateObj)
          return {
            statusCode: constants.STATUS_CODES[200],
            statusMessage: constants.STATUS_MESSAGE[200],
            emailId: findEmailId[0].emailId,
            userId: findEmailId[0]._id,
            role: findEmailId[0].role,
            whatsappNumber: findEmailId[0].whatsappNumber ? findEmailId[0].whatsappNumber : 'NA',
            createdOn: findEmailId[0].createdOn,
            updatedOn: findEmailId[0].updatedOn,
          };
        } else {
          return {
            statusCode: constants.STATUS_CODES[315],
            statusMessage: constants.STATUS_MESSAGE[315],
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

  async forgetPassword(emailId) {
    try {
      // logger.info("inside forgetPassword", emailId);
      const emailRegex =
        /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      const isValidEmail = emailRegex.test(emailId);
      if (!isValidEmail) {
        return {
          statusCode: constants.STATUS_CODES[314],
          statusMessage: constants.STATUS_MESSAGE[314],
        };
      }

      let findEmailId = await AdminDao.findEmailId({ emailId: emailId, isActive: true });
      if (findEmailId.length > 0) {
        const characters =
          "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        let randomPassword = "";
        for (let i = 0; i < 7; i++) {
          randomPassword += characters.charAt(
            Math.floor(Math.random() * characters.length)
          );
        }

        let transporter = nodemailer.createTransport({
          host: "smtp.gmail.com",
          port: 587,
          secure: false,
          auth: {
            user: process.env.EMAIL_ID,
            pass: process.env.EMAIL_PASSWORD,
          },
        });
        let mailOptions = {
          from: process.env.EMAIL_ID,
          to: emailId,
          subject: "Your password was reset",
          text: `Hi there, We wanted to let you know that your admin account password was reset. Please find the generated password ${randomPassword} for login into your admin account.`,
        };
        transporter.sendMail(mailOptions, function (error, info) {
          if (error) {
            logger.error(error);
          } else {
            // logger.info("Mail sent successfully!");
          }
        });

        let passkeyDetail = await CryptoService.encryptKey(randomPassword);
        await AdminDao.updatePasswordDetails(emailId, passkeyDetail);
        return {
          statusCode: constants.STATUS_CODES[200],
          statusMessage: "Mail sent successfully!",
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

  async changePassword(emailId, currentPassword, newPassword) {
    try {
      // logger.info("inside changePassword", emailId);
      const emailRegex =
        /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      const isValidEmail = emailRegex.test(emailId);
      if (!isValidEmail) {
        return {
          statusCode: constants.STATUS_CODES[314],
          statusMessage: constants.STATUS_MESSAGE[314],
        };
      }

      let findEmailId = await AdminDao.findEmailId({ emailId: emailId, isActive: true });
      if (findEmailId.length > 0) {
        if (currentPassword === newPassword) {
          return {
            statusCode: constants.STATUS_CODES[317],
            statusMessage: constants.STATUS_MESSAGE[317],
          };
        }
        let decryptedPassword = await CryptoService.decryptKey(
          findEmailId[0].saltKey,
          findEmailId[0].saltKeyIv,
          findEmailId[0].encryptedData
        );

        if (currentPassword === decryptedPassword) {
          let passkeyDetail = await CryptoService.encryptKey(newPassword);
          await AdminDao.updatePasswordDetails(emailId, passkeyDetail);

          return {
            statusCode: constants.STATUS_CODES[200],
            statusMessage: "password successfully changed",
            emailId: findEmailId[0].emailId,
            userId: findEmailId[0]._id,
            role: findEmailId[0].role,
            createdOn: findEmailId[0].createdOn,
            updatedOn: findEmailId[0].updatedOn,
          };
        } else {
          return {
            statusCode: constants.STATUS_CODES[316],
            statusMessage: constants.STATUS_MESSAGE[316],
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

  async adminStats(emailId) {
    try {
      // logger.info("inside adminStats", emailId);
      const emailRegex =
        /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      const isValidEmail = emailRegex.test(emailId);
      if (!isValidEmail) {
        return {
          statusCode: constants.STATUS_CODES[314],
          statusMessage: constants.STATUS_MESSAGE[314],
        };
      }

      let findEmailId = await AdminDao.findEmailId({ emailId: emailId, isActive: true });
      if (findEmailId.length > 0) {
        if (findEmailId[0].role === "admin") {
          let appUserStats = await UserDao.getUserCount();
          let brandUserCount = await AdminDao.getBrandUserCount();
          let personalStylistCount = await StylistDao.getStylistCount();

          return {
            statusCode: constants.STATUS_CODES[200],
            statusMessage: constants.STATUS_MESSAGE[200],
            appUserCount: appUserStats.totalCount,
            appMaleUserCount: appUserStats.maleCount,
            appFemaleUserCount: appUserStats.femaleCount,
            brandUserCount,
            personalStylistCount,
          };
        } else if (findEmailId[0].role === "brand") {
          let storeAssociateCount = await StoreAssociateDao.getStoreAssociateCount(emailId);
          let appUserCount = await UserDao.getVendorUserCount(findEmailId[0]._id)
          return {
            statusCode: constants.STATUS_CODES[200],
            statusMessage: constants.STATUS_MESSAGE[200],
            storeAssociateCount,
            appUserCount
          }        
        } else {
          return {
            statusCode: constants.STATUS_CODES[318],
            statusMessage: constants.STATUS_MESSAGE[318],
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

  async getAllUsers(emailId, page, limit) {
    try {
      // logger.info("inside getAllUsers", emailId);
      const emailRegex =
        /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      const isValidEmail = emailRegex.test(emailId);
      if (!isValidEmail) {
        return {
          statusCode: constants.STATUS_CODES[314],
          statusMessage: constants.STATUS_MESSAGE[314],
        };
      }

      let findEmailId = await AdminDao.findEmailId({ emailId: emailId, isActive: true });
      if (findEmailId.length > 0) {
        if (findEmailId[0].role === "admin") {
          let usersList = await UserDao.getAllUsers(page, limit);
          const filteredUsers = await Promise.all(
            usersList.map(async (user) => {
              const closetItemsCountByCategory =
                await ClosetDao.getClosetItemsCount(user.userId);

              return {
                userId: user.userId,
                emailId: user.emailId,
                name: user?.name,
                gender: user?.gender,
                profilePicUrl: user?.profilePicUrl,
                isProfileCreated: user.isProfileCreated,
                isPreferences: user.isPreferences,
                lastActive: await this.calculateActiveStatus(user.lastActive),
                totalClosetItems: closetItemsCountByCategory.count,
                categoryStats: closetItemsCountByCategory.categoryStats,
                brandStats: closetItemsCountByCategory.brandStats,
                seasonStats: closetItemsCountByCategory.seasonStats,
                colorStats: closetItemsCountByCategory.colorStats,
                totalProductValue: closetItemsCountByCategory.totalProductValue,
                totalOutfits: await OutfitDao.getOutfitCount(user.userId),
                createdOn: user.createdOn,
                updatedOn: user.updatedOn,
              };
            })
          );
          return { total: filteredUsers.length, userData: filteredUsers };
        } else if (findEmailId[0].role === "brand") {
          let usersList = await UserDao.getAllVendorUsers(findEmailId[0]._id, page, limit);
          const filteredUsers = await Promise.all(
            usersList.map(async (user) => {
              const closetItemsCountByCategory =
                await ClosetDao.getClosetItemsCount(user.userId);

              return {
                userId: user.userId,
                emailId: user.emailId,
                name: user?.name,
                gender: user?.gender,
                profilePicUrl: user?.profilePicUrl,
                isProfileCreated: user.isProfileCreated,
                isPreferences: user.isPreferences,
                lastActive: await this.calculateActiveStatus(user.lastActive),
                totalClosetItems: closetItemsCountByCategory.count,
                categoryStats: closetItemsCountByCategory.categoryStats,
                brandStats: closetItemsCountByCategory.brandStats,
                seasonStats: closetItemsCountByCategory.seasonStats,
                colorStats: closetItemsCountByCategory.colorStats,
                totalProductValue: closetItemsCountByCategory.totalProductValue,
                totalOutfits: await OutfitDao.getOutfitCount(user.userId),
                createdOn: user.createdOn,
                updatedOn: user.updatedOn,
              };
            })
          );
          return { total: filteredUsers.length, userData: filteredUsers };
        }else {
          return {
            statusCode: constants.STATUS_CODES[318],
            statusMessage: constants.STATUS_MESSAGE[318],
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

  async addBrandUser(adminEmailId, brandEmailId, brandName, whatsappNumber) {
    try {
      // logger.info("inside addBrandUser", adminEmailId);
      const emailRegex =
        /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      const isAdminValidEmail = emailRegex.test(adminEmailId);
      const isBrandValidEmail = emailRegex.test(brandEmailId);
      if (!isAdminValidEmail) {
        return {
          statusCode: constants.STATUS_CODES[314],
          statusMessage: constants.STATUS_MESSAGE[314],
        };
      }
      if (!isBrandValidEmail) {
        return {
          statusCode: constants.STATUS_CODES[314],
          statusMessage: constants.STATUS_MESSAGE[314],
        };
      }

      let findAdminEmailId = await AdminDao.findEmailId({ emailId: adminEmailId, isActive: true });
      let findBrandEmailId = await AdminDao.findEmailId({ emailId: brandEmailId });
      if (findAdminEmailId.length > 0) {
        if (findAdminEmailId[0].role === "admin") {
          if (findBrandEmailId.length > 0) {
            return {
              statusCode: constants.STATUS_CODES[319],
              statusMessage: constants.STATUS_MESSAGE[319],
            };
          } else {
            const characters =
              "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
            let randomPassword = "";
            for (let i = 0; i < 7; i++) {
              randomPassword += characters.charAt(
                Math.floor(Math.random() * characters.length)
              );
            }
            let transporter = nodemailer.createTransport({
              host: "smtp.gmail.com",
              port: 587,
              secure: false,
              auth: {
                user: process.env.EMAIL_ID,
                pass: process.env.EMAIL_PASSWORD,
              },
            });
            const templateData = {
              username: brandEmailId,
              password: randomPassword
            };
            const html = await ejs.renderFile(path.join(__dirname + "/email.ejs"), templateData);
            let mailOptions = {
              from: process.env.EMAIL_ID,
              to: brandEmailId,
              html: html
              // subject:
              //   "Invitation to Access the Admin Panel - Login credentials enclosed",
              // text: ` Hello - ${brandEmailId},

              // Welcome to Vêtir, your global personal shopping and styling tool! 
              // We are excited to invite you to access the Vêtir administration panel where you will be able to manage your product feeds, individual client data, and sales data. 
              // Your personal account details are accessible via the log-in credentials noted below:

              // Username: ${brandEmailId}
              // Password: ${randomPassword}

              // Please visit the Vêtir administration panel at https://vetir-admin.netlify.app/ to log in and begin managing your account.
              // We recommend you change your personal password for added security upon initial log-in.
              // If you have any trouble logging in or navigating through the administration panel, please reach out to contact@bond-nyc.com  by email or +19179133131 on WhatsApp.

              // Thank you for becoming a part of the Vêtir experience!`,
            };
            transporter.sendMail(mailOptions, function (error, info) {
              if (error) {
                logger.error(error);
              } else {
                // logger.info("Mail sent successfully!");
              }
            });

            let passkeyDetail = await CryptoService.encryptKey(randomPassword);

            let insertObj = {
              emailId: brandEmailId,
              name: brandName,
              saltKey: passkeyDetail.saltKey,
              saltKeyIv: passkeyDetail.saltKeyIv,
              encryptedData: passkeyDetail.encryptedData,
              isActive: false,
              role: "brand",
              whatsappNumber: whatsappNumber,
              createdOn: new Date().toISOString(),
              updatedOn: new Date().toISOString(),
            };

            let userData = await AdminDao.saveUserDetails(insertObj);

            return {
              statusCode: constants.STATUS_CODES[200],
              statusMessage: "Invitation Mail Sent successfully!",
              userId: userData._id,
              emailId: userData.emailId,
              brandName: userData.name,
              isActive: userData.isActive,
              role: userData.role,
              whatsappNumber: whatsappNumber,
              createdOn: userData.createdOn,
              updatedOn: userData.updatedOn,
            };
          }
        } else {
          return {
            statusCode: constants.STATUS_CODES[318],
            statusMessage: constants.STATUS_MESSAGE[318],
          };
        }
      } else {
        return {
          statusCode: constants.STATUS_CODES[302],
          statusMessage: "admin user not found",
        };
      }
    } catch (e) {
      console.log(e)
      // logger.error(e);
      throw e;
    }
  }

  async addStoreAssociate(vendorEmailId, storeAssociateEmailId, name, whatsappNumber) {
    try {
      const emailRegex =
        /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      const isVendorValidEmail = emailRegex.test(vendorEmailId);
      const isStoreAssociateValidEmail = emailRegex.test(storeAssociateEmailId);
      if (!isVendorValidEmail) {
        return {
          statusCode: constants.STATUS_CODES[314],
          statusMessage: constants.STATUS_MESSAGE[314],
        };
      }
      if (!isStoreAssociateValidEmail) {
        return {
          statusCode: constants.STATUS_CODES[314],
          statusMessage: constants.STATUS_MESSAGE[314],
        };
      }

      let findVendorEmailId = await AdminDao.findEmailId({ emailId: vendorEmailId, isActive: true });
      let findStoreAssociateEmailId = await StoreAssociateDao.findEmailId({ emailId: storeAssociateEmailId });
      if (findVendorEmailId.length > 0) {
        if (findVendorEmailId[0].role === "brand") {
          if (findStoreAssociateEmailId.length > 0) {
            return {
              statusCode: constants.STATUS_CODES[323],
              statusMessage: constants.STATUS_MESSAGE[323],
            };
          } else {
            let transporter = nodemailer.createTransport({
              host: "smtp.gmail.com",
              port: 587,
              secure: false,
              auth: {
                user: process.env.EMAIL_ID,
                pass: process.env.EMAIL_PASSWORD,
              },
            });
            const templateData = {
              username: storeAssociateEmailId,
            };
            const html = await ejs.renderFile(path.join(__dirname + "/email.storeassociate.ejs"), templateData);
            let mailOptions = {
              from: process.env.EMAIL_ID,
              to: storeAssociateEmailId,
              html: html
            };
            transporter.sendMail(mailOptions, function (error, info) {
              if (error) {
                logger.error(error);
              } else {
                // logger.info("Mail sent successfully!");
              }
            });

            let insertObj = {
              emailId: storeAssociateEmailId,
              name: name,
              isActive: false,
              whatsappNumber: whatsappNumber,
              isProfileCreated: false,
              vendorId: findVendorEmailId[0]._id,
              vendorEmailId: vendorEmailId,
            };

            let userData = await StoreAssociateDao.saveStoreAssociateDetails(insertObj);

            return {
              statusCode: constants.STATUS_CODES[200],
              statusMessage: "Invitation Mail Sent successfully!",
              userId: userData._id,
              emailId: userData.emailId,
              name: userData.name,
              isActive: userData.isActive,
              whatsappNumber: whatsappNumber,
              vendorId: findVendorEmailId[0]._id,
              vendorEmailId: vendorEmailId,
            };
          }
        } else {
          return {
            statusCode: constants.STATUS_CODES[318],
            statusMessage: constants.STATUS_MESSAGE[318],
          };
        }
      } else {
        return {
          statusCode: constants.STATUS_CODES[302],
          statusMessage: "admin user not found",
        };
      }
    } catch (e) {
      console.log(e)
      // logger.error(e);
      throw e;
    }
  }

  async getAllBrands(emailId, page, limit) {
    try {
      // logger.info("inside getAllBrands", emailId);
      const emailRegex =
        /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      const isValidEmail = emailRegex.test(emailId);
      if (!isValidEmail) {
        return {
          statusCode: constants.STATUS_CODES[314],
          statusMessage: constants.STATUS_MESSAGE[314],
        };
      }

      let findEmailId = await AdminDao.findEmailId({ emailId: emailId, isActive: true });
      if (findEmailId.length > 0) {
        if (findEmailId[0].role === "admin") {
          let brandsList = await AdminDao.getAllBrands(page, limit);
          let transformedBrandsList = brandsList.map(async (brand) => {
            let productCount = await ProductsDao.getBrandProductsCount(
              brand._id.toString()
            );
            return {
              brandId: brand._id,
              emailId: brand.emailId,
              brandName: brand.name,
              isActive: brand.isActive,
              role: brand.role,
              whatsappNumber: brand.whatsappNumber ? brand.whatsappNumber : 'NA',
              lastActive: await this.calculateActiveStatus(brand.lastActive),
              productCount: productCount,
              createdOn: brand.createdOn,
              updatedOn: brand.updatedOn,
            };
          });
          return {
            total: (await Promise.all(transformedBrandsList)).length,
            brandsList: await Promise.all(transformedBrandsList),
          };
        } else {
          return {
            statusCode: constants.STATUS_CODES[318],
            statusMessage: constants.STATUS_MESSAGE[318],
          };
        }
      } else {
        return {
          statusCode: constants.STATUS_CODES[302],
          statusMessage: "admin user not found",
        };
      }
    } catch (e) {
      // logger.error(e);
      throw e;
    }
  }

  async getAllStylist(adminUserId, page, limit) {
    try {
      let findAdminDetails = await AdminDao.findAdminUserId(adminUserId);
        if (findAdminDetails.length > 0) {
          
          const stylists = await StylistDao.getAllStylists(page, limit);
          const stylistDetails = stylists.map(stylist => (
            {
              stylistId: stylist._id,
              emailId: stylist.emailId,
              name: stylist.name,
              isActive: stylist.isActive,
              gender: stylist.gender, 
              isProfileCreated: stylist.isProfileCreated ,
            }
          ));
          const res = {
            statusCode: constants.STATUS_CODES[200],
            statusMessage: constants.STATUS_MESSAGE[200],
            stylists: stylistDetails,
            total: stylistDetails.length,
          };

          return res;
        } else {
          return {
            statusCode: constants.STATUS_CODES[302],
            statusMessage: "Admin user not found",
          };
        }

    } catch (e) {
      throw e;
    }
  }

  async getAllStoreAssociates(vendorId, page, limit) {
    try {
      let findVendorDetails = await AdminDao.findEmailId({_id: vendorId, role: "brand"});
        if (findVendorDetails.length > 0) {
          
          const storeAssociates = await StoreAssociateDao.getAllStoreAssociates(vendorId, page, limit);
          const storeAssociateDetails = storeAssociates.map(associate => (
            {
              storeAssociateId: associate._id,
              emailId: associate.emailId,
              name: associate.name,
              isActive: associate.isActive,
              gender: associate.gender, 
              isProfileCreated: associate.isProfileCreated ,
            }
          ));
          const res = {
            statusCode: constants.STATUS_CODES[200],
            statusMessage: constants.STATUS_MESSAGE[200],
            storeAssociates: storeAssociateDetails,
            total: storeAssociateDetails.length,
          };

          return res;
        } else {
          return {
            statusCode: constants.STATUS_CODES[302],
            statusMessage: "Vendor not found",
          };
        }

    } catch (e) {
      throw e;
    }
  }

  async getStylistDetails(adminUserId, personalStylistId) {
    try {
      let findAdminDetails = await AdminDao.findAdminUserId(adminUserId);
      if (findAdminDetails.length > 0) {
        const stylistDetails = await StylistDao.findStylistId(personalStylistId);

        if (stylistDetails) {
          
          const recommendedProducts = await StylistDao.getStylistRecommenededProducts(personalStylistId);
          const users = await UserDao.findStylistClient(personalStylistId);
          const recommendedProductDetails = [];
          const uniqueRecommendedProductIds = new Set();

          await Promise.all(
            recommendedProducts.map(async (product) => {
              const productId = product.productId;
              if(!uniqueRecommendedProductIds.has(productId)){
                uniqueRecommendedProductIds.add(productId);
                const productDetails = await ProductsDao.findOneProduct(productId);
                if (productDetails) {
                  recommendedProductDetails.push({
                    productId: productDetails._id,
                    productName: productDetails.productName,
                    productPrice: productDetails.productPrice,
                    productDescription: productDetails.productDescription,
                    productColor: productDetails.productColor,
                    imageUrls: productDetails.imageUrls,
                  });
                }
              }
            })
          );

          const userDetails = [];
          users.forEach((user) => {
            userDetails.push({
              userId: user.userId,
              emailId: user.emailId,
              name: user.name,
              gender: user.gender,
              profilePicUrl: user.profilePicUrl,
              isProfileCreated: user.isProfileCreated,
              isPreferences: user.isPreferences,
              lastActive: user.lastActive,
              createdOn: user.createdOn,
              updatedOn: user.updatedOn,
            });
          });

          const res = {
            statusCode: constants.STATUS_CODES[200],
            statusMessage: constants.STATUS_MESSAGE[200],
            stylistDetails: {
              emailId: stylistDetails.emailId,
              name: stylistDetails.name,
              gender: stylistDetails.gender,
              profilePicUrl: stylistDetails.profilePicUrl,
              isProfileCreated: stylistDetails.isProfileCreated,
              isActive: stylistDetails.isActive,
              createdOn: stylistDetails.createdOn,
              updatedOn: stylistDetails.updatedOn,
            },
            users: userDetails,
            totalUsers: users.length ?? 0,
            recommendedProductDetails: recommendedProductDetails,
            totalRecommendedproducts: recommendedProducts.length ?? 0,
            uniqueRecommendedProducts: uniqueRecommendedProductIds.size ?? 0,
          };

          return res;
        } else {
          return {
            statusCode: constants.STATUS_CODES[302],
            statusMessage: "Personal stylist not found",
          };
        }
      } else {
        return {
          statusCode: constants.STATUS_CODES[302],
          statusMessage: "Admin user not found",
        };
      }
    } catch (e) {
      // Handle errors
      throw e;
    }
  }
  
  async deleteUserAccounts(adminUserId, userIds) {
    try {
      // logger.info("inside deleteUserAccounts", adminUserId);
      let findAdminDetails = await AdminDao.findAdminUserId(adminUserId);
      if (findAdminDetails.length > 0) {
        let whereObj = { userId: { $in: userIds } };
        await UserDao.deleteUserAccount(whereObj);
        await ClosetDao.deleteClosetItems(whereObj);
        return {
          statusCode: constants.STATUS_CODES[200],
          statusMessage: "User accounts deleted successfully",
        };
      } else {
        return {
          statusCode: constants.STATUS_CODES[302],
          statusMessage: "admin user not found",
        };
      }
    } catch (e) {
      // logger.error(e);
      throw e;
    }
  }

  async getUserDetails(adminUserId, userId) {
    try {
      // logger.info("inside getUserDetails", adminUserId);
      let findAdminDetails = await AdminDao.findAdminUserId(adminUserId);
      if (findAdminDetails.length > 0) {
        let userDetails = await UserDao.findUserId(userId);
        let res;
        if (userDetails.length > 0) {
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
            isProfileCreated: userDetails[0].isProfileCreated,
            isPreferences: userDetails[0].isPreferences,
            lastActive: await this.calculateActiveStatus(
              userDetails[0].lastActive
            ),
            totalClosetItems: closetItemsCountByCategory.count,
            categoryStats: closetItemsCountByCategory.categoryStats,
            brandStats: closetItemsCountByCategory.brandStats,
            seasonStats: closetItemsCountByCategory.seasonStats,
            colorStats: closetItemsCountByCategory.colorStats,
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
        } else {
          res = {
            statusCode: constants.STATUS_CODES[302],
            statusMessage: constants.STATUS_MESSAGE[302],
          };
        }
        return res;
      } else {
        return {
          statusCode: constants.STATUS_CODES[302],
          statusMessage: "admin user not found",
        };
      }
    } catch (e) {
      // logger.error(e);
      throw e;
    }
  }

  async addNewUser(adminUserId, name, emailId, gender) {
    try {
      // logger.info("inside addNewUser", adminUserId);
      let findAdminDetails = await AdminDao.findAdminUserId(adminUserId);
      if (findAdminDetails.length > 0) {
        const emailRegex =
          /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        const isValidEmail = emailRegex.test(emailId);
        if (!isValidEmail) {
          return {
            statusCode: constants.STATUS_CODES[314],
            statusMessage: constants.STATUS_MESSAGE[314],
          };
        }
        let findEmailId = await UserDao.findUserEmailId(emailId);
        if (findEmailId.length > 0) {
          return {
            statusCode: constants.STATUS_CODES[301],
            statusMessage: constants.STATUS_MESSAGE[301],
          };
        }
        let userId = -1;
        let isProfileCreated = false;
        let isPreferences = false;
        do {
          userId = await this.generateUserId();
        } while (userId == null);
        let insertObj = {
          userId,
          emailId,
          name,
          gender,
          isProfileCreated,
          isPreferences,
          adminUserId,
          createdOn: new Date().toISOString(),
          updatedOn: new Date().toISOString(),
        };
        await UserDao.saveUserDetails(insertObj);
        return {
          statusCode: constants.STATUS_CODES[200],
          statusMessage: constants.STATUS_MESSAGE[200],
          userId,
          emailId,
          name,
          gender,
          isProfileCreated,
          isPreferences,
          adminUserId,
          createdOn: new Date().toISOString(),
          updatedOn: new Date().toISOString(),
        };
      } else {
        return {
          statusCode: constants.STATUS_CODES[302],
          statusMessage: "admin user not found",
        };
      }
    } catch (e) {
      // logger.error(e);
      throw e;
    }
  }

  async removeUserClosetItem(adminUserId, userId, closetId) {
    try {
      // logger.info("inside removeUserClosetItem", adminUserId);
      let findAdminDetails = await AdminDao.findAdminUserId(adminUserId);
      if (findAdminDetails.length > 0) {
        let userDetails = await UserDao.findUserId(userId);
        if (userDetails.length > 0) {
          let closetDetails = await ClosetDao.findClosetId(closetId);
          if (closetDetails.length > 0) {
            let whereObj = {
              userId,
              _id: closetId,
            };
            await ClosetDao.deleteClosetItem(whereObj);
            await OutfitDao.removeClosetItems(whereObj);
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
        } else {
          return {
            statusCode: constants.STATUS_CODES[302],
            statusMessage: constants.STATUS_MESSAGE[302],
          };
        }
      } else {
        return {
          statusCode: constants.STATUS_CODES[302],
          statusMessage: "admin user not found",
        };
      }
    } catch (e) {
      // logger.error(e);
      throw e;
    }
  }

  async removeUserOutfitItem(adminUserId, userId, outfitId) {
    try {
      // logger.info("inside removeUserOutfitItem", adminUserId);
      let findAdminDetails = await AdminDao.findAdminUserId(adminUserId);
      if (findAdminDetails.length > 0) {
        let userDetails = await UserDao.findUserId(userId);
        if (userDetails.length > 0) {
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
        } else {
          return {
            statusCode: constants.STATUS_CODES[302],
            statusMessage: constants.STATUS_MESSAGE[302],
          };
        }
      } else {
        return {
          statusCode: constants.STATUS_CODES[302],
          statusMessage: "admin user not found",
        };
      }
    } catch (e) {
      // logger.error(e);
      throw e;
    }
  }

  async deleteBrandAccounts(adminUserId, brandIds) {
    try {
      // logger.info("inside deleteBrandAccounts", adminUserId);
      let findAdminDetails = await AdminDao.findAdminUserId(adminUserId);
      if (findAdminDetails.length > 0) {
        let whereObj = {
          _id: { $in: brandIds },
          role: "brand",
        };
        await AdminDao.deleteBrandAccount(whereObj);
        await ProductsDao.deleteProductData({ brandId: { $in: brandIds } });
        return {
          statusCode: constants.STATUS_CODES[200],
          statusMessage: "Brand account deleted successfully",
        };
      } else {
        return {
          statusCode: constants.STATUS_CODES[302],
          statusMessage: "admin user not found",
        };
      }
    } catch (e) {
      // logger.error(e);
      throw e;
    }
  }

  async deleteStoreAssociateAccounts(vendorId, storeAssociateIds) {
    try {
      let findvendorDetails = await AdminDao.findEmailId({_id: vendorId, role: "brand"});
      if (findvendorDetails.length > 0) {
        let whereObj = {
          _id: { $in: storeAssociateIds },
          vendorId
        };
        await StoreAssociateDao.deleteStoreAssociateAccounts(whereObj);
        return {
          statusCode: constants.STATUS_CODES[200],
          statusMessage: "Store associate account deleted successfully",
        };
      } else {
        return {
          statusCode: constants.STATUS_CODES[302],
          statusMessage: "Vendor not found",
        };
      }
    } catch (e) {
      // logger.error(e);
      throw e;
    }
  } 

  async addProduct(data) {
    try {
      // logger.info("inside addProduct", data.brandId);
      let findBrandUserId = await AdminDao.findBrandUserId({
        _id: data.brandId,
        isActive: true,
        role: ["brand", "admin"],
      }, true); // passing true since we are matching an array

      let brandDetails
      if (data.staticBrandId) {
        brandDetails = await AdminDao.findBrandDetails({
          brandId: data.staticBrandId
        })
      }
      if (findBrandUserId.length > 0) {
        let insertObj = {
          brandId: data.staticBrandId,
          vendorId: data.brandId,
          vendorName: findBrandUserId[0].name,
          brandName: brandDetails && brandDetails.length > 0 ? brandDetails[0].brandName : null,
          productName: data.productName,
          productPrice: data.productPrice,
          productDescription: data.productDescription,
          productColor: data.productColor,
          imageUrls: data.imageUrls,
          categoryId: data.categoryId,
          categoryName: data.categoryName,
          subCategoryId: data.subCategoryId,
          subCategoryName: data.subCategoryName,
          seasons: data.seasons,
          productSizes: data.productSizes,
          productButtonLink: data.productButtonLink,
          productStatus: "Not published",
          createdOn: new Date().toISOString(),
          updatedOn: new Date().toISOString(),
        };
        let response = await ProductsDao.saveProductDetails(insertObj);
        return {
          statusCode: constants.STATUS_CODES[200],
          statusMessage: "Product added successfully",
          productDetails: {
            productId: response._id,
            productName: response.productName,
            productPrice: response.productPrice,
            productDescription: response.productDescription,
            productColor: response.productColor,
            imageUrls: response.imageUrls,
            categoryId: response.categoryId,
            categoryName: response.categoryName,
            subCategoryId: response.subCategoryId,
            subCategoryName: response.subCategoryName,
            seasons: response.seasons,
            productSizes: response.productSizes,
            productButtonLink: response.productButtonLink,
            productStatus: response.productStatus,
            createdOn: response.createdOn,
            updatedOn: response.updatedOn,
          },
        };
      } else {
        return {
          statusCode: constants.STATUS_CODES[302],
          statusMessage: "brand id not found",
        };
      }
    } catch (e) {
      // logger.error(e);
      throw e;
    }
  }

  async getBrandProducts(brandId) {
    try {
      // logger.info("inside getBrandProducts", brandId);
      let findBrandUserId = await AdminDao.findBrandUserId({
        _id: brandId,
        role: ["brand", "admin"],
      }, true); // passing true since we are matching an array

      if (findBrandUserId.length > 0) {
        let productsList = await ProductsDao.getVendorProductDetails(brandId);
        return {
          statusCode: constants.STATUS_CODES[200],
          statusMessage: constants.STATUS_MESSAGE[200],
          brandId,
          emailId: findBrandUserId[0].emailId,
          brandName: findBrandUserId[0].name,
          isActive: findBrandUserId[0].isActive,
          role: findBrandUserId[0].role,
          lastActive: await this.calculateActiveStatus(findBrandUserId[0].lastActive),
          productCount: productsList.length,
          productsList,
        };
      } else {
        return {
          statusCode: constants.STATUS_CODES[302],
          statusMessage: "brand id not found",
        };
      }
    } catch (e) {
      // logger.error(e);
      throw e;
    }
  }

  async getAllProducts(adminUserId, page, limit) {
    try {
      // logger.info("inside getAllProducts", adminUserId);
      let pageVal = page ? page : 1
      let limitVal = limit ? limit : 50
      let findBrandUserId = await AdminDao.findAdminUserId({
        _id: adminUserId,
        isActive: true,
        role: "brand",
      });
      if (findBrandUserId.length > 0) {
        let productsList = await ProductsDao.getAllProductDetails(pageVal, limitVal);
        let productDetails = [];
        for (const val of productsList) {
          let finalObj = {
            productId: val._id,
            brandId: val.brandId,
            emailId: findBrandUserId[0].emailId,
            brandName: val.brandName,
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
            productStatus: val.productStatus,
            createdOn: val.createdOn,
            updatedOn: val.updatedOn,
          };
          productDetails.push(finalObj);
        }
        return {
          statusCode: constants.STATUS_CODES[200],
          statusMessage: constants.STATUS_MESSAGE[200],
          productDetails,
        };
      } else {
        return {
          statusCode: constants.STATUS_CODES[302],
          statusMessage: "admin user not found",
        };
      }
    } catch (e) {
      // logger.error(e);
      throw e;
    }
  }

  async getproductDetails(productId) {
    try {
      // logger.info("inside getproductDetails", productId);
      let productDetails = await ProductsDao.findProduct(productId);
      if (productDetails.length > 0) {
        return {
          statusCode: constants.STATUS_CODES[200],
          statusMessage: constants.STATUS_MESSAGE[200],
          productDetails: productDetails[0],
        };
      } else {
        return {
          statusCode: constants.STATUS_CODES[302],
          statusMessage: "product id not found",
        };
      }
    } catch (e) {
      // logger.error(e);
      throw e;
    }
  }

  async publishProduct(brandId) {
    try {
      // logger.info("inside publishProduct", brandId);
      let findBrandUserId = await AdminDao.findBrandUserId({
        _id: brandId,
        isActive: true,
        role: ["brand", "admin"],
      }, true); // passing true since we are matching an array
      if (findBrandUserId.length > 0) {
        // let productDetails = await ProductsDao.findProduct(productId);
        // if (productDetails.length > 0) {
        await ProductsDao.updateProductStatus(brandId);
        return {
          statusCode: constants.STATUS_CODES[200],
          statusMessage: "Products published successfully",
        };
        // } else {
        //   return {
        //     statusCode: constants.STATUS_CODES[302],
        //     statusMessage: "product id not found",
        //   };
        // }
      } else {
        return {
          statusCode: constants.STATUS_CODES[302],
          statusMessage: "brand id not found",
        };
      }
    } catch (e) {
      // logger.error(e);
      throw e;
    }
  }

  async deleteProducts(brandId, productIds) {
    try {
      // logger.info("inside deleteProducts", brandId);
      let findBrandUserId = await AdminDao.findBrandUserId({
        _id: brandId,
        isActive: true,
        role: ["brand", "admin"],
      }, true); // passing true since we are matching an array
      if (findBrandUserId.length > 0) {
        await ProductsDao.deleteProductData({ _id: { $in: productIds } });
        return {
          statusCode: constants.STATUS_CODES[200],
          statusMessage: "products deleted successfully",
        };
      } else {
        return {
          statusCode: constants.STATUS_CODES[302],
          statusMessage: "brand id not found",
        };
      }
    } catch (e) {
      // logger.error(e);
      throw e;
    }
  }

  async updateProduct(data) {
    try {
      // logger.info("inside updateProduct", data.brandId);
      let findBrandUserId = await AdminDao.findBrandUserId({
        _id: data.brandId,
        isActive: true,
        role: ["brand", "admin"],
      }, true); // passing true since we are matching an array
      let brandDetails
      if (data.staticBrandId) {
        brandDetails = await AdminDao.findBrandDetails({
          brandId: data.staticBrandId
        })
      }
      if (findBrandUserId.length > 0) {
        let productDetails = await ProductsDao.findProduct(data.productId);
        if (productDetails.length > 0) {
          let updateObj = {
            $set: {
              brandId: data.staticBrandId,
              brandName: brandDetails && brandDetails.length > 0 ? brandDetails[0].brandName : null,
              productName: data.productName,
              productPrice: data.productPrice,
              productDescription: data.productDescription,
              productColor: data.productColor,
              imageUrls: data.imageUrls,
              categoryId: data.categoryId,
              categoryName: data.categoryName,
              subCategoryId: data.subCategoryId,
              subCategoryName: data.subCategoryName,
              seasons: data.seasons,
              productSizes: data.productSizes,
              productButtonLink: data.productButtonLink,
              productStatus: "Not published",
              updatedOn: new Date().toISOString(),
            },
          };
          await ProductsDao.updateProductDetails(data.productId, updateObj);
          let productDetails = await ProductsDao.findProduct(data.productId);
          let response = productDetails[0];
          return {
            statusCode: constants.STATUS_CODES[200],
            statusMessage: constants.STATUS_MESSAGE[200],
            productDetails: {
              productId: response._id,
              productName: response.productName,
              productPrice: response.productPrice,
              productDescription: response.productDescription,
              productColor: response.productColor,
              imageUrls: response.imageUrls,
              categoryId: response.categoryId,
              categoryName: response.categoryName,
              subCategoryId: response.subCategoryId,
              subCategoryName: response.subCategoryName,
              seasons: response.seasons,
              productSizes: response.productSizes,
              productButtonLink: response.productButtonLink,
              productStatus: response.productStatus,
              createdOn: response.createdOn,
              updatedOn: response.updatedOn,
            },
          };
        } else {
          return {
            statusCode: constants.STATUS_CODES[302],
            statusMessage: "product id not found",
          };
        }
      } else {
        return {
          statusCode: constants.STATUS_CODES[302],
          statusMessage: "brand id not found",
        };
      }
    } catch (e) {
      console.log(e);
      // // logger.error(e);
      throw e;
    }
  }

  async generateUserId() {
    let userId = uuidv4();
    let userExist = await UserDao.findUserId(userId);
    if (userExist.length == 0) {
      return userId;
    } else {
      return null;
    }
  }

  async calculateActiveStatus(lastActiveTime) {
    const lastActive = moment(lastActiveTime);
    const utcNow = moment.utc();
    const diffSeconds = utcNow.diff(lastActive, "seconds");

    let displayString = "";
    if (diffSeconds < 60) {
      displayString = "active " + diffSeconds + " seconds ago";
    } else if (diffSeconds < 3600) {
      const diffMinutes = Math.floor(diffSeconds / 60);
      displayString =
        "active " +
        diffMinutes +
        " minute" +
        (diffMinutes > 1 ? "s" : "") +
        " ago";
    } else if (diffSeconds < 86400) {
      const diffHours = Math.floor(diffSeconds / 3600);
      displayString =
        "active " + diffHours + " hour" + (diffHours > 1 ? "s" : "") + " ago";
    } else {
      const diffDays = Math.floor(diffSeconds / 86400);
      displayString =
        "active " + diffDays + " day" + (diffDays > 1 ? "s" : "") + " ago";
    }
    return displayString;
  }


  async getPopularBrands() {
    try {
      const stats = await ClosetDao.getPopularBrands()
      const finalArr = stats.reduce((arr, val) => {
        const brIndex = arr.findIndex((obj) => {
          console.log(obj.brandName, val._id.brandName)
          return obj.brandName === val._id.brandName
        })
        if (brIndex > -1) {
          arr[brIndex].weightage += 1
        } else {
          arr.push({
            brandName: val._id.brandName,
            weightage: 1
          })
        }
        return arr
      }, [])
      return finalArr.sort((a, b) => b.weightage - a.weightage)
    } catch (error) {
      console.log(e);
      // // logger.error(e);
      throw e;
    }
  }


  async getReferralDetails(params) {
    try {
      const firstDay = new Date(params.year, params.month - 1, 1);
      const firstDayISOString = firstDay.toISOString();
      const lastDay = new Date(params.year, params.month, 0);
      const lastDayISOString = lastDay.toISOString();
      const data = await AdminDao.getProductReferralsData(params, firstDayISOString, lastDayISOString)
      return data
    } catch (error) {
      console.log(e);
      // // logger.error(e);
      throw e;
    }
  }

  async updateBrandUser(adminUserId, brandEmail, whatsappNumber) {
    try {
      const adminUser = await AdminDao.findAdminUserId(adminUserId)
      const brand = await AdminDao.findEmailId({ emailId: brandEmail })
      if (adminUser.length > 0 && brand.length > 0) {
        await AdminDao.updateAdminUserDetails(brand[0]._id, {
          whatsappNumber: whatsappNumber,
          updatedOn: new Date().toISOString()
        })
      } else {
        return {
          statusCode: constants.STATUS_CODES[302],
          statusMessage: "admin user not found",
        };
      }
      return {
        statusCode: constants.STATUS_CODES[200],
        statusMessage: constants.STATUS_MESSAGE[200],
        emailId: brand[0].emailId,
        userId: brand[0]._id,
        role: brand[0].role,
        whatsappNumber: whatsappNumber,
        createdOn: brand[0].createdOn,
        updatedOn: brand[0].updatedOn,
      };
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  async addVideoData(params) {
    try {
      const adminData = await AdminDao.findAdminUserId(params.adminUserId)
      const alreadyExists = await AdminDao.findVideoDataByLink(params.videoLink)
      if (adminData.length > 0) {
        if (alreadyExists.length > 0) {
          return {
            statusCode: constants.STATUS_CODES[302],
            statusMessage: "video already added",
          };
        } else {
          // const vdata = await getVimeoVideoData(params.videoLink)
          const vdata = await getYouTubeVideoData(params.videoLink)
          if (vdata.thumbnail) {
            let insertObj = {
              adminUserId: params.adminUserId,
              videoLink: params.videoLink,
              name: params.name ? params.name : params.videoLink,
              thumbnail: `https://img.youtube.com/vi/${vdata.thumbnail}/0.jpg`,
              createdOn: new Date().toISOString(),
              updatedOn: new Date().toISOString(),
            };
            await AdminDao.addVideoLinkData(insertObj)
          } else {
            return {
              statusCode: constants.STATUS_CODES[302],
              statusMessage: "invalid vimeo video",
            }
          }

        }
        return {
          statusCode: constants.STATUS_CODES[200],
          statusMessage: constants.STATUS_MESSAGE[200],
          videoLink: params.videoLink
        }
      } else {
        return {
          statusCode: constants.STATUS_CODES[302],
          statusMessage: "admin user not found",
        };
      }
    } catch (error) {
      // console.log(error);
      // // logger.error(e);
      // throw error;
    }
  }

  async getAllVideoData(params) {
    try {
      const adminData = await AdminDao.findAdminUserId(params.adminUserId)
      if (adminData.length > 0) {
        let page = params.page ? params.page : 1
        let limit = params.limit ? params.limit : 50
        const videoData = await AdminDao.findVideoData(params.adminUserId, page, limit);
        return {
          statusCode: constants.STATUS_CODES[200],
          statusMessage: constants.STATUS_MESSAGE[200],
          videoData: videoData
        }
      } else {
        return {
          statusCode: constants.STATUS_CODES[302],
          statusMessage: "admin user not found",
        };
      }
    } catch (error) {
      console.log(error);
      // // logger.error(e);
      throw error;
    }
  }

  async removeVideoData(params) {
    try {
      const adminData = await AdminDao.findAdminUserId(params.adminUserId)
      if (adminData.length > 0) {
        const videoData = await AdminDao.removeVideoData(params.videoId)
        return {
          statusCode: constants.STATUS_CODES[200],
          statusMessage: constants.STATUS_MESSAGE[200],
          videoId: params.videoId
        }
      } else {
        return {
          statusCode: constants.STATUS_CODES[302],
          statusMessage: "admin user not found",
        };
      }
    } catch (error) {
      console.log(error);
      // // logger.error(e);
      throw error;
    }
  }
}

async function getVimeoVideoData(videoLink) {
  try {
    const response = await fetch(`https://vimeo.com/api/oembed.json?url=${videoLink}`);
    const data = await response.json();

    const thumbnail = data.thumbnail_url;
    const duration = data.duration;
    const title = data.title

    return { thumbnail, duration, title };
  } catch (error) {
    console.error('Error fetching Vimeo video data:', error);
    return {};
  }
}

async function getYouTubeVideoData(videoLink) {
  try {
    var regularUrlPattern = /(?:\?v=|\/embed\/|\.be\/|\/v\/|\/e\/|\/watch\?v=|\/watch\?vi=|\/watch\?v%3D|^v\/|^\/v\/|youtu\.be\/|\/v=)([^#\&\?\/]{11})/i;
    var shortsUrlPattern = /(?:\/shorts\/|\/s\/|y\/|youtu\.be\/|youtube.com\/shorts\/|youtube.com\/s\/)([^#\&\?\/]{11})/i;

    var match = videoLink.match(regularUrlPattern) || videoLink.match(shortsUrlPattern);
    if (match && match.length > 1) {
      return { thumbnail: match[1] };
    }
    return null;
  } catch {
    console.error('Error fetching youtube video data:', error);
    return {};
  }
}

module.exports = AdminBao;
