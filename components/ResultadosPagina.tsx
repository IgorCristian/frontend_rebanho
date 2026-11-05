import React from 'react';
import { Abas, TituloPagina } from './AppShell';
import { IndicadoresPanel } from './IndicadoresPanel';
import { ControleLeiteiroRelatorio } from './ControleLeiteiroRelatorio';
import { DietasRelatorios } from './DietasRelatorios';
import { AJUDA, TextoAjuda } from '../services/ajuda';

const AJUDA_ABA: Record<string, TextoAjuda> = {
  indicadores: AJUDA.indicadores, controle: AJUDA.controleLeiteiro, dietas: AJUDA.dietas, insumos: AJUDA.insumos, resumo: AJUDA.resumoLote,
};

// A aba vem do endereço da tela (ver FazendaArea)
export const ResultadosPagina: React.FC<{ fazendaId: number; gerencia: boolean; aba?: string; aoMudarAba: (aba: string) => void }> = ({ fazendaId, gerencia, aba: abaDoEndereco, aoMudarAba }) => {
  const aba = abaDoEndereco && AJUDA_ABA[abaDoEndereco] ? abaDoEndereco : 'indicadores';
  return (
    <>
      <TituloPagina titulo="Resultados" ajuda={AJUDA_ABA[aba]} />
      <Abas abas={[{ id: 'indicadores', rotulo: 'Indicadores' }, { id: 'controle', rotulo: 'Controle leiteiro' },
        { id: 'dietas', rotulo: 'Dietas por lote' }, { id: 'insumos', rotulo: 'Insumos e preço' }, { id: 'resumo', rotulo: 'Resumo do lote' }]}
        ativa={aba} aoMudar={aoMudarAba} />
      {aba === 'indicadores' && <IndicadoresPanel fazendaId={fazendaId} />}
      {aba === 'controle' && <ControleLeiteiroRelatorio fazendaId={fazendaId} />}
      {(aba === 'dietas' || aba === 'insumos' || aba === 'resumo') && (
        <DietasRelatorios key={aba} fazendaId={fazendaId} visao={aba} gerencia={gerencia} />
      )}
    </>
  );
};
