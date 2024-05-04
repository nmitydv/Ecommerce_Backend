const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  userId: String,
  prefrences: Array
});

const UserPref = new mongoose.model("userPref", schema);
module.exports = UserPref;
