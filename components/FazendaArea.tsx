import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { BellRing, Beef, BarChart3, Settings } from 'lucide-react';
import { api } from '../services/api';
import { Fazenda, Usuario, PAPEIS_LABEL } from '../types';
import { Carregando, Selo } from './ui';
import { AppShell, Abas, TituloPagina, ItemMenu } from './AppShell';
import { RebanhoArea } from './RebanhoArea';
import { LotesPanel } from './LotesPanel';
import { ResultadosPagina } from './ResultadosPagina';
import { FazendaDadosPanel } from './FazendaDadosPanel';
import { ParametrosPanel } from './ParametrosPanel';
import { EquipePanel } from './EquipePanel';
import { AcessoPanel } from './AcessoPanel';

type Pagina = 'alertas' | 'rebanho' | 'resultados' | 'configuracoes';

const MENU: ItemMenu[] = [
  { id: 'alertas', rotulo: 'Alertas', icone: BellRing },
  { id: 'rebanho', rotulo: 'Rebanho', icone: Beef },
  { id: 'resultados', rotulo: 'Resultados', icone: BarChart3 },
  { id: 'configuracoes', rotulo: 'Configurações', icone: Settings },
];

interface Props {
  fazendaId: number;
  usuario: Usuario;
  aoTrocarFazenda: () => void;
  aoSair: () => void;
}

// Área de uma fazenda para quem entra com e-mail e senha (consultor, admin, veterinário/produtor, inseminador)
export const FazendaArea: React.FC<Props> = ({ fazendaId, usuario, aoTrocarFazenda, aoSair }) => {
  const [fazenda, setFazenda] = useState<Fazenda | null>(null);
  const [pagina, setPagina] = useState<Pagina>('alertas');
  const [abaRebanho, setAbaRebanho] = useState('animais');
  const [abaConfig, setAbaConfig] = useState('informacoes');

  useEffect(() => {
    api.obterFazenda(fazendaId).then(setFazenda).catch((err) => { toast.error(err.message); aoTrocarFazenda(); });
  }, [fazendaId]);

  if (!fazenda) return <Carregando />;

  // Mesmas regras do backend (acesso.py): só o consultor responsável ou o admin configuram;
  // o veterinário/produtor vinculado também ajusta os parâmetros.
  const gerencia = usuario.papel === 'admin' || fazenda.consultor.id === usuario.id;
  const editaParametros = gerencia || usuario.papel === 'veterinario';

  const abasConfig = [
    { id: 'informacoes', rotulo: 'Informações da fazenda' },
    { id: 'parametros', rotulo: 'Parâmetros' },
    { id: 'equipe', rotulo: 'Equipe' },
    ...(gerencia ? [{ id: 'acesso', rotulo: 'Acesso' }] : []),
  ];

  return (
    <AppShell
      titulo={fazenda.nome}
      itens={MENU}
      ativo={pagina}
      aoNavegar={(id) => setPagina(id as Pagina)}
      usuario={{ nome: usuario.nome, detalhe: PAPEIS_LABEL[usuario.papel] }}
      aoSair={aoSair}
      trocar={{ rotulo: 'Trocar fazenda', acao: aoTrocarFazenda }}
    >
      {!fazenda.ativa && <div className="mb-4"><Selo cor="vermelho">Fazenda desativada</Selo></div>}

      {pagina === 'alertas' && (
        <>
          <TituloPagina titulo="Alertas do dia" descricao="O que precisa ser feito no rebanho hoje" />
          <RebanhoArea fazendaId={fazenda.id} visao="alertas" ehGestor={gerencia} />
        </>
      )}

      {pagina === 'rebanho' && (
        <>
          <TituloPagina titulo="Rebanho" />
          <Abas abas={[{ id: 'animais', rotulo: 'Animais' }, { id: 'lotes', rotulo: 'Lotes' }]} ativa={abaRebanho} aoMudar={setAbaRebanho} />
          {abaRebanho === 'animais' && <RebanhoArea fazendaId={fazenda.id} visao="rebanho" ehGestor={gerencia} />}
          {abaRebanho === 'lotes' && <LotesPanel fazendaId={fazenda.id} podeEditar={gerencia} />}
        </>
      )}

      {pagina === 'resultados' && <ResultadosPagina />}

      {pagina === 'configuracoes' && (
        <>
          <TituloPagina titulo="Configurações"
            descricao={gerencia ? undefined : editaParametros ? 'Você pode ajustar os parâmetros; o resto é só leitura.' : 'Somente leitura.'} />
          <Abas abas={abasConfig} ativa={abaConfig} aoMudar={setAbaConfig} />
          {abaConfig === 'informacoes' && <FazendaDadosPanel fazenda={fazenda} podeEditar={gerencia} aoSalvar={setFazenda} />}
          {abaConfig === 'parametros' && <ParametrosPanel fazenda={fazenda} podeEditar={editaParametros} aoMudarRaca={(raca) => setFazenda({ ...fazenda, raca_predominante: raca })} />}
          {abaConfig === 'equipe' && <EquipePanel fazendaId={fazenda.id} podeEditar={gerencia} />}
          {abaConfig === 'acesso' && gerencia && <AcessoPanel fazenda={fazenda} aoMudar={setFazenda} />}
        </>
      )}
    </AppShell>
  );
};
