// Toda a arte do jogo é desenhada aqui, em código (nenhuma imagem externa): um pequeno desenhista isométrico.
// As figuras são montadas com caixas em 3D e projetadas em 2D. Coordenadas: x e y no chão, z para cima,
// na mesma unidade do mundo (16 = 1 ladrilho). A câmera olha de +x +y, então só essas faces aparecem.

export interface Sprite { c: HTMLCanvasElement; ax: number; ay: number; w: number; h: number }
type P3 = [number, number, number];
type P2 = [number, number];

const RESOLUCAO = 2; // pixels do sprite por unidade da tela: mantém nítido em telas de alta densidade

export const projetar = (x: number, y: number, z = 0): P2 => [(x - y) * 2, x + y - z * 2];

// Sorteio previsível: o mesmo número gera sempre a mesma sequência (a mesma vaca fica sempre com as mesmas manchas)
export const sorteador = (semente: number) => {
  let s = (semente * 2654435761) >>> 0 || 1;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
};

const tom = (cor: string, f: number) => {
  const n = parseInt(cor.slice(1), 16);
  const canal = (v: number) => Math.max(0, Math.min(255, Math.round(v * f)));
  return `rgb(${canal(n >> 16)},${canal((n >> 8) & 255)},${canal(n & 255)})`;
};

interface Operacao { pts: P2[]; cor: string; ordem: number; selar: boolean }

class Cena {
  private ops: Operacao[] = [];

  // Polígono já em coordenadas da tela
  plano(pts: P2[], cor: string, ordem = 0, selar = true) {
    this.ops.push({ pts, cor, ordem, selar });
  }

  face(pts: P3[], cor: string, ordem = 0) {
    this.plano(pts.map(p => projetar(p[0], p[1], p[2])), cor, ordem);
  }

  // Disco no plano da tela ou achatado (sombra, copa de árvore)
  disco(x: number, y: number, z: number, raio: number, cor: string, achatar = 1, ordem = 0, selar = false) {
    const [cx, cy] = projetar(x, y, z);
    const pts: P2[] = [];
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2;
      pts.push([cx + Math.cos(a) * raio, cy + Math.sin(a) * raio * achatar]);
    }
    this.plano(pts, cor, ordem, selar);
  }

  // Sombra macia no chão
  sombra(x: number, y: number, raio: number, alfa = 0.3) {
    for (let i = 8; i >= 1; i--) this.disco(x, y, 0, raio * (0.3 + i * 0.09), `rgba(16,22,12,${alfa / 8})`, 0.5, -1e6);
  }

  // Caixa girada em torno da origem. Cada face visível recebe sua luz (a luz vem da esquerda, por cima)
  caixa(x: number, y: number, z: number, w: number, d: number, h: number, cor: string, ang = 0, ordemFixa?: number) {
    const cs = Math.cos(ang), sn = Math.sin(ang);
    const gira = (px: number, py: number): P2 => [px * cs - py * sn, px * sn + py * cs];
    const cant = [gira(x, y), gira(x + w, y), gira(x + w, y + d), gira(x, y + d)];
    const centro = gira(x + w / 2, y + d / 2);
    const ordem = ordemFixa ?? centro[0] + centro[1] + (z + h / 2) * 0.55;
    const lados: [number, number, P2][] = [[0, 1, gira(0, -1)], [1, 2, gira(1, 0)], [2, 3, gira(0, 1)], [3, 0, gira(-1, 0)]];
    lados.forEach(([a, b, n]) => {
      if (n[0] + n[1] <= 0.001) return;
      const luz = 0.66 + 0.3 * Math.max(0, (n[1] - n[0] * 0.25 + 0.25) / 1.25);
      this.face([[cant[a][0], cant[a][1], z], [cant[b][0], cant[b][1], z], [cant[b][0], cant[b][1], z + h], [cant[a][0], cant[a][1], z + h]], tom(cor, luz), ordem);
    });
    this.face(cant.map(c => [c[0], c[1], z + h] as P3), tom(cor, 1.08), ordem + 0.01);
  }

  // Caixa com desenho nas faces (xadrez, jeans gasto): cada face vira uma grade pintada pela função
  caixaPintada(x: number, y: number, z: number, w: number, d: number, h: number, pintar: (a: number, z: number) => string, ang = 0, passo = 0.9) {
    const cs = Math.cos(ang), sn = Math.sin(ang);
    const gira = (px: number, py: number): P2 => [px * cs - py * sn, px * sn + py * cs];
    const centro = gira(x + w / 2, y + d / 2);
    const ordem = centro[0] + centro[1] + (z + h / 2) * 0.55;
    // Cada lado: de um canto ao outro, em coordenadas da própria figura
    const lados: [P2, P2, P2][] = [
      [[x, y], [x + w, y], [0, -1]], [[x + w, y], [x + w, y + d], [1, 0]],
      [[x + w, y + d], [x, y + d], [0, 1]], [[x, y + d], [x, y], [-1, 0]],
    ];
    lados.forEach(([a, b, normal]) => {
      const n = gira(normal[0], normal[1]);
      if (n[0] + n[1] <= 0.001) return;
      const luz = 0.66 + 0.3 * Math.max(0, (n[1] - n[0] * 0.25 + 0.25) / 1.25);
      const comprimento = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const nu = Math.max(1, Math.round(comprimento / passo)), nv = Math.max(1, Math.round(h / passo));
      for (let i = 0; i < nu; i++) {
        const t0 = i / nu, t1 = (i + 1) / nu;
        const p0 = gira(a[0] + (b[0] - a[0]) * t0, a[1] + (b[1] - a[1]) * t0);
        const p1 = gira(a[0] + (b[0] - a[0]) * t1, a[1] + (b[1] - a[1]) * t1);
        const coord = (a[0] + a[1]) + (b[0] + b[1] - a[0] - a[1]) * ((t0 + t1) / 2);
        for (let j = 0; j < nv; j++) {
          const z0 = z + (h * j) / nv, z1 = z + (h * (j + 1)) / nv;
          this.face([[p0[0], p0[1], z0], [p1[0], p1[1], z0], [p1[0], p1[1], z1], [p0[0], p0[1], z1]], tom(pintar(coord, (z0 + z1) / 2), luz), ordem);
        }
      }
    });
    const topo = [gira(x, y), gira(x + w, y), gira(x + w, y + d), gira(x, y + d)];
    this.face(topo.map(c => [c[0], c[1], z + h] as P3), tom(pintar(x + y, z + h), 1.08), ordem + 0.01);
  }

  ordemMaxima() {
    return this.ops.reduce((m, o) => Math.max(m, o.ordem), 0);
  }

  sprite(res = RESOLUCAO): Sprite {
    const ops = [...this.ops].sort((a, b) => a.ordem - b.ordem);
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    ops.forEach(o => o.pts.forEach(([x, y]) => {
      x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
    }));
    x0 = Math.floor(x0) - 1; y0 = Math.floor(y0) - 1; x1 = Math.ceil(x1) + 1; y1 = Math.ceil(y1) + 1;
    const c = document.createElement('canvas');
    c.width = (x1 - x0) * res;
    c.height = (y1 - y0) * res;
    const ctx = c.getContext('2d')!;
    ctx.setTransform(res, 0, 0, res, -x0 * res, -y0 * res);
    ctx.lineWidth = 0.5;
    ctx.lineJoin = 'round';
    ops.forEach((o) => {
      ctx.beginPath();
      o.pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.closePath();
      ctx.fillStyle = o.cor;
      ctx.fill();
      if (o.selar) {
        // Fecha as frestas entre as faces
        ctx.strokeStyle = o.cor;
        ctx.stroke();
      }
    });
    return { c, ax: -x0, ay: -y0, w: x1 - x0, h: y1 - y0 };
  }
}

// ---------- Vacas ----------

interface Pelagem { base: string; mancha: string | null }

const PELAGENS: Record<string, Pelagem[]> = {
  holandes: [{ base: '#e9e5da', mancha: '#26252a' }],
  girolando: [{ base: '#e6dfcf', mancha: '#352a26' }, { base: '#b89066', mancha: '#6b4a34' }, { base: '#8a8580', mancha: '#3e3a3a' }],
  gir: [{ base: '#a35c30', mancha: '#d9c09a' }, { base: '#b6763e', mancha: '#6f3f22' }],
  jersey: [{ base: '#b98a5a', mancha: null }],
};

export const pelagemDa = (raca: string | null, id: number): Pelagem => {
  const r = (raca || '').toLowerCase();
  const chave = r.includes('girol') ? 'girolando' : r.includes('holand') ? 'holandes' : r.includes('gir') ? 'gir' : r.includes('jers') ? 'jersey' : 'girolando';
  return PELAGENS[chave][id % PELAGENS[chave].length];
};

export type Porte = 'adulta' | 'cria' | 'touro';
export interface OpcoesVaca { pelagem: Pelagem; porte: Porte; semente: number; ubere: boolean; barriga: boolean; passo: 0 | 1 | 2; pastando: boolean; dir: number }

const ESCALA_PORTE: Record<Porte, number> = { adulta: 0.84, cria: 0.54, touro: 0.98 };

export const criarVaca = (o: OpcoesVaca): Sprite => {
  const cena = new Cena();
  const k = ESCALA_PORTE[o.porte];
  const ang = (o.dir * Math.PI) / 4;
  const { base, mancha } = o.pelagem;
  const casco = '#2c221b', focinho = '#d9a79c';
  const cx = (x: number, y: number, z: number, w: number, d: number, h: number, cor: string) => cena.caixa(x * k, y * k, z * k, w * k, d * k, h * k, cor, ang);

  cena.sombra(0, 0, 44 * k, 0.32);

  // Pernas: o passo alterna as diagonais
  const pernas: [number, number, number][] = [[6, 2.6, 1], [6, -5.2, 2], [-9, 2.6, 2], [-9, -5.2, 1]];
  pernas.forEach(([x, y, par]) => {
    const anda = o.passo === 0 ? 0 : (o.passo === par ? 1.7 : -1.7);
    const sobe = o.passo !== 0 && o.passo === par ? 0.9 : 0;
    cx(x + anda, y, sobe + 1.4, 2.8, 2.6, 6.4 - sobe, base);
    cx(x + anda, y, sobe, 2.8, 2.6, 1.5, casco);
  });

  // Corpo, peito e garupa com cantos quebrados, para não parecer um tijolo
  cx(-10.5, -5, 7.5, 21, 10, 9, base);
  cx(-10, -4, 16.5, 19, 8, 1, base);
  if (o.porte === 'touro') cx(4, -3.5, 16.5, 6, 7, 3.2, base);
  if (o.barriga) cx(-7, -6, 7.5, 13, 12, 5, base);
  if (o.ubere) {
    cx(-9, -3.4, 5, 7, 6.8, 2.8, focinho);
    cx(-8, -2, 3.8, 1.2, 1.2, 1.3, '#c58c82');
    cx(-5, 0.6, 3.8, 1.2, 1.2, 1.3, '#c58c82');
  }

  // Manchas: placas finas por cima do corpo, sempre iguais para a mesma vaca
  if (mancha) {
    const sorte = sorteador(o.semente + 11);
    for (let i = 0; i < 4; i++) {
      const x = -10 + sorte() * 13, w = 4 + sorte() * 6, z = 8 + sorte() * 4, h = 3 + sorte() * 4.5;
      cx(x, 4.9, z, w, 0.3, Math.min(h, 16.4 - z), mancha);
      const x2 = -10 + sorte() * 13, z2 = 8 + sorte() * 4;
      cx(x2, -5.2, z2, w, 0.3, Math.min(h, 16.4 - z2), mancha);
    }
    for (let i = 0; i < 3; i++) cx(-9.5 + sorte() * 12, -3.6 + sorte() * 3, 17.4, 4 + sorte() * 4, 3 + sorte() * 3, 0.25, mancha);
  }

  // Rabo
  cx(-11.4, -0.6, 9, 1.1, 1.2, 8, base);
  cx(-11.8, -1, 5.6, 1.8, 2, 3.8, mancha || casco);

  // Pescoço e cabeça: levantada, ou baixa quando está pastando
  const baixa = o.pastando;
  const hz = baixa ? 2.6 : 15;
  cx(baixa ? 8 : 8.5, -2.6, baixa ? 6 : 11.5, 5.5, 5.2, baixa ? 8 : 7, base);
  cx(11.5, -2.9, hz, 6.2, 5.8, 6.2, base);
  if (mancha) cx(11.4, -3, hz + 3, 3.4, 6, 3.4, mancha);
  cx(17, -2.3, hz, 2.5, 4.6, 3, focinho);
  cx(19.3, -1.3, hz + 1, 0.3, 0.8, 0.8, '#6b3f3a');
  cx(19.3, 0.5, hz + 1, 0.3, 0.8, 0.8, '#6b3f3a');
  cx(15, 2.9, hz + 3.5, 1.1, 0.2, 1.1, '#15110e');
  cx(15, -3.1, hz + 3.5, 1.1, 0.2, 1.1, '#15110e');
  cx(12, 2.9, hz + 4, 2, 2.2, 1.2, mancha || base);
  cx(12, -5.1, hz + 4, 2, 2.2, 1.2, mancha || base);
  if (o.porte !== 'cria') {
    cx(13.6, 1.4, hz + 6.2, 1, 1, o.porte === 'touro' ? 2.6 : 1.5, '#d8cbad');
    cx(13.6, -2.4, hz + 6.2, 1, 1, o.porte === 'touro' ? 2.6 : 1.5, '#d8cbad');
  }
  return cena.sprite();
};

// ---------- Personagem ----------

const XADREZ = (a: number, z: number) => {
  const faixaA = Math.floor((a + 40) / 1.9) % 2 === 0, faixaZ = Math.floor(z / 1.9) % 2 === 0;
  return faixaA && faixaZ ? '#341318' : faixaA || faixaZ ? '#7f1d20' : '#a92c29';
};

// Jeans desbotado: varia um pouco e junta barro perto das botas
const jeans = (semente: number) => {
  const sorte = sorteador(semente);
  const ruido = Array.from({ length: 97 }, () => sorte());
  return (a: number, z: number) => {
    const n = ruido[Math.abs(Math.round(a * 3.1 + z * 7.3)) % 97];
    if (z < 5 && n > 0.86 - (5 - z) * 0.06) return n > 0.94 ? '#54422f' : '#46484f';
    return n > 0.7 ? '#37517c' : n < 0.25 ? '#2c426a' : '#314a74';
  };
};

// Quadros: 0 parado; 1 a 4 são as fases da passada (pé à frente, passando, outro pé à frente, passando)
export const criarPersonagem = (dir: number, quadro: 0 | 1 | 2 | 3 | 4): Sprite => {
  const cena = new Cena();
  const ang = (dir * Math.PI) / 4;
  const cs = Math.cos(ang), sn = Math.sin(ang);
  const pele = '#cfa27a', peleS = '#a77e5c', barba = '#2c1e16', cabelo = '#30211a', cinto = '#3f2a1b', fivela = '#a8a39a';
  const fita = '#34251a', bota = '#51351f', sola = '#231811';
  const cx = (x: number, y: number, z: number, w: number, d: number, h: number, cor: string) => cena.caixa(x, y, z, w, d, h, cor, ang);

  // Tudo que sobe e desce junto com o corpo na passada
  const sobe = quadro === 2 || quadro === 4 ? 0.45 : 0;
  const passoA = [0, 2.8, 0, -2.8, 0][quadro], passoB = -passoA;
  const ergueA = quadro === 4 ? 1.4 : 0, ergueB = quadro === 2 ? 1.4 : 0;

  cena.sombra(0, 0, 19, 0.38);

  // Pernas longas: a coxa acompanha menos que a canela, e a bota vai à frente do corpo
  ([[passoA, ergueA, 0.3, 11], [passoB, ergueB, -2.9, 23]] as const).forEach(([dx, ergue, y, semente]) => {
    const cor = jeans(semente);
    cena.caixaPintada(-1.35 + dx * 0.5, y, 8.4 + sobe, 2.7, 2.6, 6.8, cor, ang);
    cena.caixaPintada(-1.2 + dx, y + 0.1, 2 + ergue, 2.4, 2.4, 6.5 - ergue + sobe, cor, ang);
    cx(-1.45 + dx, y - 0.05, 0.5 + ergue, 2.8, 2.7, 1.9, bota);
    cx(1 + dx, y, 0.5 + ergue, 1.6, 2.6, 1.1, bota);
    cx(-1.55 + dx, y - 0.1, ergue, 4.3, 2.8, 0.55, sola);
  });

  // Quadril, cinto e tronco em xadrez, mais largo nos ombros
  cena.caixaPintada(-1.9, -3, 14.8 + sobe, 3.8, 6, 1.7, jeans(5), ang);
  cx(-2, -3.15, 16.3 + sobe, 4, 6.3, 0.9, cinto);
  cx(2, -0.7, 16.35 + sobe, 0.2, 1.4, 0.8, fivela);
  cena.caixaPintada(-1.9, -3, 17.2 + sobe, 3.8, 6, 3.6, XADREZ, ang);
  cena.caixaPintada(-2.2, -3.7, 20.8 + sobe, 4.4, 7.4, 3.5, XADREZ, ang);

  // Braços balançando ao contrário das pernas: manga xadrez dobrada, antebraço e mão
  ([[3.7, -passoA * 0.7], [-5.6, -passoB * 0.7]] as const).forEach(([y, dx]) => {
    cena.caixaPintada(-0.95 + dx * 0.4, y, 19 + sobe, 1.9, 1.9, 5.2, XADREZ, ang);
    cx(-1 + dx * 0.55, y - 0.05, 18.3 + sobe, 2, 2, 0.8, '#8a2523');
    cx(-0.8 + dx * 0.8, y + 0.15, 14.8 + sobe, 1.6, 1.6, 3.6, pele);
    cx(-0.85 + dx, y + 0.1, 13.1 + sobe, 1.7, 1.7, 1.8, peleS);
  });

  // Pescoço, gola, cabeça, barba e rosto
  cx(-1.1, -1.2, 24.3 + sobe, 2.2, 2.4, 1.3, peleS);
  cx(-1.6, -1.9, 24.2 + sobe, 3, 3.8, 0.55, '#7f1d20');
  cx(-1.85, -2, 25.6 + sobe, 3.8, 4, 5.2, pele);
  cx(-2, -2.1, 27.4 + sobe, 1.6, 4.2, 3.4, cabelo);               // cabelo atrás
  cx(0.5, -2.05, 25.3 + sobe, 1.5, 4.1, 1.7, barba);              // barba cheia, só no queixo
  cx(1.95, -2.05, 26.6 + sobe, 0.1, 0.6, 1.4, barba);             // costeletas
  cx(1.95, 1.45, 26.6 + sobe, 0.1, 0.6, 1.4, barba);
  cx(1.45, -1, 27 + sobe, 0.65, 2, 0.45, barba);                  // bigode
  cx(1.95, -0.4, 27.5 + sobe, 0.6, 0.8, 1, peleS);                // nariz
  cx(1.97, -1.5, 28.7 + sobe, 0.12, 0.85, 0.6, '#120d0a');
  cx(1.97, 0.65, 28.7 + sobe, 0.12, 0.85, 0.6, '#120d0a');
  cx(1.97, -1.65, 29.35 + sobe, 0.12, 3.3, 0.35, cabelo);         // sobrancelhas
  cx(-0.3, 2, 27.8 + sobe, 0.8, 0.25, 1.3, peleS);                // orelha
  cx(-0.3, -2.25, 27.8 + sobe, 0.8, 0.25, 1.3, peleS);

  // Chapéu: elipses empilhadas, para a copa ficar arredondada. A frente da aba sobe, senão esconderia o rosto visto do alto
  const anel = (rx: number, ry: number, z: number, cor: string, ordem: number, curvaLado = 0, ergueFrente = 0, dx = 0) => {
    const pts: P3[] = [];
    for (let i = 0; i < 24; i++) {
      const t = (i / 24) * Math.PI * 2, c = Math.cos(t), sen = Math.sin(t);
      const lx = dx + c * rx, ly = sen * ry;
      pts.push([lx * cs - ly * sn, lx * sn + ly * cs, z + sen * sen * curvaLado + Math.max(0, c) * ergueFrente - Math.max(0, -c) * 0.5]);
    }
    cena.face(pts, cor, ordem);
  };
  const z0 = 30.7 + sobe;
  const ordem = cena.ordemMaxima() + 1;
  anel(4.4, 5.9, z0 - 0.3, '#47301c', ordem, 0.9, 2.4);
  anel(4.4, 5.9, z0, '#79522f', ordem + 0.1, 0.9, 2.4);
  anel(3.6, 4.8, z0 + 0.12, '#8a5f37', ordem + 0.2, 0.75, 1.9);
  // Copa: fita escura embaixo e cada anel um pouco menor e mais claro, com o vinco no alto
  for (let i = 0; i < 5; i++) anel(2.75, 3.15, z0 + 0.2 + i * 0.26, fita, ordem + 0.3 + i * 0.01);
  for (let i = 0; i < 9; i++) {
    const t = i / 8;
    anel(2.65 - t * 0.5, 3.05 - t * 0.55, z0 + 1.5 + t * 2.6, tom('#7f5731', 0.82 + t * 0.34), ordem + 0.4 + i * 0.01);
  }
  anel(0.5, 1.5, z0 + 4.15, '#5e3f24', ordem + 0.6);
  return cena.sprite();
};

// ---------- Cenário ----------

const T = 16;
const madeira = '#7d5a39', madeiraC = '#94704a';

// Trecho de cerca: um mourão no meio do ladrilho e tábuas só até os vizinhos que existem, para os cantos se encontrarem
// e as porteiras terminarem no mourão. Bits de `bracos`: 1 = +x, 2 = -x, 4 = +y, 8 = -y
export const criarCerca = (bracos: number): Sprite => {
  const cena = new Cena();
  [4, 8].forEach((z) => {
    if (bracos & 1) cena.caixa(0, -0.5, z, 8, 1, 1.2, madeiraC);
    if (bracos & 2) cena.caixa(-8, -0.5, z, 8, 1, 1.2, madeiraC);
    if (bracos & 4) cena.caixa(-0.5, 0, z, 1, 8, 1.2, madeiraC);
    if (bracos & 8) cena.caixa(-0.5, -8, z, 1, 8, 1.2, madeiraC);
  });
  cena.caixa(-1.2, -1.2, 0, 2.4, 2.4, 11, madeira, 0, 1000);
  return cena.sprite();
};

export const criarArvore = (semente: number, tipo: 'amarelo' | 'rosa' | 'verde'): Sprite => {
  const cena = new Cena();
  const sorte = sorteador(semente);
  const paleta = {
    amarelo: ['#a9831e', '#cda028', '#e3bb3a', '#f2d65f'],
    rosa: ['#99486f', '#bb5f8e', '#d57fa9', '#ecabc8'],
    verde: ['#2f4f2b', '#3e6636', '#527f42', '#6c9652'],
  }[tipo];
  cena.sombra(10, 6, 62, 0.34);
  // Flores caídas no chão: é o que dá cara de ipê
  if (tipo !== 'verde') {
    for (let i = 0; i < 26; i++) {
      const a = sorte() * Math.PI * 2, r = 8 + sorte() * 18;
      cena.disco(Math.cos(a) * r, Math.sin(a) * r, 0, 1 + sorte() * 1.2, paleta[2 + Math.floor(sorte() * 2)], 0.55, -1000);
    }
  }
  // Tronco com galhos
  cena.caixa(-2, -2, 0, 4, 4, 15, '#574030');
  cena.caixa(-1.4, -1.4, 15, 2.8, 2.8, 16, '#574030');
  cena.caixa(0, -0.8, 18, 7, 1.6, 1.6, '#4c3829');
  cena.caixa(-0.8, 0, 22, 1.6, 7, 1.6, '#4c3829');
  // Copa em camadas: das folhas de sombra, embaixo, até as iluminadas, no alto à esquerda
  const copas: [number, number, number][] = [[0, 0, 34], [-20, 8, 22], [20, 8, 22], [-11, -15, 22], [13, -14, 20], [0, 16, 20]];
  const [ox, oy] = projetar(0, 0, 33);
  copas.forEach(([dx, dy, r]) => cena.plano(circulo(ox + dx, oy + dy + 8, r), paleta[0], 1000, false));
  copas.forEach(([dx, dy, r]) => cena.plano(circulo(ox + dx, oy + dy + 3, r * 0.9), paleta[1], 1001, false));
  for (let i = 0; i < 150; i++) {
    const a = sorte() * Math.PI * 2, r = Math.sqrt(sorte()) * 34;
    const px = ox + Math.cos(a) * r * 1.15, py = oy + Math.sin(a) * r * 0.9;
    const alto = 1 - (py - oy + 30) / 60;
    const idx = Math.min(3, Math.max(1, Math.round(1 + alto * 2 + (sorte() - 0.5))));
    cena.plano(circulo(px, py, 2 + sorte() * 3.6), paleta[idx], 1002 + i * 0.001, false);
  }
  return cena.sprite();
};

const circulo = (cx: number, cy: number, r: number): P2[] => {
  const pts: P2[] = [];
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  return pts;
};

// Tábuas e janelas pintadas nas paredes
const janelaY = (c: Cena, y: number, x: number, z: number, w: number, h: number, azul: string, vidro: string) => {
  c.face([[x - 1, y, z - 1], [x + w + 1, y, z - 1], [x + w + 1, y, z + h + 1], [x - 1, y, z + h + 1]], '#c4baa2', 50);
  c.face([[x, y, z], [x + w, y, z], [x + w, y, z + h], [x, y, z + h]], vidro, 51);
  c.face([[x, y, z], [x + w / 2 - 0.4, y, z], [x + w / 2 - 0.4, y, z + h], [x, y, z + h]], azul, 52);
  c.face([[x + w / 2 + 0.4, y, z], [x + w, y, z], [x + w, y, z + h], [x + w / 2 + 0.4, y, z + h]], azul, 52);
};
const janelaX = (c: Cena, x: number, y: number, z: number, w: number, h: number, azul: string) => {
  c.face([[x, y - 1, z - 1], [x, y + w + 1, z - 1], [x, y + w + 1, z + h + 1], [x, y - 1, z + h + 1]], '#a9a08a', 50);
  c.face([[x, y, z], [x, y + w / 2 - 0.4, z], [x, y + w / 2 - 0.4, z + h], [x, y, z + h]], azul, 52);
  c.face([[x, y + w / 2 + 0.4, z], [x, y + w, z], [x, y + w, z + h], [x, y + w / 2 + 0.4, z + h]], azul, 52);
};

export const criarSede = (largura = 7, profundidade = 5): Sprite => {
  // Casa colonial mineira: paredes brancas, barrado, janelas azuis e telhado de telha. A origem é o meio da fachada
  const c = new Cena();
  const x0 = (-largura / 2) * T, x1 = (largura / 2) * T, y0 = -profundidade * T, y1 = 0, H = 26, ym = (y0 + y1) / 2, o = 5;
  const topo = H + profundidade * 4.8;
  const parede = '#ddd5c2', barrado = '#8d7a5e', telha = '#a4502b', azul = '#3a6d96';
  c.sombra(10, ym + 10, largura * 8.5 * 2, 0.3);
  // Água de trás do telhado
  c.face([[x0 - o, y0 - o, H], [x1 + o, y0 - o, H], [x1 + o, ym, topo], [x0 - o, ym, topo]], tom(telha, 0.55), 10);
  // Parede leste (+x) com o oitão
  c.face([[x1, y0, 0], [x1, y1, 0], [x1, y1, H], [x1, y0, H]], tom(parede, 0.72), 20);
  c.face([[x1, y0, H], [x1, y1, H], [x1, ym, topo]], tom(parede, 0.72), 20);
  c.face([[x1, y0, 0], [x1, y1, 0], [x1, y1, 5], [x1, y0, 5]], tom(barrado, 0.72), 21);
  for (let y = y0 + 12; y < y1 - 16; y += 30) janelaX(c, x1, y, 10, 12, 11, tom(azul, 0.8));
  // Fachada (+y)
  c.face([[x0, y1, 0], [x1, y1, 0], [x1, y1, H], [x0, y1, H]], parede, 30);
  c.face([[x0, y1, 0], [x1, y1, 0], [x1, y1, 5], [x0, y1, 5]], barrado, 31);
  for (let x = 14; x + 12 < x1 - 2; x += 18) {
    janelaY(c, y1, x, 10, 12, 11, azul, '#31404a');
    janelaY(c, y1, -x - 12, 10, 12, 11, azul, '#31404a');
  }
  // Porta e soleira
  c.face([[-7, y1, 0], [7, y1, 0], [7, y1, 20], [-7, y1, 20]], '#5e3a1f', 40);
  c.face([[-0.3, y1, 0], [0.3, y1, 0], [0.3, y1, 20], [-0.3, y1, 20]], '#3f2613', 41);
  c.face([[3.5, y1, 9], [5, y1, 9], [5, y1, 10.5], [3.5, y1, 10.5]], '#d4b04a', 42);
  c.caixa(-10, 0, 0, 20, 5, 1.2, '#9b9385');
  // Água da frente com fiadas de telha
  c.face([[x0 - o, y1 + o, H], [x1 + o, y1 + o, H], [x1 + o, ym, topo], [x0 - o, ym, topo]], telha, 60);
  const fiadas = 9;
  for (let i = 0; i < fiadas; i++) {
    const t0 = i / fiadas, t1 = (i + 0.45) / fiadas;
    const y = (t: number) => y1 + o + (ym - y1 - o) * t, z = (t: number) => H + (topo - H) * t;
    c.face([[x0 - o, y(t0), z(t0)], [x1 + o, y(t0), z(t0)], [x1 + o, y(t1), z(t1)], [x0 - o, y(t1), z(t1)]], tom(telha, i % 2 ? 0.86 : 0.92), 61);
  }
  for (let x = x0 - o; x < x1 + o; x += 5) {
    c.face([[x, y1 + o, H], [x + 0.5, y1 + o, H], [x + 0.5, ym, topo], [x, ym, topo]], tom(telha, 0.76), 62);
  }
  // Beiral e cumeeira
  c.caixa(x0 - o, ym - 1.5, topo - 1, x1 - x0 + o * 2, 3, 2, '#8c4424');
  c.caixa(x0 - o, y1 + o - 0.5, H - 1.5, x1 - x0 + o * 2, 1, 1.5, '#6f3a1f');
  // Chaminé
  c.caixa(x1 - 26, ym - 3, topo - 12, 8, 8, 22, '#8d8778');
  return c.sprite();
};

export const criarOrdenha = (largura = 5, profundidade = 3): Sprite => {
  // Galpão de alvenaria com telhado de zinco. A origem é o meio da frente
  const c = new Cena();
  const x0 = (-largura / 2) * T, x1 = (largura / 2) * T, y0 = -profundidade * T, y1 = 0, H = 20, ym = (y0 + y1) / 2, o = 3;
  const topo = H + profundidade * 4.7;
  const parede = '#b7ad98', zinco = '#8fa0a8';
  c.sombra(8, ym + 4, largura * 8.5 * 2, 0.28);
  c.face([[x0 - o, y0 - o, H], [x1 + o, y0 - o, H], [x1 + o, ym, topo], [x0 - o, ym, topo]], tom(zinco, 0.55), 10);
  c.face([[x1, y0, 0], [x1, y1, 0], [x1, y1, H], [x1, y0, H]], tom(parede, 0.72), 20);
  c.face([[x1, y0, H], [x1, y1, H], [x1, ym, topo]], tom(parede, 0.72), 20);
  c.face([[x0, y1, 0], [x1, y1, 0], [x1, y1, H], [x0, y1, H]], parede, 30);
  // Portão aberto e, lá dentro, os latões de leite
  c.face([[-11, y1, 0], [11, y1, 0], [11, y1, 16], [-11, y1, 16]], '#241c15', 40);
  [-7, -1.5].forEach((x) => {
    c.caixa(x, y1 - 3, 0, 4, 4, 6.5, '#b9c0c4');
    c.caixa(x + 1, y1 - 2, 6.5, 2, 2, 1.5, '#8d9499');
  });
  c.face([[-14, y1, 16], [14, y1, 16], [14, y1, 19], [-14, y1, 19]], '#b9972f', 45);
  for (let x = 16; x + 10 < x1 - 1; x += 16) {
    janelaY(c, y1, x, 9, 10, 6, '#55707f', '#88a6b4');
    janelaY(c, y1, -x - 10, 9, 10, 6, '#55707f', '#88a6b4');
  }
  c.face([[x0 - o, y1 + o, H], [x1 + o, y1 + o, H], [x1 + o, ym, topo], [x0 - o, ym, topo]], zinco, 60);
  for (let x = x0 - o; x < x1 + o; x += 3.2) {
    c.face([[x, y1 + o, H], [x + 1.2, y1 + o, H], [x + 1.2, ym, topo], [x, ym, topo]], tom(zinco, 1.12), 61);
  }
  c.caixa(x0 - o, ym - 1, topo - 1, x1 - x0 + o * 2, 2, 1.6, '#6e7d84');
  return c.sprite();
};

export const criarCasinha = (): Sprite => {
  const c = new Cena();
  const parede = '#d7ceb9', teto = '#4a7d92';
  c.sombra(0, 0, 26, 0.26);
  c.caixa(-13, -8, 0, 26, 16, 12, parede);
  c.face([[-7, 8, 0], [7, 8, 0], [7, 8, 9], [-7, 8, 9]], '#241c15', 200);
  c.face([[-15, 10, 11], [15, 10, 11], [15, -10, 19], [-15, -10, 19]], teto, 300);
  for (let x = -15; x < 15; x += 3.2) c.face([[x, 10, 11], [x + 1, 10, 11], [x + 1, -10, 19], [x, -10, 19]], tom(teto, 1.15), 301);
  return c.sprite();
};

export const criarPlaca = (): Sprite => {
  const c = new Cena();
  c.sombra(0, 0, 10, 0.25);
  c.caixa(-1, -1, 0, 2, 2, 12, madeira);
  c.caixa(-9, -0.6, 10, 18, 1.2, 8, madeiraC);
  [12, 14.5].forEach(z => c.face([[-7, 0.6, z], [7, 0.6, z], [7, 0.6, z + 0.5], [-7, 0.6, z + 0.5]], '#52391f', 500));
  return c.sprite();
};

export const criarQuadro = (): Sprite => {
  const c = new Cena();
  c.sombra(0, 0, 22, 0.28);
  c.caixa(-12, -1, 0, 2, 2, 19, madeira);
  c.caixa(10, -1, 0, 2, 2, 19, madeira);
  c.caixa(-13, -0.6, 7, 26, 1.2, 13, '#a98c63');
  c.face([[-11, 0.6, 9], [-2, 0.6, 9], [-2, 0.6, 18], [-11, 0.6, 18]], '#ece4cd', 500);
  c.face([[0, 0.6, 11], [10, 0.6, 11], [10, 0.6, 18], [0, 0.6, 18]], '#ece4cd', 500);
  [11, 13, 15].forEach(z => c.face([[-10, 0.6, z], [-3, 0.6, z], [-3, 0.6, z + 0.5], [-10, 0.6, z + 0.5]], '#9d927a', 501));
  [13, 15].forEach(z => c.face([[1, 0.6, z], [9, 0.6, z], [9, 0.6, z + 0.5], [1, 0.6, z + 0.5]], '#9d927a', 501));
  c.face([[-7, 0.6, 17], [-5.5, 0.6, 17], [-5.5, 0.6, 18.5], [-7, 0.6, 18.5]], '#c9402f', 502);
  c.face([[4.5, 0.6, 17], [6, 0.6, 17], [6, 0.6, 18.5], [4.5, 0.6, 18.5]], '#3f7fa1', 502);
  c.face([[-15, 4, 19.5], [15, 4, 19.5], [15, -2, 23], [-15, -2, 23]], '#99492a', 600);
  return c.sprite();
};

export const criarPorteira = (): Sprite => {
  const c = new Cena();
  c.sombra(0, 0, 36, 0.28);
  c.caixa(-26, -2, 0, 4, 4, 28, madeira);
  c.caixa(22, -2, 0, 4, 4, 28, madeira);
  c.caixa(-28, -1.6, 28, 56, 3.2, 3, madeiraC);
  c.caixa(-15, -0.5, 18, 0.8, 1, 10, '#3a2a1b');
  c.caixa(14.2, -0.5, 18, 0.8, 1, 10, '#3a2a1b');
  c.caixa(-17, -0.7, 11, 34, 1.4, 8, '#d7ceb9');
  return c.sprite();
};

export const criarFeno = (): Sprite => {
  const c = new Cena();
  c.sombra(0, 0, 18, 0.26);
  c.caixa(-9, -6, 0, 18, 12, 9, '#c0a24a');
  [-3, 3].forEach(x => c.caixa(x, -6.1, 0, 0.5, 12.2, 9.1, '#8d7530'));
  return c.sprite();
};

export const criarCocho = (): Sprite => {
  const c = new Cena();
  c.sombra(0, 0, 22, 0.24);
  c.caixa(-14, -5, 0, 28, 10, 5, '#7c7468');
  c.face([[-12, -3, 5.1], [12, -3, 5.1], [12, 3, 5.1], [-12, 3, 5.1]], '#5a9db5', 400);
  c.face([[-9, -1, 5.15], [-2, -1, 5.15], [-2, 0, 5.15], [-9, 0, 5.15]], '#a6d4e3', 401);
  return c.sprite();
};

export const criarArbusto = (semente = 3): Sprite => {
  const c = new Cena();
  const sorte = sorteador(semente);
  c.sombra(0, 0, 16, 0.26);
  const [ox, oy] = projetar(0, 0, 6);
  [[0, 0, 12], [-9, 3, 8], [9, 3, 8]].forEach(([dx, dy, r]) => c.plano(circulo(ox + dx, oy + dy + 2, r), '#2f4f2b', 10, false));
  for (let i = 0; i < 34; i++) {
    const a = sorte() * Math.PI * 2, r = Math.sqrt(sorte()) * 12;
    c.plano(circulo(ox + Math.cos(a) * r * 1.3, oy + Math.sin(a) * r * 0.8, 1.5 + sorte() * 2), sorte() > 0.45 ? '#527f42' : '#3e6636', 11 + i * 0.01, false);
  }
  for (let i = 0; i < 6; i++) c.plano(circulo(ox - 10 + sorte() * 20, oy - 6 + sorte() * 12, 1.1), sorte() > 0.5 ? '#c55377' : '#d9b23c', 12, false);
  return c.sprite();
};

export const criarPedra = (): Sprite => {
  const c = new Cena();
  c.sombra(0, 0, 11, 0.26);
  c.caixa(-5, -4, 0, 10, 8, 3.2, '#77756e');
  c.caixa(-3, -2.5, 3.2, 6, 5, 1.8, '#8b8982');
  return c.sprite();
};

// ---------- Plantação: 5 estágios, do plantio ao ponto de corte ----------

export type Cultura = 'milho' | 'sorgo' | 'capim';

export const criarPlanta = (cultura: Cultura, estagio: number, semente = 1): Sprite => {
  const c = new Cena();
  const sorte = sorteador(semente + estagio * 7);
  const maduro = estagio >= 4;
  const folha = maduro ? '#a8953f' : cultura === 'capim' ? '#4f7f3a' : '#477a39';
  const folhaC = maduro ? '#c9b65a' : '#6b9c4c';
  const altura = [1.6, 6, 13, 21, 21][estagio];
  for (const y0 of [-4, 4]) {
    for (const x0 of [-4, 4]) {
      const x = x0 + (sorte() - 0.5) * 2, y = y0 + (sorte() - 0.5) * 2, h = altura * (0.88 + sorte() * 0.2);
      const ordem = x + y;
      if (cultura === 'capim') {
        [[-1.2, 0.9], [0, 1], [1.2, 0.85]].forEach(([d, f]) => {
          const [bx, by] = projetar(x + d, y - d, 0), [tx, ty] = projetar(x + d * 2.4, y - d * 2.4, h * f);
          c.plano([[bx - 0.6, by], [bx + 0.6, by], [tx, ty]], d === 0 ? folhaC : folha, ordem);
        });
        continue;
      }
      c.caixa(x - 0.35, y - 0.35, 0, 0.7, 0.7, h, folha);
      for (let z = 2.5; z < h - 1; z += 3.4) {
        const lado = Math.round(z) % 2 ? 1 : -1;
        const [bx, by] = projetar(x, y, z), [tx, ty] = projetar(x + lado * 3.4, y - lado * 3.4, z + 1.4);
        c.plano([[bx, by - 0.8], [tx, ty], [bx, by + 0.8]], lado > 0 ? folhaC : folha, ordem + 0.1);
      }
      if (estagio >= 3 && cultura === 'milho') {
        c.caixa(x + 0.3, y + 0.3, h * 0.48, 1.2, 1.2, 3.4, maduro ? '#d2ab3d' : '#d8cd7d');
        c.caixa(x - 0.3, y - 0.3, h, 0.6, 0.6, 2, '#cdbb72');
      }
      if (estagio >= 3 && cultura === 'sorgo') c.caixa(x - 1, y - 1, h, 2, 2, 2.8, maduro ? '#7f3a22' : '#975029');
    }
  }
  return c.sprite();
};

// ---------- Chão ----------

export type TipoChao = 'grama' | 'pasto' | 'terra' | 'agua';

const CORES_CHAO: Record<TipoChao, string[]> = {
  grama: ['#5f7c46', '#567240', '#68864d', '#4a6638'],
  pasto: ['#73894b', '#6a8045', '#7f9553', '#5c723d'],
  terra: ['#8f5c3e', '#845338', '#9a6646', '#744831'],
  agua: ['#4c7f8f', '#447585', '#5a8d9c', '#386473'],
};

// Pinta um ladrilho em losango com manchas e, na grama, tufos: de longe parece um chão contínuo
export const pintarLadrilho = (ctx: CanvasRenderingContext2D, x: number, y: number, tipo: TipoChao, sorte: () => number) => {
  const [base, a, b, c] = CORES_CHAO[tipo];
  const [cx, cy] = projetar(x + 8, y + 8);
  ctx.fillStyle = base;
  ctx.beginPath();
  ctx.moveTo(cx, cy - 16.5);
  ctx.lineTo(cx + 33, cy);
  ctx.lineTo(cx, cy + 16.5);
  ctx.lineTo(cx - 33, cy);
  ctx.closePath();
  ctx.fill();
  const manchas = tipo === 'agua' ? 3 : 7;
  for (let i = 0; i < manchas; i++) {
    const r = sorte();
    ctx.fillStyle = r < 0.45 ? a : r < 0.85 ? b : c;
    ctx.globalAlpha = 0.35;
    ctx.beginPath();
    // Pode vazar para o vizinho: é o que esconde o desenho do losango
    ctx.ellipse(cx + (sorte() - 0.5) * 52, cy + (sorte() - 0.5) * 26, 4 + sorte() * 10, 2 + sorte() * 5, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  if (tipo === 'grama' || tipo === 'pasto') {
    ctx.strokeStyle = c;
    ctx.lineWidth = 0.7;
    for (let i = 0; i < 6; i++) {
      const px = cx + (sorte() - 0.5) * 44, py = cy + (sorte() - 0.5) * 20;
      ctx.globalAlpha = 0.55;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + (sorte() - 0.5) * 2, py - 2 - sorte() * 3);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    if (sorte() < 0.05) {
      ctx.fillStyle = ['#e8e3d0', '#d7b84a', '#c56f92'][Math.floor(sorte() * 3)];
      ctx.beginPath();
      ctx.arc(cx + (sorte() - 0.5) * 36, cy + (sorte() - 0.5) * 16, 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }
};
