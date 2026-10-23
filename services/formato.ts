// Formatação para exibir os números do motor

export const hojeISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const data = (iso?: string | null) => {
  if (!iso) return '—';
  const [a, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${a}`;
};

export const numero = (valor?: number | null, casas = 0) =>
  valor == null ? '—' : valor.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });

export const idade = (meses?: number | null) => {
  if (meses == null) return '—';
  if (meses < 1) {
    const dias = Math.round(meses * 30.4375);
    return `${dias} ${dias === 1 ? 'dia' : 'dias'}`;
  }
  if (meses < 24) return `${numero(Math.floor(meses))} ${Math.floor(meses) === 1 ? 'mês' : 'meses'}`;
  const anos = Math.floor(meses / 12);
  const resto = Math.floor(meses % 12);
  return resto ? `${anos} anos e ${resto} ${resto === 1 ? 'mês' : 'meses'}` : `${anos} anos`;
};

// Dias até uma data (negativo = já passou)
export const diasAte = (iso?: string | null) => {
  if (!iso) return null;
  const alvo = new Date(`${iso.slice(0, 10)}T00:00:00`);
  const hoje = new Date(`${hojeISO()}T00:00:00`);
  return Math.round((alvo.getTime() - hoje.getTime()) / 86400000);
};

export const SITUACAO_REPRODUTIVA: Record<string, string> = {
  nao_coberta: 'Não coberta',
  aguardando_diagnostico: 'Aguardando diagnóstico',
  prenhe: 'Prenhe',
  vazia: 'Vazia',
};

export const FASE_LACTACAO: Record<string, string> = {
  recem_parida: 'Recém-parida',
  inicial: 'Inicial (pico)',
  intermediaria: 'Intermediária',
  final: 'Final',
};

export const COR_PRIORIDADE = {
  alta: 'bg-red-50 text-red-700 border-red-200',
  media: 'bg-amber-50 text-amber-700 border-amber-200',
  baixa: 'bg-gray-100 text-gray-600 border-gray-200',
} as const;

export const NOME_PRIORIDADE = { alta: 'Urgente', media: 'Atenção', baixa: 'Lembrete' } as const;

// Resumo legível do campo "dados" de um evento para o histórico
export const resumoDados = (tipo: string, dados: Record<string, any>) => {
  const partes: string[] = [];
  const add = (texto?: string | false | null) => texto && partes.push(texto);
  add(dados.categoria && `Categoria ${dados.categoria}`);
  add(dados.peso != null && `${numero(dados.peso, 1)} kg`);
  add(dados.positivo === true && (tipo === 'reconfirmacao' ? 'Continua prenhe' : 'Prenhe'));
  add(dados.positivo === false && (tipo === 'reconfirmacao' ? 'Perdeu' : 'Vazia'));
  add(dados.aprovada === true && 'Aprovada');
  add(dados.aprovada === false && `Reprovada: +${dados.dias_adicionais} dias`);
  add(dados.dias != null && `Prazo de ${dados.dias} dias`);
  add(Array.isArray(dados.ordenhas) && `${numero(dados.ordenhas.reduce((s: number, v: number) => s + v, 0), 1)} L (${dados.ordenhas.join(' + ')})`);
  add(dados.litros != null && `${numero(dados.litros, 1)} L`);
  add(dados.touro && `Touro/sêmen: ${dados.touro}`);
  add(dados.medicamento && dados.medicamento);
  add(dados.carencia_leite_dias != null && `Carência do leite: ${dados.carencia_leite_dias} dias`);
  add(dados.vacina && dados.vacina);
  add(dados.produto && dados.produto);
  add(dados.escore != null && `Escore ${dados.escore}`);
  add(dados.tipo_parto && dados.tipo_parto);
  add(Array.isArray(dados.crias) && dados.crias.length > 0 &&
    `Crias: ${dados.crias.map((c: any) => c.natimorto ? `natimorto (${c.sexo})` : `${c.brinco} (${c.sexo})`).join(', ')}`);
  add(dados.tipo && dados.tipo);
  add(dados.motivo && dados.motivo);
  add(dados.causa && dados.causa);
  add(dados.comprador && `Comprador: ${dados.comprador}`);
  add(dados.valor != null && `R$ ${numero(dados.valor, 2)}`);
  return partes.join(' · ');
};
