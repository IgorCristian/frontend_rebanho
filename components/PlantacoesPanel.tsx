import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Sprout, Wheat } from 'lucide-react';
import { api } from '../services/api';
import { CulturaInfo, Plantacao, SituacaoPlantacoesGestao } from '../types';
import { data as formatarData, hojeISO, numero } from '../services/formato';
import { AJUDA } from '../services/ajuda';
import { Botao, Campo, Carregando, Cartao, Entrada, Janela, Selo, TituloSecao, Vazio, confirmar } from './ui';

const somarDias = (iso: string, dias: number) => {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + dias);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const areaEmTexto = (hectares: number | null) => (hectares == null ? 'Área não informada' : `${numero(hectares, hectares % 1 ? 1 : 0)} ha`);

export const prazoDaPlantacao = (p: Plantacao) => {
  if (p.data_colheita) return '';
  if (p.dias_para_corte === null) return 'Sem previsão de corte';
  if (p.dias_para_corte > 0) return `Faltam ${p.dias_para_corte} ${p.dias_para_corte === 1 ? 'dia' : 'dias'} para o corte`;
  if (p.dias_para_corte === 0) return 'Corte previsto para hoje';
  const atraso = -p.dias_para_corte;
  return `Corte previsto há ${atraso} ${atraso === 1 ? 'dia' : 'dias'}`;
};

// As duas janelas abaixo são usadas aqui e também no jogo
export const PlantacaoJanela: React.FC<{
  aberta: boolean; fazendaId: number; culturas: CulturaInfo[]; plantacao?: Plantacao | null;
  aoFechar: () => void; aoSalvar: (p: Plantacao) => void;
}> = ({ aberta, fazendaId, culturas, plantacao, aoFechar, aoSalvar }) => {
  const [dados, setDados] = useState({ nome: '', cultura: '', variedade: '', hectares: '', data_plantio: '', previsao_corte: '', data_colheita: '', toneladas: '' });
  const [salvando, setSalvando] = useState(false);
  const previsaoPeloCiclo = (cultura: string, plantio: string) => {
    // Mesma regra do backend: "Milho safrinha" conta como milho; cultura desconhecida fica sem previsão automática
    const ciclo = culturas.find(c => cultura.toLowerCase().includes(c.id))?.ciclo_dias;
    return ciclo && plantio ? somarDias(plantio, ciclo) : '';
  };

  useEffect(() => {
    if (!aberta) return;
    const cultura = plantacao ? plantacao.cultura || '' : '';
    const plantio = plantacao?.data_plantio || hojeISO();
    setDados({
      nome: plantacao?.nome || '', cultura, variedade: plantacao?.variedade || '',
      hectares: plantacao?.hectares != null ? String(plantacao.hectares).replace('.', ',') : '', data_plantio: plantio,
      previsao_corte: plantacao ? plantacao.previsao_corte || '' : '',
      data_colheita: plantacao?.data_colheita || '', toneladas: plantacao?.toneladas != null ? String(plantacao.toneladas).replace('.', ',') : '',
    });
  }, [aberta]);

  const mudar = (campo: keyof typeof dados) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const novo = { ...dados, [campo]: e.target.value };
    // Trocar a cultura ou o plantio recalcula a previsão pelo ciclo
    if (campo === 'cultura' || campo === 'data_plantio') novo.previsao_corte = previsaoPeloCiclo(novo.cultura, novo.data_plantio);
    setDados(novo);
  };

  const salvar = async () => {
    setSalvando(true);
    try {
      const { data_colheita, toneladas, ...basicos } = dados;
      const salva = plantacao
        ? await api.editarPlantacao(fazendaId, plantacao.id, plantacao.data_colheita ? dados : basicos)
        : await api.criarPlantacao(fazendaId, basicos);
      aoSalvar(salva);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Janela titulo={plantacao ? 'Corrigir plantação' : 'Nova plantação'} aberta={aberta} aoFechar={aoFechar} ajuda={AJUDA.plantacoes} rodape={
      <>
        <Botao variante="secundario" onClick={aoFechar}>Cancelar</Botao>
        <Botao onClick={salvar} carregando={salvando}>Salvar</Botao>
      </>
    }>
      <div className="grid grid-cols-2 gap-3">
        <Campo rotulo="Cultura *">
          <Entrada list="culturas-sugeridas" autoFocus={!plantacao} value={dados.cultura} onChange={mudar('cultura')} placeholder="Ex.: Milho" />
          <datalist id="culturas-sugeridas">{culturas.map(c => <option key={c.id} value={c.nome} />)}</datalist>
        </Campo>
        <Campo rotulo="Variedade"><Entrada value={dados.variedade} onChange={mudar('variedade')} placeholder="Ex.: BS 2606" /></Campo>
      </div>
      <Campo rotulo="Nome" dica="Como aparece aqui e na Produção do Gestão. Em branco, usa o nome da cultura."><Entrada value={dados.nome} onChange={mudar('nome')} placeholder="Ex.: Milho Baixada" /></Campo>
      <Campo rotulo="Área (hectares) *"><Entrada inputMode="decimal" value={dados.hectares} onChange={mudar('hectares')} placeholder="Ex.: 12" /></Campo>
      <div className="grid grid-cols-2 gap-3">
        <Campo rotulo="Data do plantio *"><Entrada type="date" max={hojeISO()} value={dados.data_plantio} onChange={mudar('data_plantio')} /></Campo>
        <Campo rotulo="Previsão de corte"><Entrada type="date" value={dados.previsao_corte} onChange={mudar('previsao_corte')} /></Campo>
      </div>
      <p className="text-xs text-gray-500 -mt-2">Para milho, sorgo e capim, a previsão é uma conta aproximada pelo ciclo da cultura. Ajuste conforme a variedade e a região.</p>
      {plantacao?.data_colheita && (
        <div className="grid grid-cols-2 gap-3">
          <Campo rotulo="Data da colheita" dica="Apague a data para voltar a plantação ao campo."><Entrada type="date" max={hojeISO()} value={dados.data_colheita} onChange={mudar('data_colheita')} /></Campo>
          <Campo rotulo="Toneladas colhidas"><Entrada inputMode="decimal" value={dados.toneladas} onChange={mudar('toneladas')} /></Campo>
        </div>
      )}
    </Janela>
  );
};

export const ColheitaJanela: React.FC<{
  plantacao: Plantacao | null; fazendaId: number; aoFechar: () => void; aoSalvar: (p: Plantacao) => void;
}> = ({ plantacao, fazendaId, aoFechar, aoSalvar }) => {
  const [dataColheita, setDataColheita] = useState(hojeISO());
  const [toneladas, setToneladas] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    setDataColheita(hojeISO());
    setToneladas('');
  }, [plantacao?.id]);

  const salvar = async () => {
    if (!plantacao) return;
    setSalvando(true);
    try {
      aoSalvar(await api.editarPlantacao(fazendaId, plantacao.id, { data_colheita: dataColheita, toneladas }));
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Janela titulo={plantacao ? `Colher ${plantacao.nome}` : ''} aberta={!!plantacao} aoFechar={aoFechar} rodape={
      <>
        <Botao variante="secundario" onClick={aoFechar}>Cancelar</Botao>
        <Botao onClick={salvar} carregando={salvando}>Registrar colheita</Botao>
      </>
    }>
      <Campo rotulo="Data da colheita *"><Entrada type="date" max={hojeISO()} value={dataColheita} onChange={e => setDataColheita(e.target.value)} /></Campo>
      <Campo rotulo="Toneladas colhidas" dica="Se ainda não souber, deixe em branco e corrija depois."><Entrada inputMode="decimal" autoFocus value={toneladas} onChange={e => setToneladas(e.target.value)} placeholder="Ex.: 300" /></Campo>
    </Janela>
  );
};

export const PlantacoesPanel: React.FC<{ fazendaId: number; podeEditar: boolean }> = ({ fazendaId, podeEditar }) => {
  const [plantacoes, setPlantacoes] = useState<Plantacao[] | null>(null);
  const [culturas, setCulturas] = useState<CulturaInfo[]>([]);
  const [gestao, setGestao] = useState<SituacaoPlantacoesGestao>({ vinculada: false, erro: null });
  const [editando, setEditando] = useState<Plantacao | 'nova' | null>(null);
  const [colhendo, setColhendo] = useState<Plantacao | null>(null);

  const carregar = () => api.listarPlantacoes(fazendaId)
    .then((r) => { setPlantacoes(r.plantacoes); setCulturas(r.culturas); setGestao(r.gestao); })
    .catch((err) => { toast.error(err.message); setPlantacoes([]); });
  useEffect(() => { carregar(); }, [fazendaId]);

  const excluir = async (p: Plantacao) => {
    if (!(await confirmar(`Excluir a plantação "${p.nome}"${gestao.vinculada ? ' aqui e no Gestão' : ''}? Não dá para desfazer.`, { botao: 'Excluir', perigo: true }))) return;
    try {
      await api.excluirPlantacao(fazendaId, p.id);
      carregar();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const noCampo = plantacoes?.filter(p => !p.data_colheita) || [];
  const colhidas = plantacoes?.filter(p => p.data_colheita) || [];
  const areaNoCampo = noCampo.reduce((s, p) => s + (p.hectares || 0), 0);

  const aguardando = (p: Plantacao) => gestao.vinculada && p.sync_status !== 'enviado' && <Selo cor="amarelo">Aguardando envio ao Gestão</Selo>;
  const subtitulo = (p: Plantacao) => [p.cultura, p.variedade].filter(Boolean).join(' · ');

  const acoes = (p: Plantacao) => podeEditar && (
    <div className="flex items-center gap-1 shrink-0">
      <button onClick={() => setEditando(p)} className="p-2 text-gray-400 hover:text-gray-800 rounded-lg hover:bg-gray-100" title="Corrigir" aria-label="Corrigir plantação"><Pencil size={16} /></button>
      <button onClick={() => excluir(p)} className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100" title="Excluir" aria-label="Excluir plantação"><Trash2 size={16} /></button>
    </div>
  );

  if (plantacoes === null) return <Carregando />;

  return (
    <section className="space-y-6">
      {gestao.vinculada && (
        <p className={`text-sm rounded-lg px-3 py-2 ${gestao.erro ? 'bg-amber-50 text-amber-800' : 'bg-green-50 text-green-800'}`}>
          {gestao.erro
            ? `Sem contato com o Gestão agora: mostrando a última cópia, e o que você alterar será enviado depois. (${gestao.erro})`
            : 'Sincronizado com a Produção do Gestão Fácil.'}
        </p>
      )}
      <div>
        <TituloSecao
          titulo="No campo"
          descricao={areaNoCampo ? `${numero(areaNoCampo, areaNoCampo % 1 ? 1 : 0)} ha plantados` : undefined}
          acao={podeEditar && <Botao icone={<Plus size={18} />} onClick={() => setEditando('nova')}>Nova plantação</Botao>}
        />
        {noCampo.length === 0 ? (
          <Cartao><Vazio icone={<Sprout />} titulo="Nada plantado no momento" texto="Registre o plantio para acompanhar quando cortar." /></Cartao>
        ) : (
          <Cartao className="divide-y divide-gray-100">
            {noCampo.map(p => (
              <div key={p.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 flex flex-wrap items-center gap-2">
                      {p.nome} <span className="font-normal text-gray-500">{areaEmTexto(p.hectares)}</span>
                      {p.status === 'ponto_de_corte' && <Selo cor="amarelo">Ponto de corte</Selo>}
                      {aguardando(p)}
                    </p>
                    {subtitulo(p) && <p className="text-sm text-gray-500">{subtitulo(p)}</p>}
                    <p className="text-sm text-gray-500">Plantio em {formatarData(p.data_plantio)}{p.previsao_corte ? ` · corte em ${formatarData(p.previsao_corte)}` : ''}</p>
                  </div>
                  {acoes(p)}
                </div>
                {p.progresso !== null && (
                  <div className="mt-3 h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full bg-[#56E39F]" style={{ width: `${p.progresso * 100}%` }} />
                  </div>
                )}
                <div className="mt-2 flex items-center justify-between gap-3">
                  <p className="text-sm text-gray-600">{prazoDaPlantacao(p)}</p>
                  {podeEditar && <Botao variante="secundario" icone={<Wheat size={16} />} onClick={() => setColhendo(p)}>Colher</Botao>}
                </div>
              </div>
            ))}
          </Cartao>
        )}
      </div>

      {colhidas.length > 0 && (
        <div>
          <TituloSecao titulo="Colhidas" />
          <Cartao className="divide-y divide-gray-100">
            {colhidas.map(p => (
              <div key={p.id} className="p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 flex flex-wrap items-center gap-2">
                    {p.nome} <span className="font-normal text-gray-500">{areaEmTexto(p.hectares)}</span>
                    {aguardando(p)}
                  </p>
                  <p className="text-sm text-gray-500">
                    Colhida em {formatarData(p.data_colheita)}
                    {p.toneladas != null && ` · ${numero(p.toneladas, p.toneladas % 1 ? 1 : 0)} t`}
                    {p.toneladas != null && p.hectares ? ` · ${numero(p.toneladas / p.hectares, 1)} t/ha` : ''}
                  </p>
                </div>
                {acoes(p)}
              </div>
            ))}
          </Cartao>
        </div>
      )}

      <PlantacaoJanela aberta={!!editando} fazendaId={fazendaId} culturas={culturas} plantacao={editando === 'nova' ? null : editando}
        aoFechar={() => setEditando(null)} aoSalvar={() => { setEditando(null); carregar(); }} />
      <ColheitaJanela plantacao={colhendo} fazendaId={fazendaId} aoFechar={() => setColhendo(null)}
        aoSalvar={() => { setColhendo(null); carregar(); }} />
    </section>
  );
};
