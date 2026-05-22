import React from 'react';
// Não precisa mais importar o Layout aqui, pois ele já vem do App.jsx via Outlet

export default function Home() {
  return (
    <div className="home-container">
      {/* Todo o seu conteúdo da Dashboard aqui */}
      <h1>Bem-vindo à CEC</h1>
      <p>Este é o seu painel inicial.</p>
      
      {/* Se você tiver cards de estatísticas ou notícias, coloque aqui direto */}
    </div>
  );
}