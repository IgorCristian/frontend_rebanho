// Regras do modo de edição: o que pode ser movido e redimensionado, e o que invalida o mapa.
// Não desenha nada: o motor e a tela usam estas funções.
import {
  ALTURA, ENFEITES_INFO, LARGURA, LAYOUT_PADRAO, Layout, Lado, PIQUETES_INFO, Ponto, Retangulo, TipoEnfeite, alcancaveis, construirMundo, ladrilhosDaPorteira,
} from './mapa';

// Identificador de cada elemento do mapa: 'sede', 'piquete:lactacao', 'estrada:3', 'enfeite:12'...
export type IdElemento = string;

export const LADOS: { id: Lado; nome: string }[] = [
  { id: 'y+', nome: 'Embaixo, à esquerda' },
  { id: 'x+', nome: 'Embaixo, à direita' },
  { id: 'y-', nome: 'Em cima, à direita' },
  { id: 'x-', nome: 'Em cima, à esquerda' },
];

export const MAX_ESTRADAS = 60;
export const MAX_ENFEITES = 300;

const copiar = (l: Layout): Layout => JSON.parse(JSON.stringify(l));
const sobrepoe = (a: Retangulo, b: Retangulo) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const dentroDe = (a: Retangulo, b: Retangulo) => a.x >= b.x && a.y >= b.y && a.x + a.w <= b.x + b.w && a.y + a.h <= b.y + b.h;
const internoDe = (q: Retangulo): Retangulo => ({ x: q.x + 1, y: q.y + 1, w: q.w - 2, h: q.h - 2 });

export const retanguloDe = (l: Layout, id: IdElemento): Retangulo | null => {
  const [tipo, resto] = id.split(':');
  if (tipo === 'piquete') return l.piquetes.find(q => q.id === resto) || null;
  if (tipo === 'estrada') return l.estradas[Number(resto)] || null;
  if (tipo === 'enfeite') {
    const e = l.enfeites[Number(resto)];
    return e ? { x: e.x, y: e.y, w: ENFEITES_INFO[e.tipo].largura, h: 1 } : null;
  }
  if (tipo === 'quadro') return { ...l.quadro, w: 1, h: 1 };
  if (tipo === 'entrada') return { ...l.entrada, w: 2, h: 1 };
  if (tipo === 'sede' || tipo === 'ordenha' || tipo === 'lavoura' || tipo === 'acude') return l[tipo];
  return null;
};

export const nomeDe = (l: Layout, id: IdElemento): string => {
  const [tipo, resto] = id.split(':');
  if (tipo === 'piquete') return PIQUETES_INFO.find(i => i.id === resto)?.nome || 'Piquete';
  if (tipo === 'estrada') return 'Estrada';
  if (tipo === 'enfeite') return ENFEITES_INFO[l.enfeites[Number(resto)]?.tipo]?.nome || 'Enfeite';
  return { sede: 'Sede', ordenha: 'Sala de ordenha', quadro: 'Quadro de avisos', entrada: 'Porteira de entrada', lavoura: 'Área de plantio', acude: 'Açude' }[tipo] || tipo;
};

// Tamanho mínimo e máximo. Sem limites = só pode ser movido
export const limitesDe = (id: IdElemento): { minW: number; minH: number; maxW: number; maxH: number } | null => {
  const tipo = id.split(':')[0];
  if (tipo === 'piquete') return { minW: 6, minH: 6, maxW: 34, maxH: 30 };
  if (tipo === 'lavoura') return { minW: 3, minH: 3, maxW: 24, maxH: 24 };
  if (tipo === 'acude') return { minW: 3, minH: 3, maxW: 16, maxH: 16 };
  if (tipo === 'estrada') return { minW: 1, minH: 1, maxW: LARGURA, maxH: ALTURA };
  if (tipo === 'sede') return { minW: 5, minH: 4, maxW: 10, maxH: 8 };
  if (tipo === 'ordenha') return { minW: 4, minH: 3, maxW: 8, maxH: 6 };
  return null;
};

export const podeRemover = (id: IdElemento) => ['estrada', 'enfeite'].includes(id.split(':')[0]);

// Mantém dentro do mapa, sem tocar na borda
const prender = (r: Retangulo): Retangulo => {
  const w = Math.min(r.w, LARGURA - 2), h = Math.min(r.h, ALTURA - 2);
  return { x: Math.max(1, Math.min(r.x, LARGURA - 1 - w)), y: Math.max(1, Math.min(r.y, ALTURA - 1 - h)), w, h };
};

/** Move ou redimensiona. Mover um piquete leva junto o que está dentro dele. */
export const aplicarRetangulo = (l: Layout, id: IdElemento, r: Retangulo): Layout => {
  const novo = copiar(l);
  const [tipo, resto] = id.split(':');
  const alvo = prender(r);
  if (tipo === 'piquete') {
    const q = novo.piquetes.find(p => p.id === resto)!;
    const dx = alvo.x - q.x, dy = alvo.y - q.y;
    if (alvo.w === q.w && alvo.h === q.h && (dx || dy)) {
      const interno = internoDe(q);
      const leva = (p: Retangulo) => dentroDe(p, interno);
      novo.enfeites.forEach((e) => {
        if (leva({ x: e.x, y: e.y, w: ENFEITES_INFO[e.tipo].largura, h: 1 })) { e.x += dx; e.y += dy; }
      });
      [novo.sede, novo.ordenha].forEach((c) => {
        if (leva(c)) { c.x += dx; c.y += dy; }
      });
      if (leva({ ...novo.quadro, w: 1, h: 1 })) { novo.quadro.x += dx; novo.quadro.y += dy; }
    }
    Object.assign(q, alvo);
  } else if (tipo === 'estrada') Object.assign(novo.estradas[Number(resto)], alvo);
  else if (tipo === 'enfeite') Object.assign(novo.enfeites[Number(resto)], { x: alvo.x, y: alvo.y });
  else if (tipo === 'quadro') novo.quadro = { x: alvo.x, y: alvo.y };
  else if (tipo === 'entrada') novo.entrada = { x: alvo.x, y: alvo.y };
  else if (tipo === 'sede' || tipo === 'ordenha' || tipo === 'lavoura' || tipo === 'acude') novo[tipo] = alvo;
  return novo;
};

export const mudarPorteira = (l: Layout, id: string, campos: { lado?: Lado; porta?: number }): Layout => {
  const novo = copiar(l);
  Object.assign(novo.piquetes.find(q => q.id === id)!, campos);
  return novo;
};

export const removerElemento = (l: Layout, id: IdElemento): Layout => {
  const novo = copiar(l);
  const [tipo, resto] = id.split(':');
  if (tipo === 'estrada') novo.estradas.splice(Number(resto), 1);
  if (tipo === 'enfeite') novo.enfeites.splice(Number(resto), 1);
  return novo;
};

export const adicionarEstrada = (l: Layout, centro: Ponto): { layout: Layout; id: IdElemento } => {
  const novo = copiar(l);
  novo.estradas.push(prender({ x: Math.round(centro.x) - 4, y: Math.round(centro.y) - 1, w: 8, h: 2 }));
  return { layout: novo, id: `estrada:${novo.estradas.length - 1}` };
};

export const adicionarEnfeite = (l: Layout, tipo: TipoEnfeite, centro: Ponto): { layout: Layout; id: IdElemento } => {
  const novo = copiar(l);
  const r = prender({ x: Math.round(centro.x), y: Math.round(centro.y), w: ENFEITES_INFO[tipo].largura, h: 1 });
  novo.enfeites.push({ tipo, x: r.x, y: r.y });
  return { layout: novo, id: `enfeite:${novo.enfeites.length - 1}` };
};

/** O que torna o mapa inválido, em linguagem do usuário. Vazio = pode salvar. */
export const problemasDoMapa = (l: Layout): string[] => {
  const erros: string[] = [];
  const nomes = (id: string) => PIQUETES_INFO.find(i => i.id === id)?.nome || id;
  const areas: [string, Retangulo][] = [['Sede', l.sede], ['Sala de ordenha', l.ordenha], ['Área de plantio', l.lavoura], ['Açude', l.acude]];

  l.piquetes.forEach((q, i) => {
    l.piquetes.slice(i + 1).forEach((b) => {
      if (sobrepoe(q, b)) erros.push(`${nomes(q.id)} está em cima de ${nomes(b.id)}.`);
    });
    // A área de plantio e o açude ficam fora; as construções podem ficar fora ou inteiras lá dentro, sem cortar a cerca
    if (sobrepoe(l.lavoura, q)) erros.push(`A área de plantio está em cima de ${nomes(q.id)}.`);
    if (sobrepoe(l.acude, q)) erros.push(`O açude está em cima de ${nomes(q.id)}.`);
    ([['A sede', l.sede], ['A sala de ordenha', l.ordenha]] as [string, Retangulo][]).forEach(([nome, c]) => {
      if (sobrepoe(c, q) && !dentroDe(c, internoDe(q))) erros.push(`${nome} está cortando a cerca de ${nomes(q.id)}.`);
    });
  });
  areas.forEach(([nome, a], i) => {
    areas.slice(i + 1).forEach(([outro, b]) => {
      if (sobrepoe(a, b)) erros.push(`${nome} está em cima de ${outro}.`);
    });
  });
  l.estradas.forEach((e) => {
    if (sobrepoe(e, l.sede) || sobrepoe(e, l.ordenha) || sobrepoe(e, l.acude)) erros.push('Tem estrada passando por cima de uma construção ou do açude.');
  });

  // Tudo precisa ser alcançável a pé a partir da porteira de entrada
  if (!erros.length) {
    const m = construirMundo(l);
    const vistos = alcancaveis(m, m.pontos.entrada);
    const chega = (p: Ponto) => vistos[Math.floor(p.y)]?.[Math.floor(p.x)];
    m.piquetes.forEach((q) => {
      const [a] = ladrilhosDaPorteira(q);
      if (!chega(a)) erros.push(`Não dá para chegar à porteira de ${q.nome}.`);
    });
    if (!chega(m.pontos.portaSede)) erros.push('Não dá para chegar à porta da sede.');
    if (!chega(m.pontos.portaOrdenha)) erros.push('Não dá para chegar à porta da sala de ordenha.');
    if (!chega(m.pontos.frenteQuadro)) erros.push('Não dá para chegar ao quadro de avisos.');
  }
  return [...new Set(erros)];
};

export const layoutValido = (bruto: unknown): Layout => {
  const l = bruto as Layout | null;
  return l && l.versao === 1 && l.piquetes?.length === PIQUETES_INFO.length ? l : LAYOUT_PADRAO;
};
