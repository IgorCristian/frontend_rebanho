import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { ArrowLeft, Plus, AlertTriangle, Trash2, History, Baby } from 'lucide-react';
import { api } from '../services/api';
import { CATEGORIAS, FichaAnimal, Lote, ManejoSanitario } from '../types';
import { data, numero, idade, diasAte, SITUACAO_REPRODUTIVA, FASE_LACTACAO, COR_PRIORIDADE, resumoDados } from '../services/formato';
import { EVENTOS, eventoSeAplica } from '../services/eventos';
import { Botao, Cartao, Selo, Carregando } from './ui';
import { LancarEventoJanela } from './LancarEventoJanela';

export interface ApoioLancamento {
  tipos: string[];          // tipos de evento que quem está logado pode lançar
  lotes: Lote[];
  calendario: ManejoSanitario[];  // itens do calendário sanitário (vacinação/vermifugação)
  funcionarioId?: number;   // acesso da fazenda
  ehGestor: boolean;
}

interface Props {
  fazendaId: number;
  animalId: number;
  apoio: ApoioLancamento;
  aoVoltar: () => void;
  aoAbrirAnimal: (animalId: number) => void;
}

export const AnimalFicha: React.FC<Props> = ({ fazendaId, animalId, apoio, aoVoltar, aoAbrirAnimal }) => {
  const [ficha, setFicha] = useState<FichaAnimal | null>(null);
  const [lancando, setLancando] = useState<{ tipo: string | null; dados?: Record<string, any> } | null>(null);

  useEffect(() => {
    setFicha(null);
    api.obterAnimal(fazendaId, animalId).then(setFicha).catch((err) => { toast.error(err.message); aoVoltar(); });
  }, [fazendaId, animalId]);

  if (!ficha) return <Carregando />;
  const { animal, estado: e, alertas, eventos } = ficha;
  const ativo = e.status === 'ativo';
  const podeLancar = ativo && apoio.tipos.some(t => EVENTOS[t] && eventoSeAplica(t, e.categoria));

  const excluirEvento = async (id: number, nome: string) => {
    if (!confirm(`Excluir o lançamento "${nome}"? A categoria e os alertas serão recalculados.`)) return;
    try {
      setFicha(await api.excluirEvento(fazendaId, id));
      toast.success('Lançamento excluído.');
    } catch (err: any) {
      toast.error(err.message, { duration: 6000 });
    }
  };

  const excluirCadastro = async () => {
    if (!confirm(`Excluir o cadastro do brinco ${animal.brinco} com todo o histórico? Use só se foi cadastrado por engano. Para saída do rebanho, lance Venda ou Morte.`)) return;
    try {
      await api.excluirAnimal(fazendaId, animal.id);
      toast.success('Cadastro excluído.');
      aoVoltar();
    } catch (err: any) {
      toast.error(err.message, { duration: 6000 });
    }
  };

  const ehFemea = animal.sexo === 'F';
  const reprodutiva = ehFemea && ['NVA', 'NVP', 'PRE', 'RPA', 'LAC', 'SEC'].includes(e.categoria || '');
  const prazoTexto = (iso: string | null) => {
    const dias = diasAte(iso);
    if (dias == null) return '';
    return dias === 0 ? ' (hoje)' : dias > 0 ? ` (em ${dias} dias)` : ` (há ${-dias} dias)`;
  };

  return (
    <div className="space-y-4 pb-20">
      <button onClick={aoVoltar} className="flex items-center gap-1 text-sm font-semibold text-gray-500 hover:text-gray-900">
        <ArrowLeft size={18} /> Voltar
      </button>

      {/* Cabeçalho */}
      <Cartao className="p-4 flex items-center gap-4">
        <div className={`w-16 h-16 shrink-0 rounded-2xl flex items-center justify-center text-lg font-bold ${ehFemea ? 'bg-[#050D21] text-[#56E39F]' : 'bg-blue-50 text-blue-700'}`}>
          {animal.brinco}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-gray-900 truncate">{animal.nome || `Brinco ${animal.brinco}`}</h2>
          <div className="flex flex-wrap items-center gap-1.5 mt-1">
            {e.categoria && <Selo cor={ativo ? 'verde' : 'vermelho'}>{CATEGORIAS[e.categoria]}</Selo>}
            {!ativo && <Selo cor="vermelho">{e.motivo_baixa === 'venda' ? 'Vendido' : 'Morto'} em {data(e.data_baixa)}</Selo>}
            {e.lote && <Selo cor="azul">{e.lote.nome}</Selo>}
            {e.em_carencia && <Selo cor="vermelho">Leite em carência</Selo>}
            {e.marcado_descarte && <Selo cor="amarelo">Marcado p/ descarte</Selo>}
          </div>
          <p className="text-xs text-gray-500 mt-1.5">
            {[ehFemea ? 'Fêmea' : 'Macho', animal.raca, `${idade(e.idade_meses)}${animal.nascimento_estimado ? ' (estimada)' : ''}`].filter(Boolean).join(' · ')}
          </p>
        </div>
      </Cartao>

      {/* Alertas */}
      {alertas.length > 0 && (
        <div className="space-y-2">
          {alertas.map((a, i) => (
            <div key={`${a.codigo}-${i}`} className={`rounded-xl border p-3 flex items-start gap-3 ${COR_PRIORIDADE[a.prioridade]}`}>
              <AlertTriangle size={18} className="shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{a.titulo}</p>
                <p className="text-xs opacity-90 mt-0.5">{a.mensagem}</p>
              </div>
              {a.resolve_com && apoio.tipos.includes(a.resolve_com) && eventoSeAplica(a.resolve_com, e.categoria) && (
                <button onClick={() => setLancando({ tipo: a.resolve_com, dados: a.contexto })} className="shrink-0 text-xs font-bold underline underline-offset-2">
                  Lançar {EVENTOS[a.resolve_com]?.nome.toLowerCase()}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Números calculados */}
      <div className="grid gap-3 sm:grid-cols-2">
        {reprodutiva && (
          <Bloco titulo="Reprodução">
            <Info rotulo="Situação" valor={e.situacao_reprodutiva ? SITUACAO_REPRODUTIVA[e.situacao_reprodutiva] : '—'} />
            <Info rotulo="IAs no ciclo" valor={numero(e.ias_no_ciclo)} />
            {e.data_ultima_ia && <Info rotulo="Última IA" valor={`${data(e.data_ultima_ia)}${e.touro_ultima_ia ? ` · ${e.touro_ultima_ia}` : ''}`} />}
            {e.parto_previsto && <Info rotulo="Parto previsto" valor={data(e.parto_previsto) + prazoTexto(e.parto_previsto)} destaque />}
            {e.pre_parto_previsto && <Info rotulo="Entrada no pré-parto" valor={data(e.pre_parto_previsto) + prazoTexto(e.pre_parto_previsto)} />}
            {e.secagem_prevista && <Info rotulo="Secagem prevista" valor={data(e.secagem_prevista) + prazoTexto(e.secagem_prevista)} />}
            {e.dias_em_aberto != null && <Info rotulo="Dias em aberto" valor={numero(e.dias_em_aberto)} />}
          </Bloco>
        )}

        {e.ordem_lactacao > 0 && (
          <Bloco titulo="Lactação">
            <Info rotulo="Nº de partos" valor={numero(e.ordem_lactacao)} />
            {e.data_ultimo_parto && <Info rotulo="Último parto" valor={data(e.data_ultimo_parto)} />}
            {e.del_ != null && <Info rotulo="DEL" valor={`${numero(e.del_)}${e.fase_lactacao ? ` · ${FASE_LACTACAO[e.fase_lactacao]}` : ''}`} destaque />}
            {e.media_litros_dia != null && <Info rotulo="Média" valor={`${numero(e.media_litros_dia, 1)} L/dia`} />}
            {e.producao_acumulada != null && <Info rotulo="Produção na lactação" valor={`${numero(e.producao_acumulada)} L`} />}
            {e.producao_305 != null && <Info rotulo="Produção em 305 dias" valor={`${numero(e.producao_305)} L`} />}
            {e.iep_ultimo != null && <Info rotulo="Intervalo entre partos" valor={`${numero(e.iep_ultimo)} dias`} />}
            {e.idade_primeiro_parto_meses != null && <Info rotulo="Idade ao 1º parto" valor={`${numero(e.idade_primeiro_parto_meses, 1)} meses`} />}
          </Bloco>
        )}

        <Bloco titulo="Crescimento">
          <Info rotulo="Último peso" valor={e.ultimo_peso != null ? `${numero(e.ultimo_peso, 1)} kg em ${data(e.data_ultimo_peso)}` : '—'} />
          {e.gmd != null && <Info rotulo="Ganho médio diário" valor={`${numero(e.gmd, 3)} kg/dia`} />}
          {e.pct_peso_adulto != null && <Info rotulo="% do peso adulto" valor={`${numero(e.pct_peso_adulto * 100)}%`} />}
          {e.categoria === 'REC' && (
            <>
              <Info rotulo="Critérios de cobertura" valor={e.criterios_aptidao_atingidos ? 'Atingidos' : 'Ainda não'} />
              {e.prazo_aptidao && <Info rotulo="Prazo de aptidão" valor={data(e.prazo_aptidao) + prazoTexto(e.prazo_aptidao)} />}
            </>
          )}
          {e.adiamentos_aptidao > 0 && <Info rotulo="Aptidão adiada" valor={`${e.adiamentos_aptidao}x · ${e.dias_atraso_aptidao} dias de atraso`} />}
        </Bloco>

        {(ehFemea && e.ordem_lactacao > 0 || e.ultimo_escore != null || e.carencia_ate || Object.keys(e.ultimas_aplicacoes).length > 0) && (
          <Bloco titulo="Saúde">
            {e.carencia_ate && <Info rotulo="Carência do leite" valor={`${e.em_carencia ? 'até' : 'terminou em'} ${data(e.carencia_ate)}`} />}
            {e.ultimo_escore != null && <Info rotulo="Escore corporal" valor={numero(e.ultimo_escore, 1)} />}
            {e.ordem_lactacao > 0 && <Info rotulo="Mastite na lactação" valor={`${e.casos_mastite_lactacao} caso(s)`} />}
            {e.candidata_descarte && <Info rotulo="Candidata a descarte" valor={e.motivos_descarte.join('; ')} />}
            {Object.entries(e.ultimas_aplicacoes).map(([id, quando]) => (
              <Info key={id} rotulo={apoio.calendario.find(m => m.id === Number(id))?.nome || 'Vacina'} valor={`aplicada em ${data(quando)}`} />
            ))}
          </Bloco>
        )}

        <Bloco titulo="Identificação">
          <Info rotulo="Nascimento" valor={`${data(animal.data_nascimento)}${animal.nascimento_estimado ? ' (estimada)' : ''}`} />
          <Info rotulo="Origem" valor={animal.origem === 'comprado' ? 'Comprado' : 'Nascido na fazenda'} />
          {animal.grau_sangue && <Info rotulo="Grau de sangue" valor={animal.grau_sangue} />}
          {animal.mae && (
            <Info rotulo="Mãe" valor={<button className="font-semibold text-[#050D21] underline" onClick={() => aoAbrirAnimal(animal.mae!.id)}>{animal.mae.brinco}{animal.mae.nome ? ` · ${animal.mae.nome}` : ''}</button>} />
          )}
          {animal.pai_semen && <Info rotulo="Pai / sêmen" valor={animal.pai_semen} />}
          {animal.peso_nascer != null && <Info rotulo="Peso ao nascer" valor={`${numero(animal.peso_nascer, 1)} kg`} />}
        </Bloco>
      </div>

      {ficha.crias.length > 0 && (
        <Bloco titulo="Crias">
          <div className="flex flex-wrap gap-2 pt-1">
            {ficha.crias.map(c => (
              <button key={c.id} onClick={() => aoAbrirAnimal(c.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 text-sm hover:border-[#56E39F]">
                <Baby size={14} className="text-gray-400" /> {c.brinco}{c.nome ? ` · ${c.nome}` : ''} ({c.sexo})
              </button>
            ))}
          </div>
        </Bloco>
      )}

      {/* Histórico */}
      <section>
        <h3 className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-2 ml-1"><History size={16} /> Histórico</h3>
        <Cartao className="divide-y divide-gray-100">
          {eventos.map(ev => (
            <div key={ev.id} className="p-3 flex items-start gap-3">
              <div className="w-14 shrink-0 text-xs text-gray-500 pt-0.5">{data(ev.data).slice(0, 5)}<br /><span className="text-gray-400">{ev.data.slice(0, 4)}</span></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">{ev.tipo_nome}</p>
                {resumoDados(ev.tipo, ev.dados) && <p className="text-xs text-gray-600 mt-0.5">{resumoDados(ev.tipo, ev.dados)}</p>}
                {ev.observacao && <p className="text-xs text-gray-500 italic mt-0.5">{ev.observacao}</p>}
                {ev.lancado_por && <p className="text-[11px] text-gray-400 mt-1">por {ev.lancado_por.nome}</p>}
                {ev.gestao && (
                  <p className={`text-[11px] mt-1 font-semibold ${ev.gestao.status === 'enviado' ? 'text-green-700' : ev.gestao.status === 'erro' ? 'text-red-600' : 'text-amber-600'}`}
                    title={ev.gestao.erro || undefined}>
                    {ev.gestao.status === 'enviado' ? '✓ No financeiro do Gestão' : ev.gestao.status === 'erro' ? '⚠ Erro ao enviar ao Gestão' : '… Aguardando envio ao Gestão'}
                  </p>
                )}
              </div>
              {ev.pode_excluir && (
                <button onClick={() => excluirEvento(ev.id, ev.tipo_nome)} className="p-1.5 text-gray-300 hover:text-red-600 rounded-lg hover:bg-red-50" title="Excluir lançamento">
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
        </Cartao>
      </section>

      {apoio.ehGestor && (
        <div className="text-center pt-2">
          <button onClick={excluirCadastro} className="text-xs text-gray-400 hover:text-red-600 underline underline-offset-2">Excluir cadastro (feito por engano)</button>
        </div>
      )}

      {/* Botão de lançar fixo no rodapé (uso no curral, com o polegar) */}
      {podeLancar && (
        <div className="fixed left-0 right-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] lg:bottom-0 lg:left-72 z-30 bg-white/90 backdrop-blur border-t border-gray-200">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <Botao className="w-full py-3 text-base" icone={<Plus size={20} />} onClick={() => setLancando({ tipo: null })}>Lançar evento</Botao>
          </div>
        </div>
      )}

      <LancarEventoJanela aberta={!!lancando} fazendaId={fazendaId} ficha={ficha} tiposPermitidos={apoio.tipos} lotes={apoio.lotes}
        funcionarioId={apoio.funcionarioId} tipoInicial={lancando?.tipo} dadosIniciais={lancando?.dados}
        calendario={apoio.calendario} aoFechar={() => setLancando(null)}
        aoLancar={(nova) => { setFicha(nova); setLancando(null); }} />
    </div>
  );
};

const Bloco: React.FC<{ titulo: string; children: React.ReactNode }> = ({ titulo, children }) => (
  <Cartao className="p-4">
    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{titulo}</p>
    <div className="space-y-1.5">{children}</div>
  </Cartao>
);

const Info: React.FC<{ rotulo: string; valor: React.ReactNode; destaque?: boolean }> = ({ rotulo, valor, destaque }) => (
  <div className="flex items-baseline justify-between gap-3 text-sm">
    <span className="text-gray-500">{rotulo}</span>
    <span className={`text-right ${destaque ? 'font-bold text-gray-900' : 'font-medium text-gray-800'}`}>{valor}</span>
  </div>
);
