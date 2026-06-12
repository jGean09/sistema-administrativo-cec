require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3001;

console.log('✅ FRONTEND_URL:', process.env.FRONTEND_URL);

const origensPermitidas = [
  'https://sistema-administrativo-cec.vercel.app',
  process.env.FRONTEND_URL,
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || origensPermitidas.includes(origin)) {
      return callback(null, true);
    }
    console.warn(`🚫 CORS bloqueou: ${origin}`);
    callback(new Error(`Origem bloqueada: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

// CORS e preflight ANTES de tudo
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Helmet depois do CORS
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.disable('x-powered-by');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Instrui o Cloudflare/CDN a não cachear nada da API
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('CDN-Cache-Control', 'no-store');
  res.set('Cloudflare-CDN-Cache-Control', 'no-store');
  next();
});

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    ambiente: process.env.NODE_ENV,
    frontend_url: process.env.FRONTEND_URL,
    origens: origensPermitidas,
  });
});

app.use('/api', routes);

app.use((req, res) => res.status(404).json({ error: 'Rota não encontrada.' }));
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Erro interno do servidor.' });
});

app.listen(PORT, () => console.log(`🚀 Servidor na porta ${PORT}`));

module.exports = app;