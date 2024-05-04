const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  emailId: String,
  name: String,
  gender: String,
  profilePicUrl: String,
  isProfileCreated: Boolean,
  isActive: Boolean,
  createdOn: Date,
  updatedOn: Date,
});

const PersonalStylist = new mongoose.model("personalStylistDetails", schema);
module.exports = PersonalStylist;
