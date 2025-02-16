import express from "express";
import fileUpload from "express-fileupload";
import path from "path";
import fs from "fs";
import sharp from "sharp";
import cors from "cors";
import { exec } from "child_process";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(
  cors({ origin: "https://pdfconvertor-j2gl.onrender.com", credentials: true })
);
app.use(fileUpload());

const uploadDir = path.join(process.cwd(), "uploads");
const outputDir = path.join(process.cwd(), "output");

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

app.post("/upload", async (req, res) => {
  if (!req.files || !req.files.file) {
    return res.status(400).send("No files uploaded.");
  }

  const uploadedFile = req.files.file;
  const fileBaseName = path.parse(uploadedFile.name).name;
  const uploadPath = path.join(uploadDir, uploadedFile.name);

  uploadedFile.mv(uploadPath, async (err) => {
    if (err) return res.status(500).send("File upload failed");

    const command = `unoconv -f png -o "${outputDir}/${fileBaseName}" "${uploadPath}"`;

    exec(command, { maxBuffer: 1024 * 1024 * 100 }, async (error) => {
      if (error) {
        console.error(`Conversion error: ${error}`);
        return res.status(500).send("Conversion failed");
      }

      try {
        const files = fs
          .readdirSync(outputDir)
          .filter(
            (file) => file.startsWith(fileBaseName) && file.endsWith(".png")
          );
        if (files.length === 0) {
          return res.status(500).send("No output files found.");
        }

        const resizedPaths = await Promise.all(
          files.map((file) => {
            const inputPath = path.join(outputDir, file);
            const outputPath = path.join(outputDir, `resized-${file}`);
            return sharp(inputPath)
              .resize({ width: 1000 })
              .toFile(outputPath)
              .then(() => outputPath);
          })
        );

        res.json({
          imageUrl: resizedPaths.map(
            (file) => `/output/${path.basename(file)}`
          ),
        });
      } catch (err) {
        console.error(`Image processing error: ${err}`);
        res.status(500).send("Image processing failed.");
      }
    });
  });
});

app.use("/output", express.static(outputDir));
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
