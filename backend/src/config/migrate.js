const pool = require('./database');

const createTables = async () => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Tabela de sócios
    await client.query(`
      CREATE TABLE IF NOT EXISTS socios (
        id SERIAL PRIMARY KEY,
        matricula VARCHAR(20) UNIQUE NOT NULL,
        
        -- Dados pessoais (conforme ficha individual)
        nome VARCHAR(255) NOT NULL,
        data_nascimento DATE NOT NULL,
        genero VARCHAR(10) NOT NULL CHECK (genero IN ('M', 'F')),
        naturalidade VARCHAR(100),
        cpf VARCHAR(14) UNIQUE NOT NULL,
        rg VARCHAR(30),
        nome_pai VARCHAR(255),
        nome_mae VARCHAR(255),
        telefone VARCHAR(20),
        email VARCHAR(255) UNIQUE NOT NULL,
        
        -- Endereço
        endereco_logradouro VARCHAR(255),
        endereco_numero VARCHAR(20),
        endereco_bairro VARCHAR(100),
        endereco_cidade VARCHAR(100),
        endereco_uf VARCHAR(2),
        endereco_cep VARCHAR(10),
        
        -- Dados acadêmicos
        instituicao VARCHAR(255),
        escolaridade VARCHAR(100),
        periodo_serie VARCHAR(50),
        ano_inclusao VARCHAR(20),
        
        -- Dados institucionais
        departamento VARCHAR(10) NOT NULL CHECK (departamento IN ('masculino', 'feminino')),
        status_socio VARCHAR(20) NOT NULL DEFAULT 'ativo' CHECK (status_socio IN ('ativo', 'inativo', 'suspenso')),
        data_inclusao DATE NOT NULL DEFAULT CURRENT_DATE,
        
        -- Saúde
        alergias TEXT DEFAULT 'Não',
        medicacao TEXT DEFAULT 'Não',
        doenca_cronica TEXT DEFAULT 'Não',
        deficiencia TEXT DEFAULT 'Não',
        tratamento_medico TEXT DEFAULT 'Não',
        
        -- Autenticação
        senha_hash VARCHAR(255) NOT NULL,
        
        -- Cargo/função na diretoria
        cargo VARCHAR(100),
        tipo_usuario VARCHAR(30) NOT NULL DEFAULT 'socio' 
          CHECK (tipo_usuario IN ('socio', 'diretoria', 'presidente', 'admin')),
        
        -- Controle
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Tabela de portarias (nomeações da diretoria)
    await client.query(`
      CREATE TABLE IF NOT EXISTS portarias (
        id SERIAL PRIMARY KEY,
        numero VARCHAR(20) NOT NULL,
        data_publicacao DATE NOT NULL,
        presidente_id INTEGER REFERENCES socios(id),
        conteudo TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Tabela de itens de portaria (cada nomeação dentro da portaria)
    await client.query(`
      CREATE TABLE IF NOT EXISTS portaria_nomeacoes (
        id SERIAL PRIMARY KEY,
        portaria_id INTEGER REFERENCES portarias(id) ON DELETE CASCADE,
        socio_id INTEGER REFERENCES socios(id),
        cargo VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Tabela de notícias / publicações
    await client.query(`
      CREATE TABLE IF NOT EXISTS noticias (
        id SERIAL PRIMARY KEY,
        titulo VARCHAR(255) NOT NULL,
        conteudo TEXT NOT NULL,
        tipo VARCHAR(50) NOT NULL 
          CHECK (tipo IN (
            'edital', 'ata_assembleia', 'escala_limpeza', 
            'relatorio_gastos', 'comunicado', 'noticia_geral'
          )),
        departamento VARCHAR(20) DEFAULT 'todos' 
          CHECK (departamento IN ('masculino', 'feminino', 'todos')),
        publicado_por INTEGER REFERENCES socios(id),
        publicado BOOLEAN DEFAULT true,
        data_publicacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Tabela de mensalidades
    await client.query(`
      CREATE TABLE IF NOT EXISTS mensalidades (
        id SERIAL PRIMARY KEY,
        socio_id INTEGER REFERENCES socios(id),
        mes_referencia VARCHAR(7) NOT NULL,
        valor DECIMAL(10,2) NOT NULL,
        status VARCHAR(20) DEFAULT 'pendente' 
          CHECK (status IN ('pago', 'pendente', 'atrasado')),
        data_pagamento DATE,
        observacao TEXT,
        registrado_por INTEGER REFERENCES socios(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Índices para performance
    await client.query(`CREATE INDEX IF NOT EXISTS idx_socios_email ON socios(email);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_socios_cpf ON socios(cpf);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_socios_departamento ON socios(departamento);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_noticias_tipo ON noticias(tipo);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_noticias_publicacao ON noticias(data_publicacao DESC);`);

    await client.query('COMMIT');
    console.log('Tabelas criadas com sucesso!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Erro ao criar tabelas:', err);
    throw err;
  } finally {
    client.release();
    pool.end();
  }
};

createTables();
