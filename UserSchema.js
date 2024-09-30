const mongoose = require("mongoose");

let UserSchema = new mongoose.Schema({
  name: { type: String },
  email: { type: String },
  phoneNum: { type: Number },
  password: { type: String },
});

module.exports = mongoose.model("User", UserSchema);
