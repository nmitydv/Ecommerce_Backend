const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    emailId: String,
    name: String,
    gender: String,
    profilePicUrl: String,
    isProfileCreated: Boolean,
    isActive: Boolean,
    createdOn: Date,
    updatedOn: Date,
    vendorId: String,
    vendorEmailId: String,
  },
  { timestamps: true }
);

const StoreAssociate = new mongoose.model("storeAssociateDetails", schema);
module.exports = StoreAssociate;
