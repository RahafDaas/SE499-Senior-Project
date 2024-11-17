const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const fileSchema = new Schema({
  filename: { type: String, required: true },
  mimetype: { type: String, required: true },
  data: { type: Buffer, required: true },
  size: { type: Number, required: true },
  uploadDate: { type: Date, default: Date.now },
});

const File = mongoose.model("File", fileSchema);

module.exports = File;
