import axios from 'axios';

const api = axios.create({
  // Puxa a URL oficial da nuvem. Se não achar, usa o localhost:3001 como plano B de desenvolvimento
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001',
  timeout: 10000,
});

// Interceptor de resposta: redireciona para login se token expirar
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('cec_token');
      localStorage.removeItem('cec_usuario');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;