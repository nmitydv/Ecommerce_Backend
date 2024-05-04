const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  name: String,
  metaData: Object,
  createdOn: Date,
  updatedOn: Date,
});

const Otp = new mongoose.model("events", schema);
module.exports = Otp;
