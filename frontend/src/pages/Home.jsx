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
    <div className="home" style={{ padding: '24px' }}>

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
              {[1,2,3].map(i => <div key={i} className="skeleton-card" />)}
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
              style={{
                background: '#fff', borderRadius: '10px',
                border: '0.5px solid #e4e6eb', overflow: 'hidden',
                cursor: 'pointer', marginBottom: '12px'
              }}
              onClick={() => setNoticiaAberta(n)}
            >
              {/* Cabeçalho */}
              <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '50%',
                  background: '#1b3d2f', color: '#fff', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '14px', fontWeight: 'bold'
                }}>
                  {n.autor_nome?.split(' ').slice(0,2).map(p => p[0]).join('').toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: '600', fontSize: '14px', color: '#050505' }}>{n.autor_nome}</div>
                  <div style={{ fontSize: '12px', color: '#65676b', display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                    {new Date(n.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    &nbsp;·&nbsp;
                    <span style={{
                      background: COR_CATEGORIA[n.categoria] || '#666',
                      color: '#fff', padding: '1px 8px',
                      borderRadius: '20px', fontSize: '10px', fontWeight: 'bold'
                    }}>
                      {LABEL_CATEGORIA[n.categoria] || n.categoria}
                    </span>
                    {n.visibilidade === 'socios' && (
                      <span style={{ color: '#e65100', fontSize: '11px' }}>🔒</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Texto */}
              <div style={{ padding: '0 16px 12px', fontSize: '15px', color: '#050505', lineHeight: '1.6' }}>
                <strong style={{ display: 'block', marginBottom: '6px', fontSize: '16px' }}>{n.titulo}</strong>
                <span style={{ color: '#444' }}>
                  {n.conteudo.length > 300 ? n.conteudo.substring(0, 300) + '... ' : n.conteudo}
                  {n.conteudo.length > 300 && (
                    <span style={{ color: '#65676b', fontSize: '14px' }}>ver mais</span>
                  )}
                </span>
              </div>

              {/* Imagem em tamanho original */}
              {n.imagem_url && (
                <img
                  src={`http://localhost:3001${n.imagem_url}`} alt=""
                  style={{ width: '100%', display: 'block', maxHeight: '600px', objectFit: 'contain', background: '#f0f2f5' }}
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
        <div
          className="modal-overlay"
          onClick={() => setNoticiaAberta(null)}
          style={{ alignItems: 'center', background: 'rgba(0,0,0,0.75)' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: '10px',
              width: '100%', maxWidth: '680px',
              maxHeight: '90vh', overflowY: 'auto',
              position: 'relative'
            }}
          >
            {/* Botão fechar */}
            <button
              onClick={() => setNoticiaAberta(null)}
              style={{
                position: 'sticky', top: '10px', float: 'right', marginRight: '10px',
                background: '#e4e6eb', border: 'none',
                width: '36px', height: '36px', borderRadius: '50%',
                cursor: 'pointer', fontSize: '16px', color: '#444',
                zIndex: 10
              }}
            >✕</button>

            {/* Cabeçalho modal */}
            <div style={{ padding: '16px 16px 12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '50%',
                background: '#1b3d2f', color: '#fff', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '16px', fontWeight: 'bold'
              }}>
                {noticiaAberta.autor_nome?.split(' ').slice(0,2).map(p => p[0]).join('').toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: '700', fontSize: '15px', color: '#050505' }}>{noticiaAberta.autor_nome}</div>
                <div style={{ fontSize: '12px', color: '#65676b', display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                  {new Date(noticiaAberta.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                  &nbsp;·&nbsp;
                  <span style={{
                    background: COR_CATEGORIA[noticiaAberta.categoria] || '#666',
                    color: '#fff', padding: '1px 8px',
                    borderRadius: '20px', fontSize: '10px', fontWeight: 'bold'
                  }}>
                    {LABEL_CATEGORIA[noticiaAberta.categoria] || noticiaAberta.categoria}
                  </span>
                  {noticiaAberta.visibilidade === 'socios' && (
                    <span style={{ color: '#e65100' }}>🔒 Exclusivo sócios</span>
                  )}
                </div>
              </div>
            </div>

            {/* Título + Texto completo */}
            <div style={{ padding: '0 16px 14px', fontSize: '15px', color: '#050505', lineHeight: '1.7' }}>
              <strong style={{ display: 'block', fontSize: '18px', marginBottom: '10px' }}>
                {noticiaAberta.titulo}
              </strong>
              {noticiaAberta.conteudo.split('\n').map((p, i) =>
                p.trim()
                  ? <p key={i} style={{ margin: '0 0 10px' }}>{p}</p>
                  : <br key={i} />
              )}
            </div>

            {/* Imagem em tamanho original */}
            {noticiaAberta.imagem_url && (
              <img
                src={`http://localhost:3001${noticiaAberta.imagem_url}`} alt=""
                style={{ width: '100%', display: 'block', objectFit: 'contain', background: '#000' }}
              />
            )}

            <div style={{ height: '16px' }} />
          </div>
        </div>
      )}

    </div>
  );
}