// server.js — versão corrigida e blindada

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3001;

// Log de diagnóstico — confirma qual valor está carregado no ambiente do Render
console.log('✅ FRONTEND_URL carregado:', process.env.FRONTEND_URL);
console.log('✅ NODE_ENV:', process.env.NODE_ENV);

const origensPermitidas = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://sistema-administrativo-cec.vercel.app',
  // FRONTEND_URL como fallback (caso esteja correto no painel do Render)
  process.env.FRONTEND_URL,
].filter(Boolean); // Remove valores undefined/null

console.log('✅ Origens permitidas:', origensPermitidas);

const corsOptions = {
  origin: function (origin, callback) {
    // Permite requisições sem origin (Postman, curl, health checks)
    if (!origin) return callback(null, true);

    if (origensPermitidas.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`🚫 CORS bloqueou origem: ${origin}`);
      callback(new Error(`Origem não permitida pelo CORS: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

// ⚠️ CORS deve vir ANTES do Helmet
app.use(cors(corsOptions));

// Responde ao preflight OPTIONS de forma explícita (resolve conflitos com Helmet)
app.options('*', cors(corsOptions));

// Helmet depois do CORS
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // Evita conflito com uploads
}));

app.disable('x-powered-by');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    ambiente: process.env.NODE_ENV,
    frontend_url: process.env.FRONTEND_URL, // Expõe para diagnóstico
    origens: origensPermitidas,
  });
});

app.use('/api', routes);

app.use((req, res) => res.status(404).json({ error: 'Rota não encontrada.' }));
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Erro interno do servidor.' });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});

module.exports = app;