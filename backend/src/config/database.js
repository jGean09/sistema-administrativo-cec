const { Pool } = require('pg');
require('dotenv').config();

// O nosso X9 atualizado para a nova URL:
console.log("🔍 VERIFICANDO URL:", process.env.DATABASE_URL ? "URL carregada com sucesso!" : "FALHA: URL não encontrada no .env");

const pool = new Pool({
  // Usando apenas a URL inteira
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } 
});

pool.on('connect', () => {
  console.log('🔥 Conectado ao Supabase com sucesso!');
});

pool.on('error', (err) => {
  console.error('Erro na conexão com o banco:', err);
});

module.exports = pool;