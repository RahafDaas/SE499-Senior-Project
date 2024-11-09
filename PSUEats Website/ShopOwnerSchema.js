const mongoose = require("mongoose");

const ShopOwnerSchema = new mongoose.Schema({
  name: { type: String, unique: true, required: true },
  phoneNum: { type: String, unique: true },
  password: { type: String, required: true },
  iqamaID: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: function (v) {
        return /^\d{10}$/.test(v); // Ensures exactly 10 digits
      },
      message: "Iqama/National ID must be exactly 10 digits.",
    },
  },
  role: { type: String, default: "shopowner" },
  isApproved: { type: Boolean, default: false }, // Approval status for shop owners
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("ShopOwner", ShopOwnerSchema);
