require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('./database'); // Puxa a sua conexão configurada

async function criptografarSenhasExistentes() {
  try {
    console.log('🔍 Conectando ao banco e buscando sócios...');
    
    // Hashes do bcrypt sempre têm 60 caracteres. 
    // Se tiver menos que isso (como um CPF de 14 caracteres), sabemos que está em texto puro.
    const result = await pool.query('SELECT id, senha_hash FROM socios WHERE LENGTH(senha_hash) < 60');

    if (result.rows.length === 0) {
      console.log('✅ Nenhuma senha em texto puro encontrada. O banco já está seguro!');
      process.exit(0);
    }

    console.log(`⏳ Encontrados ${result.rows.length} sócios com senha vulnerável. Iniciando criptografia...`);

    // Fazemos um loop para criptografar e atualizar um por um
    for (const socio of result.rows) {
      const hashSeguro = await bcrypt.hash(socio.senha_hash, 10); // 10 é o custo padrão de processamento
      
      await pool.query('UPDATE socios SET senha_hash = $1 WHERE id = $2', [hashSeguro, socio.id]);
      console.log(`🔒 Senha do sócio ID ${socio.id} protegida com sucesso.`);
    }

    console.log('\n🎉 SUCESSO: Todas as senhas foram criptografadas e o banco está seguro!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro crítico ao atualizar o banco:', error);
    process.exit(1);
  }
}

// Executa a função
criptografarSenhasExistentes();