const multer = require('multer');
const path = require('path');
const fs = require('node:fs');

const dir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, dir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `noticia_${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const tipos = /jpeg|jpg|png|webp/;
    if (tipos.test(path.extname(file.originalname).toLowerCase())) cb(null, true);
    else cb(new Error('Apenas imagens são permitidas.'));
  }
});

module.exports = upload;