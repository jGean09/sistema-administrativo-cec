import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import './LandingPage.css';

import logoCEC from '../assets/logo.png'; 

const LINK_INSCRICAO = "https://docs.google.com/forms/d/e/1FAIpQLSfxMGO9G5SIgzc49i0dJUXGxSt-PswSOZ7RprpwweRsw_CaFQ/viewform?usp=sharing&ouid=100203948435918790425";

const COR_CATEGORIA = {
  aviso: '#1565c0', edital: '#6a1b9a',
  assembleia: '#e65100', portaria: '#2e7d32', escala: '#558b2f'
};

const LandingPage = () => {
  const [noticias, setNoticias] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(null);

  useEffect(() => {
    api.get('/public/noticias')
      .then(res => setNoticias(Array.isArray(res.data) ? res.data.slice(0, 6) : []))
      .catch(() => {})
      .finally(() => setCarregando(false));
  }, []);

  const abrirModal = (n) => setModalAberto(n);
  const fecharModal = () => setModalAberto(null);

  return (
    <div className="landing-wrapper">
      {/* NAVBAR */}
      <nav className="navbar">
        <div className="nav-content">
          <div className="brand">
            {/* 👇 2. Usando a variável da logo importada no src */}
            <img src={logoCEC} alt="Logo CEC" className="navbar-logo" />
            <div className="brand-text">
              <span className="main-title">Casa do Estudante de Caicó</span>
              <span className="sub-title">Desde 1960</span>
            </div>
          </div>
          <Link to="/login" className="login-pill">Área do Sócio</Link>
        </div>
      </nav>

      {/* HERO */}
      <header className="hero-section">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1>Assistência e Moradia Estudantil</h1>
          <p>Oferecendo suporte aos estudantes da UFRN em Caicó com transparência e união.</p>
          <div className="hero-btns">
            <a href={LINK_INSCRICAO} target="_blank" rel="noreferrer" className="cta-button">
              Inscrever-se no Processo Seletivo
            </a>
          </div>
        </div>
      </header>

      {/* NOTÍCIAS PÚBLICAS */}
      <section className="news-section">
        <div className="section-header">
          <h2>Informativos e Editais</h2>
          <div className="accent-line"></div>
        </div>

        {carregando ? (
          <div className="loading-msg">Carregando informativos...</div>
        ) : noticias.length === 0 ? (
          <div className="empty-news">
            <p>Não há editais ou notícias públicas no momento.</p>
          </div>
        ) : (
          <div className="news-grid">
            {noticias.map(n => (
              <article key={n.id} className="public-news-card" onClick={() => abrirModal(n)}>
                {n.imagem_url && (
                  <div className="card-img-wrap">
                    <img src={`http://localhost:3001${n.imagem_url}`} alt="" />
                  </div>
                )}
                <div className="card-body">
                  <span className="card-badge" style={{ background: COR_CATEGORIA[n.categoria] || '#1b3d2f' }}>
                    {n.categoria || 'Geral'}
                  </span>
                  <h3>{n.titulo}</h3>
                  <p>{n.conteudo?.substring(0, 120)}{n.conteudo?.length > 120 ? '...' : ''}</p>
                  <div className="news-footer">
                    <span className="news-date">{new Date(n.created_at).toLocaleDateString('pt-BR')}</span>
                    <span className="ver-mais">Ver mais →</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* MODAL */}
      {modalAberto && (
        <div className="modal-overlay" onClick={fecharModal}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={fecharModal}>✕</button>
            {modalAberto.imagem_url && (
              <img
                src={`http://localhost:3001${modalAberto.imagem_url}`}
                alt=""
                className="modal-img"
              />
            )}
            <div className="modal-body">
              <span className="card-badge" style={{ background: COR_CATEGORIA[modalAberto.categoria] || '#1b3d2f' }}>
                {modalAberto.categoria || 'Geral'}
              </span>
              <h2>{modalAberto.titulo}</h2>
              <p className="modal-data">{new Date(modalAberto.created_at).toLocaleDateString('pt-BR')}</p>
              <p className="modal-conteudo">{modalAberto.conteudo}</p>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="landing-footer">
        <div className="footer-content">
          <p><strong>Casa do Estudante de Caicó - RN</strong></p>
          <p>Travessa Padre Rafael, nº 71 – Centro | Caicó – RN</p>
          <p className="copyright">© 2026 Sistema Administrativo CEC</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;