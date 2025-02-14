import express from 'express';
import fileUpload from 'express-fileupload';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors({ origin: '*', credentials: true }));
app.use(fileUpload());

app.post('/upload', (req, res) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send('No files were uploaded.');
  }

  let uploadedFile = req.files.file;
  let uploadPath = path.join(__dirname, 'uploads', uploadedFile.name);

  uploadedFile.mv(uploadPath, (err) => {
    if (err) return res.status(500).send(err);

    let outputFileName = `${path.parse(uploadedFile.name).name}.png`;
    let outputPath = path.join(__dirname, 'output', outputFileName);

    // Command for Linux environment using LibreOffice
    const command = `"libreoffice" --headless --convert-to png --outdir "${path.join(__dirname, 'output')}" "${uploadPath}"`;

    exec(command, { maxBuffer: 1024 * 1024 * 100 }, (error) => {
      if (error) return res.status(500).send(error.message);

      sharp(outputPath)
        .resize({ width: 1000 })
        .png({ compressionLevel: 2 })
        .toBuffer((err, buffer) => {
          if (err) return res.status(500).send(err.message);
          fs.writeFileSync(outputPath, buffer);
          res.json({ imageUrl: `http://localhost:3000/output/${outputFileName}` });
        });
    });
  });
});

app.use('/output', express.static(path.join(__dirname, 'output')));

app.listen(3000, () => console.log('Server started on port 3000'));
export default app;
