import express from 'express';
import fileUpload from 'express-fileupload';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors({ origin: "https://pdfconvertor-ycw3.onrender.com", credentials: true }));
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

        const command = [
            '--headless',
            '--convert-to', 'png',
            '--outdir', path.join(__dirname, 'output'),
            uploadPath
        ];

        const process = spawn('"C:\\Program Files\\LibreOffice\\program\\soffice.exe"', command, { shell: true });
            
        process.on('close', (code) => {
            if (code !== 0) return res.status(500).send('Conversion failed');

            res.json({ imageUrl: `http://localhost:3000/output/${outputFileName}` });
        });
    });
});

app.use('/output', express.static(path.join(__dirname, 'output')));

app.listen(3000, () => console.log('Server started on port 3000'));
export default app;
