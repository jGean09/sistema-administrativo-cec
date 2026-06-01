const multer = require('multer');
const path = require('path');
const fs = require('node:fs');

const dir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, dir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const prefix = file.mimetype.startsWith('image/') ? 'noticia' : 'anexo';
    cb(null, `${prefix}_${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const tiposPermitidos = /jpeg|jpg|png|webp|pdf|doc|docx|xls|xlsx|txt/;
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    if (tiposPermitidos.test(ext)) cb(null, true);
    else cb(new Error('Tipo de arquivo não permitido.'));
  }
});

module.exports = upload;