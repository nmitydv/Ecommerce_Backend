const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  questionId: Number,
  question: String,
  options: Array,
  identifier: String,
});

const QuestionPref = new mongoose.model("questionPref", schema);
module.exports = QuestionPref;
