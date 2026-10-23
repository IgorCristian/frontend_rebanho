export type Papel = 'admin' | 'consultor' | 'produtor' | 'veterinario' | 'inseminador';

export const PAPEIS_LABEL: Record<Papel, string> = {
  admin: 'Administrador',
  consultor: 'Consultor',
  produtor: 'Produtor',
  veterinario: 'Veterinário',
  inseminador: 'Inseminador',
};

export const PAPEIS_VINCULADOS: Papel[] = ['produtor', 'veterinario', 'inseminador'];

export const RACAS = ['Holandesa', 'Girolando', 'Jersey', 'Gir'];

export const UFS = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR',
  'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  telefone?: string | null;
  papel: Papel;
  ativo: boolean;
  total_fazendas?: number;
  conta_criada?: boolean;
}

export interface FuncionarioResumo {
  id: number;
  nome: string;
  funcao?: string | null;
}

export interface Funcionario extends FuncionarioResumo {
  ativo: boolean;
}

export interface Fazenda {
  id: number;
  nome: string;
  proprietario?: string | null;
  cidade?: string | null;
  uf?: string | null;
  raca_predominante?: string | null;
  ativa: boolean;
  consultor: { id: number; nome: string };
  // Só vêm para quem gerencia a fazenda (consultor responsável ou admin)
  codigo_acesso?: string;
  acesso_simplificado_ativo?: boolean;
  gestao_cliente_id?: number | null;
}

export interface Parametro {
  codigo: string;
  grupo: string;
  nome: string;
  valor: number | string;
  padrao: number | string;
  unidade: string;
  faixa: string;
  tipo: 'numero' | 'texto';
  opcoes?: string[] | null;
  ajustavel: boolean;
  alterado: boolean;
}

export interface Lote {
  id: number;
  nome: string;
  descricao?: string | null;
  ativo: boolean;
}

// Sessão salva no aparelho: login de usuário OU acesso simplificado da fazenda
export type Sessao =
  | { tipo: 'usuario'; usuario: Usuario }
  | { tipo: 'fazenda'; fazenda: { id: number; nome: string }; funcionarios: FuncionarioResumo[] };
