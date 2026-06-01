import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import Login from './pages/Login';
import Home from './pages/Home';
import LandingPage from './pages/LandingPage';
import Perfil from './pages/Perfil';

import ListaSocios from './pages/admin/ListaSocios';
import EditarSocio from './pages/admin/EditarSocio';
import CadastroInterno from './pages/admin/CadastroInterno';
import GerenciarNoticias from './pages/admin/GerenciarNoticias';
import EnviarEmail from './pages/admin/EnviarEmail';

import Layout from './components/Layout';

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
  if (!cargosPermitidos.includes(usuario.tipo_usuario)) return <Navigate to="/home" replace />;
  return children;
};

function AppRoutes() {
  const { usuario } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={
        usuario ? <Navigate to="/home" replace /> : <Login />
      } />

      <Route element={<RotaProtegida><Layout /></RotaProtegida>}>
        <Route path="/home" element={<Home />} />
        <Route path="/perfil" element={<Perfil />} />

        <Route path="/admin/noticias" element={
          <RotaAdmin cargosPermitidos={['presidente', 'secretario', 'diretoria', 'admin']}>
            <GerenciarNoticias />
          </RotaAdmin>
        } />

        <Route path="/admin/email" element={
          <RotaAdmin cargosPermitidos={['presidente', 'secretario', 'diretoria', 'admin']}>
            <EnviarEmail />
          </RotaAdmin>
        } />

        <Route path="/admin/socios" element={
          <RotaAdmin cargosPermitidos={['presidente', 'secretario', 'diretoria', 'admin']}>
            <ListaSocios />
          </RotaAdmin>
        } />

        <Route path="/admin/cadastrar-socio" element={
          <RotaAdmin cargosPermitidos={['secretario', 'presidente', 'admin']}>
            <CadastroInterno />
          </RotaAdmin>
        } />

        <Route path="/admin/socios/editar/:id" element={
          <RotaAdmin cargosPermitidos={['secretario', 'presidente', 'admin']}>
            <EditarSocio />
          </RotaAdmin>
        } />

        <Route path="/admin/dashboard" element={
          <RotaAdmin cargosPermitidos={['presidente', 'secretario', 'diretoria', 'admin']}>
            <div style={{ padding: '2rem' }}>
              <h2>Painel Administrativo - CEC</h2>
              <p>Bem-vindo ao centro de controle da diretoria.</p>
            </div>
          </RotaAdmin>
        } />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}