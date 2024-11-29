const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    phoneNum: { type: String },
    password: { type: String, required: true },
    role: { type: String, default: "user" }, // 'user', 'shopowner', or 'admin'
    isApproved: { type: Boolean, default: true }, // Approval status
    accountStatus: { type: Boolean, default: true }, // Default to active
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    orders: [{ type: mongoose.Schema.Types.ObjectId, ref: "Order" }],
    psueatsPoints: { type: Number, defualt: 100 },
  },
  { minimize: false }
);

module.exports = mongoose.model("User", UserSchema);
