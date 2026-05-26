import { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

const MENU_SOCIO = [
  { path: '/home', label: 'Início', icone: '⌂' },
  { path: '/perfil', label: 'Meu perfil', icone: '👤' },
];

const MENU_DIRETORIA = [
  { path: '/home', label: 'Início', icone: '⌂' },
  { path: '/admin/socios', label: 'Gestão de Sócios', icone: '👥' },
  { path: '/admin/cadastrar-socio', label: 'Novo Cadastro', icone: '➕' },
  { path: '/perfil', label: 'Meu perfil', icone: '👤' },
  { path: '/admin/noticias', label: 'Publicar Notícias', icone: '📢' },
];

const iniciais = (nome = '') =>
  nome.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase();

export default function Layout() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuAberto, setMenuAberto] = useState(false);

  const ehDiretoria = ['diretoria', 'presidente', 'admin', 'secretario'].includes(usuario?.tipo_usuario);
  const menu = ehDiretoria ? MENU_DIRETORIA : MENU_SOCIO;

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="layout">
      <aside className={`sidebar ${menuAberto ? 'aberto' : ''}`}>
        <div className="sb-logo">
          <div className="sb-logo-circle">CEC</div>
          <div className="sb-logo-nome">Casa do Estudante</div>
        </div>
        <nav className="sb-nav">
          {menu.map(item => (
            <button
              key={item.path}
              className={`sb-item ${location.pathname === item.path ? 'ativo' : ''}`}
              onClick={() => { navigate(item.path); setMenuAberto(false); }}
            >
              <span className="sb-icone">{item.icone}</span>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="sb-usuario">
          <div className="sb-avatar">{iniciais(usuario?.nome)}</div>
          <div className="sb-usuario-info">
            <div className="sb-usuario-nome">{usuario?.nome?.split(' ')[0]}</div>
            <div className="sb-usuario-cargo">{usuario?.cargo}</div>
          </div>
          <button className="sb-sair" onClick={handleLogout}>↪</button>
        </div>
      </aside>

      <div className="layout-main">
        <header className="topbar">
          <button className="btn-menu-mobile" onClick={() => setMenuAberto(!menuAberto)}>☰</button>
          <div className="topbar-dep">{usuario?.departamento === 'feminino' ? 'Dep. Feminino' : 'Dep. Masculino'}</div>
        </header>
        <main className="layout-content">
          {/* Aqui é onde a mágica acontece: */}
          <Outlet />
        </main>
      </div>
    </div>
  );
}