// RestaurantSchema.js
const mongoose = require("mongoose");
const foodSchema = new mongoose.Schema({
  dishname: String,
  dishPic: String,
  price: Number,
  calories: String,
});
const restaurantSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Restaurant title is required"],
    },
    imageUrl: {
      type: String,
    },
    food: [foodSchema],
    time: {
      type: String,
    },
    pickup: {
      type: Boolean,
      default: true,
    },
    isOpen: {
      type: Boolean,
      default: true,
    },
    logoUrl: {
      type: String,
    },
    rating: {
      type: Number,
      default: 1,
      min: 1,
      max: 5,
    },
    ratingCount: {
      type: String,
    },
    code: {
      type: String,
    },
    location: {
      type: String,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Owner",
    },
    category: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Restaurant", restaurantSchema);
