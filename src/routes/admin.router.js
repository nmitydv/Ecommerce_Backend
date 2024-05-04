const express = require("express");
const router = express.Router();
const { AdminController } = require("../controllers");

router.post("/login", AdminController.POST_adminLogin);
router.post("/forgetPassword", AdminController.POST_forgetPassword);
router.post("/changePassword", AdminController.POST_changePassword);
router.get("/stats", AdminController.GET_adminStats);
router.get("/getAllUsers", AdminController.GET_allUsers);
router.get("/getAllBrands", AdminController.GET_allBrands);
router.get("/getAllStylist", AdminController.GET_allStylist);
router.get("/get/UserDetails", AdminController.GET_userDetails);
router.get("/get/StylistDetails", AdminController.GET_stylistDetails);
router.post("/addBrandUser", AdminController.POST_addBrandUser);
router.post("/update/brandUser", AdminController.POST_updateBrandUser);
router.post("/add/user", AdminController.POST_addNewUser);
router.post(
  "/remove/user/closetItem",
  AdminController.POST_removeUserClosetItem
);
router.post(
  "/remove/user/outfitItem",
  AdminController.POST_removeUserOutfitItem
);
router.post("/add/product", AdminController.POST_addProduct);
router.get("/get/brandProducts", AdminController.GET_getBrandProducts);
router.get("/get/allProducts", AdminController.GET_getAllProducts);
router.get("/get/productDetails", AdminController.GET_productDetails);
router.post("/publishProduct", AdminController.POST_publishProduct);
router.post("/update/product", AdminController.POST_updateProduct);
router.post("/delete/products", AdminController.POST_deleteProducts);
router.post("/delete/users", AdminController.POST_deleteUsers);
router.post("/delete/brands", AdminController.POST_deleteBrands);
router.get("/popular/brands", AdminController.GET_popularBrands);
router.get("/product/referrals", AdminController.GET_referralDetails);
router.post("/add/video", AdminController.POST_addVideo);
router.get("/get/video", AdminController.GET_getAllVideos);
router.post("/remove/video", AdminController.POST_removeVideo);
router.post("/addStoreAssociate", AdminController.POST_addStoreAssociate);
router.post("/delete/storeAssociates", AdminController.POST_deleteStoreAssociates);
router.get("/getAllStoreAssociates", AdminController.GET_allStoreAssociates);

module.exports = router;
