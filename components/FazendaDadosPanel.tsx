import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Save } from 'lucide-react';
import { api } from '../services/api';
import { Fazenda, UFS } from '../types';
import { Botao, Campo, Entrada, Selecao, Cartao } from './ui';

interface Props {
  fazenda: Fazenda;
  podeEditar: boolean;
  aoSalvar: (f: Fazenda) => void;
}

const formulario = (f: Fazenda) => ({
  nome: f.nome || '',
  proprietario: f.proprietario || '',
  cidade: f.cidade || '',
  uf: f.uf || '',
  ativa: f.ativa,
});

export const FazendaDadosPanel: React.FC<Props> = ({ fazenda, podeEditar, aoSalvar }) => {
  const [dados, setDados] = useState(formulario(fazenda));
  const [salvando, setSalvando] = useState(false);
  useEffect(() => setDados(formulario(fazenda)), [fazenda]);

  const alterado = JSON.stringify(dados) !== JSON.stringify(formulario(fazenda));

  const salvar = async () => {
    if (!dados.nome.trim()) return toast.error('O nome da fazenda não pode ficar vazio.');
    if (!dados.ativa && fazenda.ativa && !confirm('Desativar a fazenda? Ninguém da equipe vai conseguir acessá-la.')) return;
    setSalvando(true);
    try {
      const salva = await api.editarFazenda(fazenda.id, dados);
      aoSalvar(salva);
      toast.success('Dados salvos.');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Cartao className="p-5 space-y-4">
      <Campo rotulo="Nome da fazenda"><Entrada disabled={!podeEditar} value={dados.nome} onChange={e => setDados({ ...dados, nome: e.target.value })} /></Campo>
      <Campo rotulo="Proprietário"><Entrada disabled={!podeEditar} value={dados.proprietario} onChange={e => setDados({ ...dados, proprietario: e.target.value })} /></Campo>
      <div className="grid grid-cols-3 gap-3">
        <Campo rotulo="Cidade" className="col-span-2"><Entrada disabled={!podeEditar} value={dados.cidade} onChange={e => setDados({ ...dados, cidade: e.target.value })} /></Campo>
        <Campo rotulo="UF">
          <Selecao disabled={!podeEditar} value={dados.uf} onChange={e => setDados({ ...dados, uf: e.target.value })}>
            <option value="">—</option>{UFS.map(uf => <option key={uf}>{uf}</option>)}
          </Selecao>
        </Campo>
      </div>
      <Campo rotulo="Raça predominante" dica="Para mudar, use a aba Parâmetros (ela também ajusta os parâmetros da raça).">
        <Entrada disabled value={fazenda.raca_predominante || 'Não definida'} />
      </Campo>

      {podeEditar && (
        <>
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input type="checkbox" className="w-5 h-5 accent-[#56E39F]" checked={dados.ativa} onChange={e => setDados({ ...dados, ativa: e.target.checked })} />
            <span className="text-sm text-gray-700">Fazenda ativa</span>
          </label>
          <div className="flex justify-end pt-2">
            <Botao icone={<Save size={18} />} onClick={salvar} carregando={salvando} disabled={!alterado}>Salvar</Botao>
          </div>
        </>
      )}
    </Cartao>
  );
};
