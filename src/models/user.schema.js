const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  userId: String,
  emailId: String,
  name: String,
  gender: String,
  profilePicUrl: String,
  isProfileCreated: Boolean,
  isPreferences: Boolean,
  personalStylistId: String,
  lastActive: Date,
  createdOn: Date,
  updatedOn: Date,
  adminUserId: String,
});

const User = new mongoose.model("userDetails", schema);
module.exports = User;
