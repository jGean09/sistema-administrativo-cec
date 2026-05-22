// backend/src/controllers/fichaController.js
// Instale: npm install pdfkit
const PDFDocument = require('pdfkit');
const pool = require('../config/database');

const gerarFicha = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('SELECT * FROM socios WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Sócio não encontrado.' });

    const s = result.rows[0];

    // Formatar data
    const fmtData = (d) => {
      if (!d) return '—';
      const dt = new Date(d);
      return `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}/${dt.getFullYear()}`;
    };

    const val = (v) => v && v !== 'null' ? String(v) : '—';

    // Configurar resposta
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="ficha_${s.matricula || s.id}.pdf"`);

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    doc.pipe(res);

    const PW = 595.28; // largura A4
    const M  = 50;     // margem
    const CW = PW - M * 2; // largura útil

    // ── CABEÇALHO ─────────────────────────────────────────────────────
    doc.save();
    const path = require('path');
    const logoPath = 'C:\\Users\\joseg\\Documents\\projeto_POO2\\frontend\\public\\logo.png';
    doc.image(logoPath, M, 45, { width: 70 });
    doc.restore();

    // Texto do cabeçalho
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#000')
      .text('CASA DO ESTUDANTE DE CAICÓ', M + 80, 50, { align: 'center', width: CW - 80 });
    doc.fontSize(8).font('Helvetica').fillColor('#000')
      .text('Travessa Padre Rafael, nº 71 – Centro, Sede Própria', M + 80, 65, { align: 'center', width: CW - 80 })
      .text('Rua Boa Vista, nº 142 – Centro, Departamento Feminino da CEC', M + 80, 76, { align: 'center', width: CW - 80 })
      .text('Caicó – RN, CEP: 59.300–000', M + 80, 87, { align: 'center', width: CW - 80 })
      .text('CNPJ: 08.385.957/0001-05', M + 80, 98, { align: 'center', width: CW - 80 });

    // Linha separadora do cabeçalho
    doc.moveTo(M, 115).lineTo(M + CW, 115).stroke('#000');

    // Título
    doc.fontSize(13).font('Helvetica-Bold')
      .text('FICHA INDIVIDUAL DO SÓCIO', M, 125, { align: 'center', width: CW, underline: true });

    let y = 155;
    const ROW_H = 24;
    const lh = 8; // label height offset

    // ── FUNÇÃO AUXILIAR: desenhar célula ──────────────────────────────
    const cell = (x, cy, w, h, label, value, opts = {}) => {
      doc.rect(x, cy, w, h).stroke('#000');
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#000')
        .text(label, x + 4, cy + lh - 5, { width: w - 8 });
      doc.fontSize(9).font('Helvetica').fillColor('#000')
        .text(value, x + 4, cy + lh + 3, { width: w - 8, ...opts });
    };

    // ── LINHA 1: Nome ─────────────────────────────────────────────────
    cell(M, y, CW - 100, ROW_H, 'NOME:', val(s.nome));
    
    // Caixa matrícula (direita, ocupa 2 linhas)
    doc.rect(M + CW - 100, y, 100, ROW_H * 2).stroke('#000');
    doc.fontSize(8).font('Helvetica-Bold').text('Nº MATRÍCULA', M + CW - 96, y + 4, { width: 92, align: 'center' });
    doc.fontSize(12).font('Helvetica-Bold').text(val(s.matricula), M + CW - 96, y + 14, { width: 92, align: 'center' });

    y += ROW_H;

    // ── LINHA 2: Nascimento | Gênero ──────────────────────────────────
    const nascW = 140, genW = (CW - 100) - nascW;
    cell(M, y, nascW, ROW_H, 'DATA DE NASCIMENTO:', fmtData(s.data_nascimento));
    const genero = s.genero === 'M' ? '( X ) M   (  ) F' : '(  ) M   ( X ) F';
    cell(M + nascW, y, genW, ROW_H, 'GÊNERO:', genero);
    y += ROW_H;

    // ── LINHA 3: Naturalidade | Inclusão ─────────────────────────────
    const natW = 160, inclW = (CW - 100) - natW;
    cell(M, y, natW, ROW_H, 'NATURALIDADE:', val(s.naturalidade));
    cell(M + natW, y, inclW, ROW_H, 'INCLUSÃO:', fmtData(s.data_inclusao || s.created_at));
    y += ROW_H;

    // ── LINHA 4: RG | CPF ─────────────────────────────────────────────
    const rgW = 160, cpfW = CW - rgW;
    cell(M, y, rgW, ROW_H, 'RG:', val(s.rg));
    cell(M + rgW, y, cpfW, ROW_H, 'CPF:', val(s.cpf));
    y += ROW_H;

    // ── LINHA 5: Nome do Pai ──────────────────────────────────────────
    cell(M, y, CW, ROW_H, 'NOME DO PAI:', val(s.nome_pai));
    y += ROW_H;

    // ── LINHA 6: Nome da Mãe ─────────────────────────────────────────
    cell(M, y, CW, ROW_H, 'NOME DA MÃE:', val(s.nome_mae));
    y += ROW_H;

    // ── LINHA 7: Telefone | E-mail ────────────────────────────────────
    const telW = 160, emailW = CW - telW;
    cell(M, y, telW, ROW_H, 'TELEFONE:', val(s.telefone));
    cell(M + telW, y, emailW, ROW_H, 'E-MAIL:', val(s.email));
    y += ROW_H;

    // ── LINHA 8: Endereço | Nº | Bairro ──────────────────────────────
    const endW = 200, numW = 60, baiW = CW - endW - numW;
    cell(M, y, endW, ROW_H, 'ENDEREÇO:', val(s.endereco_logradouro));
    cell(M + endW, y, numW, ROW_H, 'Nº:', val(s.endereco_numero));
    cell(M + endW + numW, y, baiW, ROW_H, 'BAIRRO:', val(s.endereco_bairro));
    y += ROW_H;

    // ── LINHA 9: Cidade | UF | CEP ────────────────────────────────────
    const cidW = 200, ufW = 60, cepW = CW - cidW - ufW;
    cell(M, y, cidW, ROW_H, 'CIDADE:', val(s.endereco_cidade));
    cell(M + cidW, y, ufW, ROW_H, 'UF:', val(s.endereco_uf));
    cell(M + cidW + ufW, y, cepW, ROW_H, 'CEP:', val(s.endereco_cep));
    y += ROW_H + 8;

    // ── BLOCO ACADÊMICO (ATUALIZADO) ──────────────────────────────────
    cell(M, y, CW, ROW_H, 'INSTITUIÇÃO DE ENSINO:', val(s.instituicao));
    y += ROW_H;
    
    // Divisão proporcional da linha para Escolaridade e Curso
    const escW = 180;
    const curW = CW - escW;
    cell(M, y, escW, ROW_H, 'ESCOLARIDADE:', val(s.escolaridade));
    cell(M + escW, y, curW, ROW_H, 'CURSO:', val(s.curso));
    y += ROW_H;

    const perW = 180, anoW = CW - perW;
    cell(M, y, perW, ROW_H, 'PERÍODO/ SÉRIE:', val(s.periodo_serie));
    cell(M + perW, y, anoW, ROW_H, 'ANO DE INCLUSÃO:', val(s.ano_inclusao));
    y += ROW_H + 8;

    // ── BLOCO SAÚDE ───────────────────────────────────────────────────
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
        .text(`${label} `, M + 4, y + lh - 2, { continued: true, width: CW - 8 });
      doc.font('Helvetica').text(val(value));
      y += ROW_H;
    });

    // ── ASSINATURAS ───────────────────────────────────────────────────
    y += 30;
    const halfW = CW / 2 - 20;
    doc.moveTo(M + 20, y).lineTo(M + 20 + halfW, y).stroke('#000');
    doc.moveTo(M + CW / 2 + 20, y).lineTo(M + CW - 20, y).stroke('#000');

    y += 6;
    doc.fontSize(9).font('Helvetica')
      .text('Ass. Sócio/ Responsável', M, y, { width: CW / 2, align: 'center' })
      .text('Ass. Presidente', M + CW / 2, y, { width: CW / 2, align: 'center' });

    // ── RODAPÉ ────────────────────────────────────────────────────────
    y += 40;
    doc.fontSize(7).font('Helvetica-Bold')
      .text(
        'Documentação: 1. Comprovante de residência; 2. Cópia do RG e CPF; 3. Declaração de matrícula em instituição de ensino; 4. Atestado médico; 5. Certidão de nascimento; 6. Atestado de conduta do indivíduo.',
        M, y, { width: CW, align: 'justify' }
      );

    doc.end();

  } catch (err) {
    console.error(err);
    if (!res.headersSent) res.status(500).json({ error: 'Erro ao gerar ficha.' });
  }
};

module.exports = { gerarFicha };