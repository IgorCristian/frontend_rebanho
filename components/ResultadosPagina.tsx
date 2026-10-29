import React, { useState } from 'react';
import { Abas, TituloPagina } from './AppShell';
import { IndicadoresPanel } from './IndicadoresPanel';
import { ControleLeiteiroRelatorio } from './ControleLeiteiroRelatorio';
import { DietasRelatorios } from './DietasRelatorios';

export const ResultadosPagina: React.FC<{ fazendaId: number; gerencia: boolean }> = ({ fazendaId, gerencia }) => {
  const [aba, setAba] = useState('indicadores');
  return (
    <>
      <TituloPagina titulo="Resultados" />
      <Abas abas={[{ id: 'indicadores', rotulo: 'Indicadores' }, { id: 'controle', rotulo: 'Controle leiteiro' },
        { id: 'dietas', rotulo: 'Dietas por lote' }, { id: 'insumos', rotulo: 'Insumos e preço' }, { id: 'resumo', rotulo: 'Resumo do lote' }]}
        ativa={aba} aoMudar={setAba} />
      {aba === 'indicadores' && <IndicadoresPanel fazendaId={fazendaId} />}
      {aba === 'controle' && <ControleLeiteiroRelatorio fazendaId={fazendaId} />}
      {(aba === 'dietas' || aba === 'insumos' || aba === 'resumo') && (
        <DietasRelatorios key={aba} fazendaId={fazendaId} visao={aba} gerencia={gerencia} />
      )}
    </>
  );
};
