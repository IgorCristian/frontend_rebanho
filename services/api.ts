import { Fazenda, Funcionario, Lote, Parametro, Sessao, Usuario, Papel, AnimalResumo, AlertaDoDia, FichaAnimal, Evento,
  ManejoSanitario, Indicador, MetaIndicador, RelatorioControleLeiteiro } from '../types';

export const API_URL = (import.meta as any).env.VITE_API_URL;

const TOKEN_KEY = 'rebanho_token';
const SESSAO_KEY = 'rebanho_sessao';

// --- Sessão no aparelho ---
export const sessaoStorage = {
  salvar: (token: string, sessao: Sessao) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(SESSAO_KEY, JSON.stringify(sessao));
  },
  carregar: (): Sessao | null => {
    if (!localStorage.getItem(TOKEN_KEY)) return null;
    try {
      return JSON.parse(localStorage.getItem(SESSAO_KEY) || 'null');
    } catch {
      return null;
    }
  },
  limpar: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(SESSAO_KEY);
  },
};

const getAuthHeaders = () => {
  const token = localStorage.getItem(TOKEN_KEY);
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
};

// Faz a chamada e transforma o {"error": ...} da API em Error com a mensagem pronta para mostrar
const request = async <T = any>(path: string, options: { method?: string; body?: any } = {}): Promise<T> => {
  if (!navigator.onLine) {
    throw new Error('Sem conexão com a internet.');
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method: options.method || 'GET',
      headers: getAuthHeaders(),
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new Error('Não foi possível falar com o servidor. Verifique a internet e tente de novo.');
  }

  const data = await response.json().catch(() => ({}));

  if (response.status === 401 && !path.startsWith('/auth/')) {
    window.dispatchEvent(new CustomEvent('auth-expired'));
    throw new Error('Sessão expirada. Faça login novamente.');
  }
  if (response.status === 429) {
    throw new Error('Muitas tentativas. Aguarde um minuto e tente de novo.');
  }
  if (!response.ok) {
    const detalhes = Array.isArray(data.detalhes) ? `\n${data.detalhes.join('\n')}` : '';
    throw new Error((data.error || 'Ocorreu um erro inesperado.') + detalhes);
  }
  return data as T;
};

export const api = {
  // --- Login ---
  login: (email: string, senha: string) =>
    request<{ token: string; usuario: Usuario }>('/auth/login', { method: 'POST', body: { email, senha } }),

  loginFazenda: (codigo: string, pin: string) =>
    request<{ token: string; fazenda: { id: number; nome: string }; funcionarios: Funcionario[] }>(
      '/auth/fazenda', { method: 'POST', body: { codigo, pin } }),

  me: () => request<any>('/me'),

  // --- Admin ---
  listarConsultores: () => request<Usuario[]>('/admin/consultores'),
  criarConsultor: (dados: { nome: string; email: string; senha: string; telefone?: string }) =>
    request<Usuario>('/admin/consultores', { method: 'POST', body: dados }),
  alterarAtivoUsuario: (usuarioId: number, ativo: boolean) =>
    request<Usuario>(`/admin/usuarios/${usuarioId}/ativo`, { method: 'PUT', body: { ativo } }),

  // --- Fazendas ---
  listarFazendas: () => request<Fazenda[]>('/fazendas'),
  obterFazenda: (id: number) => request<Fazenda>(`/fazendas/${id}`),
  criarFazenda: (dados: Partial<Fazenda> & { consultor_id?: number }) =>
    request<Fazenda>('/fazendas', { method: 'POST', body: dados }),
  editarFazenda: (id: number, dados: Partial<Fazenda>) =>
    request<Fazenda>(`/fazendas/${id}`, { method: 'PUT', body: dados }),

  // --- Acesso simplificado ---
  definirPin: (id: number, pin: string | null) =>
    request<Fazenda>(`/fazendas/${id}/acesso`, { method: 'PUT', body: { pin } }),
  gerarNovoCodigo: (id: number) =>
    request<Fazenda>(`/fazendas/${id}/acesso`, { method: 'PUT', body: { novo_codigo: true } }),

  // --- Parâmetros ---
  listarParametros: (id: number) => request<Parametro[]>(`/fazendas/${id}/parametros`),
  salvarParametros: (id: number, valores: Record<string, number | string | null>) =>
    request<Parametro[]>(`/fazendas/${id}/parametros`, { method: 'PUT', body: { valores } }),
  aplicarRaca: (id: number, raca: string) =>
    request<Parametro[]>(`/fazendas/${id}/parametros/raca`, { method: 'POST', body: { raca } }),

  // --- Funcionários ---
  listarFuncionarios: (id: number) => request<Funcionario[]>(`/fazendas/${id}/funcionarios`),
  criarFuncionario: (id: number, dados: { nome: string; funcao?: string }) =>
    request<Funcionario>(`/fazendas/${id}/funcionarios`, { method: 'POST', body: dados }),
  editarFuncionario: (id: number, funcionarioId: number, dados: Partial<Funcionario>) =>
    request<Funcionario>(`/fazendas/${id}/funcionarios/${funcionarioId}`, { method: 'PUT', body: dados }),

  // --- Usuários vinculados ---
  listarUsuariosFazenda: (id: number) => request<Usuario[]>(`/fazendas/${id}/usuarios`),
  vincularUsuario: (id: number, dados: { email: string; nome?: string; papel?: Papel; senha?: string; telefone?: string }) =>
    request<Usuario>(`/fazendas/${id}/usuarios`, { method: 'POST', body: dados }),
  desvincularUsuario: (id: number, usuarioId: number) =>
    request(`/fazendas/${id}/usuarios/${usuarioId}`, { method: 'DELETE' }),

  // --- Lotes ---
  listarLotes: (id: number) => request<Lote[]>(`/fazendas/${id}/lotes`),
  criarLote: (id: number, dados: { nome: string; descricao?: string }) =>
    request<Lote>(`/fazendas/${id}/lotes`, { method: 'POST', body: dados }),
  editarLote: (id: number, loteId: number, dados: Partial<Lote>) =>
    request<Lote>(`/fazendas/${id}/lotes/${loteId}`, { method: 'PUT', body: dados }),

  // --- Rebanho (fase 3) ---
  listarAnimais: (id: number, status: 'ativo' | 'baixado' | 'todos' = 'ativo') =>
    request<AnimalResumo[]>(`/fazendas/${id}/animais?status=${status}`),
  alertasDoDia: (id: number) => request<AlertaDoDia[]>(`/fazendas/${id}/alertas`),
  tiposEvento: (id: number) => request<{ perfil: string | null; tipos: string[] }>(`/fazendas/${id}/tipos-evento`),
  obterAnimal: (id: number, animalId: number) => request<FichaAnimal>(`/fazendas/${id}/animais/${animalId}`),
  criarAnimal: (id: number, dados: Record<string, any>) =>
    request<FichaAnimal>(`/fazendas/${id}/animais`, { method: 'POST', body: dados }),
  excluirAnimal: (id: number, animalId: number) =>
    request(`/fazendas/${id}/animais/${animalId}`, { method: 'DELETE' }),
  lancarEvento: (id: number, animalId: number, evento: { tipo: string; data: string; dados: Record<string, any>; observacao?: string; funcionario_id?: number }) =>
    request<{ evento: Evento; avisos: string[]; ficha: FichaAnimal }>(`/fazendas/${id}/animais/${animalId}/eventos`, { method: 'POST', body: evento }),
  excluirEvento: (id: number, eventoId: number) =>
    request<FichaAnimal>(`/fazendas/${id}/eventos/${eventoId}`, { method: 'DELETE' }),

  // --- Fase 4: calendário sanitário, metas, indicadores e relatórios ---
  listarCalendario: (id: number) => request<ManejoSanitario[]>(`/fazendas/${id}/calendario`),
  criarManejo: (id: number, dados: Partial<ManejoSanitario>) =>
    request<ManejoSanitario>(`/fazendas/${id}/calendario`, { method: 'POST', body: dados }),
  editarManejo: (id: number, manejoId: number, dados: Partial<ManejoSanitario>) =>
    request<ManejoSanitario>(`/fazendas/${id}/calendario/${manejoId}`, { method: 'PUT', body: dados }),
  listarMetas: (id: number) => request<MetaIndicador[]>(`/fazendas/${id}/metas`),
  salvarMetas: (id: number, valores: Record<string, number | null>) =>
    request<MetaIndicador[]>(`/fazendas/${id}/metas`, { method: 'PUT', body: { valores } }),
  indicadores: (id: number) => request<{ data: string; indicadores: Indicador[] }>(`/fazendas/${id}/indicadores`),
  relatorioControleLeiteiro: (id: number, inicio: string, fim: string) =>
    request<RelatorioControleLeiteiro>(`/fazendas/${id}/relatorios/controle-leiteiro?inicio=${inicio}&fim=${fim}`),
};
