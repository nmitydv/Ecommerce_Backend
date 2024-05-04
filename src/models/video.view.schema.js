const { string } = require("joi");
const mongoose = require("mongoose");

const schema = new mongoose.Schema({
    videoId: String,
    userId: String,
    createdOn: Date,
    updatedOn: Date,
});

const VideoView = new mongoose.model("videoView", schema);
module.exports = VideoView;
