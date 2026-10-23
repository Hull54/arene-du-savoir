// Dessin en pixel art de l'arène et des héros, partagé entre la vue élève et la vue enseignant.
// 1 pixel d'art = 3 unités du monde. Tout est dessiné par le code (aucune image externe).
const PX = 3;
const OUT = '#1b1424';   // couleur des contours

const CLS = {
  guerrier: { nom: ['Guerrière', 'Guerrier'], ico: '⚔️', color: '#3a6fd8', desc: 'Très résistant. Épée et bouclier, au corps à corps.', pow: '🛡️ Bouclier : réduit les dégâts pendant 3 s' },
  voleur:   { nom: ['Voleuse', 'Voleur'],     ico: '🗡️', color: '#d64545', desc: 'Rapide, corps à corps. Dégâts doublés en frappant dans le dos !', pow: '👤 Ombre : invisible 4 s, prochaine attaque +50 %' },
  mage:     { nom: ['Mage', 'Mage'],          ico: '🔮', color: '#8e4ce0', desc: 'Fragile mais puissant. Lance des boules de feu.', pow: '💥 Explosion : dégâts tout autour' },
  archer:   { nom: ['Archère', 'Archer'],     ico: '🏹', color: '#2f9e55', desc: 'Rapide. Tire des flèches de loin.', pow: '🌧️ Pluie de flèches : 7 flèches en éventail' },
};
const SKIN = ['#f7d3b0', '#dca274', '#a8693d', '#6b3f22'];
const HAIR = ['#2a1c14', '#7a4422', '#e8b84a', '#c2482e'];
const nomClasse = (c, look) => CLS[c].nom[look && look[0] === 'f' ? 0 : 1];

// ---------- Outils de couleur ----------
const rgbCache = {};
function rgb(hex) {
  if (rgbCache[hex]) return rgbCache[hex];
  const n = parseInt(hex.slice(1, 7), 16);
  return (rgbCache[hex] = [n >> 16, (n >> 8) & 255, n & 255, hex.length > 7 ? parseInt(hex.slice(7, 9), 16) : 255]);
}
function shade(hex, f) {
  const [r, g, b] = rgb(hex);
  const c = v => Math.max(0, Math.min(255, Math.round(f < 1 ? v * f : v + (255 - v) * (f - 1))));
  return '#' + [c(r), c(g), c(b)].map(v => v.toString(16).padStart(2, '0')).join('');
}

// Décode l'état compact envoyé par le serveur
function unpackWorld(w) {
  w.p = w.p.map(([id, n, c, l, x, y, a, hp, m, k, f]) => ({ id, n, c, l, x, y, a, hp, m, k, al: !!(f & 1), sh: !!(f & 2), pr: !!(f & 4), hd: !!(f & 8), inv: !!(f & 16) }));
  return w;
}

// ---------- Peintre de pixels avec contour automatique ----------
class Painter {
  constructor(w, h) { this.w = w; this.h = h; this.g = new Array(w * h).fill(null); this.ox = 0; this.oy = 0; }
  px(x, y, c) { x += this.ox; y += this.oy; if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.g[y * this.w + x] = c; }
  rect(x, y, w, h, c) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.px(x + i, y + j, c); }
  disc(cx, cy, r, c) { for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) if (i * i + j * j <= r * r + r * 0.6) this.px(cx + i, cy + j, c); }
  ellipse(cx, cy, rx, ry, c) { for (let j = -ry; j <= ry; j++) for (let i = -rx; i <= rx; i++) if ((i * i) / (rx * rx + 0.5) + (j * j) / (ry * ry + 0.5) <= 1) this.px(cx + i, cy + j, c); }
  outline(c = OUT) {
    const g = this.g.slice();
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      if (g[y * this.w + x]) continue;
      if ((x > 0 && g[y * this.w + x - 1]) || (x < this.w - 1 && g[y * this.w + x + 1]) || (y > 0 && g[(y - 1) * this.w + x]) || (y < this.h - 1 && g[(y + 1) * this.w + x])) this.g[y * this.w + x] = c;
    }
    return this;
  }
  canvas() {
    const c = document.createElement('canvas'); c.width = this.w; c.height = this.h;
    const ctx = c.getContext('2d'), img = ctx.createImageData(this.w, this.h);
    this.g.forEach((col, i) => { if (col) { const [r, g, b, a] = rgb(col); img.data.set([r, g, b, a], i * 4); } });
    ctx.putImageData(img, 0, 0);
    return c;
  }
}

// ---------- Héros en pixel art ----------
// look = "f12" : f/m, teinte de peau (0-3), couleur de cheveux (0-3) ; dir = down | up | side ; frame = 0, 1, 2
const heroCache = {};
function heroSprite(cls, look, dir, frame) {
  const key = cls + look + dir + frame;
  if (heroCache[key]) return heroCache[key];
  const P = new Painter(24, 30); P.ox = 4; P.oy = 8;
  const fem = look[0] === 'f', s = SKIN[+look[1]] || SKIN[0], S = shade(s, 0.82), h = HAIR[+look[2]] || HAIR[0], Hd = shade(h, 0.7), Hl = shade(h, 1.35);
  const E = '#1b1424', boots = '#4a3426';
  const C = {
    guerrier: { c: '#c9d1dc', d: '#8a94a3', a: '#3a6fd8', pants: '#5a5f6a' },
    voleur: { c: '#4a4f5a', d: '#33363e', a: '#c23b3b', pants: '#2f3238' },
    mage: { c: '#6a3fc1', d: '#4b2a8f', a: '#f2c94c', pants: '#4b2a8f' },
    archer: { c: '#2f8f4e', d: '#22683a', a: '#8b5a2b', pants: '#5a4030' },
  }[cls];
  const metal = '#e6ebf2', metalD = '#9aa3b0', wood = '#7a4b25', gold = '#f2c94c', red = '#d33b3b';
  const lA = frame === 1 ? -1 : 0, lB = frame === 2 ? -1 : 0;   // jambes qui bougent

  // armes et objets derrière le corps
  if (dir === 'up') {
    if (cls === 'guerrier') { P.rect(2, 4, 1, 10, metal); P.px(2, 3, metal); P.rect(1, 14, 3, 1, gold); }
    if (cls === 'mage') { P.rect(2, 4, 1, 14, wood); P.rect(1, 1, 3, 3, '#b98cff'); }
    if (cls === 'archer') { P.px(2, 8, wood); P.px(1, 9, wood); P.rect(0, 10, 1, 4, wood); P.px(1, 14, wood); P.px(2, 15, wood); }
  }
  if (dir === 'side') {
    if (cls === 'guerrier') { P.rect(2, 11, 3, 6, C.a); P.rect(3, 12, 1, 4, gold); }
    if (fem && cls !== 'voleur' && cls !== 'guerrier') P.rect(4, 4, 2, 8, h);
    if (fem && cls === 'guerrier') P.rect(4, 5, 2, 7, h);
    if (fem && cls === 'archer') P.rect(3, 4, 2, 5, h);
  }

  // jambes
  if (cls !== 'mage') {
    if (dir === 'side') {
      const f = frame === 0 ? [6, 8] : frame === 1 ? [5, 9] : [9, 5];
      P.rect(f[0], 16, 2, 2, C.pants); P.rect(f[1], 16, 2, 2, shade(C.pants, 0.8));
      P.rect(f[0], 18, 2, 1, boots); P.rect(f[1], 18, 2, 1, boots);
    } else {
      P.rect(5, 16 + lA, 2, 2, C.pants); P.rect(9, 16 + lB, 2, 2, C.pants);
      P.rect(5, 18 + lA, 2, 1, boots); P.rect(9, 18 + lB, 2, 1, boots);
    }
  } else {
    if (dir === 'side') { P.rect(frame === 1 ? 5 : 6, 18, 2, 1, boots); P.rect(frame === 2 ? 5 : 9, 18, 2, 1, boots); }
    else { P.rect(5, 18 + lA, 2, 1, boots); P.rect(9, 18 + lB, 2, 1, boots); }
  }

  // corps
  const bx = dir === 'side' ? 5 : 4, bw = dir === 'side' ? 6 : 8;
  if (cls === 'mage') {
    P.rect(bx, 11, bw, 7, C.c); P.rect(bx - 1, 15, bw + 2, 3, C.c); P.rect(bx - 1, 17, bw + 2, 1, C.d);
    P.rect(bx, 13, bw, 1, gold);
  } else {
    P.rect(bx, 11, bw, 5, C.c); P.rect(bx, 15, bw, 1, C.d);
    if (fem) { P.rect(bx - 1, 15, bw + 2, 2, C.c); P.rect(bx - 1, 16, bw + 2, 1, C.d); }
    if (cls === 'guerrier' && dir !== 'up') P.rect(dir === 'side' ? 7 : 6, 12, dir === 'side' ? 3 : 4, 3, C.a);
    P.rect(bx, 14, bw, 1, cls === 'guerrier' ? '#6b4423' : cls === 'voleur' ? '#7a4a2a' : C.a);
    if (cls === 'voleur') P.rect(bx + 1, 10, bw - 2, 1, C.a);
    if (cls === 'archer' && dir === 'down') { P.px(5, 11, C.a); P.px(6, 12, C.a); P.px(7, 13, C.a); }
    if (cls === 'archer' && dir === 'up') { P.rect(9, 9, 3, 6, '#8b5a2b'); P.px(9, 8, '#ddd'); P.px(10, 7, '#ddd'); P.px(11, 8, '#ddd'); }
  }
  // bras
  if (dir === 'side') {
    P.rect(8, 11, 2, 4, shade(C.c, 0.85)); P.px(9, 15, s);
  } else {
    const ax = cls === 'mage' ? 2 : 3, aw = cls === 'mage' ? 2 : 1;
    P.rect(ax, 11, aw, 4, C.c); P.rect(12, 11, aw, 4, C.c);
    P.px(ax, 15, s); P.px(12, 15, s);
    if (cls === 'guerrier') { P.px(3, 11, metalD); P.px(12, 11, metalD); }
  }

  // tête
  if (dir === 'side') {
    P.rect(5, 3, 7, 6, s); P.rect(6, 2, 5, 1, s); P.rect(6, 9, 5, 1, s); P.px(12, 6, s);
    P.rect(10, 6, 1, 2, E); P.px(10, 8, '#f29a8a');
  } else {
    P.rect(4, 3, 8, 6, s); P.rect(5, 2, 6, 1, s); P.rect(5, 9, 6, 1, s); P.px(3, 6, s); P.px(12, 6, s);
    if (dir === 'down') {
      P.rect(6, 6, 1, 2, E); P.rect(9, 6, 1, 2, E);
      P.px(5, 8, '#f29a8a'); P.px(10, 8, '#f29a8a'); P.rect(7, 9, 2, 1, S);
      if (fem) { P.px(5, 5, E); P.px(10, 5, E); }
    }
  }

  // cheveux
  const hooded = cls === 'voleur';
  if (!hooded) {
    if (dir === 'down') {
      P.rect(4, 2, 8, 2, h); P.rect(5, 1, 6, 1, h); P.px(4, 4, h); P.px(11, 4, h); P.px(5, 4, h); P.px(8, 4, Hd); P.px(6, 1, Hl); P.px(7, 1, Hl);
      if (fem) { P.rect(3, 3, 1, 9, h); P.rect(12, 3, 1, 9, h); P.rect(4, 5, 1, 4, h); P.rect(11, 5, 1, 4, h); P.px(3, 12, Hd); P.px(12, 12, Hd); }
    } else if (dir === 'up') {
      P.rect(4, 2, 8, 8, h); P.rect(5, 10, 6, 1, Hd); P.rect(5, 1, 6, 1, h); P.px(6, 3, Hl); P.px(7, 2, Hl);
      if (fem) { P.rect(3, 3, 10, 9, h); P.rect(4, 11, 8, 1, Hd); }
    } else {
      P.rect(5, 2, 6, 2, h); P.rect(6, 1, 5, 1, h); P.rect(5, 4, 2, 3, h); P.px(11, 3, h); P.px(8, 1, Hl);
      if (fem) P.rect(4, 3, 2, 9, h);
    }
  }

  // couvre-chefs
  if (cls === 'guerrier') {
    if (dir === 'side') { P.rect(5, 1, 7, 4, metal); P.rect(6, 0, 5, 1, metal); P.rect(5, 4, 7, 1, metalD); P.rect(6, -3, 2, 3, red); P.px(5, -2, red); }
    else { P.rect(4, 1, 8, 4, metal); P.rect(5, 0, 6, 1, metal); P.rect(4, 4, 8, 1, metalD); P.rect(7, -3, 2, 3, red); P.px(9, -2, red); if (dir === 'down') P.rect(7, 5, 2, 1, metalD); if (dir === 'up') P.rect(4, 5, 8, 1, metalD); }
  } else if (cls === 'voleur') {
    const hood = '#2e3138';
    if (dir === 'up') { P.rect(3, 1, 10, 10, hood); P.rect(4, 0, 8, 1, hood); P.rect(4, 11, 8, 2, hood); if (fem) { for (let i = 0; i < 6; i++) P.px(7 + (i % 2), 11 + i, i % 2 ? Hd : h); } }
    else if (dir === 'side') { P.rect(4, 1, 8, 4, hood); P.rect(5, 0, 6, 1, hood); P.rect(4, 5, 3, 6, hood); P.rect(6, 9, 6, 2, C.a); if (fem) { for (let i = 0; i < 6; i++) P.px(3 + (i % 2), 8 + i, i % 2 ? Hd : h); } }
    else { P.rect(3, 1, 10, 4, hood); P.rect(4, 0, 8, 1, hood); P.rect(3, 5, 1, 6, hood); P.rect(12, 5, 1, 6, hood); P.rect(4, 8, 8, 2, C.a); if (fem) { P.rect(5, 5, 6, 1, h); for (let i = 0; i < 6; i++) P.px(13, 8 + i, i % 2 ? Hd : h); } }
  } else if (cls === 'mage') {
    const hat = '#5a33a8', hatD = '#4b2a8f';
    if (dir === 'side') { P.rect(3, 2, 11, 1, hatD); P.rect(5, 0, 7, 2, hat); P.rect(5, -2, 5, 2, hat); P.rect(4, -4, 4, 2, hat); P.rect(3, -6, 3, 2, hat); P.px(2, -7, hat); P.rect(5, 1, 7, 1, gold); }
    else { P.rect(2, 2, 12, 1, hatD); P.rect(4, 0, 8, 2, hat); P.rect(5, -2, 6, 2, hat); P.rect(6, -4, 4, 2, hat); P.rect(7, -6, 2, 2, hat); P.px(9, -7, hat); P.rect(4, 1, 8, 1, gold); if (dir === 'down') P.px(8, -1, gold); }
  } else if (cls === 'archer') {
    const cap = '#2f8f4e', capD = '#22683a';
    if (dir === 'side') { P.rect(5, 1, 7, 2, cap); P.rect(6, 0, 5, 1, cap); P.rect(11, 3, 2, 1, capD); P.rect(4, -2, 1, 4, '#e04a3a'); P.px(3, -3, '#e04a3a'); }
    else { P.rect(4, 1, 8, 2, cap); P.rect(5, 0, 6, 1, cap); P.rect(4, 3, 8, 1, capD); P.rect(11, -3, 1, 4, '#e04a3a'); P.px(12, -4, '#e04a3a'); }
  }

  // armes devant
  if (dir === 'down') {
    if (cls === 'guerrier') { P.rect(13, 4, 1, 10, metal); P.px(13, 3, metal); P.rect(12, 14, 3, 1, gold); P.px(13, 15, '#6b4423'); P.rect(0, 11, 3, 6, C.a); P.rect(1, 12, 1, 4, gold); }
    if (cls === 'voleur') { P.rect(13, 11, 1, 4, metal); P.rect(12, 15, 3, 1, '#c9a227'); P.rect(2, 12, 1, 3, metal); }
    if (cls === 'mage') { P.rect(13, 4, 1, 14, wood); P.rect(12, 1, 3, 3, '#b98cff'); P.px(13, 2, '#ffffff'); }
    if (cls === 'archer') { P.px(13, 8, wood); P.px(14, 9, wood); P.rect(15, 10, 1, 4, wood); P.px(14, 14, wood); P.px(13, 15, wood); P.rect(13, 9, 1, 6, '#e8e8e8'); }
  } else if (dir === 'up') {
    if (cls === 'guerrier') { P.rect(12, 11, 3, 6, C.a); P.rect(13, 12, 1, 4, gold); }
    if (cls === 'voleur') { P.rect(2, 11, 1, 4, metal); }
  } else {
    if (cls === 'guerrier') { P.rect(11, 13, 8, 1, metal); P.px(19, 13, metal); P.rect(10, 12, 1, 3, gold); }
    if (cls === 'voleur') { P.rect(11, 13, 4, 1, metal); P.rect(10, 12, 1, 3, '#c9a227'); }
    if (cls === 'mage') { P.rect(11, 4, 1, 14, wood); P.rect(10, 1, 3, 3, '#b98cff'); P.px(11, 2, '#ffffff'); }
    if (cls === 'archer') { P.px(12, 8, wood); P.px(13, 9, wood); P.rect(14, 10, 1, 5, wood); P.px(13, 15, wood); P.px(12, 16, wood); P.rect(12, 9, 1, 7, '#e8e8e8'); P.rect(8, 12, 6, 1, '#5a3a1e'); P.px(14, 12, '#cccccc'); }
  }
  P.ox = 0; P.oy = 0;
  return (heroCache[key] = P.outline().canvas());
}
function dirFromAngle(a) {
  const c = Math.cos(a), s = Math.sin(a);
  if (Math.abs(c) > Math.abs(s) * 1.1) return c > 0 ? 'right' : 'left';
  return s > 0 ? 'down' : 'up';
}
// Dessine un héros : (x, y) = centre du joueur dans le monde ; S = taille d'un pixel d'art
function drawHeroSprite(g, x, y, cls, look, angle, walk, S = PX) {
  const d = dirFromAngle(angle);
  const frame = walk ? 1 + (Math.floor(walk) % 2) : 0;
  const spr = heroSprite(cls, look, d === 'left' || d === 'right' ? 'side' : d, frame);
  g.save();
  g.imageSmoothingEnabled = false;
  g.translate(Math.round(x), Math.round(y + 22));
  if (d === 'left') g.scale(-1, 1);
  g.drawImage(spr, -12 * S, -27 * S, 24 * S, 30 * S);
  g.restore();
}

// ---------- Objets du décor ----------
function spriteFor(o) {
  const w = Math.round(o.w / PX), h = Math.round(o.h / PX);
  let P, ax, ay;   // ax, ay : où se trouve le coin haut-gauche du rectangle de collision dans le dessin
  const kind = o.kind;
  if (kind === 'oak' || kind === 'willow') {
    P = new Painter(30, 34); ax = 15 - w / 2; ay = 34 - h - 1;
    P.rect(13, 20, 4, 11, '#6b4423'); P.px(12, 30, '#6b4423'); P.px(17, 30, '#6b4423'); P.rect(15, 21, 1, 9, '#55361b');
    const base = kind === 'oak' ? '#2f7a32' : '#5d7a3a', dark = kind === 'oak' ? '#225c27' : '#46602b', li = kind === 'oak' ? '#4c9a44' : '#7a9a4a', hi = kind === 'oak' ? '#7cc25a' : '#9ab866';
    P.disc(15, 12, 11, base); P.disc(9, 15, 6, base); P.disc(21, 15, 6, base);
    P.disc(17, 16, 7, dark); P.disc(14, 11, 8, base);
    P.disc(12, 9, 5, li); P.disc(10, 7, 2, hi); P.px(18, 8, li); P.px(19, 9, li); P.px(7, 13, li);
    if (kind === 'willow') for (let i = 0; i < 6; i++) P.rect(6 + i * 4, 18, 1, 6 + (i % 3) * 2, dark);
    else for (let i = 0; i < 5; i++) P.px(8 + i * 4, 14 + (i % 2) * 4, '#c9433a');
  } else if (kind === 'pine' || kind === 'snowpine') {
    P = new Painter(26, 36); ax = 13 - w / 2; ay = 36 - h - 1;
    P.rect(11, 27, 4, 7, '#5a3a1e');
    const g1 = '#1f5a3a', g2 = '#2e7a4a', g3 = '#3f9a5a';
    const tiers = [[3, 10, 12], [9, 8, 10], [15, 6, 9], [21, 4, 7]];
    for (const [ty, , hw] of tiers) { for (let j = 0; j < 8; j++) { const ww = Math.round(hw * (0.35 + j / 10)); P.rect(13 - ww, ty + j, ww * 2, 1, j > 4 ? g1 : g2); } }
    for (const [ty] of tiers) { P.px(10, ty + 3, g3); P.px(11, ty + 2, g3); P.px(12, ty + 1, g3); }
    if (kind === 'snowpine') for (const [ty, , hw] of tiers) { for (let j = 0; j < 3; j++) { const ww = Math.round(hw * (0.35 + j / 10)); P.rect(13 - ww, ty + j, ww * 2, 1, j === 2 ? '#cfe0ee' : '#f4f8ff'); } }
  } else if (kind === 'deadtree') {
    P = new Painter(22, 28); ax = 11 - w / 2; ay = 28 - h - 1;
    const b = '#5a4a3a', bd = '#3d3022';
    P.rect(10, 8, 3, 18, b); P.rect(11, 9, 1, 16, bd);
    P.rect(5, 10, 5, 1, b); P.rect(4, 6, 1, 4, b); P.rect(13, 13, 5, 1, b); P.rect(17, 8, 1, 5, b); P.rect(8, 4, 1, 4, b); P.rect(13, 3, 1, 5, b);
    P.rect(8, 25, 7, 1, b);
  } else if (kind === 'cactus') {
    P = new Painter(20, 26); ax = 10 - w / 2; ay = 26 - h - 1;
    const g = '#3f9a4a', gd = '#2c7a38', gl = '#6cc070';
    P.rect(8, 2, 5, 22, g); P.rect(9, 1, 3, 1, g); P.rect(10, 3, 1, 20, gd); P.px(9, 4, gl); P.px(9, 9, gl); P.px(9, 14, gl);
    P.rect(3, 9, 3, 8, g); P.rect(3, 15, 5, 3, g); P.rect(15, 6, 3, 7, g); P.rect(13, 11, 4, 3, g);
    P.px(10, 0, '#ff7aa8'); P.px(4, 8, '#ffd84a');
  } else if (kind === 'palm') {
    P = new Painter(30, 36); ax = 15 - w / 2; ay = 36 - h - 1;
    for (let j = 0; j < 22; j++) P.rect(13 + Math.round(Math.sin(j / 7) * 2), 12 + j, 4, 1, j % 3 ? '#9b6b3a' : '#7a5129');
    const f = '#3f9a4a', fd = '#2c7a38';
    for (const [dx, dy] of [[-1, 0], [1, 0], [-0.7, 0.6], [0.7, 0.6], [0, -1], [-0.6, -0.6], [0.6, -0.6]])
      for (let k = 1; k < 11; k++) P.rect(15 + Math.round(dx * k), 11 + Math.round(dy * k + (k * k) / 25), 2, 2, k > 7 ? fd : f);
    P.disc(15, 12, 2, '#6b4423');
  } else if (kind === 'rock' || kind === 'snowrock') {
    P = new Painter(w + 4, h + 8); ax = 2; ay = 6;
    P.ellipse(Math.floor((w + 4) / 2), Math.floor(h / 2) + 5, Math.floor(w / 2), Math.floor(h / 2) + 1, '#7d828c');
    P.ellipse(Math.floor((w + 4) / 2) + 2, Math.floor(h / 2) + 7, Math.floor(w / 3), Math.floor(h / 3), '#62666f');
    P.ellipse(Math.floor((w + 4) / 2) - 3, Math.floor(h / 2) + 2, Math.floor(w / 4), Math.floor(h / 5), '#a3a8b2');
    if (kind === 'snowrock') P.ellipse(Math.floor((w + 4) / 2), Math.floor(h / 2) + 1, Math.floor(w / 2) - 2, Math.floor(h / 4), '#f4f8ff');
    else { P.px(4, h, '#6c8f4a'); P.px(5, h + 1, '#6c8f4a'); }
  } else if (kind === 'stump') {
    P = new Painter(w + 4, h + 6); ax = 2; ay = 4;
    P.rect(2, 6, w, h - 2, '#6b4423'); P.ellipse(Math.floor(w / 2) + 2, 6, Math.floor(w / 2), 3, '#c99a5c'); P.ellipse(Math.floor(w / 2) + 2, 6, 2, 1, '#9b6b3a');
  } else if (kind === 'snowman') {
    P = new Painter(16, 26); ax = 8 - w / 2; ay = 26 - h - 1;
    P.disc(8, 18, 6, '#f4f8ff'); P.disc(8, 9, 4, '#f4f8ff'); P.disc(8, 3, 3, '#f4f8ff');
    P.px(7, 2, OUT); P.px(9, 2, OUT); P.px(8, 3, '#ff8a1e'); P.px(9, 3, '#ff8a1e'); P.rect(5, 6, 7, 1, '#d33b3b'); P.rect(9, 7, 2, 2, '#d33b3b');
    P.px(8, 9, OUT); P.px(8, 11, OUT); P.rect(0, 9, 4, 1, '#6b4423'); P.rect(12, 8, 4, 1, '#6b4423');
    P.ellipse(9, 20, 4, 3, '#dbe7f2');
  } else if (kind === 'house') {
    const roofs = [['#b8433a', '#8e3029'], ['#3f6fb5', '#2c5089'], ['#4a8a4a', '#336a33']][o.roof || 0];
    P = new Painter(w + 2, h + 16); ax = 1; ay = 15;
    const wallTop = 15 + Math.floor(h * 0.45);
    P.rect(1, wallTop, w, h - (wallTop - 15), '#e6d3a8');
    for (let y = wallTop + 3; y < 15 + h; y += 4) P.rect(1, y, w, 1, '#cdb88a');
    P.rect(1, wallTop - 1, w, 1, '#8b5a2b');
    for (let j = 0; j < wallTop - 1; j++) { const inset = Math.max(0, 4 - j); P.rect(1 + inset - 1, j, w - inset * 2 + 2, 1, j % 4 === 3 ? roofs[1] : roofs[0]); }
    for (let x = 4; x < w - 2; x += 6) for (let j = 2; j < wallTop - 2; j += 4) P.px(x + (j % 8 ? 3 : 0), j, roofs[1]);
    P.rect(w - 12, 0, 5, 7, '#8a7f6a'); P.rect(w - 12, 0, 5, 1, '#5e5546');
    const dx = Math.floor(w / 2) - 3; P.rect(dx, 15 + h - 11, 7, 11, '#7a4b25'); P.rect(dx + 1, 15 + h - 10, 5, 10, '#9b6b3a'); P.px(dx + 5, 15 + h - 5, gold());
    for (const wx of [5, w - 12]) { P.rect(wx, wallTop + 4, 7, 6, '#5a3a1e'); P.rect(wx + 1, wallTop + 5, 5, 4, '#9fd6ff'); P.px(wx + 1, wallTop + 5, '#ffffff'); P.rect(wx, wallTop + 10, 7, 1, '#7a4b25'); P.px(wx + 1, wallTop + 9, '#e04a6a'); P.px(wx + 4, wallTop + 9, '#ffd84a'); }
  } else if (kind === 'stall') {
    P = new Painter(w + 2, h + 14); ax = 1; ay = 13;
    P.rect(1, 13 + Math.floor(h / 3), w, h - Math.floor(h / 3), '#9b6b3a'); P.rect(1, 13 + Math.floor(h / 3), w, 2, '#7a5129');
    for (let i = 0; i < w; i += 4) P.rect(1 + i, 0, 2, 12, '#d33b3b'), P.rect(3 + i, 0, 2, 12, '#f4f0e6');
    P.rect(1, 12, w, 1, '#8e3029');
    for (let i = 0; i < 5; i++) P.disc(5 + i * 5, 13 + Math.floor(h / 3) + 4, 1, ['#e04a3a', '#ffb347', '#7cc25a', '#ffd84a', '#c96bd8'][i]);
  } else if (kind === 'barrels') {
    P = new Painter(w + 2, h + 6); ax = 1; ay = 5;
    for (const bx of [1, Math.floor(w / 2)]) { P.rect(bx, 5, Math.floor(w / 2) - 1, h, '#8b5a2b'); P.rect(bx, 7, Math.floor(w / 2) - 1, 1, '#5e5546'); P.rect(bx, 5 + h - 3, Math.floor(w / 2) - 1, 1, '#5e5546'); P.ellipse(bx + Math.floor(w / 4) - 1, 5, Math.floor(w / 4) - 1, 2, '#b07a45'); }
  } else if (kind === 'dwall') {
    P = new Painter(w, h + 8); ax = 0; ay = 0;
    const face = 7, top = '#8a8796', topL = '#a3a0ae', front = '#55525f', frontD = '#3f3c48';
    P.rect(0, 0, w, h, top);
    for (let y = 0; y < h; y += 5) for (let x = (y / 5) % 2 ? 0 : 5; x < w; x += 10) { P.rect(x, y, 9, 4, topL); }
    P.rect(0, h, w, face, front);
    for (let x = 0; x < w; x += 6) P.rect(x, h + 3, 1, 3, frontD);
    P.rect(0, h + 2, w, 1, frontD);
    for (let i = 0; i < (w + h) / 18; i++) P.px(Math.floor(Math.random() * w), h + Math.floor(Math.random() * face), '#4f7a3a');
  } else if (kind === 'dpillar') {
    P = new Painter(w + 2, h + 14); ax = 1; ay = 12;
    P.rect(1, 12 + 4, w, h - 4, '#6b6878'); P.rect(3, 4, w - 4, h + 8, '#8a8796'); P.rect(4, 4, 2, h + 8, '#a3a0ae');
    P.rect(1, 2, w, 4, '#a3a0ae'); P.rect(1, 12 + h - 3, w, 3, '#55525f');
  }
  if (!P) return null;
  return { c: P.outline().canvas(), ax, ay };
}
function gold() { return '#f2c94c'; }

// ---------- La carte (dessinée une seule fois) ----------
let mapLayer = null, topLayer = null;
function buildMapLayers(map) {
  const M = Monde;
  const AW = Math.ceil(map.W / PX), AH = Math.ceil(map.H / PX);
  const ground = document.createElement('canvas'); ground.width = AW; ground.height = AH;
  const g = ground.getContext('2d');
  const img = g.createImageData(AW, AH), data = img.data;
  const set = (i, hex) => { const c = rgb(hex); data[i * 4] = c[0]; data[i * 4 + 1] = c[1]; data[i * 4 + 2] = c[2]; data[i * 4 + 3] = 255; };
  const PAL = {
    neige: ['#e9f1f8', '#dbe7f2', '#f7fbff', '#c3d5e6'],
    foret: ['#3f8a3c', '#367a34', '#4a9844', '#2c6a2e'],
    marais: ['#5f6e3c', '#536234', '#6c7b46', '#465429'],
    desert: ['#e9c77f', '#dcb76d', '#f2d494', '#c9a25a'],
    village: ['#6fb550', '#62a646', '#7cc35b', '#558f3c'],
    donjon: ['#6d6a72', '#5f5c65', '#7c7982', '#514e57'],
  };
  const rY = [], rH = [];
  for (let i = 0; i < AW; i++) { const x = i * PX + 1.5; rY[i] = M.riverY(x); rH[i] = M.riverHalf(x); }
  const D = M.DONJON, PL = M.PLAZA;
  for (let j = 0; j < AH; j++) for (let i = 0; i < AW; i++) {
    const x = i * PX + 1.5, y = j * PX + 1.5, k = j * AW + i;
    const hsh = M.hash(i, j);
    // bordure de la carte : forêt dense
    const edge = Math.min(x, y, map.W - x, map.H - y) + (M.noise(x * 0.05, y * 0.05) - 0.5) * 20;
    if (edge < 22) { set(k, hsh < 0.3 ? '#173d1d' : hsh < 0.6 ? '#1f4d22' : '#24572a'); continue; }
    // rivière
    const dy = Math.abs(y - rY[i]), half = rH[i];
    if (dy < half + 7) {
      if (dy >= half + 3) { set(k, '#6b4a2b'); continue; }
      if (dy >= half) { set(k, '#8b6a3e'); continue; }
      if (dy > half - 5) { set(k, hsh < 0.5 ? '#bfe3ff' : '#8cc8f2'); continue; }
      const deep = dy < half * 0.45;
      set(k, (M.noise(x * 0.02, y * 0.08) > 0.72) ? '#5aa6e8' : deep ? '#2f6db8' : '#3d84cf');
      continue;
    }
    // étangs (eau ou glace)
    const pond = M.pondAt(x, y);
    if (pond) {
      const r = Math.hypot(x - pond.x, y - pond.y) / pond.r;
      if (pond.type === 'ice') set(k, r > 0.95 ? '#9fc6e0' : (M.noise(x * 0.03, y * 0.01) > 0.68 ? '#ffffff' : hsh < 0.1 ? '#d6ecfa' : '#bfe0f5'));
      else set(k, r > 0.95 ? '#bfe3ff' : r > 0.88 ? '#5aa6e8' : '#3d84cf');
      continue;
    }
    // intérieur du donjon : dalles sombres
    if (x > D.x && x < D.x + D.w && y > D.y && y < D.y + D.h) {
      const tx = Math.floor((x - D.x) / 24), ty = Math.floor((y - D.y) / 24), lx = (x - D.x) % 24, ly = (y - D.y) % 24;
      if (lx < PX || ly < PX) { set(k, '#2e2c36'); continue; }
      const v = M.hash(tx, ty);
      set(k, v < 0.33 ? '#4a4754' : v < 0.66 ? '#53505e' : '#44414d');
      if (hsh < 0.02) set(k, '#3a3844');
      continue;
    }
    // place du village : pavés
    const dp = Math.hypot(x - PL.x, y - PL.y);
    if (dp < PL.r) {
      if (dp > PL.r - 6) { set(k, '#8a8070'); continue; }
      const ang = Math.atan2(y - PL.y, x - PL.x), ring = Math.floor(dp / 21), seg = Math.floor(ang * (ring + 2) * 1.6);
      const lr = dp % 21;
      if (lr < PX) { set(k, '#9a9080'); continue; }
      const v = M.hash(ring, seg);
      set(k, v < 0.3 ? '#cfc6b4' : v < 0.7 ? '#c2b9a6' : '#d9d1c0');
      continue;
    }
    // sentiers
    const pd = M.pathDist(x, y);
    const reg = M.regionAt(x, y);
    if (pd < 30) {
      const snow = reg === 'neige', sand = reg === 'desert';
      if (pd > 25) set(k, snow ? '#b9cddd' : sand ? '#c49a5c' : '#9b7b4a');
      else set(k, snow ? (hsh < 0.5 ? '#d2e0ec' : '#c7d8e7') : sand ? (hsh < 0.5 ? '#d9b36a' : '#cfa95f') : hsh < 0.08 ? '#a8844e' : hsh < 0.55 ? '#c9a66b' : '#bf9a5f');
      continue;
    }
    // sol de la région
    const pal = PAL[reg];
    let c;
    const patch = M.noise(x * 0.012, y * 0.012);
    c = patch > 0.62 ? pal[1] : patch < 0.3 ? pal[2] : pal[0];
    if (hsh < 0.04) c = pal[3];
    if (reg === 'marais' && M.isMud(x, y)) c = hsh < 0.1 ? '#6d6538' : M.noise(x * 0.05, y * 0.05) > 0.7 ? '#4a4424' : '#57502c';
    if (reg === 'desert' && Math.sin(x * 0.02 + y * 0.06 + M.noise(x * 0.004, y * 0.004) * 8) > 0.93) c = pal[3];
    if (reg === 'neige' && hsh > 0.985) c = '#a9c2d8';
    set(k, c);
  }
  g.putImageData(img, 0, 0);

  const top = document.createElement('canvas'); top.width = AW; top.height = AH;
  const t = top.getContext('2d');
  g.imageSmoothingEnabled = false; t.imageSmoothingEnabled = false;
  let seed = 11;
  const R = (a, b) => { seed = (seed * 16807) % 2147483647; return a + (seed / 2147483647) * (b - a); };
  const dot = (x, y, c) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), 1, 1); };

  // petits décors (sans collision)
  for (let n = 0; n < 2600; n++) {
    const ax = Math.floor(R(8, AW - 8)), ay = Math.floor(R(8, AH - 8)), x = ax * PX, y = ay * PX;
    const reg = M.regionAt(x, y);
    if (M.isWater(x, y) || M.inRiver(x, y) || M.pondAt(x, y) || M.pathDist(x, y) < 34 || Math.hypot(x - PL.x, y - PL.y) < PL.r + 6) continue;
    if (x > D.x && x < D.x + D.w && y > D.y && y < D.y + D.h) { if (R(0, 1) < 0.15) { dot(ax, ay, '#6b6878'); dot(ax + 1, ay, '#6b6878'); } continue; }
    const r = R(0, 1);
    if (reg === 'foret' || reg === 'village') {
      if (r < 0.45) { const c = reg === 'foret' ? '#2c6a2e' : '#4f8f3a'; dot(ax, ay, c); dot(ax + 2, ay, c); dot(ax + 1, ay - 1, c); }
      else if (r < 0.8) { const c = ['#fff3a8', '#ffd1e8', '#ffffff', '#c9b8ff', '#ff9a7a'][Math.floor(R(0, 5))]; dot(ax, ay - 1, c); dot(ax - 1, ay, c); dot(ax + 1, ay, c); dot(ax, ay + 1, c); dot(ax, ay, '#f2b632'); }
      else if (reg === 'foret') { g.fillStyle = '#efe3cf'; g.fillRect(ax, ay, 1, 2); g.fillStyle = '#d84a3a'; g.fillRect(ax - 1, ay - 1, 3, 1); }
    } else if (reg === 'neige') {
      if (r < 0.5) { dot(ax, ay, '#c3d5e6'); dot(ax + 1, ay, '#ffffff'); }
      else if (r < 0.6) { dot(ax, ay, '#9fc6e0'); dot(ax, ay - 1, '#d6ecfa'); dot(ax, ay - 2, '#9fc6e0'); }
    } else if (reg === 'desert') {
      if (r < 0.4) { dot(ax, ay, '#b08a4a'); dot(ax + 1, ay, '#c9a25a'); }
      else if (r < 0.46) { g.fillStyle = '#f4f0e6'; g.fillRect(ax, ay, 3, 2); dot(ax, ay + 2, '#f4f0e6'); dot(ax + 2, ay + 2, '#f4f0e6'); dot(ax + 1, ay + 1, OUT); }
      else if (r < 0.5) { dot(ax, ay, '#5a8a3a'); dot(ax + 1, ay - 1, '#5a8a3a'); dot(ax - 1, ay - 1, '#5a8a3a'); }
    } else if (reg === 'marais') {
      if (r < 0.5) { g.fillStyle = '#4f6a2a'; g.fillRect(ax, ay - 3, 1, 4); g.fillStyle = '#6b4423'; g.fillRect(ax, ay - 5, 1, 2); }
      else if (r < 0.7) { dot(ax, ay, '#46542a'); dot(ax + 1, ay + 1, '#46542a'); }
    } else if (reg === 'donjon') {
      if (r < 0.5) { dot(ax, ay, '#8a8796'); dot(ax + 1, ay, '#55525f'); }
      else if (r < 0.55) { g.fillStyle = '#f4f0e6'; g.fillRect(ax, ay, 2, 2); dot(ax, ay + 2, OUT); }
    }
  }
  // nénuphars sur les étangs et la rivière
  for (let n = 0; n < 160; n++) {
    const ax = Math.floor(R(8, AW - 8)), ay = Math.floor(R(8, AH - 8)), x = ax * PX, y = ay * PX;
    if (!M.isWater(x, y) || M.onBridge(x, y)) continue;
    if (M.inRiver(x, y) && Math.abs(y - M.riverY(x)) > M.riverHalf(x) - 12) continue;
    g.fillStyle = '#3d9a4a'; g.fillRect(ax - 1, ay, 4, 2); g.fillRect(ax, ay - 1, 2, 4);
    if (R(0, 1) < 0.35) dot(ax + 1, ay, '#f7a8d0');
  }
  // ponts
  for (const b of M.BRIDGES) {
    const x0 = Math.round(b.x / PX), w = Math.round(b.w / PX);
    for (let ay = Math.round(b.y / PX); ay < Math.round((b.y + b.h) / PX); ay++) {
      const y = ay * PX, cx = b.x + b.w / 2;
      if (Math.abs(y - M.riverY(cx)) > M.riverHalf(cx) + 12) continue;
      g.fillStyle = (ay % 4 === 0) ? '#7a5129' : '#a8743f'; g.fillRect(x0, ay, w, 1);
      if (ay % 4 === 1) { g.fillStyle = '#c08a52'; g.fillRect(x0 + 2, ay, w - 4, 1); }
      g.fillStyle = '#5a3a1e'; g.fillRect(x0 - 2, ay, 2, 1); g.fillRect(x0 + w, ay, 2, 1);
      if (ay % 10 === 0) { g.fillStyle = OUT; g.fillRect(x0 - 3, ay, 4, 2); g.fillRect(x0 + w - 1, ay, 4, 2); }
    }
  }
  // fontaine (bassin de pierre)
  {
    const F = map.fountain, P = new Painter(40, 34), cx = 20, cy = 18;
    P.ellipse(cx, cy, 17, 12, '#cfc6b3'); P.ellipse(cx, cy, 14, 9, '#a69c86'); P.ellipse(cx, cy - 1, 13, 8, '#3d9ad6'); P.ellipse(cx - 3, cy - 3, 5, 2, '#9be8ff');
    P.rect(cx - 2, cy - 12, 4, 11, '#cfc6b3'); P.rect(cx - 1, cy - 12, 1, 11, '#e8e0cf'); P.ellipse(cx, cy - 13, 4, 2, '#e8e0cf');
    const c = P.outline().canvas();
    g.drawImage(c, Math.round(F.x / PX) - cx, Math.round(F.y / PX) - cy);
  }
  // obstacles : la partie au-dessus du rectangle de collision va dans la couche du dessus (les joueurs passent derrière)
  const sorted = [...map.walls].sort((a, b) => (a.y + a.h) - (b.y + b.h));
  for (const o of sorted) {
    const s = spriteFor(o);
    if (!s) continue;
    const sx = Math.round(o.x / PX - s.ax), sy = Math.round(o.y / PX - s.ay);
    // ombre
    g.fillStyle = '#00000030';
    g.beginPath(); g.ellipse(Math.round((o.x + o.w / 2) / PX), Math.round((o.y + o.h) / PX), Math.round(o.w / PX / 2) + 2, 3, 0, 0, 7); g.fill();
    const split = Math.max(0, Math.min(s.c.height, Math.round(s.ay)));
    if (split > 0) t.drawImage(s.c, 0, 0, s.c.width, split, sx, sy, s.c.width, split);
    g.drawImage(s.c, 0, split, s.c.width, s.c.height - split, sx, sy + split, s.c.width, s.c.height - split);
  }
  // buissons (cachettes) : dessus, pour couvrir à moitié les joueurs cachés
  for (const b of map.bushes) {
    const r = Math.round(b.r / PX), P = new Painter(r * 2 + 6, r * 2 + 6), c = r + 3;
    const snow = b.region === 'neige', dark = b.region === 'marais';
    const base = dark ? '#3f5a2a' : '#2f6e2b', mid = dark ? '#4f6d33' : '#3f8d37', hi = dark ? '#6a8a44' : '#5aac4b';
    for (let i = 0; i < 7; i++) { const a = i * 0.9; P.disc(c + Math.round(Math.cos(a) * r * 0.45), c + Math.round(Math.sin(a) * r * 0.35), Math.round(r * 0.55), base); }
    P.disc(c - 2, c - 3, Math.round(r * 0.5), mid); P.disc(c - 4, c - 5, Math.round(r * 0.22), hi);
    if (snow) { P.ellipse(c, c - Math.round(r * 0.45), Math.round(r * 0.75), Math.round(r * 0.25), '#f4f8ff'); }
    else for (let i = 0; i < 6; i++) P.px(c + Math.round(Math.cos(i * 2.1) * r * 0.55), c + Math.round(Math.sin(i * 2.1) * r * 0.4), '#d9334a');
    t.globalAlpha = 0.92;
    t.drawImage(P.outline().canvas(), Math.round(b.x / PX) - c, Math.round(b.y / PX) - c);
    t.globalAlpha = 1;
  }
  mapLayer = ground; topLayer = top;
}

// ---------- Rendu d'une image ----------
// mine = mon joueur (élève) ou null (vue enseignant : voit tout le monde)
function drawWorld(ctx, world, map, mine, disp, heroScale = PX) {
  if (!mapLayer) buildMapLayers(map);
  const big = heroScale > PX;   // vue enseignant : carte réduite, on lisse pour qu'elle reste jolie
  ctx.imageSmoothingEnabled = big;
  ctx.drawImage(mapLayer, 0, 0, mapLayer.width * PX, mapLayer.height * PX);
  const now = performance.now() / 1000;
  const md = mine && (disp.get(mine.id) || mine);
  const sq = (x, y, s, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x / PX) * PX, Math.round(y / PX) * PX, s * PX, s * PX); };

  // reflets animés sur la rivière, fontaine, torches du donjon
  for (let k = 0; k < 70; k++) {
    const x = ((k * 211 + now * 30) % map.W), y = Monde.riverY(x) + Math.sin(k * 3.7) * Monde.riverHalf(x) * 0.6;
    if (!Monde.onBridge(x, y)) { sq(x, y, 3, '#ffffff66'); }
  }
  const F = map.fountain;
  for (let k = 0; k < 8; k++) {
    const t = (now * 0.9 + k / 8) % 1, a = k / 8 * Math.PI * 2;
    sq(F.x + Math.cos(a) * (6 + t * 30), F.y - 30 + Math.sin(a) * (4 + t * 16) - Math.sin(t * Math.PI) * 24 + t * 30, 1, t < 0.7 ? '#e8fbff' : '#9be8ff');
  }
  for (const o of map.walls) {
    if (o.kind !== 'dpillar') continue;
    const cx = o.x + o.w / 2, cy = o.y - 30, f = Math.sin(now * 12 + cx) > 0 ? 1 : 0;
    ctx.fillStyle = '#ffb34722'; ctx.beginPath(); ctx.arc(cx, cy + 20, 90, 0, 7); ctx.fill();
    sq(cx - 4, cy - f * 3, 3, '#ff8a1e'); sq(cx - 1, cy - 4 - f * 3, 1, '#ffe27a'); sq(cx - 4, cy + 6, 3, '#5a3a1e');
  }

  // effets
  for (const f of world.fx) {
    const t = f.t / f.d;
    ctx.save(); ctx.globalAlpha = Math.max(0, Math.min(1, t * 1.5));
    if (f.k === 'slash') {
      for (let i = 0; i <= 8; i++) { const a = f.a - f.arc / 2 + f.arc * i / 8; sq(f.x + Math.cos(a) * f.r, f.y + Math.sin(a) * f.r, 2, '#ffffff'); }
    } else if (f.k === 'boom') {
      const r = f.r * (1.1 - t * 0.6);
      for (let i = 0; i < 28; i++) { const a = i / 28 * Math.PI * 2; sq(f.x + Math.cos(a) * r, f.y + Math.sin(a) * r, 3, i % 2 ? '#ff8a1e' : '#ffe27a'); sq(f.x + Math.cos(a + 0.1) * r * 0.6, f.y + Math.sin(a + 0.1) * r * 0.6, 2, '#ff4a1a'); }
    } else if (f.k === 'hit') {
      sq(f.x - 9, f.y - 30, 2, '#ffffff'); sq(f.x + 6, f.y - 20, 2, '#ffffff'); sq(f.x - 3, f.y - 12, 2, '#ffe27a');
    } else if (f.k === 'death') {
      for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + now * 3; sq(f.x + Math.cos(a) * 26, f.y - 30 + Math.sin(a) * 10 - (1 - t) * 20, 2, '#ffe27a'); }
    } else if (f.k === 'spawn') {
      const r = 70 * (1 - t) + 20;
      for (let i = 0; i < 20; i++) { const a = i / 20 * Math.PI * 2; sq(f.x + Math.cos(a) * r, f.y + 10 + Math.sin(a) * r * 0.5, 2, '#ffe36b'); }
    } else if (f.k === 'smoke') {
      for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; sq(f.x + Math.cos(a) * (20 + 30 * (1 - t)), f.y + Math.sin(a) * (14 + 20 * (1 - t)), 4, '#6b6878'); }
    } else if (f.k === 'crit') {
      ctx.font = '22px "Pixelify Sans", monospace'; ctx.textAlign = 'center'; ctx.lineWidth = 5; ctx.strokeStyle = OUT;
      ctx.strokeText(f.txt, f.x, f.y - 40 - (1 - t) * 30); ctx.fillStyle = '#ffd54a'; ctx.fillText(f.txt, f.x, f.y - 40 - (1 - t) * 30);
    }
    ctx.restore();
  }
  // projectiles
  for (const [x, y, c, a] of world.b) {
    if (c === 'mage') {
      sq(x - 6, y - 6, 4, '#ff4a1a'); sq(x - 3, y - 3, 2, '#ffe27a');
      sq(x - Math.cos(a) * 14, y - Math.sin(a) * 14, 2, '#ff8a1e'); sq(x - Math.cos(a) * 24, y - Math.sin(a) * 24, 1, '#ffb347');
    } else {
      for (let i = 0; i < 7; i++) sq(x - Math.cos(a) * i * 3.2, y - Math.sin(a) * i * 3.2, 1, i === 0 ? '#e6ebf2' : i > 5 ? '#e04a3a' : '#7a4b25');
    }
  }
  // joueurs (du haut vers le bas)
  const list = world.p.filter(p => p.al).sort((p, q) => p.y - q.y);
  for (const p of list) {
    const d = disp.get(p.id) || p;
    if (d.lx === undefined) { d.lx = d.x; d.ly = d.y; d.ph = 0; }
    if (Math.hypot(d.x - d.lx, d.y - d.ly) > 0.4) d.ph = (d.ph || 0) + 0.12; else d.ph = 0;
    d.lx = d.x; d.ly = d.y;
    const isMe = mine && p.id === mine.id;
    let alpha = 1;
    if (p.hd || p.inv) {
      if (isMe || !mine) alpha = 0.5;
      else if (md && Math.hypot(md.x - d.x, md.y - d.y) < (p.inv ? 80 : 130)) alpha = 0.35;
      else continue;
    }
    ctx.save();
    ctx.globalAlpha = alpha * (p.pr && Math.floor(now * 8) % 2 ? 0.35 : 1);
    // ombre et marqueur au sol
    ctx.fillStyle = '#00000044'; ctx.fillRect(Math.round(d.x) - 15, Math.round(d.y) + 18, 30, 6);
    if (isMe) { sq(d.x - 3, d.y + 30, 2, '#ffd54a'); }
    else { ctx.fillStyle = CLS[p.c].color; ctx.fillRect(Math.round(d.x) - 15, Math.round(d.y) + 24, 30, 3); }
    drawHeroSprite(ctx, d.x, d.y, p.c, p.l || 'm00', p.a, d.ph, heroScale);
    if (p.sh) {
      ctx.globalAlpha = alpha * 0.8;
      for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2 + now * 2; sq(d.x + Math.cos(a) * 36, d.y - 10 + Math.sin(a) * 40, 2, '#7fd3ff'); }
    }
    ctx.restore();
  }
  // couche du dessus : feuillages, toits, buissons
  ctx.imageSmoothingEnabled = big;
  ctx.drawImage(topLayer, 0, 0, topLayer.width * PX, topLayer.height * PX);
  // noms et barres de vie par-dessus tout
  ctx.font = `${big ? 46 : 15}px "Pixelify Sans", monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  for (const p of list) {
    const d = disp.get(p.id) || p;
    const isMe = mine && p.id === mine.id;
    if ((p.hd || p.inv) && !isMe && mine && !(md && Math.hypot(md.x - d.x, md.y - d.y) < (p.inv ? 80 : 130))) continue;
    const ny = Math.round(d.y + 22 - (p.c === 'mage' ? 31 : 28) * heroScale);
    ctx.lineWidth = big ? 9 : 4; ctx.strokeStyle = OUT; ctx.strokeText(p.n, d.x, ny);
    ctx.fillStyle = isMe ? '#ffd54a' : '#ffffff'; ctx.fillText(p.n, d.x, ny);
    const bw = big ? 110 : 36, r = p.hp / p.m;
    ctx.fillStyle = OUT; ctx.fillRect(Math.round(d.x - bw / 2) - 3, ny + 6, bw + 6, big ? 20 : 8);
    ctx.fillStyle = '#3a2a3a'; ctx.fillRect(Math.round(d.x - bw / 2), ny + 9, bw, big ? 14 : 3);
    ctx.fillStyle = r > 0.5 ? '#5ad65a' : r > 0.25 ? '#ffcc00' : '#ff3b30';
    ctx.fillRect(Math.round(d.x - bw / 2), ny + 9, Math.round(bw * r / 3) * 3, big ? 14 : 3);
  }
}

// Mini-carte (vue élève)
function drawMinimap(ctx, world, map, mine, x, y, w) {
  const s = w / map.W, h = map.H * s;
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.fillStyle = OUT; ctx.fillRect(x - 4, y - 4, w + 8, h + 8);
  ctx.drawImage(mapLayer, x, y, w, h);
  ctx.drawImage(topLayer, x, y, w, h);
  for (const p of world.p) {
    if (!p.al || (mine && p.id === mine.id) || p.hd || p.inv) continue;
    ctx.fillStyle = '#ffffff'; ctx.fillRect(Math.round(x + p.x * s) - 1, Math.round(y + p.y * s) - 1, 3, 3);
  }
  if (mine && mine.al) {
    ctx.fillStyle = OUT; ctx.fillRect(Math.round(x + mine.x * s) - 4, Math.round(y + mine.y * s) - 4, 8, 8);
    ctx.fillStyle = '#ffd54a'; ctx.fillRect(Math.round(x + mine.x * s) - 3, Math.round(y + mine.y * s) - 3, 6, 6);
  }
  ctx.restore();
}
