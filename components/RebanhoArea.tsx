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
}

// Lista do rebanho / alertas do dia + ficha do animal. Usado pelo consultor/equipe e pelo funcionário.
export const RebanhoArea: React.FC<Props> = ({ fazendaId, visao, ehGestor, funcionarioId }) => {
  const [apoio, setApoio] = useState<ApoioLancamento | null>(null);
  const [animalId, setAnimalId] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([api.tiposEvento(fazendaId), api.listarLotes(fazendaId), api.listarCalendario(fazendaId)])
      .then(([tipos, lotes, calendario]) => setApoio({ tipos: tipos.tipos, lotes: lotes as Lote[], calendario, funcionarioId, ehGestor }))
      .catch(() => setApoio({ tipos: [], lotes: [], calendario: [], funcionarioId, ehGestor }));
  }, [fazendaId, funcionarioId, ehGestor]);

  // Trocar de aba volta para a lista
  useEffect(() => setAnimalId(null), [visao]);

  if (!apoio) return <Carregando />;

  if (animalId) {
    return <AnimalFicha key={animalId} fazendaId={fazendaId} animalId={animalId} apoio={apoio}
      aoVoltar={() => setAnimalId(null)} aoAbrirAnimal={setAnimalId} />;
  }
  return visao === 'alertas'
    ? <AlertasPanel fazendaId={fazendaId} aoAbrirAnimal={setAnimalId} />
    : <RebanhoPanel fazendaId={fazendaId} podeCadastrar={ehGestor} lotes={apoio.lotes} aoAbrirAnimal={setAnimalId} />;
};
