const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true },
    originalname: { type: String, required: true },
    mimetype: { type: String, required: true },
    size: { type: Number, required: true },
    path: { type: String, required: true }, // Stores the file path on disk
  },
  { timestamps: true }
);

module.exports = mongoose.model("File", fileSchema);
