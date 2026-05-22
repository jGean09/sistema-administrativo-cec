import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('cec_token');
    const usuarioSalvo = localStorage.getItem('cec_usuario');

    if (token && usuarioSalvo) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUsuario(JSON.parse(usuarioSalvo));
    }
    setCarregando(false);
  }, []);

  const login = async (email, senha) => {
    const res = await api.post('/auth/login', { email, senha });
    const { token, usuario } = res.data;

    localStorage.setItem('cec_token', token);
    localStorage.setItem('cec_usuario', JSON.stringify(usuario));
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUsuario(usuario);
    return usuario;
  };

  const logout = () => {
    localStorage.removeItem('cec_token');
    localStorage.removeItem('cec_usuario');
    delete api.defaults.headers.common['Authorization'];
    setUsuario(null);
  };

  const ehDiretoria = () => ['diretoria', 'presidente', 'admin'].includes(usuario?.tipo_usuario);
  const ehPresidente = () => ['presidente', 'admin'].includes(usuario?.tipo_usuario);

  return (
    <AuthContext.Provider value={{ usuario, login, logout, carregando, ehDiretoria, ehPresidente }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
};
