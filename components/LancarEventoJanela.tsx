import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { api } from '../services/api';
import { CATEGORIAS, CATEGORIAS_POR_SEXO, FichaAnimal, Lote } from '../types';
import { EVENTOS, GRUPOS_EVENTO, CampoEvento, eventoSeAplica } from '../services/eventos';
import { hojeISO } from '../services/formato';
import { Botao, Campo, Entrada, Selecao, AreaTexto, Janela } from './ui';

interface Props {
  aberta: boolean;
  fazendaId: number;
  ficha: FichaAnimal;
  tiposPermitidos: string[];
  lotes: Lote[];
  funcionarioId?: number;       // acesso da fazenda: quem está lançando
  tipoInicial?: string | null;  // ex.: aberto a partir de um alerta
  aoFechar: () => void;
  aoLancar: (ficha: FichaAnimal) => void;
}

type Cria = { brinco: string; sexo: '' | 'F' | 'M'; nome: string; peso_nascer: string; natimorto: boolean };
const criaVazia = (): Cria => ({ brinco: '', sexo: '', nome: '', peso_nascer: '', natimorto: false });

export const LancarEventoJanela: React.FC<Props> = ({ aberta, fazendaId, ficha, tiposPermitidos, lotes, funcionarioId, tipoInicial, aoFechar, aoLancar }) => {
  const [tipo, setTipo] = useState<string | null>(null);
  const [dataEvento, setDataEvento] = useState(hojeISO());
  const [dados, setDados] = useState<Record<string, any>>({});
  const [observacao, setObservacao] = useState('');
  const [salvando, setSalvando] = useState(false);

  const categoria = ficha.estado.categoria;
  const disponiveis = useMemo(() => tiposPermitidos.filter(t => EVENTOS[t] && eventoSeAplica(t, categoria)), [tiposPermitidos, categoria]);

  const escolher = (t: string | null) => {
    setTipo(t);
    setDados(t === 'controle_leiteiro' ? { ordenhas: ['', ''] } : t === 'parto' ? { crias: [criaVazia()] } : {});
    setObservacao('');
  };

  useEffect(() => {
    if (aberta) {
      setDataEvento(hojeISO());
      escolher(tipoInicial && disponiveis.includes(tipoInicial) ? tipoInicial : null);
    }
  }, [aberta]);

  const config = tipo ? EVENTOS[tipo] : null;

  const salvar = async () => {
    if (!tipo || !config) return;
    const enviar: Record<string, any> = {};
    for (const campo of config.campos) {
      if (campo.mostrarSe && !campo.mostrarSe(dados)) continue;
      const valor = dados[campo.chave];
      const vazio = valor === undefined || valor === '' || (campo.tipo === 'ordenhas' && !(valor as string[]).some(v => v !== ''));
      if (vazio) {
        if (campo.obrigatorio) return toast.error(`Informe: ${campo.rotulo.toLowerCase()}.`);
        continue;
      }
      if (campo.tipo === 'crias') {
        const crias = (valor as Cria[]).filter(c => c.sexo || c.brinco);
        if (crias.some(c => !c.sexo)) return toast.error('Informe o sexo de cada cria.');
        if (crias.some(c => !c.natimorto && !c.brinco.trim())) return toast.error('Informe o brinco de cada cria viva.');
        enviar.crias = crias.map(c => ({ ...c, peso_nascer: c.peso_nascer || undefined }));
      } else if (campo.tipo === 'ordenhas') {
        enviar.ordenhas = (valor as string[]).filter(v => v !== '');
      } else {
        enviar[campo.chave] = valor;
      }
    }

    setSalvando(true);
    try {
      const resp = await api.lancarEvento(fazendaId, ficha.animal.id, {
        tipo, data: dataEvento, dados: enviar, observacao, ...(funcionarioId ? { funcionario_id: funcionarioId } : {}),
      });
      toast.success(`${config.nome} lançado(a).`);
      resp.avisos.forEach(aviso => toast(aviso, { icon: '⚠️', duration: 6000 }));
      aoLancar(resp.ficha);
    } catch (err: any) {
      toast.error(err.message, { duration: 6000 });
    } finally {
      setSalvando(false);
    }
  };

  const titulo = config ? config.nome : `Lançar para ${ficha.animal.nome || `brinco ${ficha.animal.brinco}`}`;

  return (
    <Janela titulo={titulo} aberta={aberta} aoFechar={aoFechar} rodape={config ? (
      <>
        <Botao variante="secundario" icone={<ArrowLeft size={16} />} onClick={() => escolher(null)}>Voltar</Botao>
        <Botao onClick={salvar} carregando={salvando}>Lançar</Botao>
      </>
    ) : undefined}>
      {!config ? (
        disponiveis.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-6">Nenhum lançamento disponível para este animal com o seu acesso.</p>
        ) : (
          <div className="space-y-4">
            {GRUPOS_EVENTO.map(grupo => {
              const tipos = disponiveis.filter(t => EVENTOS[t].grupo === grupo);
              if (!tipos.length) return null;
              return (
                <div key={grupo}>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{grupo}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {tipos.map(t => (
                      <button key={t} onClick={() => escolher(t)}
                        className="p-3 rounded-xl border border-gray-200 text-left text-sm font-semibold text-gray-800 hover:border-[#56E39F] hover:bg-green-50/50 transition">
                        {EVENTOS[t].nome}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        <>
          <Campo rotulo="Data">
            <Entrada type="date" max={hojeISO()} min={ficha.animal.data_nascimento || undefined} value={dataEvento} onChange={e => setDataEvento(e.target.value)} />
          </Campo>
          {config.campos.filter(c => !c.mostrarSe || c.mostrarSe(dados)).map(campo => (
            <CampoDinamico key={campo.chave} campo={campo} valor={dados[campo.chave]} lotes={lotes} sexo={ficha.animal.sexo}
              aoMudar={(v) => setDados({ ...dados, [campo.chave]: v })} />
          ))}
          <Campo rotulo="Observação"><AreaTexto rows={2} value={observacao} onChange={e => setObservacao(e.target.value)} /></Campo>
        </>
      )}
    </Janela>
  );
};

const CampoDinamico: React.FC<{ campo: CampoEvento; valor: any; lotes: Lote[]; sexo: 'F' | 'M'; aoMudar: (v: any) => void }> = ({ campo, valor, lotes, sexo, aoMudar }) => {
  const rotulo = `${campo.rotulo}${campo.obrigatorio ? ' *' : ''}`;
  switch (campo.tipo) {
    case 'numero':
      return (
        <Campo rotulo={rotulo}>
          <div className="flex items-center border border-gray-200 rounded-lg bg-white focus-within:border-[#56E39F]">
            <input inputMode="decimal" value={valor ?? ''} onChange={e => aoMudar(e.target.value)} className="w-full px-3 py-2.5 bg-transparent rounded-lg focus:outline-none" />
            {campo.unidade && <span className="pr-3 text-sm text-gray-400">{campo.unidade}</span>}
          </div>
        </Campo>
      );
    case 'texto':
      return <Campo rotulo={rotulo}><Entrada value={valor ?? ''} onChange={e => aoMudar(e.target.value)} /></Campo>;
    case 'opcoes':
      return (
        <Campo rotulo={rotulo}>
          <Selecao value={valor ?? ''} onChange={e => aoMudar(e.target.value)}>
            <option value="">—</option>{campo.opcoes!.map(o => <option key={o}>{o}</option>)}
          </Selecao>
        </Campo>
      );
    case 'simnao': {
      const [sim, nao] = campo.rotulosSimNao || ['Sim', 'Não'];
      return (
        <Campo rotulo={rotulo}>
          <div className="grid grid-cols-2 gap-2">
            {([[true, sim], [false, nao]] as const).map(([v, r]) => (
              <button key={String(v)} type="button" onClick={() => aoMudar(v)}
                className={`py-2.5 rounded-lg border text-sm font-semibold transition ${valor === v ? 'bg-[#050D21] text-white border-[#050D21]' : 'bg-white text-gray-600 border-gray-200'}`}>
                {r}
              </button>
            ))}
          </div>
        </Campo>
      );
    }
    case 'lote':
      return (
        <Campo rotulo={rotulo}>
          <Selecao value={valor ?? ''} onChange={e => aoMudar(e.target.value ? Number(e.target.value) : '')}>
            <option value="">Sem lote</option>{lotes.filter(l => l.ativo).map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
          </Selecao>
        </Campo>
      );
    case 'categoria':
      return (
        <Campo rotulo={rotulo}>
          <Selecao value={valor ?? ''} onChange={e => aoMudar(e.target.value)}>
            <option value="">Escolha...</option>{CATEGORIAS_POR_SEXO[sexo].map(c => <option key={c} value={c}>{CATEGORIAS[c]}</option>)}
          </Selecao>
        </Campo>
      );
    case 'ordenhas': {
      const lista: string[] = valor || ['', ''];
      const total = lista.reduce((s, v) => s + (Number(String(v).replace(',', '.')) || 0), 0);
      return (
        <Campo rotulo={rotulo} dica={`Total do dia: ${total.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} L`}>
          <div className="grid grid-cols-3 gap-2">
            {[0, 1, 2].map(i => (
              <div key={i}>
                <span className="block text-[11px] text-gray-400 mb-1">{i + 1}ª ordenha</span>
                <Entrada inputMode="decimal" placeholder="L" value={lista[i] ?? ''}
                  onChange={e => { const nova = [...lista]; nova[i] = e.target.value; aoMudar(nova); }} />
              </div>
            ))}
          </div>
        </Campo>
      );
    }
    case 'crias': {
      const crias: Cria[] = valor || [];
      const mudar = (i: number, campo: keyof Cria, v: any) => aoMudar(crias.map((c, j) => j === i ? { ...c, [campo]: v } : c));
      return (
        <Campo rotulo={rotulo} dica="Bezerros vivos são cadastrados automaticamente, já ligados à mãe.">
          <div className="space-y-3">
            {crias.map((c, i) => (
              <div key={i} className="rounded-xl border border-gray-200 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500">Cria {i + 1}</span>
                  <button type="button" onClick={() => aoMudar(crias.filter((_, j) => j !== i))} className="p-1 text-gray-400 hover:text-red-600"><Trash2 size={16} /></button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Selecao value={c.sexo} onChange={e => mudar(i, 'sexo', e.target.value)}>
                    <option value="">Sexo...</option><option value="F">Fêmea</option><option value="M">Macho</option>
                  </Selecao>
                  <Entrada placeholder="Brinco" disabled={c.natimorto} value={c.brinco} onChange={e => mudar(i, 'brinco', e.target.value)} />
                  <Entrada placeholder="Nome" disabled={c.natimorto} value={c.nome} onChange={e => mudar(i, 'nome', e.target.value)} />
                  <Entrada placeholder="Peso (kg)" inputMode="decimal" disabled={c.natimorto} value={c.peso_nascer} onChange={e => mudar(i, 'peso_nascer', e.target.value)} />
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input type="checkbox" className="w-4 h-4 accent-[#56E39F]" checked={c.natimorto} onChange={e => mudar(i, 'natimorto', e.target.checked)} /> Natimorto
                </label>
              </div>
            ))}
            <Botao variante="secundario" icone={<Plus size={16} />} onClick={() => aoMudar([...crias, criaVazia()])} type="button">Adicionar cria</Botao>
          </div>
        </Campo>
      );
    }
  }
};
