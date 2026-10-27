import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '../services/api';
import { CATEGORIAS, CATEGORIAS_POR_SEXO, Lote, RACAS } from '../types';
import { hojeISO } from '../services/formato';
import { Botao, Campo, Entrada, Selecao, Janela } from './ui';

interface Props {
  aberta: boolean;
  fazendaId: number;
  lotes: Lote[];
  aoFechar: () => void;
  aoCriar: (animalId: number) => void;
}

const COM_PARTO = ['RPA', 'LAC', 'SEC', 'PRE'];
const SEMPRE_PRENHE = ['NVP', 'PRE'];
const PODE_ESTAR_PRENHE = ['RPA', 'LAC', 'SEC'];
const PODE_TER_IA = ['NVA', 'RPA', 'LAC', 'SEC'];

const inicial = () => ({
  brinco: '', nome: '', sexo: 'F' as 'F' | 'M', raca: '', grau_sangue: '', data_nascimento: '', nascimento_estimado: false,
  origem: 'nascido' as 'nascido' | 'comprado', data_entrada: hojeISO(), categoria: '', lote_id: '', peso: '',
  ordem_lactacao: '', ultimo_parto: '', prenhe: '' as '' | 'sim' | 'nao', ultima_ia: '', dias_gestacao: '', touro: '',
  valor: '', vendedor: '', gta: '', vencimento: '',
});

// Cadastro do animal com o evento de entrada (cadastro inicial na implantação, ou compra).
// Bezerros nascidos na fazenda entram pelo Parto da mãe.
export const NovoAnimalJanela: React.FC<Props> = ({ aberta, fazendaId, lotes, aoFechar, aoCriar }) => {
  const [f, setF] = useState(inicial());
  const [salvando, setSalvando] = useState(false);
  useEffect(() => { if (aberta) setF(inicial()); }, [aberta]);

  const set = (campo: keyof ReturnType<typeof inicial>) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF({ ...f, [campo]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value });

  const cat = f.categoria;
  const mostraParto = f.sexo === 'F' && COM_PARTO.includes(cat);
  const mostraPrenhe = f.sexo === 'F' && PODE_ESTAR_PRENHE.includes(cat);
  const prenhe = SEMPRE_PRENHE.includes(cat) || f.prenhe === 'sim';
  const mostraIA = f.sexo === 'F' && (PODE_TER_IA.includes(cat) || SEMPRE_PRENHE.includes(cat));

  const salvar = async () => {
    if (!f.brinco.trim()) return toast.error('Informe o brinco.');
    if (!f.data_nascimento) return toast.error('Informe a data de nascimento (pode ser estimada).');
    if (!cat) return toast.error('Escolha a categoria atual do animal.');
    if (COM_PARTO.includes(cat) && cat !== 'PRE' && !f.ultimo_parto) return toast.error('Informe a data do último parto.');

    const dados: Record<string, any> = { categoria: cat };
    if (f.lote_id) dados.lote_id = Number(f.lote_id);
    if (f.peso) dados.peso = f.peso;
    if (mostraParto) {
      if (f.ordem_lactacao) dados.ordem_lactacao = f.ordem_lactacao;
      if (f.ultimo_parto) dados.ultimo_parto = f.ultimo_parto;
    }
    if (mostraIA && f.ultima_ia) { dados.ultima_ia = f.ultima_ia; if (f.touro) dados.touro = f.touro; }
    if (prenhe) {
      dados.prenhe = true;
      if (!f.ultima_ia && f.dias_gestacao) dados.dias_gestacao = f.dias_gestacao;
    } else if (f.prenhe === 'nao') {
      dados.prenhe = false;
    }
    if (f.origem === 'comprado') {
      if (f.valor) dados.valor = f.valor;
      if (f.vendedor) dados.origem = f.vendedor;
      if (f.gta) dados.gta = f.gta;
      if (f.vencimento) dados.vencimento = f.vencimento;
    }

    setSalvando(true);
    try {
      const ficha = await api.criarAnimal(fazendaId, {
        brinco: f.brinco, nome: f.nome, sexo: f.sexo, raca: f.raca, grau_sangue: f.grau_sangue,
        data_nascimento: f.data_nascimento, nascimento_estimado: f.nascimento_estimado, origem: f.origem,
        entrada: { tipo: f.origem === 'comprado' ? 'compra' : 'cadastro_inicial', data: f.data_entrada, dados },
      });
      aoCriar(ficha.animal.id);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Janela titulo="Novo animal" aberta={aberta} aoFechar={aoFechar} rodape={
      <>
        <Botao variante="secundario" onClick={aoFechar}>Cancelar</Botao>
        <Botao onClick={salvar} carregando={salvando}>Cadastrar</Botao>
      </>
    }>
      <div className="grid grid-cols-2 gap-3">
        <Campo rotulo="Brinco *"><Entrada autoFocus value={f.brinco} onChange={set('brinco')} placeholder="Ex.: 1023" /></Campo>
        <Campo rotulo="Nome"><Entrada value={f.nome} onChange={set('nome')} placeholder="Ex.: Mimosa" /></Campo>
      </div>

      <Campo rotulo="Sexo *">
        <div className="grid grid-cols-2 gap-2">
          {(['F', 'M'] as const).map(s => (
            <button key={s} type="button" onClick={() => setF({ ...f, sexo: s, categoria: '' })}
              className={`py-2.5 rounded-lg border text-sm font-semibold transition ${f.sexo === s ? 'bg-[#050D21] text-white border-[#050D21]' : 'bg-white text-gray-600 border-gray-200'}`}>
              {s === 'F' ? 'Fêmea' : 'Macho'}
            </button>
          ))}
        </div>
      </Campo>

      <div className="grid grid-cols-2 gap-3">
        <Campo rotulo="Raça">
          <Entrada list="racas" value={f.raca} onChange={set('raca')} placeholder="Ex.: Girolando" />
          <datalist id="racas">{RACAS.map(r => <option key={r} value={r} />)}</datalist>
        </Campo>
        <Campo rotulo="Grau de sangue"><Entrada value={f.grau_sangue} onChange={set('grau_sangue')} placeholder="Ex.: 3/4 HG" /></Campo>
      </div>

      <Campo rotulo="Data de nascimento *">
        <Entrada type="date" max={hojeISO()} value={f.data_nascimento} onChange={set('data_nascimento')} />
        <label className="flex items-center gap-2 mt-2 text-sm text-gray-600">
          <input type="checkbox" className="w-4 h-4 accent-[#56E39F]" checked={f.nascimento_estimado} onChange={set('nascimento_estimado')} /> Data estimada
        </label>
      </Campo>

      <div className="grid grid-cols-2 gap-3">
        <Campo rotulo="Origem">
          <Selecao value={f.origem} onChange={set('origem')}>
            <option value="nascido">Nascido na fazenda</option>
            <option value="comprado">Comprado</option>
          </Selecao>
        </Campo>
        <Campo rotulo={f.origem === 'comprado' ? 'Data da compra' : 'Data do cadastro'}>
          <Entrada type="date" max={hojeISO()} value={f.data_entrada} onChange={set('data_entrada')} />
        </Campo>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Campo rotulo="Categoria atual *" dica="Como o animal está hoje.">
          <Selecao value={cat} onChange={set('categoria')}>
            <option value="">Escolha...</option>
            {CATEGORIAS_POR_SEXO[f.sexo].map(c => <option key={c} value={c}>{CATEGORIAS[c]}</option>)}
          </Selecao>
        </Campo>
        <Campo rotulo="Lote">
          <Selecao value={f.lote_id} onChange={set('lote_id')}>
            <option value="">Sem lote</option>
            {lotes.filter(l => l.ativo).map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
          </Selecao>
        </Campo>
      </div>

      <Campo rotulo="Peso atual"><Entrada inputMode="decimal" value={f.peso} onChange={set('peso')} placeholder="kg (opcional)" /></Campo>

      {(mostraParto || mostraIA) && (
        <div className="rounded-xl bg-gray-50 border border-gray-100 p-4 space-y-4">
          <p className="text-xs font-semibold text-gray-500 uppercase">Situação reprodutiva conhecida</p>
          {mostraParto && (
            <div className="grid grid-cols-2 gap-3">
              <Campo rotulo="Nº de partos"><Entrada inputMode="numeric" value={f.ordem_lactacao} onChange={set('ordem_lactacao')} /></Campo>
              <Campo rotulo={cat === 'PRE' ? 'Último parto (se já pariu)' : 'Último parto *'}>
                <Entrada type="date" max={hojeISO()} value={f.ultimo_parto} onChange={set('ultimo_parto')} />
              </Campo>
            </div>
          )}
          {mostraPrenhe && (
            <Campo rotulo="Está prenha?">
              <Selecao value={f.prenhe} onChange={set('prenhe')}>
                <option value="">Não sei / não diagnosticada</option>
                <option value="sim">Sim</option>
                <option value="nao">Não (vazia)</option>
              </Selecao>
            </Campo>
          )}
          {mostraIA && (
            <div className="grid grid-cols-2 gap-3">
              <Campo rotulo={prenhe ? 'Data da IA que pegou' : 'Última IA'}><Entrada type="date" max={hojeISO()} value={f.ultima_ia} onChange={set('ultima_ia')} /></Campo>
              <Campo rotulo="Touro / sêmen"><Entrada value={f.touro} onChange={set('touro')} /></Campo>
            </div>
          )}
          {prenhe && !f.ultima_ia && (
            <Campo rotulo="Dias de gestação" dica="Sem a data da IA, usamos os dias de gestação para prever o parto.">
              <Entrada inputMode="numeric" value={f.dias_gestacao} onChange={set('dias_gestacao')} />
            </Campo>
          )}
        </div>
      )}

      {f.origem === 'comprado' && (
        <div className="rounded-xl bg-gray-50 border border-gray-100 p-4 space-y-4">
          <p className="text-xs font-semibold text-gray-500 uppercase">Compra</p>
          <div className="grid grid-cols-2 gap-3">
            <Campo rotulo="Valor (R$)"><Entrada inputMode="decimal" value={f.valor} onChange={set('valor')} /></Campo>
            <Campo rotulo="GTA"><Entrada value={f.gta} onChange={set('gta')} /></Campo>
          </div>
          <Campo rotulo="Vendedor / origem"><Entrada value={f.vendedor} onChange={set('vendedor')} /></Campo>
          <Campo rotulo="Vencimento do pagamento" dica="Com valor, a compra vai para o financeiro do Gestão como pendente (padrão: a data da compra).">
            <Entrada type="date" value={f.vencimento} onChange={set('vencimento')} />
          </Campo>
        </div>
      )}
    </Janela>
  );
};
