// ============================================================
// PADRÃO: Service Layer — Serviço de E-mail
// SOLID S — Single Responsibility: este arquivo tem UMA
//           responsabilidade — enviar e-mails pela CEC.
// GRASP Expert: é o especialista em comunicação por e-mail —
//           sabe configurar o transporte, buscar destinatários
//           e formatar as mensagens.
// SOLID O — Open/Closed: para adicionar novo tipo de filtro
//           de destinatários, só adiciona novo método aqui.
// ============================================================

const nodemailer = require('nodemailer');
const pool = require('../config/database');
const fs = require('fs');

// ─── CONFIGURAÇÃO DO TRANSPORTE ──────────────────────────────
// Cria o transportador Gmail uma única vez (Singleton implícito)
// Usa as credenciais do .env — nunca hardcoded no código
const criarTransporte = () => nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ─── BUSCAR DESTINATÁRIOS ────────────────────────────────────
// Retorna lista de { nome, email } conforme o filtro escolhido

// Todos os sócios ativos
const buscarTodosSocios = async () => {
  const result = await pool.query(
    `SELECT nome, email FROM socios
     WHERE status_socio = 'ativo'
     AND email NOT LIKE '%nao_fornecido%'
     ORDER BY nome ASC`
  );
  return result.rows;
};

// Sócios por departamento
const buscarPorDepartamento = async (departamento) => {
  const result = await pool.query(
    `SELECT nome, email FROM socios
     WHERE departamento = $1
     AND status_socio = 'ativo'
     AND email NOT LIKE '%nao_fornecido%'
     ORDER BY nome ASC`,
    [departamento]
  );
  return result.rows;
};

// Sócios por status (ativo, inativo, suspenso)
const buscarPorStatus = async (status) => {
  const result = await pool.query(
    `SELECT nome, email FROM socios
     WHERE status_socio = $1
     AND email NOT LIKE '%nao_fornecido%'
     ORDER BY nome ASC`,
    [status]
  );
  return result.rows;
};

// Sócios específicos por IDs selecionados
const buscarPorIds = async (ids) => {
  const result = await pool.query(
    `SELECT nome, email FROM socios
     WHERE id = ANY($1)
     AND email NOT LIKE '%nao_fornecido%'`,
    [ids]
  );
  return result.rows;
};

// Listar todos os sócios para seleção no frontend
const listarSociosParaSelecao = async () => {
  const result = await pool.query(
    `SELECT id, nome, email, departamento, status_socio
     FROM socios
     WHERE email NOT LIKE '%nao_fornecido%'
     ORDER BY nome ASC`
  );
  return result.rows;
};

// ─── ENVIAR E-MAIL ───────────────────────────────────────────
// Função principal — monta e envia o e-mail
// destinatarios: array de { nome, email }
// anexos: array de arquivos do multer (req.files)
const enviarEmail = async ({ destinatarios, assunto, mensagem, remetente_nome, anexos = [] }) => {
  if (!destinatarios || destinatarios.length === 0) {
    throw new Error('Nenhum destinatário encontrado.');
  }

  if (!assunto || !mensagem) {
    throw new Error('Assunto e mensagem são obrigatórios.');
  }

  const transporte = criarTransporte();

  // Monta o HTML do e-mail com o template da CEC
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      
      <!-- Cabeçalho -->
      <div style="background-color: #1a3a2a; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: #fff; margin: 0; font-size: 20px;">
          Casa do Estudante de Caicó
        </h1>
        <p style="color: #a8c5b0; margin: 4px 0 0; font-size: 13px;">
          Sistema Administrativo — CEC
        </p>
      </div>

      <!-- Corpo -->
      <div style="background: #f9f9f9; padding: 32px; border: 1px solid #e0e0e0;">
        <p style="color: #333; font-size: 15px; line-height: 1.7;">
          ${mensagem.replace(/\n/g, '<br/>')}
        </p>
      </div>

      <!-- Rodapé -->
      <div style="background: #f0f0f0; padding: 16px; text-align: center; border-radius: 0 0 8px 8px; border: 1px solid #e0e0e0; border-top: none;">
        <p style="color: #666; font-size: 12px; margin: 0;">
          Enviado por <strong>${remetente_nome || 'Diretoria CEC'}</strong> via Sistema Administrativo CEC
        </p>
        <p style="color: #999; font-size: 11px; margin: 4px 0 0;">
          Travessa Padre Rafael, nº 71 – Centro, Caicó – RN
        </p>
      </div>
    </div>
  `;

  // Monta os anexos no formato que o nodemailer espera
  // originalname = nome original do arquivo enviado pelo usuário
  // path = caminho temporário salvo pelo multer no servidor
  const attachments = anexos.map(anexo => ({
    filename: anexo.originalname,
    path: anexo.path,
  }));

  // Envia para cada destinatário individualmente
  // (evita expor e-mails de outros sócios)
  const resultados = [];
  const erros = [];

  for (const destinatario of destinatarios) {
    try {
      await transporte.sendMail({
        from: `"Casa do Estudante de Caicó" <${process.env.EMAIL_USER}>`,
        to: destinatario.email,
        subject: assunto,
        html,
        text: mensagem, // fallback texto puro
        attachments,   // anexos incluídos aqui
      });
      resultados.push({ nome: destinatario.nome, email: destinatario.email, enviado: true });
    } catch (err) {
      erros.push({ nome: destinatario.nome, email: destinatario.email, erro: err.message });
    }
  }

  // Remove os arquivos temporários do servidor após o envio
  // Evita acúmulo de arquivos na pasta uploads
  anexos.forEach(anexo => {
    try { fs.unlinkSync(anexo.path); } catch (e) {
      console.warn('[emailService] Não foi possível remover arquivo temporário:', anexo.path);
    }
  });

  return {
    total: destinatarios.length,
    enviados: resultados.length,
    erros: erros.length,
    detalhes: resultados,
    falhas: erros
  };
};

// ─── ORQUESTRADOR PRINCIPAL ──────────────────────────────────
// Recebe o tipo de filtro e os dados, busca destinatários
// e envia o e-mail. Controller só chama esta função.
const processarEnvio = async ({ tipo, ids, departamento, status, assunto, mensagem, remetente_nome, anexos = [] }) => {

  let destinatarios = [];

  // Strategy: cada tipo de filtro tem sua estratégia de busca
  switch (tipo) {
    case 'todos':
      destinatarios = await buscarTodosSocios();
      break;

    case 'departamento':
      if (!departamento) throw new Error('Informe o departamento.');
      destinatarios = await buscarPorDepartamento(departamento);
      break;

    case 'status':
      if (!status) throw new Error('Informe o status.');
      destinatarios = await buscarPorStatus(status);
      break;

    case 'selecionados':
      if (!ids || ids.length === 0) throw new Error('Selecione ao menos um sócio.');
      destinatarios = await buscarPorIds(ids);
      break;

    default:
      throw new Error('Tipo de envio inválido.');
  }

  // Passa os anexos para o enviarEmail
  return await enviarEmail({ destinatarios, assunto, mensagem, remetente_nome, anexos });
};

module.exports = {
  processarEnvio,
  listarSociosParaSelecao
};