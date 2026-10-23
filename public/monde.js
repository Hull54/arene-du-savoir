// La carte du monde : régions, rivière, étangs, boue, sentiers.
// Ce fichier est partagé : le serveur s'en sert pour les collisions, le navigateur pour dessiner.
(function (root) {
  const W = 3200, H = 2200;

  // Bruit de valeur 2D déterministe (même résultat partout)
  function hash(x, y) {
    let h = (x * 374761393 + y * 668265263) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }
  function noise(x, y) {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  const fbm = (x, y) => noise(x, y) * 0.6 + noise(x * 2.1 + 17, y * 2.1 + 9) * 0.3 + noise(x * 4.3 + 3, y * 4.3 + 31) * 0.1;

  // Rivière : traverse la carte d'ouest en est en serpentant
  const riverY = x => H * 0.5 + Math.sin(x * 0.0022) * 120 + Math.sin(x * 0.0057 + 1.3) * 55 + (fbm(x * 0.004, 7) - 0.5) * 80;
  const riverHalf = x => 52 + (fbm(x * 0.006, 3) - 0.5) * 30;
  const BRIDGE_X = [420, 1050, 1600, 2150, 2780];
  const BRIDGES = BRIDGE_X.map(x => ({ x: x - 56, y: riverY(x) - 130, w: 112, h: 260 }));

  // Le donjon : une forteresse au sud-est
  const DONJON = { x: 2280, y: 1470, w: 820, h: 640 };
  const PLAZA = { x: 1600, y: 1720, r: 250 };   // place du village (fontaine au centre)

  // Étangs : glace (on marche dessus), oasis et mares (eau)
  const PONDS = [
    { x: 520, y: 520, r: 190, type: 'ice' },
    { x: 560, y: 1820, r: 130, type: 'water' },     // oasis du désert
    { x: 2560, y: 330, r: 95, type: 'water' },
    { x: 2950, y: 740, r: 80, type: 'water' },
    { x: 2300, y: 690, r: 70, type: 'water' },
  ];
  function pondAt(x, y) {
    for (const p of PONDS) {
      const d = Math.hypot(x - p.x, y - p.y), r = p.r * (0.82 + fbm(x * 0.01 + p.x, y * 0.01) * 0.36);
      if (d < r) return p;
    }
    return null;
  }

  // Région à une position (frontières ondulées)
  const REGIONS = {
    neige: 'Toundra glacée', foret: 'Forêt des Murmures', marais: 'Marais Gluant',
    desert: 'Désert Brûlant', village: 'Village de Mirabel', donjon: 'Donjon Oublié',
  };
  function regionAt(x, y) {
    if (x > DONJON.x - 40 && x < DONJON.x + DONJON.w + 40 && y > DONJON.y - 40 && y < DONJON.y + DONJON.h + 40) return 'donjon';
    const wx = x + (fbm(x * 0.0018, y * 0.0018) - 0.5) * 520 + (noise(x * 0.006 + 11, y * 0.006 + 5) - 0.5) * 200 + (noise(x * 0.03, y * 0.03) - 0.5) * 26;
    const top = y < riverY(x);
    if (top) return wx < 1080 ? 'neige' : wx < 2120 ? 'foret' : 'marais';
    return wx < 1080 ? 'desert' : wx < 2120 ? 'village' : 'donjon';
  }

  function inRiver(x, y) { return Math.abs(y - riverY(x)) < riverHalf(x); }
  function onBridge(x, y) { return BRIDGES.some(b => x > b.x && x < b.x + b.w && y > b.y && y < b.y + b.h); }
  // Eau qui bloque les joueurs (mais pas les projectiles)
  function isWater(x, y) {
    if (inRiver(x, y)) return !onBridge(x, y);
    const p = pondAt(x, y);
    return !!p && p.type === 'water';
  }
  function isIce(x, y) { const p = pondAt(x, y); return !!p && p.type === 'ice'; }
  // Boue du marais : ralentit
  function isMud(x, y) {
    return regionAt(x, y) === 'marais' && !isWater(x, y) && fbm(x * 0.006 + 50, y * 0.006 + 50) > 0.56;
  }

  // Sentiers de terre (seulement pour le dessin)
  const PATHS = [
    [[1600, 1720], [1380, 1500], [1050, 1250], [1050, 900], [900, 700]],
    [[1600, 1720], [1600, 1300], [1600, 900], [1700, 500], [1650, 80]],
    [[1600, 1720], [1900, 1600], [2150, 1300], [2150, 900], [2450, 600]],
    [[1600, 1720], [2000, 1790], [2280, 1790]],
    [[1600, 1720], [1200, 1800], [800, 1900], [420, 1500], [420, 1150]],
    [[1600, 1720], [1600, 2180]],
    [[420, 950], [500, 750]],
    [[2800, 800], [2780, 1250], [2700, 1470]],
  ];
  function distSeg(px, py, a, b) {
    const dx = b[0] - a[0], dy = b[1] - a[1], t = Math.max(0, Math.min(1, ((px - a[0]) * dx + (py - a[1]) * dy) / (dx * dx + dy * dy)));
    return Math.hypot(px - a[0] - t * dx, py - a[1] - t * dy);
  }
  function pathDist(x, y) {
    let d = Infinity;
    for (const p of PATHS) for (let i = 0; i < p.length - 1; i++) d = Math.min(d, distSeg(x, y, p[i], p[i + 1]));
    return d + (noise(x * 0.02, y * 0.02) - 0.5) * 18;
  }

  const api = { W, H, noise, fbm, hash, riverY, riverHalf, inRiver, onBridge, isWater, isIce, isMud, pondAt, regionAt, pathDist, REGIONS, BRIDGES, BRIDGE_X, DONJON, PLAZA, PONDS };
  if (typeof module !== 'undefined') module.exports = api; else root.Monde = api;
})(this);
