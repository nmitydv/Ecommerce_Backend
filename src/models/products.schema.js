const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  brandId: Number,
  brandId: String,
  vendorId: String,
  brandName: String,
  vendorName: String,
  productId: String,
  productName: String,
  productPrice: Number,
  productDescription: String,
  productColor: String,
  imageUrls: [String],
  categoryId: Number,
  categoryName: String,
  subCategoryId: Number,
  subCategoryName: String,
  seasons: [String],
  productSizes: [String],
  sizeType: String,
  sizeSystem: String,
  shippingCountry: String,
  gender: String,
  productButtonLink: String,
  productStatus: String,
  vendorProductId: String,
  createdOn: Date,
  updatedOn: Date,
});

const Products = new mongoose.model("product", schema);
module.exports = Products;
