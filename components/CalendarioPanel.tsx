import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, Syringe, BellRing, BellOff } from 'lucide-react';
import { api } from '../services/api';
import { CATEGORIAS, ManejoSanitario } from '../types';
import { Botao, Campo, Entrada, Selecao, AreaTexto, Cartao, Selo, Janela, Carregando, TituloSecao } from './ui';

interface Props {
  fazendaId: number;
  podeEditar: boolean;
}

const regra = (m: ManejoSanitario) => {
  const partes: string[] = [];
  if (m.usar_p29) partes.push('A partir da idade do parâmetro P29');
  else if (m.idade_inicio_meses != null) partes.push(`A partir de ${m.idade_inicio_meses} meses`);
  if (m.idade_max_meses != null) partes.push(`até ${m.idade_max_meses} meses`);
  if (m.intervalo_meses) partes.push(`repetir a cada ${m.intervalo_meses} meses`);
  return partes.length ? partes.join(', ') : (m.epoca || 'Conforme veterinário');
};

const ORDEM_CATEGORIAS = ['BZF', 'BZM', 'REC', 'GAR', 'NVA', 'NVP', 'PRE', 'RPA', 'LAC', 'SEC', 'TOR'];

// Calendário sanitário da fazenda (modelo da planilha). Itens com idade/intervalo geram o alerta "vacina pendente".
export const CalendarioPanel: React.FC<Props> = ({ fazendaId, podeEditar }) => {
  const [itens, setItens] = useState<ManejoSanitario[] | null>(null);
  const [editando, setEditando] = useState<Partial<ManejoSanitario> | null>(null);
  const [salvando, setSalvando] = useState(false);

  const carregar = () => api.listarCalendario(fazendaId).then(setItens).catch((err) => { toast.error(err.message); setItens([]); });
  useEffect(() => { carregar(); }, [fazendaId]);

  const set = (campo: keyof ManejoSanitario, valor: any) => setEditando({ ...editando, [campo]: valor });

  const salvar = async () => {
    if (!editando?.nome?.trim()) return toast.error('Informe o nome.');
    setSalvando(true);
    try {
      const { id, gera_alerta, ...dados } = editando as ManejoSanitario;
      if (id) await api.editarManejo(fazendaId, id, dados);
      else await api.criarManejo(fazendaId, dados);
      setEditando(null);
      carregar();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSalvando(false);
    }
  };

  if (!itens) return <Carregando />;

  return (
    <section>
      <TituloSecao
        titulo="Calendário sanitário"
        descricao="Modelo da planilha: revise idades, reforços e carências com o veterinário. Itens com idade ou intervalo avisam quando a vacina está pendente."
        acao={podeEditar && <Botao icone={<Plus size={18} />} onClick={() => setEditando({ tipo_evento: 'vacinacao', categorias: [], ativo: true })}>Novo item</Botao>}
      />
      <Cartao className="divide-y divide-gray-100">
        {itens.map(m => (
          <div key={m.id} className={`p-4 flex items-start justify-between gap-3 ${m.ativo ? '' : 'opacity-50'}`}>
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-9 h-9 shrink-0 rounded-lg bg-gray-100 text-gray-500 flex items-center justify-center"><Syringe size={18} /></div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 flex flex-wrap items-center gap-2">
                  {m.nome}
                  {m.obrigatorio && <Selo cor="vermelho">Obrigatória</Selo>}
                  {!m.ativo && <Selo>Inativo</Selo>}
                  {m.gera_alerta ? <Selo cor="verde"><BellRing size={11} /> Alerta</Selo> : <Selo><BellOff size={11} /> Sem alerta</Selo>}
                </p>
                <p className="text-sm text-gray-600 mt-0.5">{regra(m)}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {[m.sexo === 'F' ? 'Fêmeas' : m.sexo === 'M' ? 'Machos' : null,
                    m.categorias.length ? m.categorias.map(c => CATEGORIAS[c]).join(', ') : 'Todas as categorias',
                    m.reforco && `Reforço: ${m.reforco}`,
                    m.carencia_leite_dias != null && `Carência leite: ${m.carencia_leite_dias} dias`].filter(Boolean).join(' · ')}
                </p>
              </div>
            </div>
            {podeEditar && <button onClick={() => setEditando(m)} className="p-2 text-gray-400 hover:text-gray-800 rounded-lg hover:bg-gray-100" title="Editar"><Pencil size={16} /></button>}
          </div>
        ))}
      </Cartao>

      <Janela titulo={editando?.id ? 'Editar item do calendário' : 'Novo item do calendário'} aberta={!!editando} aoFechar={() => setEditando(null)} rodape={
        <>
          <Botao variante="secundario" onClick={() => setEditando(null)}>Cancelar</Botao>
          <Botao onClick={salvar} carregando={salvando}>Salvar</Botao>
        </>
      }>
        {editando && (
          <>
            <Campo rotulo="Nome *"><Entrada value={editando.nome || ''} onChange={e => set('nome', e.target.value)} placeholder="Ex.: Brucelose" /></Campo>
            <div className="grid grid-cols-2 gap-3">
              <Campo rotulo="Lançado como">
                <Selecao value={editando.tipo_evento} onChange={e => set('tipo_evento', e.target.value)}>
                  <option value="vacinacao">Vacinação</option><option value="vermifugacao">Vermifugação / parasitas</option>
                </Selecao>
              </Campo>
              <Campo rotulo="Sexo">
                <Selecao value={editando.sexo || ''} onChange={e => set('sexo', e.target.value || null)}>
                  <option value="">Ambos</option><option value="F">Fêmeas</option><option value="M">Machos</option>
                </Selecao>
              </Campo>
            </div>
            <Campo rotulo="Categorias" dica="Nenhuma marcada = todas.">
              <div className="flex flex-wrap gap-1.5">
                {ORDEM_CATEGORIAS.map(c => {
                  const marcada = editando.categorias?.includes(c);
                  return (
                    <button key={c} type="button" onClick={() => set('categorias', marcada ? editando.categorias!.filter(x => x !== c) : [...(editando.categorias || []), c])}
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${marcada ? 'bg-[#050D21] text-white border-[#050D21]' : 'bg-white text-gray-600 border-gray-200'}`}>
                      {CATEGORIAS[c]}
                    </button>
                  );
                })}
              </div>
            </Campo>

            <div className="rounded-xl bg-gray-50 border border-gray-100 p-4 space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase">Quando avisar (deixe em branco para não gerar alerta)</p>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" className="w-4 h-4 accent-[#56E39F]" checked={!!editando.usar_p29} onChange={e => set('usar_p29', e.target.checked)} />
                Começar na idade do parâmetro P29 (brucelose)
              </label>
              <div className="grid grid-cols-3 gap-2">
                <Campo rotulo="A partir de (meses)"><Entrada inputMode="decimal" disabled={!!editando.usar_p29} value={editando.idade_inicio_meses ?? ''} onChange={e => set('idade_inicio_meses', e.target.value)} /></Campo>
                <Campo rotulo="Até (meses)"><Entrada inputMode="decimal" value={editando.idade_max_meses ?? ''} onChange={e => set('idade_max_meses', e.target.value)} /></Campo>
                <Campo rotulo="Repetir a cada (meses)"><Entrada inputMode="decimal" value={editando.intervalo_meses ?? ''} onChange={e => set('intervalo_meses', e.target.value)} /></Campo>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Campo rotulo="Época (texto)"><Entrada value={editando.epoca || ''} onChange={e => set('epoca', e.target.value)} placeholder="Ex.: Antes da estação" /></Campo>
              <Campo rotulo="Reforço"><Entrada value={editando.reforco || ''} onChange={e => set('reforco', e.target.value)} placeholder="Ex.: Conforme bula" /></Campo>
              <Campo rotulo="Carência leite (dias)"><Entrada inputMode="decimal" value={editando.carencia_leite_dias ?? ''} onChange={e => set('carencia_leite_dias', e.target.value)} /></Campo>
              <Campo rotulo="Carência carne (dias)"><Entrada inputMode="decimal" value={editando.carencia_carne_dias ?? ''} onChange={e => set('carencia_carne_dias', e.target.value)} /></Campo>
            </div>
            <Campo rotulo="Observação"><AreaTexto rows={2} value={editando.observacao || ''} onChange={e => set('observacao', e.target.value)} /></Campo>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" className="w-4 h-4 accent-[#56E39F]" checked={!!editando.obrigatorio} onChange={e => set('obrigatorio', e.target.checked)} /> Obrigatória (alerta urgente)
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" className="w-4 h-4 accent-[#56E39F]" checked={editando.ativo !== false} onChange={e => set('ativo', e.target.checked)} /> Ativo
              </label>
            </div>
          </>
        )}
      </Janela>
    </section>
  );
};
