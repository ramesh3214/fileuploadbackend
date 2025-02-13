import express from 'express';
import fileUpload from 'express-fileupload';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(fileUpload());
app.use(express.static('public'));

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

        exec(`"C:\\Program Files\\LibreOffice\\program\\soffice.exe" --headless --convert-to png --outdir "${path.join(__dirname, 'output')}" "${uploadPath}"`, (error) => {
            if (error) return res.status(500).send(error.message);
            res.json({ imageUrl: `/output/${outputFileName}` });
        });
    });
});

app.use('/output', express.static(path.join(__dirname, 'output')));

app.listen(3000, () => console.log('Server started on port 3000'));
export default app;
