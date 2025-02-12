const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const axios = require("axios");
const FormData = require("form-data");
const File = require("../Model/File");

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const allowedFileTypes =
  /doc|docx|odt|txt|html|htm|ppt|pptx|xls|xlsx|xps|jpeg|jpg|png|gif|bmp|heif|heic|webp|svg/;

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const mimeType = allowedFileTypes.test(file.mimetype);
    const extname = allowedFileTypes.test(
      path.extname(file.originalname).toLowerCase()
    );

    if (mimeType && extname) {
      return cb(null, true);
    }
    cb(
      new Error(
        "Invalid file type. Supported types: .doc, .docx, .odt, .txt, .html, .htm, .ppt, .pptx, .xls, .xlsx, .xps, .jpeg, .jpg, .png, .gif, .bmp, .heif, .heic, .webp, .svg"
      )
    );
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

router.post("/convertFile", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const filePath = req.file.path;
    const fileExt = path.extname(req.file.originalname).toLowerCase();
    const apiKey = "secret_14pCFIuZgLtuCwQq";
    const convertType = "pdf";

    const formData = new FormData();
    formData.append("File", fs.createReadStream(filePath));

    const convertApiUrl = `https://v2.convertapi.com/convert/${fileExt.substring(1)}/to/${convertType}?Secret=${apiKey}`;

    const response = await axios.post(convertApiUrl, formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });

    if (!response.data || !response.data.Files || response.data.Files.length === 0) {
      return res.status(500).json({ message: "Conversion failed, no file received" });
    }
    const fileData = response.data.Files[0];
    const convertedFileName = fileData.FileName;
    const convertedFilePath = path.join("uploads", convertedFileName);
    const fileBuffer = Buffer.from(fileData.FileData, "base64");
    fs.writeFileSync(convertedFilePath, fileBuffer);

    res.status(200).json({
      message: "File converted successfully",
      convertedFile: `/uploads/${convertedFileName}`,
    });
  } catch (error) {
    console.error("Error converting file:", error);
    res.status(500).json({ message: "File conversion failed", error: error.message });
  }
});


module.exports = router;
