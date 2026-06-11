// ============================================================
// PADRÃO: Builder (GoF)
// Responsabilidade ÚNICA: montar a Declaração de Residência
// da CEC em formato PDF.
// ============================================================

const PDFDocument = require('pdfkit');
const path        = require('node:path');
const fs          = require('node:fs');

// ─── CAMINHOS DOS ASSETS ─────────────────────────────────────
const LOGO_PATH       = path.join(__dirname, '../../../frontend/src/assets/logo.png');
const ASSINATURA_PATH = path.join(__dirname, '../../../frontend/src/assets/assinatura_presidente.png');

// ─── ENDEREÇOS POR GÊNERO ────────────────────────────────────
const ENDERECO_FEMININO  = 'Rua Boa Vista, número 142, Centro, Caicó/RN';
const ENDERECO_MASCULINO = 'Travessa Padre Rafael, número 71, Centro, Caicó/RN';

// ─── MESES POR EXTENSO ───────────────────────────────────────
const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
];

// ─── SIGLAS DE ESTADOS ───────────────────────────────────────
const UFs = new Set([
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS',
  'MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC',
  'SP','SE','TO'
]);

// ─── FUNÇÕES AUXILIARES ──────────────────────────────────────

const toTitleCase = (str) => {
  if (!str || str === 'null') return '—';
  const minusculos = new Set(['da', 'de', 'do', 'das', 'dos', 'e', 'a', 'o', 'em', 'na', 'no']);
  return String(str).toLowerCase().split(' ')
    .map((w, i) => (i === 0 || !minusculos.has(w)) ? w.charAt(0).toUpperCase() + w.slice(1) : w)
    .join(' ');
};

const fmtNaturalidade = (str) => {
  if (!str || str === 'null') return '—';
  const partes = String(str).split(/([\u2013\/\-])/);
  return partes.map((parte, i) => {
    if (i % 2 === 1) return parte;
    const t = parte.trim();
    if (UFs.has(t.toUpperCase())) return parte.replace(t, t.toUpperCase());
    return toTitleCase(parte);
  }).join('');
};

const fmtDataExtenso = (d) => {
  if (!d) return '—';
  const dt = typeof d === 'string' && d.length >= 10
    ? new Date(d.substring(0, 10) + 'T00:00:00Z') : new Date(d);
  return `${dt.getUTCDate()} de ${MESES[dt.getUTCMonth()]} de ${dt.getUTCFullYear()}`;
};

const val = (v) => (v && v !== 'null' ? String(v) : '—');

// ─── DIMENSÕES ───────────────────────────────────────────────
const PW     = 595.28;
const ML     = 80;
const MR     = 80;
const MT     = 50;
const CW     = PW - ML - MR;
const INDENT = 35;

const F_NORMAL        = 'Times-Roman';
const F_BOLD          = 'Times-Bold';
const F_HEADER_NORMAL = 'Helvetica';
const F_HEADER_BOLD   = 'Helvetica-Bold';
const FONT_SIZE       = 12;
const LINE_GAP        = 4;

// ─── HELPER: texto justificado simulando negrito inline ───────
// PDFKit perde o justify quando mistura continued+justify.
// Solução: montamos o parágrafo completo com marcadores,
// e renderizamos palavra a palavra controlando x manualmente.
// Para simplificar e garantir justify correto, usamos a abordagem
// de renderizar o parágrafo inteiro em dois passes:
//   1. Texto completo em normal para calcular quebras (invisível)
//   2. Texto real misturando bold/normal por token
//
// Na prática o PDFKit justify funciona bem com continued desde que
// NÃO troquemos de fonte no meio de uma linha — então a solução
// mais confiável é: negrito só no primeiro token (nome) que
// termina numa quebra natural, e o resto em normal.
//
// Para garantir justify perfeito, renderizamos o parágrafo como
// texto único após substituir o nome por placeholder, depois
// desenhamos o nome em bold por cima na posição certa.
// ─────────────────────────────────────────────────────────────

// ─── CONSTRUTOR PRINCIPAL ────────────────────────────────────
const construirDeclaracao = (s) => {
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: MT, bottom: 55, left: ML, right: MR },
    info: { Title: `Declaração - ${toTitleCase(s.nome)}` }
  });

  const feminino  = s.genero === 'F';
  const pronome   = feminino ? 'portadora' : 'portador';
  const qualidade = feminino ? 'sócia'     : 'sócio';
  const filiacao  = feminino ? 'filha'     : 'filho';
  const endResid  = feminino ? ENDERECO_FEMININO : ENDERECO_MASCULINO;

  const nomeSocio    = toTitleCase(s.nome);
  const nomeMae      = toTitleCase(s.nome_mae);
  const nomePai      = toTitleCase(s.nome_pai);
  const naturalidade = fmtNaturalidade(s.naturalidade);

  const temRg   = s.rg && s.rg !== 'null' && String(s.rg).trim() !== '';
  const docsStr = temRg
    ? `${pronome} do RG ${val(s.rg)} ITEP/RN e do CPF ${val(s.cpf)}`
    : `${pronome} do CPF ${val(s.cpf)} ITEP/RN`;

  const dataInclusao = fmtDataExtenso(s.data_inclusao || s.created_at);
  const hoje = (() => {
    const n = new Date();
    return `Caicó-RN, ${n.getDate()} de ${MESES[n.getMonth()]} de ${n.getFullYear()}.`;
  })();

  // ═══════════════════════════════════════════════════════════
  // CABEÇALHO
  // ═══════════════════════════════════════════════════════════
  let logoOk = false;
  try {
    if (fs.existsSync(LOGO_PATH)) {
      doc.image(LOGO_PATH, ML, MT, { width: 65, height: 65 });
      logoOk = true;
    }
  } catch (e) { console.warn('[declaracaoBuilder] Logo não encontrada'); }

  const hX = logoOk ? ML + 75 : ML;
  const hW = logoOk ? CW - 75 : CW;
  const hAlign = logoOk ? 'left' : 'center';

  doc.fontSize(11).font(F_HEADER_BOLD).fillColor('#000')
    .text('CASA DO ESTUDANTE DE CAICÓ', hX, MT + 2, { width: hW, align: hAlign });

  doc.fontSize(8).font(F_HEADER_NORMAL).fillColor('#000');
  let hy = MT + 18;
  [
    'Travessa Padre Rafael, nº 71 – Centro, Sede Própria',
    'Rua Boa Vista, nº 142 – Centro, Departamento Feminino da CEC',
    'Caicó – RN, CEP: 59.300–000',
    'CNPJ: 08.385.957/0001-05',
  ].forEach(line => { doc.text(line, hX, hy, { width: hW, align: hAlign }); hy += 11; });

  const sepY = MT + 72;
  doc.moveTo(ML, sepY).lineTo(ML + CW, sepY).lineWidth(1).stroke('#000');

  // ═══════════════════════════════════════════════════════════
  // TÍTULO
  // ═══════════════════════════════════════════════════════════
  doc.fontSize(14).font(F_BOLD).fillColor('#000')
    .text('D E C L A R A Ç Ã O', ML, sepY + 50, {
      width: CW, align: 'center', underline: true,
    });

  // ═══════════════════════════════════════════════════════════
  // PARÁGRAFO 1
  // Estratégia: renderizar o parágrafo completo com o nome
  // em negrito no início usando continued, mas com align:'justify'
  // somente no bloco final (o que define o comportamento de toda linha).
  // O nome fica em bold na primeira parte do continued chain.
  // ═══════════════════════════════════════════════════════════
  const p1Y = sepY + 105;

  const p1ante  = 'Declaramos para os devidos fins que se fizerem necessários, que ';
  const p1depois =
    `, ${docsStr}, ` +
    `${filiacao} de ${nomeMae} e ${nomePai}, ` +
    `natural de ${naturalidade}, ` +
    `é ${qualidade} e residente na ${endResid} nesta referida Instituição ` +
    `desde ${dataInclusao}.`;

  // Renderiza os 3 segmentos como um único bloco contínuo.
  // O align:'justify' no último segmento se aplica a todo o bloco.
  doc.fontSize(FONT_SIZE).font(F_NORMAL).fillColor('#000')
    .text(p1ante, ML + INDENT, p1Y, {
      width: CW - INDENT,
      lineGap: LINE_GAP,
      continued: true,
    });
  doc.font(F_BOLD)
    .text(nomeSocio, { continued: true, lineGap: LINE_GAP });
  doc.font(F_NORMAL)
    .text(p1depois, {
      continued: false,
      lineGap: LINE_GAP,
      align: 'justify',
    });

  // ═══════════════════════════════════════════════════════════
  // PARÁGRAFO 2
  // ═══════════════════════════════════════════════════════════
  const p2Y      = doc.y + 16;
  const p2artigo = feminino ? 'a referida sócia' : 'o referido sócio';

  doc.fontSize(FONT_SIZE).font(F_NORMAL).fillColor('#000')
    .text('Ressaltamos que ', ML + INDENT, p2Y, {
      width: CW - INDENT,
      lineGap: LINE_GAP,
      continued: true,
    });
  doc.font(F_BOLD)
    .text(
      `${p2artigo} mantém regularmente o pagamento da contribuição social mensal no valor de R$ 135,00 (cento e trinta e cinco reais)`,
      { continued: true, lineGap: LINE_GAP }
    );
  doc.font(F_NORMAL)
    .text(', destinada à manutenção das atividades desta Casa.', {
      continued: false,
      align: 'justify',
      lineGap: LINE_GAP,
    });

  // ═══════════════════════════════════════════════════════════
  // LOCAL E DATA
  // ═══════════════════════════════════════════════════════════
  doc.moveDown(3);
  doc.fontSize(FONT_SIZE).font(F_NORMAL).fillColor('#000')
    .text(hoje, ML, doc.y, { width: CW, align: 'right' });

  // ═══════════════════════════════════════════════════════════
  // ASSINATURA — centralizada, com bastante espaço acima
  // ═══════════════════════════════════════════════════════════
  // Espaço generoso entre data e assinatura (igual ao modelo)
  doc.moveDown(3);
  const assY = doc.y;

  const assW = 260;                    // largura da área
  const assH = 65;                     // altura da imagem da assinatura
  const assX = (PW - assW) / 2;       // centro horizontal da página

  let assOk = false;
  try {
    if (fs.existsSync(ASSINATURA_PATH)) {
      doc.image(ASSINATURA_PATH, assX, assY, { width: assW, height: assH });
      assOk = true;
    }
  } catch (e) { console.warn('[declaracaoBuilder] Assinatura não encontrada'); }

  // Linha sob a assinatura — sempre presente
  const linhaY = assY + assH + 3;
  doc.moveTo(assX, linhaY)
     .lineTo(assX + assW, linhaY)
     .lineWidth(1).stroke('#000');

  // Nome e cargo centralizados abaixo da linha
  const infoY = linhaY + 7;
  doc.fontSize(11).font(F_BOLD).fillColor('#000')
    .text('Jackson Martins Dantas', assX, infoY,     { width: assW, align: 'center' });
  doc.fontSize(11).font(F_BOLD)
    .text('PRESIDENTE DA CEC',     assX, infoY + 16, { width: assW, align: 'center' });
  doc.fontSize(11).font(F_BOLD)
    .text('CPF: 101.454.554-40',   assX, infoY + 32, { width: assW, align: 'center' });

  doc.end();
  return doc;
};

module.exports = { construirDeclaracao };