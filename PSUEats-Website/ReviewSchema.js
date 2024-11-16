// ReviewSchema.js
const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  ratingFood: { type: Number, required: true },
  ratingService: { type: Number, required: true },
  feedback: { type: String, required: true },
  selectedShop: { type: String, required: true }, // New field for shop name
  createdAt: { type: Date, default: Date.now },
});

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
