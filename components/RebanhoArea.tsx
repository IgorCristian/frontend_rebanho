import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Lote } from '../types';
import { Carregando } from './ui';
import { RebanhoPanel } from './RebanhoPanel';
import { AlertasPanel } from './AlertasPanel';
import { AnimalFicha, ApoioLancamento } from './AnimalFicha';

interface Props {
  fazendaId: number;
  visao: 'rebanho' | 'alertas';
  ehGestor: boolean;
  funcionarioId?: number;
  animalId: number | null;                   // ficha aberta: vem do endereço da tela
  aoAbrirAnimal: (animalId: number) => void;
  aoVoltarDaFicha: (fichaSumiu?: boolean) => void;
}

// Lista do rebanho / alertas do dia + ficha do animal. Usado pelo consultor/equipe e pelo funcionário.
export const RebanhoArea: React.FC<Props> = ({ fazendaId, visao, ehGestor, funcionarioId, animalId, aoAbrirAnimal, aoVoltarDaFicha }) => {
  const [apoio, setApoio] = useState<ApoioLancamento | null>(null);

  useEffect(() => {
    Promise.all([api.tiposEvento(fazendaId), api.listarLotes(fazendaId), api.listarCalendario(fazendaId)])
      .then(([tipos, lotes, calendario]) => setApoio({ tipos: tipos.tipos, perfil: tipos.perfil, lotes: lotes as Lote[], calendario, funcionarioId, ehGestor }))
      .catch(() => setApoio({ tipos: [], perfil: null, lotes: [], calendario: [], funcionarioId, ehGestor }));
  }, [fazendaId, funcionarioId, ehGestor]);

  if (!apoio) return <Carregando />;

  if (animalId) {
    return <AnimalFicha key={animalId} fazendaId={fazendaId} animalId={animalId} apoio={apoio}
      aoVoltar={aoVoltarDaFicha} aoAbrirAnimal={aoAbrirAnimal} />;
  }
  return visao === 'alertas'
    ? <AlertasPanel fazendaId={fazendaId} aoAbrirAnimal={aoAbrirAnimal} />
    : <RebanhoPanel fazendaId={fazendaId} podeCadastrar={ehGestor} lotes={apoio.lotes} aoAbrirAnimal={aoAbrirAnimal} />;
};
