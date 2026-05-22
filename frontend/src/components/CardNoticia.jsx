import './CardNoticia.css';

const TIPOS = {
  edital:          { label: 'Edital',            cls: 'edital' },
  ata_assembleia:  { label: 'Ata de Assembleia', cls: 'ata' },
  escala_limpeza:  { label: 'Escala de Limpeza', cls: 'escala' },
  relatorio_gastos:{ label: 'Relatório de Gastos',cls: 'relatorio' },
  comunicado:      { label: 'Comunicado',         cls: 'comunicado' },
  noticia_geral:   { label: 'Notícia',            cls: 'noticia' },
};

const formatarData = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });
};

const resumir = (texto, limite = 180) => {
  if (!texto) return '';
  if (texto.length <= limite) return texto;
  return texto.slice(0, limite).trimEnd() + '...';
};

export default function CardNoticia({ noticia, onClick }) {
  const tipo = TIPOS[noticia.tipo] || { label: noticia.tipo, cls: 'noticia' };

  return (
    <article className="card-noticia" onClick={onClick} role={onClick ? 'button' : undefined} tabIndex={onClick ? 0 : undefined}>
      <div className="cn-header">
        <span className={`cn-badge ${tipo.cls}`}>{tipo.label}</span>
        {noticia.departamento && noticia.departamento !== 'todos' && (
          <span className="cn-dep">{noticia.departamento === 'feminino' ? 'Dep. Feminino' : 'Dep. Masculino'}</span>
        )}
      </div>
      <h3 className="cn-titulo">{noticia.titulo}</h3>
      <p className="cn-preview">{resumir(noticia.conteudo)}</p>
      <div className="cn-meta">
        {noticia.autor && <span>{noticia.autor}{noticia.cargo_autor ? ` · ${noticia.cargo_autor}` : ''}</span>}
        <span className="cn-data">{formatarData(noticia.data_publicacao)}</span>
      </div>
    </article>
  );
}