const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const File = require("../Model/File");

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const fileTypes = /jpeg|jpg|png|pdf|doc|docx|pptx/;
    const mimeType = fileTypes.test(file.mimetype);
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
    if (mimeType && extname) {
      return cb(null, true);
    }
    cb(new Error("Only .jpeg, .jpg, .png, .pdf, .doc, .docx, .pptx files are allowed"));
  },
});

router.post("/upload", upload.array("files", 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }
    const fileMetadata = req.files.map(async (file) => {
      const fileData = new File({
        filename: file.filename,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: file.path,
      });
      await fileData.save();
      return fileData;
    });
    const savedFiles = await Promise.all(fileMetadata);
    res.status(200).json({
      message: "Files uploaded and saved to MongoDB successfully",
      files: savedFiles,
    });
  } catch (error) {
    console.error("Error during file upload:", error);
    res.status(500).json({ message: "Server error during file upload" });
  }
});

router.get("/files", async (req, res) => {
  try {
    const files = await File.find().sort({ createdAt: -1 });
    res.status(200).json({ files });
  } catch (error) {
    console.error("Error fetching files:", error);
    res.status(500).json({ message: "Server error fetching files" });
  }
});

module.exports = router;
