export type Papel = 'admin' | 'consultor' | 'veterinario' | 'inseminador';

export const PAPEIS_LABEL: Record<Papel, string> = {
  admin: 'Administrador',
  consultor: 'Consultor',
  veterinario: 'Veterinário / Produtor',
  inseminador: 'Inseminador',
};

// O produtor usa o mesmo acesso do veterinário (decisão do PROJETO.md)
export const PAPEIS_VINCULADOS: Papel[] = ['veterinario', 'inseminador'];

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
  minimo?: number | null;
  maximo?: number | null;
  inteiro?: boolean;
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

// ---------- Rebanho (fase 3) ----------

export const CATEGORIAS: Record<string, string> = {
  BZF: 'Bezerra', BZM: 'Bezerro', REC: 'Recria', NVA: 'Novilha apta', NVP: 'Novilha prenha',
  PRE: 'Pré-parto', RPA: 'Recém-parida', LAC: 'Lactação', SEC: 'Seca', GAR: 'Garrote', TOR: 'Touro', BAI: 'Baixado',
};
export const CATEGORIAS_POR_SEXO: Record<'F' | 'M', string[]> = {
  F: ['BZF', 'REC', 'NVA', 'NVP', 'PRE', 'RPA', 'LAC', 'SEC'],
  M: ['BZM', 'GAR', 'TOR'],
};

export type Prioridade = 'alta' | 'media' | 'baixa';

export interface AlertaResumo { codigo: string; titulo: string; prioridade: Prioridade }
export interface Alerta extends AlertaResumo { mensagem: string; resolve_com: string | null }
export interface AlertaDoDia extends Alerta { animal: { id: number; brinco: string; nome: string | null; categoria: string } }

export interface Animal {
  id: number;
  brinco: string;
  nome: string | null;
  sexo: 'F' | 'M';
  raca: string | null;
  grau_sangue: string | null;
  data_nascimento: string | null;
  nascimento_estimado: boolean;
  origem: 'nascido' | 'comprado';
  mae: { id: number; brinco: string; nome: string | null } | null;
  pai_semen: string | null;
  peso_nascer: number | null;
  observacoes: string | null;
}

export interface AnimalResumo extends Animal {
  categoria: string | null;
  categoria_nome: string | null;
  status: 'ativo' | 'baixado';
  idade_meses: number | null;
  del: number | null;
  lote: { id: number; nome: string } | null;
  situacao_reprodutiva: string | null;
  alertas: AlertaResumo[];
}

// Campos calculados pelo motor (backend_rebanho/motor/estado.py)
export interface EstadoAnimal {
  categoria: string | null;
  categoria_nome: string | null;
  status: 'ativo' | 'baixado';
  data_baixa: string | null;
  motivo_baixa: string | null;
  lote: { id: number; nome: string } | null;
  idade_dias: number | null;
  idade_meses: number | null;
  ultimo_peso: number | null;
  data_ultimo_peso: string | null;
  gmd: number | null;
  pct_peso_adulto: number | null;
  colostrado: boolean | null;
  criterios_aptidao_atingidos: boolean;
  prazo_aptidao: string | null;
  adiamentos_aptidao: number;
  dias_atraso_aptidao: number;
  apta_reproducao: boolean;
  situacao_reprodutiva: string | null;
  ias_no_ciclo: number;
  data_ultima_ia: string | null;
  touro_ultima_ia: string | null;
  data_ultimo_cio: string | null;
  data_concepcao: string | null;
  diagnosticos_na_gestacao: number;
  parto_previsto: string | null;
  pre_parto_previsto: string | null;
  secagem_prevista: string | null;
  dias_em_aberto: number | null;
  ordem_lactacao: number;
  data_ultimo_parto: string | null;
  data_primeiro_parto: string | null;
  data_secagem: string | null;
  del_: number | null;
  fase_lactacao: string | null;
  media_litros_dia: number | null;
  producao_acumulada: number | null;
  producao_305: number | null;
  iep_ultimo: number | null;
  idade_primeiro_parto_meses: number | null;
  data_ultimo_controle: string | null;
  em_carencia: boolean;
  carencia_ate: string | null;
  ultimo_escore: number | null;
  casos_mastite_lactacao: number;
  marcado_descarte: boolean;
  candidata_descarte: boolean;
  motivos_descarte: string[];
  avisos: { evento_id: number; data: string; tipo: string; aviso: string; ignorado: boolean }[];
}

export interface Evento {
  id: number;
  tipo: string;
  tipo_nome: string;
  data: string;
  dados: Record<string, any>;
  observacao: string | null;
  lancado_por: { tipo: 'usuario' | 'funcionario'; nome: string } | null;
  pode_excluir: boolean;
}

export interface FichaAnimal {
  animal: Animal;
  estado: EstadoAnimal;
  alertas: Alerta[];
  eventos: Evento[];
  crias: { id: number; brinco: string; nome: string | null; sexo: 'F' | 'M' }[];
}
