const { string } = require("joi");
const mongoose = require("mongoose");

const schema = new mongoose.Schema({
    name: String,
    videoLink: String,
    adminUserId: String,
    thumbnail: String,
    duration: String,
    createdOn: Date,
    updatedOn: Date,
});

const Video = new mongoose.model("video", schema);
module.exports = Video;
