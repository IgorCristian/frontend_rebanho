// Formulário de cada tipo de evento (aba EVENTOS da planilha).
// "categorias" diz para quais animais o evento aparece na lista; o backend/motor confere de novo.

export type TipoCampo = 'numero' | 'texto' | 'opcoes' | 'simnao' | 'lote' | 'categoria' | 'ordenhas' | 'crias';

export interface CampoEvento {
  chave: string;
  rotulo: string;
  tipo: TipoCampo;
  obrigatorio?: boolean;
  unidade?: string;
  opcoes?: string[];
  rotulosSimNao?: [string, string]; // [sim, não]
  mostrarSe?: (dados: Record<string, any>) => boolean;
}

export interface ConfigEvento {
  nome: string;
  grupo: 'Cria e recria' | 'Reprodução' | 'Parto e lactação' | 'Saúde' | 'Manejo e saída';
  categorias: string[] | 'todas';
  campos: CampoEvento[];
}

const FEMEAS_ADULTAS = ['NVA', 'NVP', 'PRE', 'RPA', 'LAC', 'SEC'];

export const EVENTOS: Record<string, ConfigEvento> = {
  colostragem: {
    nome: 'Colostragem', grupo: 'Cria e recria', categorias: ['BZF', 'BZM'],
    campos: [
      { chave: 'volume_litros', rotulo: 'Volume', tipo: 'numero', unidade: 'L' },
      { chave: 'brix', rotulo: 'Qualidade (Brix)', tipo: 'numero', unidade: '%' },
    ],
  },
  pesagem: {
    nome: 'Pesagem', grupo: 'Cria e recria', categorias: 'todas',
    campos: [
      { chave: 'peso', rotulo: 'Peso', tipo: 'numero', unidade: 'kg', obrigatorio: true },
      { chave: 'metodo', rotulo: 'Método', tipo: 'opcoes', opcoes: ['Balança', 'Fita'] },
    ],
  },
  desmama: {
    nome: 'Desmama', grupo: 'Cria e recria', categorias: ['BZF', 'BZM'],
    campos: [{ chave: 'peso', rotulo: 'Peso', tipo: 'numero', unidade: 'kg' }],
  },
  prazo_aptidao: {
    nome: 'Prazo de aptidão à reprodução', grupo: 'Cria e recria', categorias: ['REC'],
    campos: [{ chave: 'dias', rotulo: 'Em quantos dias deve estar apta', tipo: 'numero', unidade: 'dias', obrigatorio: true }],
  },
  avaliacao_aptidao: {
    nome: 'Avaliação de aptidão à reprodução', grupo: 'Cria e recria', categorias: ['REC'],
    campos: [
      { chave: 'aprovada', rotulo: 'Está apta para reprodução?', tipo: 'simnao', obrigatorio: true, rotulosSimNao: ['Aprovada', 'Ainda não'] },
      { chave: 'dias_adicionais', rotulo: 'Avaliar de novo em', tipo: 'numero', unidade: 'dias', obrigatorio: true, mostrarSe: d => d.aprovada === false },
    ],
  },
  cio: {
    nome: 'Cio observado', grupo: 'Reprodução', categorias: ['NVA', 'RPA', 'LAC'],
    campos: [{ chave: 'sinais', rotulo: 'Intensidade / sinais', tipo: 'texto' }],
  },
  inseminacao: {
    nome: 'Inseminação / cobertura', grupo: 'Reprodução', categorias: ['NVA', 'RPA', 'LAC'],
    campos: [
      { chave: 'touro', rotulo: 'Touro ou sêmen', tipo: 'texto' },
      { chave: 'inseminador', rotulo: 'Inseminador', tipo: 'texto' },
      { chave: 'protocolo', rotulo: 'Protocolo', tipo: 'opcoes', opcoes: ['IATF', 'Cio natural', 'Monta natural'] },
    ],
  },
  diagnostico: {
    nome: 'Diagnóstico de prenhez', grupo: 'Reprodução', categorias: ['NVA', 'RPA', 'LAC'],
    campos: [
      { chave: 'positivo', rotulo: 'Resultado', tipo: 'simnao', obrigatorio: true, rotulosSimNao: ['Prenhe', 'Vazia'] },
      { chave: 'metodo', rotulo: 'Método', tipo: 'opcoes', opcoes: ['Ultrassom', 'Toque'] },
      { chave: 'dias_gestacao', rotulo: 'Dias de gestação estimados', tipo: 'numero', unidade: 'dias', mostrarSe: d => d.positivo === true },
    ],
  },
  reconfirmacao: {
    nome: 'Reconfirmação de prenhez', grupo: 'Reprodução', categorias: ['NVP', 'PRE', 'LAC', 'SEC'],
    campos: [{ chave: 'positivo', rotulo: 'Resultado', tipo: 'simnao', obrigatorio: true, rotulosSimNao: ['Continua prenhe', 'Perdeu'] }],
  },
  aborto: {
    nome: 'Aborto / perda embrionária', grupo: 'Reprodução', categorias: ['NVP', 'PRE', 'LAC', 'SEC'],
    campos: [
      { chave: 'idade_feto', rotulo: 'Idade do feto estimada', tipo: 'texto' },
      { chave: 'causa', rotulo: 'Causa suspeita', tipo: 'texto' },
    ],
  },
  pre_parto: {
    nome: 'Entrada no pré-parto', grupo: 'Parto e lactação', categorias: ['NVP', 'SEC'],
    campos: [{ chave: 'lote_id', rotulo: 'Lote de destino', tipo: 'lote' }],
  },
  parto: {
    nome: 'Parto', grupo: 'Parto e lactação', categorias: ['PRE', 'NVP', 'SEC', 'LAC'],
    campos: [
      { chave: 'tipo_parto', rotulo: 'Tipo de parto', tipo: 'opcoes', opcoes: ['Normal', 'Assistido', 'Cesárea'] },
      { chave: 'retencao_placenta', rotulo: 'Retenção de placenta?', tipo: 'simnao', rotulosSimNao: ['Sim', 'Não'] },
      { chave: 'crias', rotulo: 'Crias', tipo: 'crias' },
    ],
  },
  controle_leiteiro: {
    nome: 'Controle leiteiro', grupo: 'Parto e lactação', categorias: ['RPA', 'LAC'],
    campos: [{ chave: 'ordenhas', rotulo: 'Litros por ordenha', tipo: 'ordenhas', obrigatorio: true }],
  },
  secagem: {
    nome: 'Secagem', grupo: 'Parto e lactação', categorias: ['RPA', 'LAC'],
    campos: [
      { chave: 'produto', rotulo: 'Produto de secagem', tipo: 'texto' },
      { chave: 'ultima_producao', rotulo: 'Última produção', tipo: 'numero', unidade: 'L/dia' },
    ],
  },
  mastite: {
    nome: 'Mastite / CMT', grupo: 'Saúde', categorias: ['RPA', 'LAC'],
    campos: [
      { chave: 'tipo', rotulo: 'Tipo', tipo: 'opcoes', opcoes: ['Clínica', 'Subclínica'] },
      { chave: 'quartos', rotulo: 'Quarto(s) afetado(s)', tipo: 'texto' },
      { chave: 'grau', rotulo: 'Grau', tipo: 'texto' },
    ],
  },
  tratamento: {
    nome: 'Tratamento', grupo: 'Saúde', categorias: 'todas',
    campos: [
      { chave: 'diagnostico', rotulo: 'Diagnóstico', tipo: 'texto' },
      { chave: 'medicamento', rotulo: 'Medicamento', tipo: 'texto', obrigatorio: true },
      { chave: 'dose', rotulo: 'Dose', tipo: 'texto' },
      { chave: 'carencia_leite_dias', rotulo: 'Carência do leite', tipo: 'numero', unidade: 'dias' },
      { chave: 'carencia_carne_dias', rotulo: 'Carência da carne', tipo: 'numero', unidade: 'dias' },
    ],
  },
  vacinacao: {
    nome: 'Vacinação', grupo: 'Saúde', categorias: 'todas',
    campos: [
      { chave: 'vacina', rotulo: 'Vacina', tipo: 'texto' },
      { chave: 'lote_fabricante', rotulo: 'Lote / fabricante', tipo: 'texto' },
      { chave: 'dose', rotulo: 'Dose', tipo: 'texto' },
    ],
  },
  vermifugacao: {
    nome: 'Vermifugação / parasitas', grupo: 'Saúde', categorias: 'todas',
    campos: [
      { chave: 'produto', rotulo: 'Produto', tipo: 'texto' },
      { chave: 'dose', rotulo: 'Dose', tipo: 'texto' },
    ],
  },
  casqueamento: {
    nome: 'Casqueamento', grupo: 'Saúde', categorias: ['LAC', 'SEC', 'PRE', 'RPA'],
    campos: [
      { chave: 'lesao', rotulo: 'Lesão encontrada', tipo: 'texto' },
      { chave: 'membro', rotulo: 'Membro', tipo: 'texto' },
    ],
  },
  escore_corporal: {
    nome: 'Escore de condição corporal', grupo: 'Saúde', categorias: FEMEAS_ADULTAS,
    campos: [{ chave: 'escore', rotulo: 'Escore (1 a 5)', tipo: 'numero', obrigatorio: true }],
  },
  troca_lote: {
    nome: 'Troca de lote', grupo: 'Manejo e saída', categorias: 'todas',
    campos: [
      { chave: 'lote_id', rotulo: 'Lote de destino', tipo: 'lote' },
      { chave: 'motivo', rotulo: 'Motivo', tipo: 'texto' },
    ],
  },
  reclassificacao: {
    nome: 'Reclassificação', grupo: 'Manejo e saída', categorias: 'todas',
    campos: [
      { chave: 'categoria', rotulo: 'Nova categoria', tipo: 'categoria', obrigatorio: true },
      { chave: 'motivo', rotulo: 'Motivo', tipo: 'texto' },
    ],
  },
  marcar_descarte: {
    nome: 'Marcar para descarte', grupo: 'Manejo e saída', categorias: FEMEAS_ADULTAS,
    campos: [{ chave: 'motivo', rotulo: 'Motivo', tipo: 'opcoes', opcoes: ['Reprodutivo', 'Mastite', 'Casco', 'Idade', 'Produção', 'Outro'] }],
  },
  venda: {
    nome: 'Venda', grupo: 'Manejo e saída', categorias: 'todas',
    campos: [
      { chave: 'comprador', rotulo: 'Comprador', tipo: 'texto' },
      { chave: 'valor', rotulo: 'Valor', tipo: 'numero', unidade: 'R$' },
      { chave: 'peso', rotulo: 'Peso', tipo: 'numero', unidade: 'kg' },
      { chave: 'motivo', rotulo: 'Motivo', tipo: 'texto' },
    ],
  },
  morte: {
    nome: 'Morte', grupo: 'Manejo e saída', categorias: 'todas',
    campos: [{ chave: 'causa', rotulo: 'Causa', tipo: 'texto' }],
  },
};

export const GRUPOS_EVENTO: ConfigEvento['grupo'][] = ['Cria e recria', 'Reprodução', 'Parto e lactação', 'Saúde', 'Manejo e saída'];

export const eventoSeAplica = (tipo: string, categoria: string | null) => {
  const config = EVENTOS[tipo];
  if (!config || !categoria || categoria === 'BAI') return false;
  return config.categorias === 'todas' || config.categorias.includes(categoria);
};
