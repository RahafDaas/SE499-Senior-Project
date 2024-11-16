const mongoose = require("mongoose");

const ItemSchema = new mongoose.Schema({
  dishname: { type: String, required: true },
  dishPic: { type: String, required: true },
  price: { type: Number, required: true },
  calories: { type: String, required: true }
  });
  
  module.exports = mongoose.model("Item", ItemSchema);