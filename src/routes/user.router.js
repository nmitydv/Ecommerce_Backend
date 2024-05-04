const express = require("express");
const router = express.Router();
const { UserController } = require("../controllers");

router.get("/getUserDetails", UserController.GET_userDetails);
router.post("/userProfile", UserController.POST_userProfile);
router.get("/userPrefrences", UserController.GET_userPrefrences);
router.post("/addStylist", UserController.POST_personalStylist);
router.post("/removeStylist", UserController.POST_removeStylist);
router.get("/getStylistClients", UserController.GET_clients);
router.post("/recommendToClient", UserController.POST_recommendToClient);
router.get("/getRecommendationToClient", UserController.GET_recommendToClient);
router.post("/changeLikeStatus", UserController.POST_changeRecommendedProductStatus);
router.post("/uploadChatMedia", UserController.POST_uploadChatMedia)
router.get("/uploadChatVideo", UserController.GET_presignedURL)

module.exports = router;
