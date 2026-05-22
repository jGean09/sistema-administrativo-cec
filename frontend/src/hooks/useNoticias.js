import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export function useNoticias(filtroInicial = {}) {
  const [noticias, setNoticias] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [filtros, setFiltros] = useState(filtroInicial);

  const buscar = useCallback(async (pg = 1, filtrosAtuais = filtros) => {
    setCarregando(true);
    setErro(null);
    try {
      const params = new URLSearchParams({ pagina: pg, limite: 10, ...filtrosAtuais });
      const res = await api.get(`/noticias?${params}`);
      setNoticias(pg === 1 ? res.data.noticias : prev => [...prev, ...res.data.noticias]);
      setTotalPaginas(res.data.totalPaginas);
      setPagina(pg);
    } catch (err) {
      setErro('Não foi possível carregar as notícias.');
    } finally {
      setCarregando(false);
    }
  }, [filtros]);

  useEffect(() => {
    buscar(1, filtros);
  }, [filtros]);

  const mudarFiltro = (novosFiltros) => {
    setNoticias([]);
    setFiltros(prev => ({ ...prev, ...novosFiltros }));
  };

  const carregarMais = () => {
    if (pagina < totalPaginas) buscar(pagina + 1);
  };

  return {
    noticias, carregando, erro,
    pagina, totalPaginas,
    filtros, mudarFiltro, carregarMais,
    recarregar: () => buscar(1),
  };
}