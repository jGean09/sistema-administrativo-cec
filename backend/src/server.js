require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet'); // Importante para segurança
const path = require('path');
const routes = require('./routes');

const app = express();

// Proteção básica de cabeçalhos HTTP
app.use(helmet()); 
app.disable('x-powered-by');

const PORT = process.env.PORT || 3001;

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// CORS blindado: aceita a variável do Render, o Localhost e a Vercel
const origensPermitidas = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'https://sistema-administrativo-cec.vercel.app'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || origensPermitidas.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Bloqueado pelo CORS'));
    }
  },
  credentials: true,
}));

// Rota de Health Check (útil para o Render não derrubar seu app)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', ambiente: process.env.NODE_ENV });
});

// Rotas da API
app.use('/api', routes);

// Handlers de Erro
app.use((req, res) => res.status(404).json({ error: 'Rota não encontrada.' }));
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Erro interno do servidor.' });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});

module.exports = app;