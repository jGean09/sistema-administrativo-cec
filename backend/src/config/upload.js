const multer = require('multer');

// ============================================================
// PADRÃO: Configuration Object
// SOLID S — Single Responsibility: este módulo tem uma única
//           responsabilidade — configurar o middleware de upload.
//
// MOTIVO DA MUDANÇA: diskStorage salvava arquivos no disco do
// servidor (Render). O Render tem filesystem EFÊMERO — os arquivos
// somem a cada novo deploy ou reinício. Por isso as imagens
// "sumiam". A solução é memoryStorage: o arquivo fica em buffer
// na memória (req.file.buffer) e é convertido para base64 para
// persistir no banco de dados PostgreSQL.
// ============================================================

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB por arquivo
  fileFilter: (req, file, cb) => {
    // Aceita apenas imagens e PDF — doc/xls removidos pois o
    // sistema só exibe/abre PDFs no frontend.
    const tiposPermitidos = /jpeg|jpg|png|webp|pdf/;
    const ext = file.originalname.split('.').pop().toLowerCase();
    if (tiposPermitidos.test(ext)) cb(null, true);
    else cb(new Error('Tipo de arquivo não permitido. Use imagens ou PDF.'));
  }
});

module.exports = upload;