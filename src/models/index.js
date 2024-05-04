const Otp = require("./otp.schema");
const User = require("./user.schema");
const Categories = require("./categories.schema");
const Brands = require("./brands.schema");
const Closet = require("./closet.schema");
const Outfit = require("./outfits.schema");
const Colors = require("./colors.schema");
const Sizes = require("./sizes.schema");
const AdminUser = require("./admin.user.schema");
const Products = require("./products.schema");
const QuestionPref = require("./question.pref.schema");
const UserPref = require("./user.pref.schema");
const PersonalStylist = require("./personalstylist.schema");
const StylistRecommendedProducts = require("./stylist.recommended.products.schema.js");
const Events = require("./events.schema.js");
const Video = require("./video.schema.js");
const VideoView = require("./video.view.schema.js");
const StoreAssociate = require("./storeassociate.schema");

module.exports = {
  Otp,
  User,
  Categories,
  Brands,
  Closet,
  Outfit,
  Colors,
  Sizes,
  AdminUser,
  Products,
  QuestionPref,
  UserPref,
  PersonalStylist,
  StylistRecommendedProducts,
  Events,
  Video,
  VideoView,
  StoreAssociate,
};
