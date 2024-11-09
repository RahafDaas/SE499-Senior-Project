const mongoose = require("mongoose");

const foodItemSchema = new mongoose.Schema({
  dishname: {
    type: String,
    required: true,
  },
  dishPic: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  calories: {
    type: String,
    required: true,
  },
});

const offerSchema = new mongoose.Schema({
  dishname: {
    type: String,
    required: true,
  },
  dishPic: {
    type: String,
    required: true,
  },
  Price: {
    type: Number,
    required: true,
  },
  calories: {
    type: String,
    required: true,
  },
});

const menuItemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  food: {
    type: [foodItemSchema],
    required: true,
  },
  offers: {
    type: [offerSchema],
    required: true,
  },
  time: {
    type: String,
    required: true,
  },
  pickup: {
    type: Boolean,
    required: true,
  },
  isOpen: {
    type: Boolean,
    required: true,
  },
  logoUrl: {
    type: String,
    required: true,
  },
  rating: {
    type: Number,
    required: true,
  },
  ratingCount: {
    type: String,
    required: true,
  },
  code: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
});

// Create the MenuItem model
const MenuItem = mongoose.model("MenuItem", menuItemSchema);

module.exports = MenuItem;
