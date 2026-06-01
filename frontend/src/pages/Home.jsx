import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './Home.css';

const FILTROS = [
  { value: '', label: 'Tudo' },
  { value: 'aviso', label: 'Avisos' },
  { value: 'edital', label: 'Editais' },
  { value: 'assembleia', label: 'Assembleias' },
  { value: 'portaria', label: 'Portarias' },
  { value: 'escala', label: 'Escalas' },
];

const COR_CATEGORIA = {
  aviso: '#1565c0', edital: '#6a1b9a',
  assembleia: '#e65100', portaria: '#2e7d32', escala: '#558b2f'
};

const LABEL_CATEGORIA = {
  aviso: 'Aviso', edital: 'Edital',
  assembleia: 'Assembleia', portaria: 'Portaria', escala: 'Escala'
};

const HORARIOS_MASC = [
  { label: 'Café da manhã', valor: '6h – 7h30' },
  { label: 'Almoço', valor: '11h – 13h' },
  { label: 'Jantar', valor: '17h30 – 19h' },
  { label: 'Silêncio (seg–sex)', valor: '19h30 – 6h' },
  { label: 'Silêncio (fds)', valor: '23h – 6h' },
];

const HORARIOS_FEM = [
  { label: 'Café da manhã', valor: '6h – 9h' },
  { label: 'Almoço', valor: '11h – 13h' },
  { label: 'Jantar', valor: '17h30 – 19h' },
  { label: 'Silêncio manhã', valor: '8h – 11h' },
  { label: 'Silêncio tarde', valor: '13h30 – 16h30' },
  { label: 'Silêncio noite', valor: '20h – 6h' },
];

export default function Home() {
  const { usuario } = useAuth();
  const [noticias, setNoticias] = useState([]);
  const [filtro, setFiltro] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);
  const [noticiaAberta, setNoticiaAberta] = useState(null);

  useEffect(() => {
    api.get('/noticias')
      .then(res => setNoticias(Array.isArray(res.data) ? res.data : []))
      .catch(() => setErro(true))
      .finally(() => setCarregando(false));
  }, []);

  const noticiasFiltradas = filtro
    ? noticias.filter(n => n.categoria === filtro)
    : noticias;

  const horarios = usuario?.departamento === 'feminino' ? HORARIOS_FEM : HORARIOS_MASC;

  return (
    <div className="home-container">

      {/* FEED */}
      <div className="home-feed">
        <div className="feed-filtros">
          {FILTROS.map(f => (
            <button
              key={f.value}
              className={`filtro-btn ${filtro === f.value ? 'ativo' : ''}`}
              onClick={() => setFiltro(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="feed-lista">
          {carregando && (
            <div className="feed-loading">
              {[1, 2, 3].map(i => <div key={i} className="skeleton-card" />)}
            </div>
          )}

          {erro && (
            <div className="feed-erro">
              Não foi possível carregar as notícias. Verifique sua conexão.
            </div>
          )}

          {!carregando && !erro && noticiasFiltradas.length === 0 && (
            <div className="feed-vazio">
              <div className="feed-vazio-icone">📭</div>
              <p>Nenhuma notícia encontrada.</p>
              {filtro && (
                <button className="btn-link" onClick={() => setFiltro('')}>
                  Ver todas as notícias
                </button>
              )}
            </div>
          )}

          {/* CARDS ESTILO FACEBOOK */}
          {!carregando && noticiasFiltradas.map(n => (
            <div
              key={n.id}
              className="feed-card"
              onClick={() => setNoticiaAberta(n)}
            >
              {/* Cabeçalho do Card */}
              <div className="card-header">
                <div className="avatar">
                  {n.autor_nome?.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase()}
                </div>
                <div className="card-header-info">
                  <div className="author-name">{n.autor_nome}</div>
                  <div className="meta-info">
                    {new Date(n.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    &nbsp;·&nbsp;
                    <span 
                      className="badge-categoria" 
                      style={{ backgroundColor: COR_CATEGORIA[n.categoria] || '#666' }}
                    >
                      {LABEL_CATEGORIA[n.categoria] || n.categoria}
                    </span>
                    {n.visibilidade === 'socios' && (
                      <span className="badge-exclusivo">🔒</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Texto do Card */}
              <div className="card-content">
                <strong className="card-title">{n.titulo}</strong>
                <span className="card-text">
                  {n.conteudo.length > 300 ? n.conteudo.substring(0, 300) + '... ' : n.conteudo}
                  {n.conteudo.length > 300 && (
                    <span className="ver-mais">ver mais</span>
                  )}
                </span>
              </div>

              {/* Imagem do Card */}
              {n.imagem_url && (
                <img
                  src={`http://localhost:3001${n.imagem_url}`} 
                  alt=""
                  className="card-image"
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ASIDE */}
      <aside className="home-aside">
        <div className="widget">
          <div className="widget-titulo">
            🕐 Horários — {usuario?.departamento === 'feminino' ? 'Dep. Feminino' : 'Sede Masculina'}
          </div>
          {horarios.map(h => (
            <div key={h.label} className="horario-linha">
              <span className="horario-label">{h.label}</span>
              <span className="horario-valor">{h.valor}</span>
            </div>
          ))}
        </div>

        <div className="widget">
          <div className="widget-titulo">💰 Mensalidade</div>
          <div className="mensalidade-info">
            <p>Vencimento todo dia <strong>10</strong> de cada mês.</p>
            <p>Em caso de dúvidas, entre em contato com o Tesoureiro.</p>
          </div>
        </div>
      </aside>

      {/* MODAL ESTILO FACEBOOK */}
      {noticiaAberta && (
        <div className="modal-overlay" onClick={() => setNoticiaAberta(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            
            {/* Botão fechar */}
            <button className="modal-close-btn" onClick={() => setNoticiaAberta(null)}>
              ✕
            </button>

            {/* Cabeçalho modal */}
            <div className="modal-header">
              <div className="avatar modal-avatar">
                {noticiaAberta.autor_nome?.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase()}
              </div>
              <div className="modal-header-info">
                <div className="author-name modal-author-name">{noticiaAberta.autor_nome}</div>
                <div className="meta-info">
                  {new Date(noticiaAberta.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                  &nbsp;·&nbsp;
                  <span 
                    className="badge-categoria" 
                    style={{ backgroundColor: COR_CATEGORIA[noticiaAberta.categoria] || '#666' }}
                  >
                    {LABEL_CATEGORIA[noticiaAberta.categoria] || noticiaAberta.categoria}
                  </span>
                  {noticiaAberta.visibilidade === 'socios' && (
                    <span className="badge-exclusivo modal-badge-exclusivo">🔒 Exclusivo sócios</span>
                  )}
                </div>
              </div>
            </div>

            {/* Título + Texto completo */}
            <div className="modal-content-body">
              <strong className="modal-title">{noticiaAberta.titulo}</strong>
              {noticiaAberta.conteudo.split('\n').map((p, i) =>
                p.trim()
                  ? <p key={i}>{p}</p>
                  : <br key={i} />
              )}
            </div>

            {/* Imagem em tamanho original */}
            {noticiaAberta.imagem_url && (
              <img
                src={`http://localhost:3001${noticiaAberta.imagem_url}`} 
                alt=""
                className="modal-image"
              />
            )}

            <div className="modal-spacer" />
          </div>
        </div>
      )}

    </div>
  );
}