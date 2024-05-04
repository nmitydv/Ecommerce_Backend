const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  personalStylistId: String,
  userId: String,
  productId: String,
  note: String,
  dislike: Boolean,
  createdOn: Date,
  updatedOn: Date,
});

const StylistRecommendedProducts = new mongoose.model("stylistRecommendedProducts", schema);
module.exports = StylistRecommendedProducts;
