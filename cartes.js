// Les cartes de l'arène, dessinées en tuiles de 48 unités (16 pixels d'art).
// L'enseignant choisit la carte dans son tableau de bord.
//
// Tuiles (un caractère chacune) :
//   sol     .  herbe   h hautes herbes (on s'y cache)   s sable   n neige   d chemin   p pavés   f dalles   w plancher   t tapis   B pont
//   ciel    e  pont de navire (le vide autour : v, on tire par-dessus)
//   caverne o  sol de la grotte   R  rails des wagonnets
//   école   a  asphalte de la cour   l  linoléum   y  plancher du gymnase   r  trampoline (te propulse)
//   lent    m  boue / sables mouvants   =  gué (eau peu profonde)   j  Jell-O renversé (colle aux pieds)
//   rapide  i  glace
//   eau     ~  eau   v  fosse   L  lave          (bloquent les joueurs, pas les flèches)
//   murs    b  briques   #  pierre   k  mur du donjon   c  falaise   x  rondins   g  gradins   T  arbres denses

const T = 48, COLS = 52, ROWS = 36;
const WALL = new Set('b#kcxgT');
const WATER = new Set('~vL');

function hash(x, y, s) {
  let h = (x * 374761393 + y * 668265263 + s * 2246822519) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function noise(x, y, s) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

// Petit atelier pour tracer une carte
function atelier(id, seed, base) {
  const g = Array.from({ length: ROWS }, () => Array(COLS).fill(base));
  let s = seed;
  const rnd = (a = 0, b = 1) => { s = (s * 16807) % 2147483647; return a + (s / 2147483647) * (b - a); };
  const A = {
    g, rnd, objs: [], bushes: [], chests: [], spots: [], heal: null, barrels: [], portals: [],
    ok: (x, y) => x >= 0 && y >= 0 && x < COLS && y < ROWS,
    get: (x, y) => (A.ok(x, y) ? g[y][x] : 'c'),
    set: (x, y, ch) => { if (A.ok(x, y)) g[y][x] = ch; },
    fill(x, y, w, h, ch) { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) A.set(i, j, ch); },
    // tache aux bords irréguliers
    blob(cx, cy, rx, ry, ch, wob = 0.35, only = null) {
      for (let j = Math.floor(cy - ry - 2); j <= cy + ry + 2; j++) for (let i = Math.floor(cx - rx - 2); i <= cx + rx + 2; i++) {
        const d = Math.hypot((i - cx) / rx, (j - cy) / ry) + (noise(i * 0.45, j * 0.45, seed) - 0.5) * wob * 2;
        if (d < 1 && (!only || only.includes(A.get(i, j)))) A.set(i, j, ch);
      }
    },
    // trait épais le long d'une ligne brisée
    path(pts, w, ch, only = null) {
      for (let k = 0; k < pts.length - 1; k++) {
        const [x0, y0] = pts[k], [x1, y1] = pts[k + 1], n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 3);
        for (let t = 0; t <= n; t++) {
          const x = x0 + (x1 - x0) * t / n, y = y0 + (y1 - y0) * t / n;
          for (let j = Math.floor(y - w / 2); j < y + w / 2; j++) for (let i = Math.floor(x - w / 2); i < x + w / 2; i++)
            if (!only || only.includes(A.get(i, j))) A.set(i, j, ch);
        }
      }
    },
    border(ch, thick = 1) {
      for (let j = 0; j < ROWS; j++) for (let i = 0; i < COLS; i++) {
        const e = Math.min(i, j, COLS - 1 - i, ROWS - 1 - j);
        if (e < thick || (e === thick && noise(i * 0.5, j * 0.5, seed + 9) > 0.62)) A.set(i, j, ch);
      }
    },
    // maison où l'on peut entrer : murs, plancher, portes de 2 tuiles
    house(x, y, w, h, wall, floor, doors = ['s'], furn = true) {
      A.fill(x, y, w, h, wall); A.fill(x + 1, y + 1, w - 2, h - 2, floor);
      const mx = x + Math.floor(w / 2) - 1, my = y + Math.floor(h / 2) - 1;
      for (const d of doors) {
        if (d === 's') A.fill(mx, y + h - 1, 2, 1, floor);
        if (d === 'n') A.fill(mx, y, 2, 1, floor);
        if (d === 'w') A.fill(x, my, 1, 2, floor);
        if (d === 'e') A.fill(x + w - 1, my, 1, 2, floor);
      }
      if (furn) {
        // meubles contre le mur du haut, un tapis au centre, un coffre dans un coin
        A.obj('shelf', x + 1.2, y + 1, 1.4, 0.9);
        if (w > 7) A.obj('table', x + w - 4, y + 1.1, 2.4, 0.9);
        if (w > 8 && h > 6) A.obj('bed', x + w - 2.2, y + h - 3.6, 1, 1.9);
        A.fill(x + Math.floor(w / 2) - 1, y + Math.floor(h / 2) - 1, 3, 2, 't');
        A.chest(x + 1.5, y + h - 2.5);
      }
      return { x: x + 1, y: y + 1, w: w - 2, h: h - 2 };
    },
    // objets (en tuiles) : rectangle de collision
    // décor peint au sol, sans collision (ex. l'intérieur d'un autobus)
    deco(kind, x, y, w, h, extra) { (A.decos = A.decos || []).push({ kind, x: Math.round(x * T), y: Math.round(y * T), w: Math.round(w * T), h: Math.round(h * T), ...extra }); },
    obj(kind, x, y, w, h) { A.objs.push({ kind, x: Math.round(x * T), y: Math.round(y * T), w: Math.round(w * T), h: Math.round(h * T) }); },
    chest(x, y) { A.chests.push({ x: Math.round((x + 0.5) * T), y: Math.round((y + 0.5) * T) }); },
    bush(x, y, r = 1.2, kind) { A.bushes.push({ x: Math.round(x * T), y: Math.round(y * T), r: Math.round(r * T), ...(kind ? { kind } : {}) }); },
    spot(x, y) { A.spots.push({ x: Math.round((x + 0.5) * T), y: Math.round((y + 0.5) * T) }); },
    setHeal(x, y, kind) { A.heal = { x: Math.round(x * T), y: Math.round(y * T), r: 110, heal: 10, kind }; },
    // une case libre : sol permis tout autour, loin des objets
    free(x, y, pad, allowed) {
      for (let j = y - pad; j <= y + pad; j++) for (let i = x - pad; i <= x + pad; i++) if (!allowed.includes(A.get(i, j))) return false;
      const cx = (x + 0.5) * T, cy = (y + 0.5) * T;
      if (A.objs.some(o => cx > o.x - T * 1.6 && cx < o.x + o.w + T * 1.6 && cy > o.y - T * 1.6 && cy < o.y + o.h + T * 1.6)) return false;
      if (A.heal && Math.hypot(cx - A.heal.x, cy - A.heal.y) < 200) return false;
      const near = (l, d) => l.some(o => Math.hypot(o.x - cx, o.y - cy) < d);
      if (near(A.chests, T * 2) || near(A.barrels, T * 3) || near(A.portals.flat(), T * 3)) return false;
      return true;
    },
    scatter(kind, n, allowed, w, h, pad = 1) {
      for (let i = 0, k = 0; k < n && i < n * 80; i++) {
        const x = Math.floor(rnd(2, COLS - 3)), y = Math.floor(rnd(2, ROWS - 3));
        if (A.free(x, y, pad, allowed)) { A.obj(kind, x + 0.5 - w / 2, y + 0.9 - h, w, h); k++; }
      }
    },
    // tonneaux explosifs, loin les uns des autres
    scatterBarrels(n, allowed) {
      for (let i = 0, k = 0; k < n && i < n * 120; i++) {
        const x = Math.floor(rnd(3, COLS - 4)), y = Math.floor(rnd(3, ROWS - 4));
        if (A.free(x, y, 1, allowed) && !A.barrels.some(b => Math.hypot(b.x - (x + 0.5) * T, b.y - (y + 0.5) * T) < T * 7)) { A.barrels.push({ x: Math.round((x + 0.5) * T), y: Math.round((y + 0.5) * T) }); k++; }
      }
    },
    // une paire de portails, aux deux bouts de la carte
    portal(allowed) {
      for (let i = 0; i < 4000; i++) {
        const x1 = Math.floor(rnd(3, COLS - 4)), y1 = Math.floor(rnd(3, ROWS - 4)), x2 = Math.floor(rnd(3, COLS - 4)), y2 = Math.floor(rnd(3, ROWS - 4));
        if (Math.hypot(x2 - x1, y2 - y1) < 30 || !A.free(x1, y1, 1, allowed) || !A.free(x2, y2, 1, allowed)) continue;
        A.portals.push([{ x: Math.round((x1 + 0.5) * T), y: Math.round((y1 + 0.5) * T) }, { x: Math.round((x2 + 0.5) * T), y: Math.round((y2 + 0.5) * T) }]);
        return;
      }
    },
    // touffes de hautes herbes où l'on se cache
    tallGrass(n, r = 1.8) {
      for (let i = 0, k = 0; k < n && i < n * 80; i++) {
        const x = Math.floor(rnd(3, COLS - 4)), y = Math.floor(rnd(3, ROWS - 4));
        if (!A.free(x, y, 1, '.')) continue;
        A.blob(x + 0.5, y + 0.5, r + rnd(0, 0.8), r * 0.7 + rnd(0, 0.5), 'h', 0.5, '.'); k++;
      }
    },
    scatterBushes(n, allowed) {
      for (let i = 0, k = 0; k < n && i < n * 80; i++) {
        const x = Math.floor(rnd(2, COLS - 3)), y = Math.floor(rnd(2, ROWS - 3));
        if (A.free(x, y, 1, allowed) && !A.bushes.some(b => Math.hypot(b.x - (x + 0.5) * T, b.y - (y + 0.5) * T) < T * 4)) { A.bush(x + 0.5, y + 0.5, 1.1 + rnd(0, 0.4)); k++; }
      }
    },
  };
  return A;
}

function fin(A, id, nom, theme, desc) {
  // ponts : la terre doit continuer au bout de chaque pont (sinon l'eau qui touche l'entrée bloque le passage).
  // Le pont traverse dans le sens de sa longueur.
  const vusB = new Set();
  for (let j = 0; j < ROWS; j++) for (let i = 0; i < COLS; i++) {
    if (A.get(i, j) !== 'B' || vusB.has(j * COLS + i)) continue;
    let i1 = i, j1 = j;
    while (A.get(i1 + 1, j) === 'B') i1++;
    while (A.get(i, j1 + 1) === 'B') j1++;
    for (let b = j; b <= j1; b++) for (let a = i; a <= i1; a++) vusB.add(b * COLS + a);
    const vert = j1 - j >= i1 - i;
    for (let a = vert ? i : j; a <= (vert ? i1 : j1); a++) for (const [d0, s] of [[vert ? j : i, -1], [vert ? j1 : i1, 1]])
      for (let k = 1; k <= 2; k++) {
        const x = vert ? a : d0 + s * k, y = vert ? d0 + s * k : a;
        if (!WATER.has(A.get(x, y))) break;
        A.set(x, y, '.');
      }
  }
  // un buisson ne doit pas chevaucher un arbre ou un meuble (on ne le distinguerait plus) : on le déplace un peu
  const touche = (bx, by, r) => A.objs.some(o => bx + r > o.x - 16 && bx - r < o.x + o.w + 16 && by + r > o.y - 90 && by - r < o.y + o.h + 12);
  A.bushes.forEach((b, n) => {
    if (b.kind || !touche(b.x, b.y, b.r)) return;   // les casiers restent contre leur mur
    const i0 = Math.floor(b.x / T), j0 = Math.floor(b.y / T), sol = A.get(i0, j0);
    for (let d = 1; d <= 10; d++) for (let j = j0 - d; j <= j0 + d; j++) for (let i = i0 - d; i <= i0 + d; i++) {
      if (Math.max(Math.abs(i - i0), Math.abs(j - j0)) !== d) continue;
      const x = (i + 0.5) * T, y = (j + 0.5) * T;
      if (!A.free(i, j, 1, sol) || touche(x, y, b.r) || A.bushes.some((c, m) => m !== n && Math.hypot(c.x - x, c.y - y) < T * 3)) continue;
      b.x = Math.round(x); b.y = Math.round(y); return;
    }
  });
  // les buissons servent aussi de cachettes pour les objets
  for (const b of A.bushes) A.spots.push({ x: b.x, y: b.y });
  return {
    id, nom, theme, desc, T, cols: COLS, rows: ROWS, W: COLS * T, H: ROWS * T,
    tiles: A.g.map(r => r.join('')), objs: A.objs, bushes: A.bushes, chests: A.chests, spots: A.spots, heal: A.heal,
    barrels: A.barrels, portals: A.portals, ...(A.ballons ? { ballons: A.ballons } : {}), ...(A.rails ? { rails: A.rails } : {}), ...(A.fantome ? { fantome: A.fantome } : {}), ...(A.vent ? { vent: A.vent } : {}), ...(A.decos ? { decos: A.decos } : {}),
  };
}

// ---------- Village ----------
function village() {
  const A = atelier('village', 7331, '.');
  A.border('T', 1);
  A.fill(2, 1, 14, 2, 'c');                                                  // falaise au nord-ouest
  // rivière : descend du nord, puis se sépare vers le grand lac et vers le sud
  A.path([[27, 0], [27, 5], [25, 10], [26, 15], [24, 18]], 3, '~');
  A.path([[24, 18], [19, 19], [15, 22]], 3, '~');
  A.path([[25, 18], [29, 23], [28, 30], [30, 36]], 3, '~');
  A.blob(11, 27, 8, 6, 's', 0.15, '.~');                                      // plage
  A.blob(11, 27, 6.5, 4.6, '~', 0.12);                                        // grand lac
  A.blob(10, 27, 1.6, 1.2, 's', 0.1);                                        // petite île au trésor
  A.path([[10, 27], [10, 33]], 2, '=', '~s');                                // gué vers l'île
  // ponts et gué (passages d'une zone à l'autre)
  A.fill(24, 8, 4, 2, 'B');
  A.fill(17, 18, 2, 4, 'B');
  A.path([[26, 28], [31, 28]], 2, '=', '~');
  // chemins de terre
  A.path([[8, 11], [12, 13], [20, 13], [24, 9], [32, 9], [38, 13], [39, 17]], 1.2, 'd', '.');
  A.path([[39, 17], [38, 24], [30, 28], [22, 29], [17, 25], [17, 22]], 1.2, 'd', '.');
  A.path([[39, 17], [47, 17]], 1.2, 'd', '.');
  A.path([[8, 11], [8, 20], [16, 20]], 1.2, 'd', '.');
  // place avec fontaine
  A.blob(39, 17, 4.2, 3.6, 'p', 0.1);
  A.setHeal(39.5, 17.5, 'fontaine');
  // maisons
  A.house(3, 4, 10, 7, 'b', 'w', ['s']);
  A.house(34, 3, 9, 7, '#', 'f', ['s', 'w']);
  A.house(42, 21, 8, 7, 'b', 'w', ['w', 'n']);
  A.house(31, 30, 9, 5, 'b', 'w', ['n'], true);
  // ruines au nord-est
  for (const [x, y] of [[45, 4], [48, 4], [45, 8], [48, 9]]) A.obj(y === 9 ? 'pillarb' : 'pillar', x, y, 1, 1);
  A.fill(44, 12, 3, 1, '#'); A.fill(49, 11, 1, 3, '#');
  A.chest(46.5, 6);
  A.chest(10, 26.5);                                                         // sur l'île
  A.obj('well', 21, 6, 1.4, 1.2);
  A.obj('stall', 43, 14, 2, 1); A.obj('barrels', 34.5, 19, 1, 1);
  A.tallGrass(5); A.portal('.'); A.scatterBarrels(5, '.dp');
  A.scatter('oak', 14, '.', 1, 0.8, 1);
  A.scatter('palm', 5, 's', 0.8, 0.6, 1);
  A.scatter('rock', 4, '.s', 1.1, 0.8, 1);
  A.scatterBushes(10, '.');
  for (const [x, y] of [[7, 7], [38, 6], [46, 24], [35, 32], [20, 27], [47, 32]]) A.spot(x, y);
  return fin(A, 'village', 'Village de Mirabel', 'village', 'Maisons à visiter, rivière, grand lac et place avec fontaine de soin');
}

// ---------- Cité ----------
function cite() {
  const A = atelier('cite', 8128, 'p');
  A.fill(0, 0, COLS, 1, '#'); A.fill(0, ROWS - 1, COLS, 1, '#'); A.fill(0, 0, 1, ROWS, '#'); A.fill(COLS - 1, 0, 1, ROWS, '#');   // remparts bien droits
  // canal qui traverse la ville, trois ponts
  A.path([[0, 19], [14, 19], [19, 21], [33, 21], [38, 19], [52, 19]], 2, '~');
  A.path([[8, 16], [8, 24]], 3, 'B', '~');
  A.path([[26, 18], [26, 25]], 3, 'B', '~');
  A.path([[45, 16], [45, 23]], 3, 'B', '~');
  // place du marché avec fontaine de soin
  A.setHeal(27, 8, 'fontaine');
  for (const [x, y] of [[21, 3.6], [30.5, 3.6], [21, 11], [30.5, 11]]) A.obj('stall', x, y, 2.2, 1);
  // quartier nord : maisons et guilde (on peut entrer)
  A.house(2, 2, 8, 6, 'b', 'w', ['s', 'e']);
  A.house(12, 2, 7, 6, '#', 'f', ['s'], false); A.chest(13.5, 4);
  A.house(2, 10, 7, 6, 'b', 'w', ['e', 'n'], false); A.chest(3.5, 13);
  A.house(11, 10, 7, 6, 'b', 'w', ['s', 'w'], false);
  A.house(36, 2, 8, 7, '#', 'f', ['s', 'w']);
  A.house(46, 2, 5, 6, 'b', 'w', ['s'], false);
  A.house(36, 11, 6, 5, 'b', 'w', ['n', 'w'], false);
  A.house(44, 10, 7, 6, 'b', 'w', ['w', 's'], false); A.chest(48.5, 12);
  // quartier sud : la cathédrale et des maisons
  const c = A.house(19, 25, 14, 9, '#', 'f', ['n', 'e', 'w'], false);
  A.fill(25, 26, 2, 7, 't');
  for (const [x, y] of [[22, 27], [22, 30.5], [29, 27], [29, 30.5]]) A.obj('pillar', x, y, 1, 1);
  A.obj('statue', 25.5, c.y + 0.2, 1, 1); A.chest(20.5, 31.5);
  A.house(2, 25, 7, 6, 'b', 'w', ['n', 'e']);
  A.house(11, 25, 6, 6, '#', 'f', ['n'], false);
  A.house(35, 25, 7, 6, 'b', 'w', ['n', 'w'], false); A.chest(39.5, 27.5);
  A.house(44, 25, 7, 6, 'b', 'w', ['n', 'w']);
  // ruelles : caisses, tonneaux, puits, réverbères
  for (const [x, y] of [[10, 8.4], [33, 15], [17, 33], [42, 33], [2.4, 33]]) A.obj('crate', x, y, 1, 1);
  A.obj('barrels', 34.4, 2.4, 1, 1); A.obj('barrels', 9.6, 32.6, 1, 1);
  A.obj('well', 4, 17, 1.4, 1.2);
  for (const [x, y] of [[19, 2.2], [34.4, 9.6], [19, 13.8], [10.4, 22.6], [41.4, 22.6], [33.6, 24.6], [17.6, 24.6], [48, 16.4], [2.4, 22.6], [47.6, 33.4]]) A.obj('lamp', x, y, 0.4, 0.4);
  A.bush(20.4, 14.6, 1.1); A.bush(33.6, 14.6, 1.1); A.bush(14, 33.4, 1.1); A.bush(38, 33.4, 1.1);
  A.portal('p'); A.scatterBarrels(6, 'p');
  for (const [x, y] of [[5, 5], [41, 5], [14, 13], [47, 28], [5, 28], [30, 33]]) A.spot(x, y);
  return fin(A, 'cite', 'Cité de Pierrefort', 'cite', 'Rues pavées, ruelles, maisons à visiter, marché, canal et cathédrale');
}

// ---------- Désert ----------
function desert() {
  const A = atelier('desert', 9001, 's');
  A.border('c', 1);
  for (const [x, y, rx, ry] of [[10, 9, 3, 2], [16, 27, 2.6, 2], [41, 28, 3, 2.2]]) A.blob(x, y, rx, ry, 'c', 0.35);   // plateaux rocheux
  // oasis
  A.blob(24, 19, 6.5, 4.6, '.', 0.3);
  A.blob(22, 20, 3.6, 2.4, '~', 0.25);
  A.setHeal(27.5, 17.5, 'source');
  // sables mouvants
  for (const [x, y, r] of [[36, 15, 2.4], [7, 19, 2], [30, 31, 2.2]]) A.blob(x, y, r, r * 0.8, 'm', 0.4);
  // lit de rivière asséché
  A.path([[2, 33], [12, 22], [24, 26], [38, 21], [50, 24]], 1.2, 'd', 's');
  // temple en ruine (on peut y entrer)
  A.house(33, 3, 14, 9, 'g', 'p', ['s', 'w']);
  A.fill(39, 4, 2, 7, 't');
  for (const [x, y] of [[36, 5], [36, 8], [43, 5], [43, 8]]) A.obj('pillar', x, y, 1, 1);
  A.fill(35, 1, 1, 1, 's');
  A.chest(40, 5);
  // petite cabane de pierre
  A.house(4, 26, 7, 6, 'g', 'p', ['e']);
  A.chest(16, 25); A.chest(47, 32);
  A.portal('s'); A.scatterBarrels(5, 'sd');
  A.scatter('cactus', 14, 's', 0.6, 0.7, 1);
  A.scatter('rock', 6, 's', 1.1, 0.8, 1);
  A.scatter('palm', 5, '.', 0.8, 0.6, 0);
  A.scatterBushes(5, 's.');
  for (const [x, y] of [[12, 12], [44, 30], [20, 30], [8, 4], [47, 16]]) A.spot(x, y);
  return fin(A, 'desert', 'Désert Brûlant', 'desert', 'Oasis, temple en ruine et sables mouvants qui ralentissent');
}

// ---------- Donjon ----------
function donjon() {
  const A = atelier('donjon', 666, 'k');
  // salles : 3 x 3, la grande salle au centre
  const rooms = [
    [2, 2, 12, 9], [20, 2, 12, 8], [38, 2, 12, 9],
    [2, 14, 11, 9], [18, 13, 16, 10], [39, 14, 11, 9],
    [2, 26, 12, 8], [20, 26, 12, 8], [38, 26, 12, 8],
  ];
  for (const [x, y, w, h] of rooms) A.fill(x, y, w, h, 'f');
  const c = ([x, y, w, h]) => [x + w / 2, y + h / 2];
  // couloirs de 3 tuiles
  for (const [a, b] of [[0, 1], [1, 2], [3, 4], [4, 5], [6, 7], [7, 8], [0, 3], [3, 6], [1, 4], [4, 7], [2, 5], [5, 8]]) {
    const [x0, y0] = c(rooms[a]), [x1, y1] = c(rooms[b]);
    A.path([[x0, y0], [x1, y1]], 3, 'f');
  }
  // dangers : fosses et lave (on peut tirer par-dessus)
  A.blob(8, 6.5, 2.4, 1.4, 'v', 0.2);
  A.fill(41, 29, 6, 2, 'L'); A.fill(43, 28, 2, 4, 'L');
  A.path([[4, 30], [12, 30]], 2, '~');
  A.fill(7, 29, 2, 3, 'B');
  A.blob(44, 18, 2.2, 1.5, 'v', 0.2);
  // grande salle : autel de soin, piliers, tapis
  A.setHeal(26, 18, 'autel');
  A.fill(23, 21, 6, 1, 't');
  for (const [x, y] of [[20, 14.5], [31, 14.5], [20, 20.5], [31, 20.5]]) A.obj('dpillar', x, y, 1, 1);
  for (const [x, y] of [[23, 3.5], [28, 3.5], [23, 7], [28, 7], [23, 28], [28, 28], [23, 31], [28, 31]]) A.obj('dpillar', x, y, 1, 1);
  A.obj('crate', 4, 15, 1, 1); A.obj('crate', 11, 21, 1, 1); A.obj('barrels', 47, 3, 1, 1); A.obj('crate', 40, 9, 1, 1);
  A.portal('f'); A.scatterBarrels(6, 'f');
  A.obj('tomb', 6, 32, 1.4, 1); A.obj('tomb', 47.5, 15, 1.4, 1);
  for (const [x, y] of [[3, 3], [48, 3], [3, 32], [48, 32], [44, 22]]) A.chest(x, y);
  for (const [x, y] of [[12, 9], [21, 9], [40, 15], [12, 24], [30, 33]]) A.spot(x, y);
  return fin(A, 'donjon', 'Donjon Oublié', 'donjon', 'Salles et couloirs sombres, fosses, lave et coffres dans les coins');
}

// ---------- Hiver ----------
function hiver() {
  const A = atelier('hiver', 1225, 'n');
  A.border('c', 1);
  A.blob(17, 19, 11, 7.5, 'i', 0.25);                                        // grand lac gelé : on glisse vite !
  for (const [x, y, r] of [[13, 17, 1.4], [21, 22, 1.2], [18, 14, 0.9]]) A.blob(x, y, r, r * 0.8, '~', 0.2);   // trous dans la glace
  A.blob(9, 21, 1.6, 1.2, 'n', 0.2);                                         // îlot enneigé
  // ruisseau qui descend vers l'est, un pont de bois et un gué
  A.path([[40, 0], [38, 8], [41, 16], [39, 24], [42, 36]], 2, '~');
  A.fill(37, 7, 4, 2, 'B');
  A.path([[38, 22], [42, 22]], 2, '=', '~');
  // hameau de cabanes autour du feu de camp
  A.house(43, 4, 7, 6, 'x', 'w', ['s', 'w']);
  A.house(44, 27, 7, 6, 'x', 'w', ['n', 'w']);
  A.blob(32, 30, 2, 1.6, 'd', 0.2);
  A.setHeal(32.5, 30.5, 'feu');
  A.path([[32, 30], [38, 30], [46, 26]], 1.2, 'd', 'n');
  A.path([[32, 30], [33, 18], [38, 9], [44, 9]], 1.2, 'd', 'n');
  A.chest(9, 21); A.chest(30, 4); A.chest(4, 32);
  A.portal('n'); A.scatterBarrels(4, 'nd');
  A.scatter('snowpine', 16, 'n', 0.9, 0.8, 1);
  A.scatter('snowrock', 5, 'n', 1.1, 0.8, 1);
  A.scatter('snowman', 4, 'n', 0.7, 0.6, 1);
  A.scatterBushes(6, 'n');
  for (const [x, y] of [[26, 6], [6, 6], [28, 33], [48, 18], [35, 14]]) A.spot(x, y);
  return fin(A, 'hiver', 'Toundra Glacée', 'hiver', 'Immense lac gelé où l\'on glisse, cabanes et feu de camp qui soigne');
}

// ---------- Colisée ----------
function colisee() {
  const A = atelier('colisee', 300, 'p');
  A.border('g', 1);
  const cx = 26, cy = 18;
  // anneau de gradins avec 4 portes
  for (let j = 0; j < ROWS; j++) for (let i = 0; i < COLS; i++) {
    const d = Math.hypot((i + 0.5 - cx) / 18, (j + 0.5 - cy) / 12.5);
    if (d < 1 && d > 0.84) A.set(i, j, 'g');
    if (d <= 0.84) A.set(i, j, 's');
  }
  A.fill(cx - 2, 3, 4, 4, 's'); A.fill(cx - 2, 29, 4, 4, 's');
  A.fill(6, cy - 2, 5, 4, 's'); A.fill(41, cy - 2, 5, 4, 's');
  A.setHeal(cx, cy, 'fontaine');
  // dans l'arène : quelques piliers et deux fosses
  for (const [x, y] of [[17, 13], [34, 13], [17, 22], [34, 22]]) A.obj('pillar', x, y, 1, 1);
  A.blob(20.5, 18, 1.2, 1, 'v', 0); A.blob(31.5, 18, 1.2, 1, 'v', 0);
  A.obj('crate', 25.5, 10, 1, 1); A.obj('crate', 25.5, 25, 1, 1);
  // cellules de gladiateurs dans les coins (on peut y entrer)
  A.house(2, 2, 7, 5, '#', 'f', ['s', 'e'], false); A.chest(3, 3);
  A.house(43, 2, 7, 5, '#', 'f', ['s', 'w'], false); A.chest(47, 3);
  A.house(2, 29, 7, 5, '#', 'f', ['n', 'e'], false); A.chest(3, 31);
  A.house(43, 29, 7, 5, '#', 'f', ['n', 'w'], false); A.chest(47, 31);
  // statues et braseros autour
  A.portal('s'); A.scatterBarrels(6, 's');
  for (const [x, y] of [[15, 3], [36, 3], [15, 32], [36, 32]]) A.obj('statue', x, y, 1, 1);
  for (const [x, y] of [[3, 12], [3, 23], [48, 12], [48, 23]]) A.obj('brazier', x, y, 0.8, 0.8);
  for (const [x, y] of [[cx, 10.5], [16, 18], [36, 18], [cx, 26]]) A.spot(x, y);
  return fin(A, 'colisee', 'Grand Colisée', 'colisee', 'Arène de gladiateurs : grand combat ouvert, cellules dans les coins');
}

// ---------- Marais ----------
function marais() {
  const A = atelier('marais', 5150, '.');
  A.border('T', 1);
  for (const [x, y, rx, ry] of [[12, 10, 5, 3], [36, 9, 4, 3], [20, 27, 6, 3.5], [42, 26, 4, 3], [28, 17, 3, 2.4]]) A.blob(x, y, rx, ry, 'm', 0.45);
  for (const [x, y, rx, ry] of [[7, 22, 3, 2.2], [30, 5, 2.6, 1.8], [46, 17, 2.4, 3]]) A.blob(x, y, rx, ry, '~', 0.35);
  // chenal avec passerelles et gués
  A.path([[0, 17], [10, 16], [18, 19], [25, 14], [33, 20], [40, 18], [52, 21]], 2, '~');
  A.fill(17, 17, 2, 4, 'B'); A.fill(39, 16, 2, 4, 'B');
  A.path([[28, 15], [28, 20]], 3, '=', '~m');
  A.path([[6, 14], [6, 19]], 2, '=', '~');
  // cabane de la sorcière
  A.house(40, 3, 8, 6, 'x', 'w', ['s', 'w']);
  A.blob(14, 31, 2, 1.2, 'd', 0.2);
  A.setHeal(14.5, 31.5, 'source');
  A.chest(30, 5); A.chest(4, 4); A.chest(47, 32);
  A.tallGrass(6); A.portal('.'); A.scatterBarrels(4, '.d');
  A.scatter('deadtree', 10, '.', 0.6, 0.6, 1);
  A.scatter('willow', 5, '.', 1, 0.8, 1);
  A.scatterBushes(12, '.m');
  for (const [x, y] of [[22, 9], [10, 27], [33, 30], [47, 11], [26, 23]]) A.spot(x, y);
  return fin(A, 'marais', 'Marais Gluant', 'marais', 'Boue qui ralentit, passerelles et cabane de la sorcière');
}

// ---------- École ----------
// L'école, avec des surprises : trampolines au gymnase, Jell-O renversé à la cafétéria,
// casiers où se cacher et ballons géants qui roulent dans la cour.
function ecole() {
  const A = atelier('ecole', 4242, '.');
  A.border('T', 1);
  // ===== le bâtiment (nord) =====
  A.fill(1, 1, 50, 14, 'b');
  A.fill(2, 7, 35, 3, 'l');                                                  // grand corridor
  const classe = (x, y, w, h, porte) => { A.fill(x, y, w, h, 'w'); A.fill(x + Math.floor(w / 2) - 1, porte, 2, 1, 'w'); };
  classe(2, 2, 10, 4, 6); classe(13, 2, 10, 4, 6);                           // classes du haut
  classe(2, 11, 10, 3, 10); classe(13, 11, 10, 3, 10);                       // classes du bas
  // cafétéria (au nord du corridor) : du Jell-O renversé partout
  A.fill(24, 2, 13, 4, 'l'); A.fill(29, 6, 3, 1, 'l');
  for (const [x, y, rx, ry] of [[27, 3.5, 1.6, 0.9], [33.5, 4, 1.4, 1], [30.5, 2.8, 1.1, 0.7]]) A.blob(x, y, rx, ry, 'j', 0.4, 'l');
  // hall d'entrée vers la cour, et salle des profs (interdite… mais il y a un trésor !)
  A.fill(24, 10, 4, 5, 'l'); A.fill(29, 11, 8, 3, 'w'); A.fill(29, 10, 2, 1, 'w');
  // gymnase (à l'est) : grand plancher, portes vers le corridor et vers la cour
  A.fill(38, 2, 12, 12, 'y'); A.fill(37, 7, 1, 3, 'y'); A.fill(43, 14, 2, 1, 'y');
  for (const [x, y] of [[40, 4], [46, 4], [43, 9], [40, 11], [46, 11]]) A.fill(x, y, 2, 2, 'r');   // trampolines
  // portes vers l'extérieur
  A.fill(24, 14, 4, 1, 'l');
  // ===== dehors =====
  A.fill(13, 16, 28, 18, 'a');                                               // cour d'école
  A.fill(24, 15, 4, 1, 'a');
  A.path([[44, 15], [44, 18.5], [40, 18.5]], 3, 'a', '.');
  A.path([[13, 19], [8, 20], [7, 26], [7, 30]], 1.4, 'd', '.');               // sentier dans le parc
  A.blob(7, 24, 3, 2, 's', 0.2);                                             // carré de sable
  A.fill(40, 20, 11, 14, 'p');                                               // stationnement des autobus
  A.setHeal(7, 30.5, 'fontaine');
  // ballons géants : ils roulent dans la cour (rectangle où ils naissent)
  A.ballons = [{ x: 22 * T, y: 22 * T }, { x: 32 * T, y: 28 * T }];
  // ===== meubles et décor =====
  for (const [x0, y0] of [[2, 2], [13, 2]]) { A.obj('tableau', x0 + 3, y0, 4, 0.5); for (let i = 0; i < 3; i++) A.obj('pupitre', x0 + 1.3 + i * 3, y0 + 2.2, 1.2, 0.7); }
  for (const [x0, y0] of [[2, 11], [13, 11]]) { for (let i = 0; i < 3; i++) A.obj('pupitre', x0 + 1.3 + i * 3, y0 + 1.6, 1.2, 0.7); }
  for (const [x, y] of [[25, 2.4], [32, 4.6]]) A.obj('tablecaf', x, y, 3, 0.8);
  A.obj('sofa', 32, 11.2, 3, 0.8); A.obj('shelf', 29.4, 11, 1.4, 0.9);
  A.obj('panier', 38.4, 7.4, 0.6, 1.2); A.obj('panier', 49, 7.4, 0.6, 1.2);
  A.obj('panier', 14, 23.5, 0.6, 1.2); A.obj('panier', 39.4, 23.5, 0.6, 1.2);
  A.obj('balancoire', 3, 18, 4, 1); A.obj('glissade', 9, 17.6, 1.4, 2);
  // autobus vus de haut : on entre par la porte avant ou la sortie de secours, on circule dans l'allée
  const bus = (bx, by) => {
    const L = 8.5, H = 3.6, e = 0.35;
    A.deco('bus', bx, by, L, H);
    A.obj('bord', bx, by, 0.6, e); A.obj('bord', bx + 2, by, L - 2, e);                       // côté nord, porte avant
    A.obj('bord', bx, by + H - e, L, e); A.obj('bord', bx, by, e, H);                          // côté sud, avant
    A.obj('bord', bx + L - e, by, e, 1.1); A.obj('bord', bx + L - e, by + 2.5, e, H - 2.5);    // arrière, sortie de secours
    A.obj('bord', bx + 0.45, by + 2.35, 0.8, 0.85);                                            // siège du chauffeur
    for (let x = bx + 2.4; x < bx + L - 1.2; x += 1.2) { A.obj('bord', x, by + e, 0.75, 0.7); A.obj('bord', x, by + H - e - 0.7, 0.75, 0.7); }
  };
  bus(41, 21.4); bus(41, 27.6);
  for (const [x, y] of [[3.5, 21], [11, 21.5], [3, 27], [11, 31], [8.5, 33], [2.5, 33]]) A.obj('oak', x, y, 1, 0.8);
  // casiers où l'on se cache, le long du corridor
  for (const x of [4, 10.5, 14.5, 21, 34]) A.bush(x, 6.95, 0.85, 'casier');   // collés au mur : le corridor reste libre
  A.scatterBushes(4, '.');
  // coffres : dans les classes, la salle des profs et la cour
  for (const [x, y] of [[2, 2], [22, 13], [35, 12], [48, 12], [20, 32], [8, 22], [46, 29]]) A.chest(x, y);
  A.portal('a'); A.scatterBarrels(3, 'a');
  for (const [x, y] of [[6, 4], [17, 12], [30, 3], [44, 6], [26, 25], [45, 33], [5, 31]]) A.spot(x, y);
  return fin(A, 'ecole', 'École des Héros', 'ecole', 'Classes, corridor, cafétéria au Jell-O, gymnase à trampolines et cour aux ballons géants');
}

// ---------- Caverne ----------
// Une mine dans le noir : on ne voit qu'autour de son héros, des lanternes, des cristaux et des champignons lumineux.
// Trois wagonnets foncent sur une grande boucle de rails (ils traversent la lave sur des ponts de rails),
// une géode de cristal au centre, un lac souterrain et des champignons qui font rebondir.
function caverne() {
  const A = atelier('caverne', 8080, 'c');
  const salles = [[9, 7, 6, 4.5], [26, 6, 6, 3.5], [44, 8, 6, 5], [6.5, 18, 4, 4], [45.5, 18, 4, 4], [11, 29, 7, 4.8], [26, 30, 6, 3.5], [43, 29, 7, 4.8], [26, 18, 8.5, 5.5]];
  for (const [x, y, rx, ry] of salles) A.blob(x, y, rx, ry, 'o', 0.35);
  // tunnels : la grande boucle (celle des rails) et les quatre galeries vers la géode
  A.path([[8, 6], [44, 6], [44, 30], [8, 30], [8, 6]], 3.2, 'o');
  A.path([[26.5, 6], [26.5, 13]], 2.6, 'o'); A.path([[26.5, 23], [26.5, 30]], 2.6, 'o');
  A.path([[8, 18.5], [18, 18.5]], 2.6, 'o'); A.path([[34, 18.5], [44, 18.5]], 2.6, 'o');
  // rivière de lave (passerelles sur les galeries), lac souterrain avec un pont
  A.path([[37, 1], [38, 8], [36, 14], [38.5, 20], [36.5, 27], [38.5, 35]], 1.7, 'L', 'oc');
  for (let j = 16; j <= 20; j++) for (let i = 34; i <= 41; i++) if (A.get(i, j) === 'L' && Math.abs(j - 18.5) < 1.4) A.set(i, j, 'B');
  A.blob(12.5, 26.6, 3.4, 1.7, '~', 0.25, 'o'); A.fill(12, 25, 1, 4, 'B');
  // rails : la boucle tout autour (les rails passent par-dessus la lave)
  const boucle = [[8, 6], [44, 6], [44, 30], [8, 30]];
  A.rails = boucle.map(([x, y]) => ({ x: (x + 0.5) * T, y: (y + 0.5) * T }));
  for (let k = 0; k < 4; k++) {
    const [x0, y0] = boucle[k], [x1, y1] = boucle[(k + 1) % 4];
    for (let i = Math.min(x0, x1); i <= Math.max(x0, x1); i++) for (let j = Math.min(y0, y1); j <= Math.max(y0, y1); j++) A.set(i, j, 'R');
  }
  for (const j of [5, 7, 29, 31]) for (let i = 30; i < 44; i++) if (A.get(i, j) === 'L') A.set(i, j, 'B');   // passerelles à côté des rails
  // champignons rebondissants (comme les trampolines)
  for (const [x, y] of [[4, 4], [47, 4], [5, 33], [46, 32], [21, 15], [30, 20]]) if (A.get(x, y) === 'o' && A.get(x + 1, y + 1) === 'o') A.fill(x, y, 2, 2, 'r');
  A.setHeal(26.5, 18.5, 'source');
  // la géode : un cercle de gros cristaux autour de la source
  for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2, x = 26.2 + Math.cos(a) * 6.2, y = 18.2 + Math.sin(a) * 3.8; if (A.free(Math.floor(x), Math.floor(y), 0, 'o')) A.obj('cristal' + (k % 3), x, y, 0.8, 0.6); }
  for (const [x, y, k] of [[5, 6, 0], [13, 9, 1], [40, 6, 1], [48, 10, 2], [6, 30, 1], [16, 31, 0], [40, 31, 2], [47, 29, 0]]) if (A.free(x, y, 0, 'o')) A.obj('cristal' + k, x, y, 0.8, 0.6);
  // étais de mine avec une lanterne le long des rails, champignons lumineux près du lac
  for (const [x, y, v] of [[16, 6, 0], [26, 6, 0], [35, 6, 0], [44, 13, 1], [44, 23, 1], [33, 30, 0], [20, 30, 0], [8, 23, 1], [8, 12, 1]]) A.deco('etai', x, y, 1, 1, { v });
  for (const [x, y, c] of [[9, 25, 0], [16, 25.5, 1], [9.5, 28.5, 1], [15.5, 28.8, 0], [3.5, 17, 0], [48, 16.5, 1], [24, 27.5, 1], [29, 9.5, 0]]) A.deco('champilum', x, y, 0.6, 0.6, { c });
  A.scatter('stalag', 12, 'o', 0.8, 0.6, 1);
  for (const [x, y] of [[4, 9], [48, 6], [6, 31], [47, 31], [26, 4], [46, 18]]) A.chest(x, y);
  A.scatterBarrels(4, 'o'); A.portal('o');
  A.scatterBushes(6, 'o');
  for (const [x, y] of [[9, 8], [26, 7], [43, 8], [10, 31], [43, 28], [22, 18], [31, 18]]) A.spot(x, y);
  return fin(A, 'caverne', 'Mine des Cristaux', 'caverne', 'Mine dans le noir : wagonnets fous sur une grande boucle, lave, géode de cristal, lanternes et champignons lumineux');
}

// ---------- Bibliothèque ----------
// Bibliothèque magique et un peu folle : un lac d'encre au milieu, traversé par des crayons géants,
// une forêt de livres géants debout, un tapis-puzzle de l'alphabet avec des blocs, un observatoire étoilé,
// des livres ouverts qui transportent ailleurs et un fantôme bibliothécaire qui fait « Chut ! ».
function bibliotheque() {
  const A = atelier('bibliotheque', 6464, 'w');
  A.border('x', 1);
  // lac d'encre, île du grand livre et ponts-crayons
  A.blob(26, 18, 9.5, 6.2, '~', 0.18, 'w');
  A.blob(26, 18, 4, 2.6, 't', 0.08, '~');
  const pont = (x0, y0, w, h) => { for (let j = y0; j < y0 + h; j++) for (let i = x0; i < x0 + w; i++) if (A.get(i, j) === '~') A.set(i, j, 'B'); };
  pont(14, 17, 10, 2); pont(28, 17, 10, 2); pont(25, 9, 2, 8); pont(25, 19, 2, 9);
  A.setHeal(26, 18.2, 'autel'); A.deco('livreouvert', 23.4, 16.6, 5.2, 3.2);
  // nord-ouest : forêt de livres géants debout (on se faufile entre eux)
  let k = 0;
  for (const y of [4, 7.6, 11.2]) for (let x = 3 + (k++ % 2) * 1.3; x < 19; ) {
    const ep = 0.9 + ((x * 7 + y * 3) % 5) * 0.15;
    if (((x * 13 + y * 5) | 0) % 4 !== 0) A.obj('grandlivre', x, y, ep, 0.8);
    x += ep + (((x * 3 + y) | 0) % 3 === 0 ? 1.6 : 0.15);
  }
  // nord-est : grands rayons et coin lecture
  for (const y of [4.2, 8, 11.8]) for (const [x0, x1] of [[31, 38], [40, 49]]) A.obj('rayon', x0, y - 0.9, x1 - x0, 0.9);
  // sud-ouest : observatoire, tapis étoilé, globe et télescope
  A.blob(10, 27, 6.5, 4.6, 'u', 0.12, 'w');
  A.obj('globe', 9.2, 26.4, 1.6, 1); A.obj('telescope', 13.6, 24.2, 1, 0.8);
  // sud-est : tapis-puzzle de l'alphabet et blocs géants
  A.fill(32, 23, 17, 10, 'q');
  for (const [x, y, l] of [[34, 25, 'A'], [38.5, 27.5, 'B'], [43, 24.5, 'C'], [46, 29.5, 'D'], [35.5, 30.5, 'E'], [41.5, 31, 'Z']]) { A.obj('cube', x, y, 1.6, 1.2); A.objs[A.objs.length - 1].lettre = l; }
  // livres géants ouverts : ils te transportent à l'autre livre de la même couleur
  A.portals.push([{ x: 11 * T, y: 9.6 * T }, { x: 40.5 * T, y: 28.5 * T }]);
  A.portals.push([{ x: 44.5 * T, y: 13.8 * T }, { x: 5.5 * T, y: 23.5 * T }]);
  // le fantôme bibliothécaire fait le tour du lac d'encre
  A.fantome = [[15, 10.5], [37, 10.5], [37, 25.5], [15, 25.5]].map(([x, y]) => ({ x: x * T, y: y * T }));
  // bougies qui flottent dans les airs
  for (const [x, y] of [[8, 14.5], [20, 14], [33, 14.5], [45, 16.5], [6, 20], [20, 23], [33, 22.5], [47, 20.5], [27, 7], [26, 29.5], [16, 31], [37, 33.5]]) A.deco('bougie', x, y, 0.4, 0.4);
  A.scatterBushes(6, 'wtqu');
  for (const [x, y] of [[2, 2], [49, 2], [2, 33], [49, 33], [17, 5.5], [30, 31]]) A.chest(x, y);
  A.scatterBarrels(3, 'w');
  for (const [x, y] of [[8, 10], [44, 10], [8, 28], [44, 26], [26, 16], [20, 18], [33, 18]]) A.spot(x, y);
  return fin(A, 'bibliotheque', 'Bibliothèque Magique', 'biblio', 'Lac d\'encre et crayons géants, forêt de livres, tapis de l\'alphabet, observatoire et fantôme qui fait « Chut ! »');
}

// ---------- Bateaux volants ----------
// Deux galions pirates bord à bord dans les nuages : on monte à l'abordage par les planches,
// on tire au canon sur l'autre navire (on attaque à côté d'un canon), et le vent pousse tout le monde.
function ciel() {
  const A = atelier('ciel', 9191, 'v');
  // un galion : poupe un peu arrondie, ventre large, proue en pointe ; bastingage tout autour
  const navire = (x0, y0, L, Hh, versDroite) => {
    for (let j = 0; j < Hh; j++) for (let i = 0; i < L; i++) {
      const u = versDroite ? (i + 0.5) / L : 1 - (i + 0.5) / L;
      const f = u < 0.08 ? 0.8 + u * 2.5 : u > 0.58 ? 1 - ((u - 0.58) / 0.42) ** 1.7 : 1;
      if (Math.abs(j + 0.5 - Hh / 2) < (Hh / 2) * f + 0.2) A.set(x0 + i, y0 + j, 'e');
    }
    for (let j = y0 - 1; j <= y0 + Hh; j++) for (let i = x0 - 1; i <= x0 + L; i++) {
      if (A.get(i, j) !== 'v') continue;
      let n = false; for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (A.get(i + di, j + dj) === 'e') n = true;
      if (n) A.set(i, j, 'x');
    }
    const cy = y0 + Hh / 2, proue = versDroite ? x0 + L : x0 - 1, poupe = versDroite ? x0 : x0 + L;
    A.deco('beaupre', versDroite ? proue + 0.6 : proue - 4.6, cy - 0.5, 4, 1, { dir: versDroite ? 1 : -1 });   // beaupré et figure de proue
    return { cy, poupe, proue, at: u => versDroite ? x0 + u * L : x0 + L - u * L };
  };
  const N = [navire(3, 2, 44, 11, true), navire(5, 23, 44, 11, false)];
  // planches d'abordage entre les deux navires, et un rocher flottant au milieu
  A.blob(25.5, 17.8, 4.4, 2.6, '.', 0.3, 'v');
  for (const x of [15.5, 34]) A.path([[x, 12.5], [x, 23.5]], 1.7, 'B', 'vx');   // passerelles de corde
  A.path([[25.5, 12.5], [25.5, 15.5]], 1.7, 'B', 'vx'); A.path([[25.5, 20], [25.5, 23.5]], 1.7, 'B', 'vx');
  A.obj('palm', 22.6, 17.4, 0.8, 0.6); A.obj('palm', 28.2, 18.4, 0.8, 0.6);
  A.setHeal(25.5, 17.6, 'source');
  N.forEach((n, k) => {
    const sud = k === 0, coul = k === 0 ? 'rouge' : 'noir';
    // cabine du capitaine à la poupe (porte vers la proue), coffre à l'intérieur
    const cx = k === 0 ? 5 : 41;
    A.house(cx, k === 0 ? 4 : 25, 6, 6, 'x', 'w', [k === 0 ? 'e' : 'w'], false); A.chest(cx + 2.5, k === 0 ? 6.5 : 27.5);
    A.obj('barre', n.at(0.22) - 0.5, n.cy - 0.4, 1, 0.8);                                     // gouvernail
    for (const [u, voile] of [[0.36, 0], [0.55, 1], [0.74, 0]]) { A.obj('mat', n.at(u) - 0.4, n.cy - 0.4, 0.8, 0.8); A.objs[A.objs.length - 1].coul = coul; A.objs[A.objs.length - 1].crane = voile; }
    A.deco('trappe', n.at(0.46) - 1, n.cy - 3.6, 2, 1.4); A.deco('trappe', n.at(0.64) - 1, n.cy + 2.2, 2, 1.4);
    A.deco('drapeau', n.poupe + (k === 0 ? -1.4 : 0.4), n.cy - 0.5, 1, 1, { coul });
    // canons sur le flanc qui fait face à l'autre navire
    for (const x of [7, 11, 19, 30, 38, 42]) if (A.get(x, sud ? 12 : 23) === 'e' && A.get(x + 1, sud ? 12 : 23) === 'e') A.obj('canon', x, sud ? 11.9 : 23.3, 1, 0.8);
    for (const [u, dy] of [[0.3, -3.5], [0.86, 2], [0.48, 3.2]]) A.obj('crate', n.at(u) - 0.5, n.cy + dy, 1, 0.9);
  });
  A.objs.filter(o => o.kind === 'canon').forEach(o => { o.dir = o.y < 15 * T ? Math.PI / 2 : -Math.PI / 2; });
  A.scatterBarrels(5, 'e');
  A.scatterBushes(2, '.');
  for (const [x, y] of [[44, 7], [8, 28], [25, 17]]) A.chest(x, y);
  for (const [x, y] of [[20, 5], [30, 30], [40, 9], [12, 27], [25, 16], [35, 4], [16, 31]]) A.spot(x, y);
  A.vent = true;
  return fin(A, 'ciel', 'Bateaux Volants', 'ciel', 'Deux galions pirates bord à bord dans les nuages : planches d\'abordage, canons et coups de vent');
}

const CARTES = [village, cite, desert, donjon, hiver, colisee, marais, ecole, caverne, bibliotheque, ciel].map(f => f());
module.exports = { CARTES, T, WALL, WATER };
