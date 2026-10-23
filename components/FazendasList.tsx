import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Tractor, MapPin, ChevronRight, Search } from 'lucide-react';
import { api } from '../services/api';
import { Fazenda, Usuario, RACAS, UFS } from '../types';
import { Botao, Campo, Entrada, Selecao, Cartao, Selo, Janela, Vazio, Carregando } from './ui';

interface FazendasListProps {
  usuario: Usuario;
  aoAbrir: (fazenda: Fazenda) => void;
}

export const FazendasList: React.FC<FazendasListProps> = ({ usuario, aoAbrir }) => {
  const [fazendas, setFazendas] = useState<Fazenda[] | null>(null);
  const [busca, setBusca] = useState('');
  const [criando, setCriando] = useState(false);
  const podeCriar = usuario.papel === 'admin' || usuario.papel === 'consultor';

  const carregar = async () => {
    try {
      setFazendas(await api.listarFazendas());
    } catch (err: any) {
      toast.error(err.message);
      setFazendas([]);
    }
  };

  useEffect(() => { carregar(); }, []);

  const termo = busca.trim().toLowerCase();
  const filtradas = (fazendas || []).filter(f =>
    !termo || [f.nome, f.proprietario, f.cidade, f.consultor.nome].some(v => v?.toLowerCase().includes(termo)));

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fazendas</h1>
          <p className="text-sm text-gray-500">
            {usuario.papel === 'admin' ? 'Todas as fazendas do sistema' :
              usuario.papel === 'consultor' ? 'Fazendas que você acompanha' : 'Fazendas em que você foi incluído'}
          </p>
        </div>
        {podeCriar && <Botao icone={<Plus size={18} />} onClick={() => setCriando(true)}>Nova fazenda</Botao>}
      </div>

      {fazendas && fazendas.length > 3 && (
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Entrada className="pl-10" placeholder="Buscar por fazenda, proprietário ou cidade" value={busca} onChange={e => setBusca(e.target.value)} />
        </div>
      )}

      {fazendas === null ? <Carregando /> : filtradas.length === 0 ? (
        <Cartao>
          <Vazio
            icone={<Tractor />}
            titulo={termo ? 'Nenhuma fazenda encontrada' : 'Nenhuma fazenda ainda'}
            texto={!termo && podeCriar ? 'Cadastre a primeira fazenda para começar.' : !termo ? 'Peça ao consultor para incluir você em uma fazenda.' : undefined}
            acao={!termo && podeCriar ? <Botao icone={<Plus size={18} />} onClick={() => setCriando(true)}>Nova fazenda</Botao> : undefined}
          />
        </Cartao>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtradas.map(f => (
            <Cartao key={f.id} onClick={() => aoAbrir(f)} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-11 h-11 shrink-0 rounded-xl bg-[#050D21] text-[#56E39F] flex items-center justify-center"><Tractor size={22} /></div>
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 truncate">{f.nome}</p>
                    {f.proprietario && <p className="text-sm text-gray-500 truncate">{f.proprietario}</p>}
                    {(f.cidade || f.uf) && (
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-1"><MapPin size={12} />{[f.cidade, f.uf].filter(Boolean).join(' - ')}</p>
                    )}
                  </div>
                </div>
                <ChevronRight className="text-gray-300 shrink-0" size={20} />
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {!f.ativa && <Selo cor="vermelho">Desativada</Selo>}
                {f.raca_predominante && <Selo cor="azul">{f.raca_predominante}</Selo>}
                {usuario.papel === 'admin' && <Selo>Consultor: {f.consultor.nome}</Selo>}
              </div>
            </Cartao>
          ))}
        </div>
      )}

      <NovaFazendaJanela
        aberta={criando}
        usuario={usuario}
        aoFechar={() => setCriando(false)}
        aoCriar={(fazenda) => { setCriando(false); toast.success('Fazenda cadastrada!'); aoAbrir(fazenda); }}
      />
    </div>
  );
};

const NovaFazendaJanela: React.FC<{ aberta: boolean; usuario: Usuario; aoFechar: () => void; aoCriar: (f: Fazenda) => void }> = ({ aberta, usuario, aoFechar, aoCriar }) => {
  const vazio = { nome: '', proprietario: '', cidade: '', uf: '', raca_predominante: '', consultor_id: '' };
  const [dados, setDados] = useState(vazio);
  const [consultores, setConsultores] = useState<Usuario[]>([]);
  const [salvando, setSalvando] = useState(false);
  const ehAdmin = usuario.papel === 'admin';

  useEffect(() => {
    if (aberta) {
      setDados(vazio);
      if (ehAdmin) api.listarConsultores().then(setConsultores).catch(() => setConsultores([]));
    }
  }, [aberta]);

  const set = (campo: keyof typeof vazio) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setDados({ ...dados, [campo]: e.target.value });

  const salvar = async () => {
    if (!dados.nome.trim()) return toast.error('Informe o nome da fazenda.');
    if (ehAdmin && !dados.consultor_id) return toast.error('Escolha o consultor responsável.');
    setSalvando(true);
    try {
      const { consultor_id, ...resto } = dados;
      const fazenda = await api.criarFazenda({ ...resto, ...(ehAdmin ? { consultor_id: Number(consultor_id) } : {}) });
      if (dados.raca_predominante) await api.aplicarRaca(fazenda.id, dados.raca_predominante);
      aoCriar(fazenda);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Janela titulo="Nova fazenda" aberta={aberta} aoFechar={aoFechar} rodape={
      <>
        <Botao variante="secundario" onClick={aoFechar}>Cancelar</Botao>
        <Botao onClick={salvar} carregando={salvando}>Cadastrar</Botao>
      </>
    }>
      <Campo rotulo="Nome da fazenda *"><Entrada autoFocus value={dados.nome} onChange={set('nome')} placeholder="Ex.: Fazenda Boa Vista" /></Campo>
      <Campo rotulo="Proprietário"><Entrada value={dados.proprietario} onChange={set('proprietario')} /></Campo>
      <div className="grid grid-cols-3 gap-3">
        <Campo rotulo="Cidade" className="col-span-2"><Entrada value={dados.cidade} onChange={set('cidade')} /></Campo>
        <Campo rotulo="UF">
          <Selecao value={dados.uf} onChange={set('uf')}><option value="">—</option>{UFS.map(uf => <option key={uf}>{uf}</option>)}</Selecao>
        </Campo>
      </div>
      <Campo rotulo="Raça predominante" dica="Já preenche peso adulto, idade de 1ª cobertura e gestação com as faixas da planilha.">
        <Selecao value={dados.raca_predominante} onChange={set('raca_predominante')}>
          <option value="">Não definir agora</option>{RACAS.map(r => <option key={r}>{r}</option>)}
        </Selecao>
      </Campo>
      {ehAdmin && (
        <Campo rotulo="Consultor responsável *">
          <Selecao value={dados.consultor_id} onChange={set('consultor_id')}>
            <option value="">Escolha...</option>
            {consultores.filter(c => c.ativo).map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </Selecao>
        </Campo>
      )}
    </Janela>
  );
};
