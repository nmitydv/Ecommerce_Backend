const express = require("express");
const router = express.Router();
const { HomeController } = require("../controllers");

router.get("/get/homePageData", HomeController.GET_homePageData);
router.get("/get/allProducts", HomeController.GET_allProducts);
router.post("/get/allProducts/v1", HomeController.POST_allProducts);
router.post("/get/allProducts/v2", HomeController.POST_allProductsv2);
router.get("/get/productDetails", HomeController.GET_productDetails);
router.get("/get/preferences", HomeController.GET_preferences);
router.post("/savePreferences", HomeController.POST_savePreferences);
router.get("/search", HomeController.GET_search);
router.post("/event", HomeController.POST_eventProduct);
router.get("/videos", HomeController.GET_vimeoVideo)
router.post("/video/view", HomeController.POST_viewVimeoVideo)

module.exports = router;
