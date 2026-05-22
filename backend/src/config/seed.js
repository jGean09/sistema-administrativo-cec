const pool = require('./database');
const bcrypt = require('bcryptjs');

// Dados reais da Portaria Nº 07/2025
const diretoria = [
  {
    nome: 'Jackson Martins Dantas',
    cpf: '000.000.000-00', // CPF não consta na portaria para o presidente
    email: 'jackson.dantas@cec.org.br',
    cargo: 'Presidente',
    tipo_usuario: 'presidente',
    departamento: 'masculino',
    genero: 'M',
  },
  {
    nome: 'José Gean de Macêdo Alves',
    cpf: '706.323.764-06',
    email: 'gean.alves@cec.org.br',
    cargo: 'Secretário Geral',
    tipo_usuario: 'diretoria',
    departamento: 'masculino',
    genero: 'M',
  },
  {
    nome: 'Wiritan Soares da Silva',
    cpf: '112.544.894-60',
    email: 'wiritans@gmail.com',
    cargo: 'Diretor de Tesouraria',
    tipo_usuario: 'diretoria',
    departamento: 'masculino',
    genero: 'M',
  },
  {
    nome: 'Imaculada Luciana da Silva Santos',
    cpf: '017.698.784-32',
    email: 'imaculada.luciana@cec.org.br',
    cargo: 'Diretora Geral do Departamento Feminino',
    tipo_usuario: 'diretoria',
    departamento: 'feminino',
    genero: 'F',
  },
  {
    nome: 'Samille Nayara Silva Araújo',
    cpf: '128.087.484-85',
    email: 'samille.araujo@cec.org.br',
    cargo: 'Diretora de Disciplina e Higiene',
    tipo_usuario: 'diretoria',
    departamento: 'feminino',
    genero: 'F',
  },
  {
    nome: 'José Raí Pereira da Silva',
    cpf: '127.365.774-85',
    email: 'rai.silva@cec.org.br',
    cargo: 'Diretor de Disciplina e Higiene',
    tipo_usuario: 'diretoria',
    departamento: 'masculino',
    genero: 'M',
  },
  {
    nome: 'Luan de Sousa Batista',
    cpf: '073.340.133-36',
    email: 'luan.batista@cec.org.br',
    cargo: 'Diretor de Assistência Econômica',
    tipo_usuario: 'diretoria',
    departamento: 'masculino',
    genero: 'M',
  },
  {
    nome: 'Luiz Henrique Felix Guedes',
    cpf: '709.441.544-33',
    email: 'luiz.guedes@cec.org.br',
    cargo: 'Diretor Social e Esportivo',
    tipo_usuario: 'diretoria',
    departamento: 'masculino',
    genero: 'M',
  },
  {
    nome: 'José Kassyel Borges da Silva',
    cpf: '709.953.344-47',
    email: 'kassyel.silva@cec.org.br',
    cargo: 'Diretor de Cultura e Publicidade',
    tipo_usuario: 'diretoria',
    departamento: 'masculino',
    genero: 'M',
  },
  {
    nome: 'Ismael Vieira Emidio',
    cpf: '167.353.564-03',
    email: 'ismael.emidio@cec.org.br',
    cargo: 'Bibliotecário',
    tipo_usuario: 'diretoria',
    departamento: 'masculino',
    genero: 'M',
  },
];

const gerarMatricula = (index) => {
  const ano = new Date().getFullYear();
  return `${ano}${String(index).padStart(4, '0')}-DIR`;
};

const seed = async () => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    for (let i = 0; i < diretoria.length; i++) {
      const d = diretoria[i];
      const cpfLimpo = d.cpf.replace(/\D/g, '');
      const senhaHash = await bcrypt.hash(cpfLimpo, 10);
      const matricula = gerarMatricula(i + 1);

      await client.query(
        `INSERT INTO socios 
          (matricula, nome, data_nascimento, genero, naturalidade, cpf, rg,
           email, departamento, cargo, tipo_usuario, senha_hash, status_socio, data_inclusao)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'ativo', CURRENT_DATE)
         ON CONFLICT (email) DO NOTHING`,
        [
          matricula,
          d.nome,
          '1990-01-01',
          d.genero,
          'Caicó/RN',
          d.cpf,
          '000.000.000',
          d.email,
          d.departamento,
          d.cargo,
          d.tipo_usuario,
          senhaHash,
        ]
      );
    }

    await client.query('COMMIT');
    console.log('Seed concluído! Diretoria da Portaria 07/2025 cadastrada.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Erro no seed:', err);
  } finally {
    client.release();
    pool.end();
  }
};

seed();
