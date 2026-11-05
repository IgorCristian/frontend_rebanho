// O mapa do sítio. Cada piquete corresponde a categorias reais do rebanho:
// quando o motor do backend muda a categoria de um animal, ele anda sozinho para o piquete certo.
// O Layout é o que a fazenda personaliza no modo de edição (salvo no backend); construirMundo transforma em chão e obstáculos.

export const LADRILHO = 16;
export const LARGURA = 66;
export const ALTURA = 44;

export interface Ponto { x: number; y: number }
export interface Retangulo { x: number; y: number; w: number; h: number }

export type Lado = 'y+' | 'x+' | 'y-' | 'x-';
export type TipoEnfeite = 'ipeA' | 'ipeR' | 'arvore' | 'arbusto' | 'pedra' | 'feno' | 'cocho' | 'casinha';

export interface LayoutPiquete extends Retangulo { id: string; lado: Lado; porta: number } // porta: ladrilhos a partir do canto da cerca
export interface Enfeite extends Ponto { tipo: TipoEnfeite }

export interface Layout {
  versao: 1;
  piquetes: LayoutPiquete[];
  sede: Retangulo;
  ordenha: Retangulo;
  quadro: Ponto;
  entrada: Ponto;
  lavoura: Retangulo;
  acude: Retangulo;
  estradas: Retangulo[];
  enfeites: Enfeite[];
}

export const PIQUETES_INFO: { id: string; nome: string; categorias: string[] }[] = [
  { id: 'bezerreiro', nome: 'Bezerreiro', categorias: ['BZF', 'BZM'] },
  { id: 'recria', nome: 'Recria', categorias: ['REC', 'GAR'] },
  { id: 'novilhas', nome: 'Novilhas', categorias: ['NVA', 'NVP'] },
  { id: 'lactacao', nome: 'Vacas em lactação', categorias: ['LAC', 'RPA'] },
  { id: 'secas', nome: 'Secas e pré-parto', categorias: ['SEC', 'PRE'] },
  { id: 'touros', nome: 'Touros', categorias: ['TOR'] },
];

export const ENFEITES_INFO: Record<TipoEnfeite, { nome: string; solido: boolean; largura: number }> = {
  ipeA: { nome: 'Ipê amarelo', solido: true, largura: 1 },
  ipeR: { nome: 'Ipê rosa', solido: true, largura: 1 },
  arvore: { nome: 'Árvore', solido: true, largura: 1 },
  arbusto: { nome: 'Arbusto', solido: false, largura: 1 },
  pedra: { nome: 'Pedra', solido: false, largura: 1 },
  feno: { nome: 'Feno', solido: false, largura: 1 },
  cocho: { nome: 'Cocho', solido: true, largura: 2 },
  casinha: { nome: 'Casinha de bezerro', solido: true, largura: 2 },
};

const enfeites = (tipo: TipoEnfeite, ...pontos: [number, number][]): Enfeite[] => pontos.map(([x, y]) => ({ tipo, x, y }));

export const LAYOUT_PADRAO: Layout = {
  versao: 1,
  piquetes: [
    { id: 'bezerreiro', x: 2, y: 3, w: 15, h: 11, lado: 'y+', porta: 7 },
    { id: 'recria', x: 36, y: 3, w: 14, h: 11, lado: 'y+', porta: 6 },
    { id: 'novilhas', x: 36, y: 17, w: 14, h: 11, lado: 'x-', porta: 5 },
    { id: 'lactacao', x: 2, y: 17, w: 16, h: 12, lado: 'x+', porta: 5 },
    { id: 'secas', x: 2, y: 32, w: 15, h: 10, lado: 'y-', porta: 7 },
    { id: 'touros', x: 36, y: 32, w: 14, h: 10, lado: 'y-', porta: 6 },
  ],
  sede: { x: 22, y: 4, w: 7, h: 5 },
  ordenha: { x: 7, y: 19, w: 5, h: 3 },
  quadro: { x: 32, y: 10 },
  entrada: { x: 25, y: 42 },
  lavoura: { x: 54, y: 7, w: 10, h: 16 },
  acude: { x: 29, y: 33, w: 6, h: 7 },
  estradas: [
    { x: 25, y: 9, w: 2, h: 35 },
    { x: 8, y: 14, w: 46, h: 2 },
    { x: 18, y: 22, w: 18, h: 2 },
    { x: 8, y: 29, w: 36, h: 2 },
    { x: 9, y: 31, w: 2, h: 1 },
    { x: 42, y: 31, w: 2, h: 1 },
  ],
  enfeites: [
    ...enfeites('ipeA', [20, 11], [34, 11], [22, 18], [22, 33], [33, 41], [65 - 1, 25]),
    ...enfeites('ipeR', [31, 6], [32, 25], [22, 40], [60, 26]),
    ...enfeites('arvore', [19, 5], [33, 2], [19, 2], [29, 18], [20, 26], [20, 37], [34, 17], [1, 1], [51, 1], [1, 29], [51, 29], [64, 3], [58, 3], [54, 33]),
    ...enfeites('arbusto', [28, 13], [23, 13], [22, 25], [18, 34], [28, 41]),
    ...enfeites('pedra', [29, 26], [34, 8], [18, 41]),
    ...enfeites('casinha', [4, 5], [7, 5], [10, 5]),
    ...enfeites('cocho', [14, 18], [46, 18], [46, 33]),
    ...enfeites('feno', [39, 4], [47, 4], [14, 40]),
  ],
};

export interface Piquete extends LayoutPiquete {
  nome: string;
  categorias: string[];
  interno: Retangulo;   // dentro da cerca: onde os animais passeiam
  placa: Ponto;
}

export type Chao = 'grama' | 'pasto' | 'terra' | 'agua';

export interface Prop {
  tipo: 'cerca' | 'placa' | 'sede' | 'ordenha' | 'quadro' | 'porteira' | TipoEnfeite;
  x: number; // ladrilhos: o ponto de referência do sprite
  y: number;
  solido?: Retangulo; // ocupação no chão; também decide quem passa na frente de quem
  semente?: number;
}

export interface Pontos {
  entrada: Ponto;
  quadro: Ponto;
  frenteQuadro: Ponto;
  portaSede: Ponto;
  portaOrdenha: Ponto;
  placaLavoura: Ponto;
}

export interface Mundo {
  layout: Layout;
  chao: Chao[][];
  solido: boolean[][];
  props: Prop[];
  piquetes: Piquete[];
  lavoura: Retangulo;
  pontos: Pontos;
}

// Os ladrilhos da porteira: dois, no lado escolhido da cerca
export const ladrilhosDaPorteira = (q: LayoutPiquete): Ponto[] => {
  const porta = Math.max(1, Math.min(q.porta, ((q.lado === 'y+' || q.lado === 'y-') ? q.w : q.h) - 3));
  if (q.lado === 'y+') return [{ x: q.x + porta, y: q.y + q.h - 1 }, { x: q.x + porta + 1, y: q.y + q.h - 1 }];
  if (q.lado === 'y-') return [{ x: q.x + porta, y: q.y }, { x: q.x + porta + 1, y: q.y }];
  if (q.lado === 'x+') return [{ x: q.x + q.w - 1, y: q.y + porta }, { x: q.x + q.w - 1, y: q.y + porta + 1 }];
  return [{ x: q.x, y: q.y + porta }, { x: q.x, y: q.y + porta + 1 }];
};

const placaDoPiquete = (q: LayoutPiquete): Ponto => {
  const [p] = ladrilhosDaPorteira(q);
  if (q.lado === 'y+') return { x: p.x + 3, y: p.y + 1 };
  if (q.lado === 'y-') return { x: p.x + 3, y: p.y - 1 };
  if (q.lado === 'x+') return { x: p.x + 2, y: p.y - 3 };
  return { x: p.x - 2, y: p.y - 3 };
};

export const construirMundo = (layout: Layout): Mundo => {
  const chao: Chao[][] = Array.from({ length: ALTURA }, () => Array(LARGURA).fill('grama'));
  const solido: boolean[][] = Array.from({ length: ALTURA }, () => Array(LARGURA).fill(false));
  const props: Prop[] = [];

  const preencher = (r: Retangulo, tipo: Chao) => {
    for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) if (chao[y]?.[x]) chao[y][x] = tipo;
  };
  const bloquear = (r: Retangulo) => {
    for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) if (solido[y]?.[x] !== undefined) solido[y][x] = true;
  };
  const prop = (p: Prop, bloqueia = true) => {
    props.push(p);
    if (p.solido && bloqueia) bloquear(p.solido);
  };

  // Piquetes e cercas (com abertura de 2 ladrilhos na porteira)
  const piquetes: Piquete[] = layout.piquetes.map((q) => {
    const info = PIQUETES_INFO.find(i => i.id === q.id)!;
    return { ...q, nome: info.nome, categorias: info.categorias, interno: { x: q.x + 1, y: q.y + 1, w: q.w - 2, h: q.h - 2 }, placa: placaDoPiquete(q) };
  });
  piquetes.forEach(q => preencher(q.interno, 'pasto'));

  // Estradas de terra vermelha
  layout.estradas.forEach(e => preencher(e, 'terra'));

  piquetes.forEach((q) => {
    const aberto = ladrilhosDaPorteira(q);
    const cerca = new Set<string>();
    for (let y = q.y; y < q.y + q.h; y++) {
      for (let x = q.x; x < q.x + q.w; x++) {
        if (x !== q.x && x !== q.x + q.w - 1 && y !== q.y && y !== q.y + q.h - 1) continue;
        if (aberto.some(a => a.x === x && a.y === y)) chao[y][x] = 'terra';
        else cerca.add(`${x},${y}`);
      }
    }
    cerca.forEach((chave) => {
      const [x, y] = chave.split(',').map(Number);
      const vizinho = (dx: number, dy: number) => cerca.has(`${x + dx},${y + dy}`);
      const bracos = (vizinho(1, 0) ? 1 : 0) | (vizinho(-1, 0) ? 2 : 0) | (vizinho(0, 1) ? 4 : 0) | (vizinho(0, -1) ? 8 : 0);
      prop({ tipo: 'cerca', x: x + 0.5, y: y + 0.5, semente: bracos, solido: { x, y, w: 1, h: 1 } });
    });
    props.push({ tipo: 'placa', x: q.placa.x + 0.5, y: q.placa.y + 0.5 });
  });

  // Açude em forma arredondada
  const a = layout.acude;
  for (let y = a.y; y < a.y + a.h; y++) {
    for (let x = a.x; x < a.x + a.w; x++) {
      const dx = (x + 0.5 - (a.x + a.w / 2)) / (a.w / 2), dy = (y + 0.5 - (a.y + a.h / 2)) / (a.h / 2);
      if (dx * dx + dy * dy <= 1.12) {
        chao[y][x] = 'agua';
        solido[y][x] = true;
      }
    }
  }

  // Construções
  const { sede, ordenha, quadro, entrada, lavoura } = layout;
  prop({ tipo: 'sede', x: sede.x + sede.w / 2, y: sede.y + sede.h, solido: sede });
  prop({ tipo: 'ordenha', x: ordenha.x + ordenha.w / 2, y: ordenha.y + ordenha.h, solido: ordenha });
  prop({ tipo: 'quadro', x: quadro.x + 0.5, y: quadro.y + 0.5, solido: { x: quadro.x, y: quadro.y, w: 1, h: 1 } });
  prop({ tipo: 'porteira', x: entrada.x + 1, y: entrada.y + 1.8, solido: { x: entrada.x - 1, y: entrada.y + 1, w: 1, h: 1 } });
  bloquear({ x: entrada.x + 2, y: entrada.y + 1, w: 1, h: 1 });

  // Árvores, arbustos e outros detalhes
  layout.enfeites.forEach((e, i) => {
    const info = ENFEITES_INFO[e.tipo];
    prop({ tipo: e.tipo, x: e.x + info.largura / 2, y: e.y + 0.5, semente: i + 3, solido: { x: e.x, y: e.y, w: info.largura, h: 1 } }, info.solido);
  });

  // Bordas do mapa
  bloquear({ x: 0, y: 0, w: LARGURA, h: 1 });
  bloquear({ x: 0, y: 0, w: 1, h: ALTURA });
  bloquear({ x: LARGURA - 1, y: 0, w: 1, h: ALTURA });
  bloquear({ x: 0, y: ALTURA - 1, w: LARGURA, h: 1 });

  const placaLavoura = lavoura.x >= 3
    ? { x: lavoura.x - 2, y: lavoura.y + Math.floor(lavoura.h / 3) }
    : { x: lavoura.x + lavoura.w + 1, y: lavoura.y + Math.floor(lavoura.h / 3) };
  props.push({ tipo: 'placa', x: placaLavoura.x + 0.5, y: placaLavoura.y + 0.5 });

  return {
    layout, chao, solido, props, piquetes, lavoura,
    pontos: {
      entrada: { x: entrada.x + 0.5, y: entrada.y + 0.5 },
      quadro,
      frenteQuadro: { x: quadro.x + 0.5, y: quadro.y + 1.5 },
      portaSede: { x: sede.x + sede.w / 2, y: sede.y + sede.h + 0.5 },
      portaOrdenha: { x: ordenha.x + ordenha.w / 2, y: ordenha.y + ordenha.h + 0.5 },
      placaLavoura,
    },
  };
};

export const piqueteDaCategoria = (mundo: Mundo, categoria: string | null) =>
  mundo.piquetes.find(p => categoria && p.categorias.includes(categoria)) || mundo.piquetes.find(p => p.id === 'lactacao')!;

const livre = (m: Mundo, x: number, y: number) => y >= 0 && x >= 0 && y < ALTURA && x < LARGURA && !m.solido[y][x];

/** O ladrilho livre mais perto: um animal pode ter sido empurrado para perto de um obstáculo. */
export const ladrilhoLivre = (m: Mundo, p: Ponto): Ponto => {
  const cx = Math.floor(p.x), cy = Math.floor(p.y);
  for (let r = 0; r < 12; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) === r && livre(m, cx + dx, cy + dy)) return { x: cx + dx, y: cy + dy };
      }
    }
  }
  return { x: cx, y: cy };
};

/** Tudo o que dá para alcançar andando a partir de um ponto. */
export const alcancaveis = (m: Mundo, inicio: Ponto): boolean[][] => {
  const vistos: boolean[][] = Array.from({ length: ALTURA }, () => Array(LARGURA).fill(false));
  const pilha = [ladrilhoLivre(m, inicio)];
  vistos[pilha[0].y][pilha[0].x] = true;
  while (pilha.length) {
    const { x, y } = pilha.pop()!;
    [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
      const nx = x + dx, ny = y + dy;
      if (livre(m, nx, ny) && !vistos[ny][nx]) {
        vistos[ny][nx] = true;
        pilha.push({ x: nx, y: ny });
      }
    });
  }
  return vistos;
};

/**
 * Caminho a pé entre dois pontos, desviando de cercas e construções e preferindo as estradas.
 * Devolve os pontos em ladrilhos; sem caminho possível, vai direto (o animal atravessa em vez de ficar parado).
 */
export const caminho = (m: Mundo, de: Ponto, para: Ponto): Ponto[] => {
  const ini = ladrilhoLivre(m, de), fim = ladrilhoLivre(m, para);
  const id = (x: number, y: number) => y * LARGURA + x;
  const custo = new Map<number, number>([[id(ini.x, ini.y), 0]]);
  const veioDe = new Map<number, number>();
  const aberto = [{ x: ini.x, y: ini.y, f: 0 }];
  const objetivo = id(fim.x, fim.y);
  let achou = false;
  while (aberto.length) {
    let menor = 0;
    for (let i = 1; i < aberto.length; i++) if (aberto[i].f < aberto[menor].f) menor = i;
    const atual = aberto.splice(menor, 1)[0];
    const chave = id(atual.x, atual.y);
    if (chave === objetivo) { achou = true; break; }
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const nx = atual.x + dx, ny = atual.y + dy;
        if (!livre(m, nx, ny)) continue;
        // Na diagonal, os dois lados precisam estar livres: não corta o canto da cerca
        if (dx && dy && (!livre(m, atual.x + dx, atual.y) || !livre(m, atual.x, atual.y + dy))) continue;
        const passo = (dx && dy ? 1.41 : 1) * (m.chao[ny][nx] === 'terra' ? 1 : 2.2);
        const total = custo.get(chave)! + passo;
        const nid = id(nx, ny);
        if (total < (custo.get(nid) ?? Infinity)) {
          custo.set(nid, total);
          veioDe.set(nid, chave);
          aberto.push({ x: nx, y: ny, f: total + Math.hypot(fim.x - nx, fim.y - ny) });
        }
      }
    }
  }
  if (!achou) return [para];
  const pontos: Ponto[] = [];
  for (let c: number | undefined = objetivo; c !== undefined && c !== id(ini.x, ini.y); c = veioDe.get(c)) {
    pontos.unshift({ x: (c % LARGURA) + 0.5, y: Math.floor(c / LARGURA) + 0.5 });
  }
  // Tira os pontos do meio de trechos retos
  const limpos = pontos.filter((p, i) => {
    const a = pontos[i - 1], b = pontos[i + 1];
    return !a || !b || Math.abs((p.x - a.x) * (b.y - p.y) - (p.y - a.y) * (b.x - p.x)) > 1e-6;
  });
  limpos.push(para);
  return limpos;
};
