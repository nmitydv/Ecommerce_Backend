const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  brandId: Number,
  brandName: String,
  category: [String]
});

const Brands = new mongoose.model("brands", schema);
module.exports = Brands;
