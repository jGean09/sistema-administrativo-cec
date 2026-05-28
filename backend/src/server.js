require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('node:path');

const routes = require('./routes');

const app = express();

app.disable('x-powered-by');

const PORT = process.env.PORT || 3001;

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Middlewares globais
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log de requisições (desenvolvimento)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.path}`);
    next();
  });
}

// Rotas da API
app.use('/api', routes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    sistema: 'CEC - Casa do Estudante de Caicó',
    versao: '1.0.0'
  });
});

// Handler de erros 404
app.use((req, res) => {
  res.status(404).json({
    error: 'Rota não encontrada.'
  });
});

// Handler de erros globais
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);

  res.status(500).json({
    error: 'Erro interno do servidor.'
  });
});

app.listen(PORT, () => {
  console.log(`\n🏠 CEC Sistema Administrativo`);
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log(`📋 Ambiente: ${process.env.NODE_ENV || 'development'}\n`);
});

module.exports = app;