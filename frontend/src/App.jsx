import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Importação das Páginas
import Login from './pages/Login';
import Home from './pages/Home';
import LandingPage from './pages/LandingPage';
import Perfil from './pages/Perfil';


// Componentes Administrativos (Secretaria/Diretoria)
import ListaSocios from './pages/admin/ListaSocios';
import EditarSocio from './pages/admin/EditarSocio';
import CadastroInterno from './pages/admin/CadastroInterno';
import GerenciarNoticias from './pages/admin/GerenciarNoticias';


// Componentes Globais
import Layout from './components/Layout';

// ─── COMPONENTES DE PROTEÇÃO ──────────────────────────────────────────

const RotaProtegida = ({ children }) => {
  const { usuario, carregando } = useAuth();
  
  if (carregando) return <div className="loading">Carregando...</div>;
  if (!usuario) return <Navigate to="/login" replace />;
  
  
  return children;
};

const RotaAdmin = ({ children, cargosPermitidos }) => {
  const { usuario, carregando } = useAuth();
  
  if (carregando) return <div className="loading">Carregando...</div>;
  if (!usuario) return <Navigate to="/login" replace />;
  
  // Verifica se o tipo_usuario está autorizado (ex: 'presidente', 'secretario')
  if (!cargosPermitidos.includes(usuario.tipo_usuario)) {
    return <Navigate to="/home" replace />;
  }
  
  return children;
};

// ─── ROTAS DA APLICAÇÃO ───────────────────────────────────────────────

function AppRoutes() {
  const { usuario } = useAuth();

  return (
    <Routes>

      {/* 1. Rotas Públicas */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={
        usuario ? <Navigate to="/home" replace /> : <Login />
      } />

      {/* 2. Rotas Protegidas (Sócios e Diretoria Logados) */}
      <Route element={<RotaProtegida><Layout /></RotaProtegida>}>
        
        {/* Página inicial do sistema */}
        <Route path="/home" element={<Home />} />
        <Route path="/perfil" element={<Perfil />} />

        <Route path="/admin/noticias" element={
          <RotaAdmin cargosPermitidos={['presidente', 'secretario', 'diretoria', 'admin']}>
            <GerenciarNoticias />
          </RotaAdmin>
        } />


        {/* 3. Rotas de Gestão (Acesso restrito por cargo) */}
        
        {/* Listagem de Sócios - Acessível por toda a diretoria */}
        <Route path="/admin/socios" element={
          <RotaAdmin cargosPermitidos={['presidente', 'secretario', 'diretoria', 'admin']}>
            <ListaSocios />
          </RotaAdmin>
        } />

        {/* Cadastro de Sócio - Apenas Secretaria e Presidência */}
        <Route path="/admin/cadastrar-socio" element={
          <RotaAdmin cargosPermitidos={['secretario', 'presidente', 'admin']}>
            <CadastroInterno />
          </RotaAdmin>
        } />

        {/* Edição de Sócio */}
        <Route path="/admin/socios/editar/:id" element={
          <RotaAdmin cargosPermitidos={['secretario', 'presidente', 'admin']}>
            <EditarSocio />
          </RotaAdmin>
        } />

        {/* Dashboard/Painel da Diretoria */}
        <Route path="/admin/dashboard" element={
          <RotaAdmin cargosPermitidos={['presidente', 'secretario', 'diretoria', 'admin']}>
             <div style={{ padding: '2rem' }}>
               <h2>Painel Administrativo - CEC</h2>
               <p>Bem-vindo ao centro de controle da diretoria.</p>
             </div>
          </RotaAdmin>
        } />
        
      </Route>

      {/* Rota de fallback para páginas não encontradas */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}