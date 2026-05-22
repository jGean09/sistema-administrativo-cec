import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import './LandingPage.css';

// Link para o formulário externo do Google
const LINK_INSCRICAO = "https://docs.google.com/forms/d/e/1FAIpQLSfxMGO9G5SIgzc49i0dJUXGxSt-PswSOZ7RprpwweRsw_CaFQ/viewform?usp=sharing&ouid=100203948435918790425"; 

const LandingPage = () => {
  const [noticias, setNoticias] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    // Busca notícias marcadas como públicas no backend
    api.get('/public/noticias')
      .then(response => {
        setNoticias(response.data);
        setCarregando(false);
      })
      .catch(err => {
        console.error("Erro ao carregar notícias públicas:", err);
        setCarregando(false);
      });
  }, []);

  return (
    <div className="landing-wrapper">
      {/* Navbar com Logo e Nome alinhados */}
      <nav className="navbar">
        <div className="nav-content">
          <div className="brand">
            <img src="/logo.png" alt="Logo CEC" className="navbar-logo" />
            <div className="brand-text">
              <span className="main-title">Casa do Estudante de Caicó</span>
              <span className="sub-title">Desde 1960</span>
            </div>
          </div>
          <Link to="/login" className="login-pill">Área do Sócio</Link>
        </div>
      </nav>

      {/* Hero Section com imagem de fundo da Casa */}
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

      {/* Seção de Notícias Públicas (Editais/Informativos) */}
      <section className="news-section">
        <div className="section-header">
          <h2>Informativos e Editais</h2>
          <div className="accent-line"></div>
        </div>

        {carregando ? (
          <div className="loading-msg">Carregando informativos...</div>
        ) : (
          <div className="news-grid">
            {noticias.length > 0 ? noticias.map(noticia => (
              <article key={noticia.id} className="public-news-card">
                <span className="news-category">{noticia.categoria || 'Geral'}</span>
                <h3>{noticia.titulo}</h3>
                <p>{noticia.resumo}</p>
                <div className="news-footer">
                   <span className="news-date">
                     {new Date(noticia.data_publicacao).toLocaleDateString('pt-BR')}
                   </span>
                </div>
              </article>
            )) : (
              <div className="empty-news">
                <p>Não há editais ou notícias públicas no momento.</p>
              </div>
            )}
          </div>
        )}
      </section>

      <footer className="landing-footer">
        <div className="footer-content">
          <p><strong>Casa do Estudante de Caicó - RN</strong></p>
          <p>Rua Av. Seridó, Centro - Caicó</p>
          <p className="copyright">© 2026 Sistema Administrativo CEC</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;