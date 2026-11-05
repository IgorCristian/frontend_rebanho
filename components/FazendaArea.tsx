import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { BellRing, Beef, BarChart3, Milk, Settings, Sprout } from 'lucide-react';
import { api } from '../services/api';
import { navegar } from '../services/rota';
import { Fazenda, Usuario, PAPEIS_LABEL } from '../types';
import { Carregando, Selo } from './ui';
import { AppShell, Abas, TituloPagina, ItemMenu } from './AppShell';
import { RebanhoArea } from './RebanhoArea';
import { LotesPanel } from './LotesPanel';
import { PlantacoesPanel } from './PlantacoesPanel';
import { SaidaLeitePanel } from './SaidaLeitePanel';
import { ResultadosPagina } from './ResultadosPagina';
import { FazendaDadosPanel } from './FazendaDadosPanel';
import { ParametrosPanel } from './ParametrosPanel';
import { EquipePanel } from './EquipePanel';
import { AcessoPanel } from './AcessoPanel';
import { CalendarioPanel } from './CalendarioPanel';
import { MetasPanel } from './MetasPanel';
import { IntegracaoPanel } from './IntegracaoPanel';
import { AJUDA, TextoAjuda } from '../services/ajuda';

const AJUDA_CONFIG: Record<string, TextoAjuda> = {
  informacoes: AJUDA.informacoes, parametros: AJUDA.parametros, calendario: AJUDA.calendario, metas: AJUDA.metas,
  equipe: AJUDA.equipe, acesso: AJUDA.acesso, integracao: AJUDA.integracao,
};

type Pagina = 'alertas' | 'rebanho' | 'leite' | 'plantacoes' | 'resultados' | 'configuracoes';

const MENU: ItemMenu[] = [
  { id: 'alertas', rotulo: 'Alertas', icone: BellRing },
  { id: 'rebanho', rotulo: 'Rebanho', icone: Beef },
  { id: 'leite', rotulo: 'Leite', icone: Milk },
  { id: 'plantacoes', rotulo: 'Plantações', icone: Sprout },
  { id: 'resultados', rotulo: 'Resultados', icone: BarChart3 },
  { id: 'configuracoes', rotulo: 'Configurações', icone: Settings },
];

interface Props {
  fazendaId: number;
  usuario: Usuario;
  caminho: string[];   // o que vem no endereço depois de /fazendas/<id>: página, aba ou ficha do animal
  aoSair: () => void;
}

// Área de uma fazenda para quem entra com e-mail e senha (consultor, admin, veterinário/produtor, inseminador)
export const FazendaArea: React.FC<Props> = ({ fazendaId, usuario, caminho, aoSair }) => {
  const [fazenda, setFazenda] = useState<Fazenda | null>(null);
  const base = `/fazendas/${fazendaId}`;
  const pagina = (MENU.some(m => m.id === caminho[0]) ? caminho[0] : 'alertas') as Pagina;
  const animalId = (pagina === 'alertas' || pagina === 'rebanho') && caminho[1] === 'animal' && Number(caminho[2]) > 0 ? Number(caminho[2]) : null;
  const abrirAnimal = (id: number) => navegar(`${base}/${pagina}/animal/${id}`);
  const voltarDaFicha = (fichaSumiu?: boolean) => navegar(`${base}/${pagina}`, { substituir: fichaSumiu });

  // Endereço sem página (ou com uma que não existe): fica nos alertas, sem criar passo no histórico
  useEffect(() => {
    if (caminho[0] !== pagina) navegar(`${base}/alertas`, { substituir: true });
  }, [caminho[0], pagina]);

  useEffect(() => {
    api.obterFazenda(fazendaId).then(setFazenda).catch((err) => { toast.error(err.message); navegar('/', { substituir: true }); });
  }, [fazendaId]);

  if (!fazenda) return <Carregando />;

  // Mesmas regras do backend (acesso.py): só o consultor responsável ou o admin configuram;
  // o veterinário/produtor vinculado também ajusta os parâmetros.
  const gerencia = usuario.papel === 'admin' || fazenda.consultor.id === usuario.id;
  const editaParametros = gerencia || usuario.papel === 'veterinario';

  const abasConfig = [
    { id: 'informacoes', rotulo: 'Informações da fazenda' },
    { id: 'parametros', rotulo: 'Parâmetros' },
    { id: 'calendario', rotulo: 'Calendário sanitário' },
    { id: 'metas', rotulo: 'Metas' },
    { id: 'equipe', rotulo: 'Equipe' },
    ...(gerencia ? [{ id: 'acesso', rotulo: 'Acesso' }, { id: 'integracao', rotulo: 'Integração' }] : []),
  ];
  const abaRebanho = pagina === 'rebanho' && caminho[1] === 'lotes' ? 'lotes' : 'animais';
  const abaConfig = abasConfig.some(a => a.id === caminho[1]) ? caminho[1] : 'informacoes';

  return (
    <AppShell
      titulo={fazenda.nome}
      itens={MENU}
      ativo={pagina}
      aoNavegar={(id) => navegar(`${base}/${id}`)}
      usuario={{ nome: usuario.nome, detalhe: PAPEIS_LABEL[usuario.papel] }}
      aoSair={aoSair}
      trocar={{ rotulo: 'Trocar fazenda', acao: () => navegar('/') }}
      largo={pagina === 'resultados'}
    >
      {!fazenda.ativa && <div className="mb-4"><Selo cor="vermelho">Fazenda desativada</Selo></div>}

      {pagina === 'alertas' && (
        <>
          <TituloPagina titulo="Alertas do dia" descricao="O que precisa ser feito no rebanho hoje" ajuda={AJUDA.alertas} />
          <RebanhoArea fazendaId={fazenda.id} visao="alertas" ehGestor={gerencia} animalId={animalId} aoAbrirAnimal={abrirAnimal} aoVoltarDaFicha={voltarDaFicha} />
        </>
      )}

      {pagina === 'rebanho' && (
        <>
          <TituloPagina titulo="Rebanho" ajuda={abaRebanho === 'lotes' ? AJUDA.lotes : AJUDA.animais} />
          <Abas abas={[{ id: 'animais', rotulo: 'Animais' }, { id: 'lotes', rotulo: 'Lotes' }]} ativa={abaRebanho} aoMudar={(aba) => navegar(aba === 'lotes' ? `${base}/rebanho/lotes` : `${base}/rebanho`)} />
          {abaRebanho === 'animais' && <RebanhoArea fazendaId={fazenda.id} visao="rebanho" ehGestor={gerencia} animalId={animalId} aoAbrirAnimal={abrirAnimal} aoVoltarDaFicha={voltarDaFicha} />}
          {abaRebanho === 'lotes' && <LotesPanel fazendaId={fazenda.id} podeEditar={gerencia} />}
        </>
      )}

      {pagina === 'leite' && (
        <>
          <TituloPagina titulo="Saída de leite" descricao="Quanto o caminhão recolheu em cada dia" ajuda={AJUDA.saidaLeite} />
          <SaidaLeitePanel fazendaId={fazenda.id} />
        </>
      )}

      {pagina === 'plantacoes' && (
        <>
          <TituloPagina titulo="Plantações" descricao="O que está plantado e quando cortar" ajuda={AJUDA.plantacoes} />
          <PlantacoesPanel fazendaId={fazenda.id} podeEditar={gerencia} />
        </>
      )}

      {pagina === 'resultados' && <ResultadosPagina fazendaId={fazenda.id} gerencia={gerencia} aba={caminho[1]} aoMudarAba={(aba) => navegar(`${base}/resultados/${aba}`)} />}

      {pagina === 'configuracoes' && (
        <>
          <TituloPagina titulo="Configurações" ajuda={AJUDA_CONFIG[abaConfig]}
            descricao={gerencia ? undefined : editaParametros ? 'Você pode ajustar parâmetros, calendário sanitário e metas; o resto é só leitura.' : 'Somente leitura.'} />
          <Abas abas={abasConfig} ativa={abaConfig} aoMudar={(aba) => navegar(`${base}/configuracoes/${aba}`)} />
          {abaConfig === 'informacoes' && <FazendaDadosPanel fazenda={fazenda} podeEditar={gerencia} aoSalvar={setFazenda} />}
          {abaConfig === 'parametros' && <ParametrosPanel fazenda={fazenda} podeEditar={editaParametros} aoMudarRaca={(raca) => setFazenda({ ...fazenda, raca_predominante: raca })} />}
          {abaConfig === 'calendario' && <CalendarioPanel fazendaId={fazenda.id} podeEditar={editaParametros} />}
          {abaConfig === 'metas' && <MetasPanel fazendaId={fazenda.id} podeEditar={editaParametros} />}
          {abaConfig === 'equipe' && <EquipePanel fazendaId={fazenda.id} podeEditar={gerencia} />}
          {abaConfig === 'acesso' && gerencia && <AcessoPanel fazenda={fazenda} aoMudar={setFazenda} />}
          {abaConfig === 'integracao' && gerencia && <IntegracaoPanel fazenda={fazenda} aoMudar={setFazenda} />}
        </>
      )}
    </AppShell>
  );
};
