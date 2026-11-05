import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '../services/api';
import { hojeISO } from '../services/formato';
import { Animal, AnimalResumo, FichaAnimal } from '../types';
import { AJUDA } from '../services/ajuda';
import { Botao, Campo, Entrada, Selecao, AreaTexto, Janela } from './ui';
import { CampoGrauSangue } from './NovoAnimalJanela';

interface Props {
  aberta: boolean;
  fazendaId: number;
  animal: Animal;
  aoFechar: () => void;
  aoSalvar: (ficha: FichaAnimal) => void;
}

const formulario = (a: Animal) => ({
  brinco: a.brinco, nome: a.nome || '', raca: a.raca || '', grau_sangue: a.grau_sangue || '',
  data_nascimento: a.data_nascimento || '', nascimento_estimado: a.nascimento_estimado,
  mae_id: a.mae ? String(a.mae.id) : '', pai_semen: a.pai_semen || '',
  peso_nascer: a.peso_nascer != null ? String(a.peso_nascer).replace('.', ',') : '', observacoes: a.observacoes || '',
});

// Correção dos dados de identificação. O que mudar fica no histórico do animal ("Correção de cadastro").
// Sexo e origem não mudam aqui: definem o ciclo do animal e o evento de entrada.
export const CorrigirCadastroJanela: React.FC<Props> = ({ aberta, fazendaId, animal, aoFechar, aoSalvar }) => {
  const [f, setF] = useState(formulario(animal));
  const [femeas, setFemeas] = useState<AnimalResumo[]>([]);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!aberta) return;
    setF(formulario(animal));
    api.listarAnimais(fazendaId, 'todos')
      .then(lista => setFemeas(lista.filter(a => a.sexo === 'F' && a.id !== animal.id)))
      .catch(() => setFemeas([]));
  }, [aberta]);

  const set = (campo: keyof ReturnType<typeof formulario>) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setF({ ...f, [campo]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value });

  const salvar = async () => {
    if (!f.brinco.trim()) return toast.error('Informe o brinco.');
    if (!f.data_nascimento) return toast.error('Informe a data de nascimento (pode ser estimada).');
    setSalvando(true);
    try {
      const ficha = await api.editarAnimal(fazendaId, animal.id, {
        ...f, mae_id: f.mae_id ? Number(f.mae_id) : null, peso_nascer: f.peso_nascer.replace(',', '.') || null,
      });
      toast.success('Cadastro corrigido. A correção ficou no histórico.');
      aoSalvar(ficha);
    } catch (err: any) {
      toast.error(err.message, { duration: 6000 });
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Janela titulo={`Corrigir cadastro – brinco ${animal.brinco}`} ajuda={AJUDA.corrigirCadastro} aberta={aberta} aoFechar={aoFechar} rodape={
      <>
        <Botao variante="secundario" onClick={aoFechar}>Cancelar</Botao>
        <Botao onClick={salvar} carregando={salvando}>Salvar correção</Botao>
      </>
    }>
      <div className="grid grid-cols-2 gap-3">
        <Campo rotulo="Brinco *"><Entrada value={f.brinco} onChange={set('brinco')} /></Campo>
        <Campo rotulo="Nome"><Entrada value={f.nome} onChange={set('nome')} /></Campo>
      </div>
      <Campo rotulo="Raça"><Entrada value={f.raca} onChange={set('raca')} /></Campo>
      <CampoGrauSangue valor={f.grau_sangue} aoMudar={set('grau_sangue')} />
      <Campo rotulo="Data de nascimento *">
        <Entrada type="date" max={hojeISO()} value={f.data_nascimento} onChange={set('data_nascimento')} />
        <label className="flex items-center gap-2 mt-2 text-sm text-gray-600">
          <input type="checkbox" className="w-4 h-4 accent-[#56E39F]" checked={f.nascimento_estimado} onChange={set('nascimento_estimado')} /> Data estimada
        </label>
      </Campo>
      <Campo rotulo="Mãe">
        <Selecao value={f.mae_id} onChange={set('mae_id')}>
          <option value="">Não informada</option>
          {femeas.map(m => <option key={m.id} value={m.id}>{m.brinco}{m.nome ? ` · ${m.nome}` : ''}</option>)}
        </Selecao>
      </Campo>
      <div className="grid grid-cols-2 gap-3">
        <Campo rotulo="Pai / sêmen"><Entrada value={f.pai_semen} onChange={set('pai_semen')} /></Campo>
        <Campo rotulo="Peso ao nascer (kg)"><Entrada inputMode="decimal" value={f.peso_nascer} onChange={set('peso_nascer')} /></Campo>
      </div>
      <Campo rotulo="Observações"><AreaTexto rows={2} value={f.observacoes} onChange={set('observacoes')} /></Campo>
      <p className="text-xs text-gray-500">Sexo e origem não podem ser corrigidos. Se foram cadastrados errado, exclua o cadastro e faça de novo.</p>
    </Janela>
  );
};
