// Les cartes de l'arène, dessinées en tuiles de 48 unités (16 pixels d'art).
// L'enseignant choisit la carte dans son tableau de bord.
//
// Tuiles (un caractère chacune) :
//   sol     .  herbe   h hautes herbes (on s'y cache)   s sable   n neige   d chemin   p pavés   f dalles   w plancher   t tapis   B pont
//   lent    m  boue / sables mouvants   =  gué (eau peu profonde)
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
    obj(kind, x, y, w, h) { A.objs.push({ kind, x: Math.round(x * T), y: Math.round(y * T), w: Math.round(w * T), h: Math.round(h * T) }); },
    chest(x, y) { A.chests.push({ x: Math.round((x + 0.5) * T), y: Math.round((y + 0.5) * T) }); },
    bush(x, y, r = 1.2) { A.bushes.push({ x: Math.round(x * T), y: Math.round(y * T), r: Math.round(r * T) }); },
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
  // les buissons servent aussi de cachettes pour les objets
  for (const b of A.bushes) A.spots.push({ x: b.x, y: b.y });
  return {
    id, nom, theme, desc, T, cols: COLS, rows: ROWS, W: COLS * T, H: ROWS * T,
    tiles: A.g.map(r => r.join('')), objs: A.objs, bushes: A.bushes, chests: A.chests, spots: A.spots, heal: A.heal,
    barrels: A.barrels, portals: A.portals,
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

// ---------- Forêt ----------
function foret() {
  const A = atelier('foret', 4242, '.');
  A.border('T', 2);
  // bosquets impénétrables (peu nombreux, bien visibles)
  for (const [x, y, rx, ry] of [[12, 9, 3, 2.2], [38, 8, 3.5, 2.4], [42, 27, 3, 2.5], [9, 28, 2.6, 2]]) A.blob(x, y, rx, ry, 'T', 0.4);
  // ruisseau en diagonale avec gués et un pont
  A.path([[0, 6], [8, 13], [18, 16], [27, 22], [36, 26], [44, 33], [52, 35]], 2, '~');
  A.path([[12, 13], [14, 17]], 3, '=', '~');
  A.path([[34, 24], [36, 28]], 3, '=', '~');
  A.fill(24, 19, 2, 4, 'B');
  A.blob(44, 15, 3.5, 2.6, '~', 0.3);                                        // étang
  // clairière centrale avec la source de soin
  A.blob(26, 12, 2.6, 2, 'd', 0.3);
  A.setHeal(26.5, 12.5, 'source');
  A.path([[26, 12], [25, 21], [20, 28], [12, 31]], 1.2, 'd', '.');
  A.path([[26, 12], [34, 10], [46, 20]], 1.2, 'd', '.');
  A.path([[26, 12], [16, 6], [6, 4]], 1.2, 'd', '.');
  // cabane du bûcheron
  A.house(4, 17, 8, 6, 'x', 'w', ['e', 's']);
  // cercle de champignons et vieille tour
  A.house(30, 29, 6, 5, '#', 'f', ['n', 'w'], false); A.chest(31.5, 31); A.spot(33, 31);
  A.chest(40, 4.5); A.chest(47, 12);
  A.tallGrass(7); A.portal('.d'); A.scatterBarrels(4, '.d');
  A.scatter('oak', 12, '.', 1, 0.8, 1);
  A.scatter('pine', 10, '.', 0.9, 0.8, 1);
  A.scatter('stump', 4, '.', 0.7, 0.5, 1);
  A.scatterBushes(18, '.');
  for (const [x, y] of [[13, 12], [16, 25], [38, 13], [21, 4], [47, 30]]) A.spot(x, y);
  return fin(A, 'foret', 'Forêt des Murmures', 'foret', 'Plein de buissons pour se cacher, ruisseau, cabane et source de soin');
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

const CARTES = [village, foret, desert, donjon, hiver, colisee, marais].map(f => f());
module.exports = { CARTES, T, WALL, WATER };
