const mongoose = require("mongoose");

const ShopOwnerSchema = new mongoose.Schema({
  name: { type: String, unique: true, required: true },
  ShopName: { type: String, unique: true, required: true },
  phoneNum: { type: String, unique: true },
  password: { type: String, required: true },

  // iqamaID is now storing the path of the uploaded file
  iqamaID: {
    type: String,
    required: true, // You can decide if this is required or not
  },

  role: { type: String, default: "shopowner" },
  isApproved: { type: Boolean, default: false }, // Approval status for shop owners
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("ShopOwner", ShopOwnerSchema);
