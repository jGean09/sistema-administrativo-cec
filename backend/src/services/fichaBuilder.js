// ============================================================
// PADRÃO: Builder (GoF)
// Responsabilidade ÚNICA: saber montar o PDF da ficha CEC.
// Se o layout mudar (novo campo, nova fonte, nova célula),
// só este arquivo precisa ser alterado.
//
// SOLID S: este arquivo NÃO busca dados do banco e NÃO
//          envia resposta HTTP — só constrói o documento.
// SOLID O: para adicionar novos campos na ficha, basta
//          adicionar novas chamadas de cell() — sem
//          modificar a estrutura existente.
// ============================================================

const PDFDocument = require('pdfkit');
const path = require('path');

// Caminho da logo — relativo ao projeto para funcionar
// em qualquer máquina (não depende de caminho absoluto)
const LOGO_PATH = path.join(__dirname, '../../../frontend/public/logo.png');

// ─── FUNÇÕES AUXILIARES DE FORMATAÇÃO ────────────────────────
// Responsabilidade: transformar dados brutos em texto legível.
// Ficam aqui pois só são usadas na construção da ficha.

// Formata data do banco (ISO) para DD/MM/AAAA
const fmtData = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  return `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}/${dt.getFullYear()}`;
};

// Garante que valores nulos ou undefined apareçam como '—'
const val = (v) => v && v !== 'null' ? String(v) : '—';

// ─── DIMENSÕES DO DOCUMENTO ──────────────────────────────────
// Constantes centralizadas — se mudar o tamanho do papel,
// só muda aqui e todo o layout se ajusta.
const PW = 595.28; // largura A4 em pontos
const M  = 50;     // margem lateral
const CW = PW - M * 2; // largura útil do conteúdo
const ROW_H = 24;  // altura padrão de cada linha
const LH = 8;      // offset vertical do label dentro da célula

// ─── FUNÇÃO CÉLULA ───────────────────────────────────────────
// Desenha uma célula da tabela com label em negrito e valor.
// Reutilizada em TODAS as linhas da ficha — alta coesão.
// Parâmetros:
//   doc — documento PDF atual
//   x, cy — posição (x horizontal, cy vertical)
//   w, h  — largura e altura da célula
//   label — texto do rótulo (ex: 'NOME:')
//   value — conteúdo a exibir
const cell = (doc, x, cy, w, h, label, value) => {
  // Borda da célula
  doc.rect(x, cy, w, h).stroke('#000');
  // Label em negrito no topo da célula
  doc.fontSize(8).font('Helvetica-Bold').fillColor('#000')
    .text(label, x + 4, cy + LH - 5, { width: w - 8 });
  // Valor em fonte normal abaixo do label
  doc.fontSize(9).font('Helvetica').fillColor('#000')
    .text(value, x + 4, cy + LH + 3, { width: w - 8 });
};

// ─── CONSTRUTOR PRINCIPAL DA FICHA ───────────────────────────
// Recebe os dados do sócio e retorna um PDFDocument pronto
// para ser enviado como resposta HTTP.
// SOLID S: esta função só monta o PDF — não busca dados,
//          não envia resposta, não valida permissões.
const construirFicha = (s) => {
  const doc = new PDFDocument({ size: 'A4', margin: M });

  // ── CABEÇALHO ───────────────────────────────────────────────
  // Logo da CEC no canto esquerdo
  try {
    doc.image(LOGO_PATH, M, 45, { width: 70 });
  } catch (e) {
    // Se a logo não for encontrada, continua sem ela
    console.warn('[fichaBuilder] Logo não encontrada:', LOGO_PATH);
  }

  // Dados institucionais centralizados à direita da logo
  doc.fontSize(11).font('Helvetica-Bold').fillColor('#000')
    .text('CASA DO ESTUDANTE DE CAICÓ', M + 80, 50, { align: 'center', width: CW - 80 });
  doc.fontSize(8).font('Helvetica').fillColor('#000')
    .text('Travessa Padre Rafael, nº 71 – Centro, Sede Própria', M + 80, 65, { align: 'center', width: CW - 80 })
    .text('Rua Boa Vista, nº 142 – Centro, Departamento Feminino da CEC', M + 80, 76, { align: 'center', width: CW - 80 })
    .text('Caicó – RN, CEP: 59.300–000', M + 80, 87, { align: 'center', width: CW - 80 })
    .text('CNPJ: 08.385.957/0001-05', M + 80, 98, { align: 'center', width: CW - 80 });

  // Linha separadora abaixo do cabeçalho
  doc.moveTo(M, 115).lineTo(M + CW, 115).stroke('#000');

  // Título da ficha
  doc.fontSize(13).font('Helvetica-Bold')
    .text('FICHA INDIVIDUAL DO SÓCIO', M, 125, { align: 'center', width: CW, underline: true });

  let y = 155; // posição vertical atual — avança a cada linha

  // ── LINHA 1: Nome + Matrícula ────────────────────────────────
  // Nome ocupa a largura menos 100 (reservado para matrícula)
  cell(doc, M, y, CW - 100, ROW_H, 'NOME:', val(s.nome));

  // Caixa de matrícula ocupa 2 linhas de altura (destaque)
  doc.rect(M + CW - 100, y, 100, ROW_H * 2).stroke('#000');
  doc.fontSize(8).font('Helvetica-Bold')
    .text('Nº MATRÍCULA', M + CW - 96, y + 4, { width: 92, align: 'center' });
  doc.fontSize(12).font('Helvetica-Bold')
    .text(val(s.matricula), M + CW - 96, y + 14, { width: 92, align: 'center' });
  y += ROW_H;

  // ── LINHA 2: Data de Nascimento | Gênero ─────────────────────
  const nascW = 140, genW = (CW - 100) - nascW;
  cell(doc, M, y, nascW, ROW_H, 'DATA DE NASCIMENTO:', fmtData(s.data_nascimento));
  // Gênero exibe checkbox marcado conforme o valor do banco
  const genero = s.genero === 'M' ? '( X ) M   (  ) F' : '(  ) M   ( X ) F';
  cell(doc, M + nascW, y, genW, ROW_H, 'GÊNERO:', genero);
  y += ROW_H;

  // ── LINHA 3: Naturalidade | Inclusão ─────────────────────────
  const natW = 160, inclW = (CW - 100) - natW;
  cell(doc, M, y, natW, ROW_H, 'NATURALIDADE:', val(s.naturalidade));
  cell(doc, M + natW, y, inclW, ROW_H, 'INCLUSÃO:', fmtData(s.data_inclusao || s.created_at));
  y += ROW_H;

  // ── LINHA 4: RG | CPF ────────────────────────────────────────
  const rgW = 160, cpfW = CW - rgW;
  cell(doc, M, y, rgW, ROW_H, 'RG:', val(s.rg));
  cell(doc, M + rgW, y, cpfW, ROW_H, 'CPF:', val(s.cpf));
  y += ROW_H;

  // ── LINHA 5: Nome do Pai ──────────────────────────────────────
  cell(doc, M, y, CW, ROW_H, 'NOME DO PAI:', val(s.nome_pai));
  y += ROW_H;

  // ── LINHA 6: Nome da Mãe ─────────────────────────────────────
  cell(doc, M, y, CW, ROW_H, 'NOME DA MÃE:', val(s.nome_mae));
  y += ROW_H;

  // ── LINHA 7: Telefone | E-mail ───────────────────────────────
  const telW = 160, emailW = CW - telW;
  cell(doc, M, y, telW, ROW_H, 'TELEFONE:', val(s.telefone));
  cell(doc, M + telW, y, emailW, ROW_H, 'E-MAIL:', val(s.email));
  y += ROW_H;

  // ── LINHA 8: Endereço | Nº | Bairro ──────────────────────────
  const endW = 200, numW = 60, baiW = CW - endW - numW;
  cell(doc, M, y, endW, ROW_H, 'ENDEREÇO:', val(s.endereco_logradouro));
  cell(doc, M + endW, y, numW, ROW_H, 'Nº:', val(s.endereco_numero));
  cell(doc, M + endW + numW, y, baiW, ROW_H, 'BAIRRO:', val(s.endereco_bairro));
  y += ROW_H;

  // ── LINHA 9: Cidade | UF | CEP ───────────────────────────────
  const cidW = 200, ufW = 60, cepW = CW - cidW - ufW;
  cell(doc, M, y, cidW, ROW_H, 'CIDADE:', val(s.endereco_cidade));
  cell(doc, M + cidW, y, ufW, ROW_H, 'UF:', val(s.endereco_uf));
  cell(doc, M + cidW + ufW, y, cepW, ROW_H, 'CEP:', val(s.endereco_cep));
  y += ROW_H + 8; // espaço extra antes do bloco acadêmico

  // ── BLOCO ACADÊMICO ──────────────────────────────────────────
  cell(doc, M, y, CW, ROW_H, 'INSTITUIÇÃO DE ENSINO:', val(s.instituicao));
  y += ROW_H;

  const escW = 180, curW = CW - escW;
  cell(doc, M, y, escW, ROW_H, 'ESCOLARIDADE:', val(s.escolaridade));
  cell(doc, M + escW, y, curW, ROW_H, 'CURSO:', val(s.curso));
  y += ROW_H;

  const perW = 180, anoW = CW - perW;
  cell(doc, M, y, perW, ROW_H, 'PERÍODO/ SÉRIE:', val(s.periodo_serie));
  cell(doc, M + perW, y, anoW, ROW_H, 'ANO DE INCLUSÃO:', val(s.ano_inclusao));
  y += ROW_H + 8; // espaço extra antes do bloco de saúde

  // ── BLOCO SAÚDE ──────────────────────────────────────────────
  // Array de pares [label, valor] — fácil de adicionar novos itens
  const saudeItems = [
    ['POSSUI ALGUM TIPO DE ALERGIA? QUAL?', s.alergias],
    ['FAZ USO DE ALGUMA MEDICAÇÃO? QUAL?', s.medicacao],
    ['ALGUMA DOENÇA CRÔNICA? QUAL?', s.doenca_cronica],
    ['DEFICIÊNCIA? QUAL?', s.deficiencia],
    ['FAZ ALGUM TRATAMENTO MÉDICO? QUAL?', s.tratamento_medico],
  ];

  saudeItems.forEach(([label, value]) => {
    doc.rect(M, y, CW, ROW_H).stroke('#000');
    doc.fontSize(8).font('Helvetica-Bold')
      .text(`${label} `, M + 4, y + LH - 2, { continued: true, width: CW - 8 });
    doc.font('Helvetica').text(val(value));
    y += ROW_H;
  });

  // ── ASSINATURAS ──────────────────────────────────────────────
  y += 30;
  const halfW = CW / 2 - 20;
  // Linha de assinatura do sócio
  doc.moveTo(M + 20, y).lineTo(M + 20 + halfW, y).stroke('#000');
  // Linha de assinatura do presidente
  doc.moveTo(M + CW / 2 + 20, y).lineTo(M + CW - 20, y).stroke('#000');

  y += 6;
  doc.fontSize(9).font('Helvetica')
    .text('Ass. Sócio/ Responsável', M, y, { width: CW / 2, align: 'center' })
    .text('Ass. Presidente', M + CW / 2, y, { width: CW / 2, align: 'center' });

  // ── RODAPÉ ───────────────────────────────────────────────────
  y += 40;
  doc.fontSize(7).font('Helvetica-Bold')
    .text(
      'Documentação: 1. Comprovante de residência; 2. Cópia do RG e CPF; ' +
      '3. Declaração de matrícula em instituição de ensino; 4. Atestado médico; ' +
      '5. Certidão de nascimento; 6. Atestado de conduta do indivíduo.',
      M, y, { width: CW, align: 'justify' }
    );

  // Finaliza o documento — após isso não pode mais escrever
  doc.end();

  return doc;
};

module.exports = { construirFicha };