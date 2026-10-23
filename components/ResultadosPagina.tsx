import React from 'react';
import { Milk, Layers, Package, Salad, Construction } from 'lucide-react';
import { Cartao, Selo } from './ui';
import { TituloPagina } from './AppShell';

// Relatórios planejados (roteiro no PROJETO.md). Os de custo dependem da integração com o Gestão Fácil.
const RELATORIOS = [
  { icone: Milk, titulo: 'Controle leiteiro', texto: 'Data, animal, ordenhas 1, 2 e 3 em litros e média diária.', depende: null },
  { icone: Salad, titulo: 'Dietas por lote', texto: 'Uma linha por lote × insumo com kg/animal/dia; o resto é calculado.', depende: 'Cadastro de dietas' },
  { icone: Package, titulo: 'Insumos e preço', texto: 'Insumos e preços do Gestão Fácil cruzados com o consumo das dietas.', depende: 'Integração com o Gestão Fácil' },
  { icone: Layers, titulo: 'Resumo do lote', texto: 'Quanto cada lote come, custa, produz e sobra.', depende: 'Integração com o Gestão Fácil' },
];

export const ResultadosPagina: React.FC = () => (
  <>
    <TituloPagina titulo="Resultados" descricao="Relatórios do rebanho" />
    <div className="grid gap-3 sm:grid-cols-2">
      {RELATORIOS.map(({ icone: Icone, titulo, texto, depende }) => (
        <Cartao key={titulo} className="p-4 opacity-80">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 shrink-0 rounded-xl bg-gray-100 text-gray-500 flex items-center justify-center"><Icone size={20} /></div>
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 flex flex-wrap items-center gap-2">{titulo} <Selo><Construction size={11} /> Em breve</Selo></p>
              <p className="text-sm text-gray-500 mt-0.5">{texto}</p>
              {depende && <p className="text-xs text-gray-400 mt-1">Depende de: {depende}</p>}
            </div>
          </div>
        </Cartao>
      ))}
    </div>
  </>
);
