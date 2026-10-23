// Dessin en pixel art de l'arène et des héros, partagé entre la vue élève et la vue enseignant.
// 1 pixel d'art = 3 unités du monde. Tout est dessiné par le code (aucune image externe).
const PX = 3;
const OUT = '#1b1424';   // couleur des contours

const CLS = {
  guerrier: { nom: ['Guerrière', 'Guerrier'], ico: '⚔️', color: '#3a6fd8', desc: 'Très résistant. Épée et bouclier, au corps à corps.', pow: '🛡️ Bouclier : réduit les dégâts pendant 3 s', dash: '💨 Charge : fonce et bouscule' },
  voleur:   { nom: ['Voleuse', 'Voleur'],     ico: '🗡️', color: '#d64545', desc: 'Rapide, corps à corps. Dégâts doublés en frappant dans le dos !', pow: '👤 Ombre : invisible 4 s, prochaine attaque +50 %', dash: '🌀 Roulade : esquive, invincible un instant' },
  mage:     { nom: ['Mage', 'Mage'],          ico: '🔮', color: '#8e4ce0', desc: 'Fragile mais puissant. Lance des boules de feu.', pow: '💥 Explosion : dégâts tout autour', dash: '✨ Téléportation : 3 cases plus loin' },
  archer:   { nom: ['Archère', 'Archer'],     ico: '🏹', color: '#2f9e55', desc: 'Rapide. Tire des flèches de loin.', pow: '🌧️ Pluie de flèches : 7 flèches en éventail', dash: '🦘 Saut arrière : recule en tirant' },
};
const SKIN = ['#f7d3b0', '#dca274', '#a8693d', '#6b3f22'];
const HAIR = ['#2a1c14', '#7a4422', '#e8b84a', '#c2482e'];
const nomClasse = (c, look) => CLS[c].nom[look && look[0] === 'f' ? 0 : 1];
// Personnalisation : couleur de la tenue, accessoire, familier (caractères 4, 5 et 6 du look)
const OUTFIT = [null, '#d33b3b', '#3a6fd8', '#2f9e55', '#8e4ce0', '#e89a2a', '#e06aa8'];
const OUTFIT_NOMS = ['Classique', 'Rouge', 'Bleu', 'Vert', 'Violet', 'Orange', 'Rose'];
const ACCESSOIRES = ['Aucun', 'Cape', 'Lunettes', 'Écharpe'];
const FAMILIERS = ['Aucun', '🐱 Chat', '🐶 Chien', '🐲 Dragon', '🦉 Hibou', '🟢 Slime'];
const PET_ICO = [null, '😺', '🐶', '🔥', '🦉', '🟢'];
// Équipement : niveaux bronze, argent, or
const TIER_C = [null, '#cd7f32', '#dfe5ee', '#f2c94c'];
const TIER_NOMS = ['', 'bronze', 'argent', 'or'];
const GEAR_ORDRE = ['casque', 'armure', 'epee', 'bottes'];
const gearOf = code => ({ casque: code & 3, armure: (code >> 2) & 3, epee: (code >> 4) & 3, bottes: (code >> 6) & 3 });

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
  w.pz = w.pz || [];
  w.p = w.p.map(([id, n, c, l, x, y, a, hp, m, k, f, tm, g]) => ({ id, n, c, l, x, y, a, hp, m, k, tm, g: g || 0, al: !!(f & 1), sh: !!(f & 2), pr: !!(f & 4), hd: !!(f & 8), inv: !!(f & 16), st: !!(f & 32), fa: !!(f & 64), bz: !!(f & 128), dz: !!(f & 256), lz: !!(f & 512), sl: !!(f & 1024) }));
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
function heroSprite(cls, look, dir, frame, gearCode = 0) {
  const key = cls + look + dir + frame + 'g' + gearCode;
  if (heroCache[key]) return heroCache[key];
  const P = new Painter(24, 30); P.ox = 4; P.oy = 8;
  const fem = look[0] === 'f', s = SKIN[+look[1]] || SKIN[0], S = shade(s, 0.82), h = HAIR[+look[2]] || HAIR[0], Hd = shade(h, 0.7), Hl = shade(h, 1.35);
  const out = OUTFIT[+look[3] || 0], acc = +look[4] || 0, G = gearOf(gearCode);
  const E = '#1b1424', boots = G.bottes ? TIER_C[G.bottes] : '#4a3426';
  const C = {
    guerrier: { c: '#c9d1dc', d: '#8a94a3', a: '#3a6fd8', pants: '#5a5f6a' },
    voleur: { c: '#4a4f5a', d: '#33363e', a: '#c23b3b', pants: '#2f3238' },
    mage: { c: '#6a3fc1', d: '#4b2a8f', a: '#f2c94c', pants: '#4b2a8f' },
    archer: { c: '#2f8f4e', d: '#22683a', a: '#8b5a2b', pants: '#5a4030' },
  }[cls];
  // couleur de tenue choisie : le tabard du guerrier, le foulard du voleur, la robe du mage, la tunique de l'archer
  let hat = '#5a33a8', hatD = '#4b2a8f', cap = '#2f8f4e', capD = '#22683a';
  if (out) {
    if (cls === 'guerrier' || cls === 'voleur') C.a = out;
    else { C.c = out; C.d = shade(out, 0.72); if (cls === 'mage') { hat = shade(out, 0.85); hatD = shade(out, 0.68); C.pants = C.d; } else { cap = out; capD = shade(out, 0.72); } }
  }
  const metal = '#e6ebf2', metalD = '#9aa3b0', wood = '#7a4b25', gold = '#f2c94c', red = '#d33b3b';
  // équipement : lame, orbe et arc prennent la couleur de l'épée ; le casque du guerrier, celle du casque
  const blade = G.epee ? shade(TIER_C[G.epee], 1.15) : metal, orb = G.epee ? TIER_C[G.epee] : '#b98cff', bow = G.epee ? shade(TIER_C[G.epee], 0.8) : wood;
  const helm = G.casque ? TIER_C[G.casque] : metal, helmD = G.casque ? shade(TIER_C[G.casque], 0.7) : metalD;
  const capeC = out || '#c23b3b', scarf = out || '#e04a3a';
  const lA = frame === 1 ? -1 : 0, lB = frame === 2 ? -1 : 0;   // jambes qui bougent

  // cape (derrière tout, sauf de dos)
  if (acc === 1 && dir === 'down') { P.rect(3, 10, 10, 9, shade(capeC, 0.7)); }
  if (acc === 1 && dir === 'side') { P.rect(2, 10, 4, 8, capeC); P.rect(2, 17, 4, 1, shade(capeC, 0.7)); }

  // armes et objets derrière le corps
  if (dir === 'up') {
    if (cls === 'guerrier') { P.rect(2, 4, 1, 10, blade); P.px(2, 3, blade); P.rect(1, 14, 3, 1, gold); }
    if (cls === 'mage') { P.rect(2, 4, 1, 14, wood); P.rect(1, 1, 3, 3, orb); }
    if (cls === 'archer') { P.px(2, 8, bow); P.px(1, 9, bow); P.rect(0, 10, 1, 4, bow); P.px(1, 14, bow); P.px(2, 15, bow); }
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
  // armure trouvée : plastron aux couleurs du niveau
  if (G.armure) {
    const tc = TIER_C[G.armure], x0 = dir === 'side' ? 6 : 5, w0 = dir === 'side' ? 4 : 6;
    P.rect(x0, 11, w0, 3, tc); P.rect(x0, 11, w0, 1, shade(tc, 1.3)); P.rect(x0, 13, w0, 1, shade(tc, 0.75));
    if (dir !== 'up' && G.armure === 3) P.px(x0 + (w0 >> 1), 12, '#e04a5a');
  }
  if (acc === 3) {
    if (dir === 'side') { P.rect(5, 10, 6, 2, scarf); P.rect(3, 11, 2, 3, shade(scarf, 0.8)); }
    else { P.rect(4, 10, 8, 2, scarf); if (dir === 'down') P.rect(9, 12, 2, 3, shade(scarf, 0.8)); else P.rect(5, 12, 2, 3, shade(scarf, 0.8)); }
  }
  if (acc === 1 && dir === 'up') { P.rect(4, 10, 8, 9, capeC); P.rect(4, 18, 8, 1, shade(capeC, 0.7)); P.rect(6, 11, 1, 7, shade(capeC, 0.85)); P.rect(9, 11, 1, 7, shade(capeC, 0.85)); }
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

  // lunettes
  if (acc === 2) {
    const lens = '#bfe8ff', rim = '#3a2a2a';
    if (dir === 'down') { P.rect(5, 6, 2, 2, lens); P.rect(9, 6, 2, 2, lens); P.rect(4, 5, 8, 1, rim); P.px(6, 7, E); P.px(9, 7, E); }
    else if (dir === 'side') { P.rect(9, 6, 3, 2, lens); P.rect(6, 5, 6, 1, rim); P.px(10, 7, E); }
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
    if (dir === 'side') { P.rect(5, 1, 7, 4, helm); P.rect(6, 0, 5, 1, helm); P.rect(5, 4, 7, 1, helmD); P.rect(6, -3, 2, 3, red); P.px(5, -2, red); }
    else { P.rect(4, 1, 8, 4, helm); P.rect(5, 0, 6, 1, helm); P.rect(4, 4, 8, 1, helmD); P.rect(7, -3, 2, 3, red); P.px(9, -2, red); if (dir === 'down') P.rect(7, 5, 2, 1, helmD); if (dir === 'up') P.rect(4, 5, 8, 1, helmD); }
  } else if (cls === 'voleur') {
    const hood = '#2e3138';
    if (dir === 'up') { P.rect(3, 1, 10, 10, hood); P.rect(4, 0, 8, 1, hood); P.rect(4, 11, 8, 2, hood); if (fem) { for (let i = 0; i < 6; i++) P.px(7 + (i % 2), 11 + i, i % 2 ? Hd : h); } }
    else if (dir === 'side') { P.rect(4, 1, 8, 4, hood); P.rect(5, 0, 6, 1, hood); P.rect(4, 5, 3, 6, hood); P.rect(6, 9, 6, 2, C.a); if (fem) { for (let i = 0; i < 6; i++) P.px(3 + (i % 2), 8 + i, i % 2 ? Hd : h); } }
    else { P.rect(3, 1, 10, 4, hood); P.rect(4, 0, 8, 1, hood); P.rect(3, 5, 1, 6, hood); P.rect(12, 5, 1, 6, hood); P.rect(4, 8, 8, 2, C.a); if (fem) { P.rect(5, 5, 6, 1, h); for (let i = 0; i < 6; i++) P.px(13, 8 + i, i % 2 ? Hd : h); } }
  } else if (cls === 'mage') {
    if (dir === 'side') { P.rect(3, 2, 11, 1, hatD); P.rect(5, 0, 7, 2, hat); P.rect(5, -2, 5, 2, hat); P.rect(4, -4, 4, 2, hat); P.rect(3, -6, 3, 2, hat); P.px(2, -7, hat); P.rect(5, 1, 7, 1, gold); }
    else { P.rect(2, 2, 12, 1, hatD); P.rect(4, 0, 8, 2, hat); P.rect(5, -2, 6, 2, hat); P.rect(6, -4, 4, 2, hat); P.rect(7, -6, 2, 2, hat); P.px(9, -7, hat); P.rect(4, 1, 8, 1, gold); if (dir === 'down') P.px(8, -1, gold); }
  } else if (cls === 'archer') {
    if (dir === 'side') { P.rect(5, 1, 7, 2, cap); P.rect(6, 0, 5, 1, cap); P.rect(11, 3, 2, 1, capD); P.rect(4, -2, 1, 4, '#e04a3a'); P.px(3, -3, '#e04a3a'); }
    else { P.rect(4, 1, 8, 2, cap); P.rect(5, 0, 6, 1, cap); P.rect(4, 3, 8, 1, capD); P.rect(11, -3, 1, 4, '#e04a3a'); P.px(12, -4, '#e04a3a'); }
  }

  // casque trouvé (autres classes) : un bandeau de métal sur le front
  if (G.casque && cls !== 'guerrier') {
    const tc = TIER_C[G.casque];
    if (dir === 'side') { P.rect(5, 3, 7, 2, tc); P.rect(5, 4, 7, 1, shade(tc, 0.7)); }
    else { P.rect(4, 3, 8, 2, tc); P.rect(4, 4, 8, 1, shade(tc, 0.7)); if (dir === 'down') P.px(7, 3, G.casque === 3 ? '#e04a5a' : shade(tc, 1.3)); }
  }
  // armes devant
  if (dir === 'down') {
    if (cls === 'guerrier') { P.rect(13, 4, 1, 10, blade); P.px(13, 3, blade); P.rect(12, 14, 3, 1, gold); P.px(13, 15, '#6b4423'); P.rect(0, 11, 3, 6, C.a); P.rect(1, 12, 1, 4, gold); }
    if (cls === 'voleur') { P.rect(13, 11, 1, 4, blade); P.rect(12, 15, 3, 1, '#c9a227'); P.rect(2, 12, 1, 3, blade); }
    if (cls === 'mage') { P.rect(13, 4, 1, 14, wood); P.rect(12, 1, 3, 3, orb); P.px(13, 2, '#ffffff'); }
    if (cls === 'archer') { P.px(13, 8, bow); P.px(14, 9, bow); P.rect(15, 10, 1, 4, bow); P.px(14, 14, bow); P.px(13, 15, bow); P.rect(13, 9, 1, 6, '#e8e8e8'); }
  } else if (dir === 'up') {
    if (cls === 'guerrier') { P.rect(12, 11, 3, 6, C.a); P.rect(13, 12, 1, 4, gold); }
    if (cls === 'voleur') { P.rect(2, 11, 1, 4, blade); }
  } else {
    if (cls === 'guerrier') { P.rect(11, 13, 8, 1, blade); P.px(19, 13, blade); P.rect(10, 12, 1, 3, gold); }
    if (cls === 'voleur') { P.rect(11, 13, 4, 1, blade); P.rect(10, 12, 1, 3, '#c9a227'); }
    if (cls === 'mage') { P.rect(11, 4, 1, 14, wood); P.rect(10, 1, 3, 3, orb); P.px(11, 2, '#ffffff'); }
    if (cls === 'archer') { P.px(12, 8, bow); P.px(13, 9, bow); P.rect(14, 10, 1, 5, bow); P.px(13, 15, bow); P.px(12, 16, bow); P.rect(12, 9, 1, 7, '#e8e8e8'); P.rect(8, 12, 6, 1, '#5a3a1e'); P.px(14, 12, '#cccccc'); }
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
function drawHeroSprite(g, x, y, cls, look, angle, walk, S = PX, gear = 0) {
  const d = dirFromAngle(angle);
  const frame = walk ? 1 + (Math.floor(walk) % 2) : 0;
  const spr = heroSprite(cls, look, d === 'left' || d === 'right' ? 'side' : d, frame, gear);
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
  } else if (kind === 'pillar' || kind === 'pillarb') {
    const broken = kind === 'pillarb', top = broken ? 12 : 0;
    P = new Painter(w + 2, h + 18); ax = 1; ay = 17;
    const st = '#c3c7d0', sd = '#8d929e', sl = '#e1e4ea';
    P.rect(1, h + 12, w, 5, sd); P.rect(1, h + 11, w, 1, st);                     // socle
    P.rect(3, top + 4, w - 4, h + 8 - top, st);                                   // fût
    for (let x = 5; x < w - 2; x += 3) P.rect(x, top + 5, 1, h + 6 - top, '#a3a8b3');
    P.rect(3, top + 4, 1, h + 8 - top, sl);
    if (!broken) { P.rect(1, 0, w, 4, sl); P.rect(1, 3, w, 1, sd); }
    else { for (let x = 3; x < w - 1; x++) P.rect(x, top + 4 - ((x * 7) % 4), 1, (x * 7) % 4, st); P.rect(7, top + 8, 1, 4, sd); P.px(8, top + 12, sd); }
  } else if (kind === 'table') {
    P = new Painter(w + 2, h + 10); ax = 1; ay = 8;
    P.rect(1, 6, w, h - 2, '#b07a45'); P.rect(1, 6, w, 1, '#d09a60'); P.rect(1, h + 3, w, 2, '#7a4b25');
    P.rect(2, h + 5, 2, 3, '#6b4423'); P.rect(w - 3, h + 5, 2, 3, '#6b4423');
    P.rect(5, 1, 4, 6, '#d33b5b'); P.rect(6, 0, 2, 1, '#ffffff'); P.px(6, 2, '#ff9ab0');            // potion
    P.rect(13, 3, 7, 5, '#3f6fb5'); P.rect(14, 4, 5, 1, '#9fc3f0');                                 // livre
    if (w > 24) { P.rect(w - 7, 1, 3, 6, '#f2e6c8'); P.px(w - 6, 0, '#ffb347'); }                   // bougie
  } else if (kind === 'bed') {
    P = new Painter(w + 2, h + 6); ax = 1; ay = 4;
    P.rect(1, 2, w, h + 2, '#8b5a2b'); P.rect(2, 3, w - 2, 7, '#f4f0e6'); P.rect(2, 10, w - 2, h - 6, '#5a8ad8');
    P.rect(2, 10, w - 2, 1, '#8fb5f0'); for (let y = 13; y < h + 2; y += 4) P.rect(2, y, w - 2, 1, '#4a76c0');
  } else if (kind === 'shelf') {
    P = new Painter(w + 2, h + 18); ax = 1; ay = 17;
    P.rect(1, 1, w, h + 15, '#7a4b25'); P.rect(2, 2, w - 2, h + 13, '#5a3a1e');
    const books = ['#d33b3b', '#3f6fb5', '#4a9a4a', '#e8b84a', '#8e4ce0', '#e07a3a'];
    for (const y of [3, 10]) { for (let x = 3, i = y; x < w - 1; x += 2, i++) P.rect(x, y + (i % 3 === 0 ? 1 : 0), 2, 6 - (i % 3 === 0 ? 1 : 0), books[i % books.length]); P.rect(2, y + 6, w - 2, 1, '#7a4b25'); }
    P.rect(1, h + 15, w, 1, '#4a2e16');
  } else if (kind === 'crate') {
    P = new Painter(w + 2, h + 8); ax = 1; ay = 6;
    P.rect(1, 1, w, h + 5, '#b07a45'); P.rect(1, 1, w, 2, '#d09a60'); P.rect(1, h + 5, w, 1, '#7a4b25');
    P.rect(1, 1, 2, h + 5, '#8b5a2b'); P.rect(w - 1, 1, 2, h + 5, '#8b5a2b');
    for (let i = 0; i < w - 4; i++) { P.px(3 + i, 3 + Math.round(i * (h + 1) / (w - 4)), '#8b5a2b'); }
  } else if (kind === 'statue') {
    P = new Painter(w + 4, h + 30); ax = 2; ay = 28;
    const st = '#b7bcc6', sd = '#7f8592', sl = '#dde1e8';
    P.rect(2, h + 20, w, 8, sd); P.rect(2, h + 19, w, 2, st);
    P.rect(6, 14, w - 8, h + 6, st); P.rect(5, 18, w - 6, 6, st); P.disc(Math.floor(w / 2) + 2, 9, 4, st);
    P.rect(w - 1, 2, 2, h + 16, sd); P.rect(w - 2, 1, 4, 2, sl);                 // lance
    P.rect(6, 14, 1, h + 6, sl); P.px(Math.floor(w / 2) + 1, 8, sd);
  } else if (kind === 'brazier') {
    P = new Painter(w + 6, h + 18); ax = 3; ay = 16;
    P.rect(3 + Math.floor(w / 2) - 1, 10, 3, h + 6, '#55525f');
    P.rect(1, 6, w + 4, 5, '#6d6a7a'); P.rect(2, 10, w + 2, 1, '#45424f');
    P.rect(3, 2, w, 4, '#ff8a1e'); P.rect(5, 0, w - 4, 3, '#ffd25a'); P.px(4, 1, '#ff8a1e');
    P.rect(2, h + 14, w + 2, 2, '#45424f');
  } else if (kind === 'tomb') {
    P = new Painter(w + 2, h + 14); ax = 1; ay = 12;
    P.rect(3, 3, w - 4, h + 8, '#9aa0ab'); P.rect(5, 1, w - 8, 2, '#9aa0ab'); P.rect(3, 3, 1, h + 8, '#c3c7d0');
    P.rect(Math.floor(w / 2), 5, 2, 8, '#6d7380'); P.rect(Math.floor(w / 2) - 2, 7, 6, 2, '#6d7380');
    P.rect(1, h + 10, w, 2, '#6c8f4a');
  } else if (kind === 'well') {
    P = new Painter(w + 2, h + 18); ax = 1; ay = 16;
    P.ellipse(Math.floor(w / 2) + 1, h + 8, Math.floor(w / 2), Math.floor(h / 2) + 1, '#9aa0ab');
    P.ellipse(Math.floor(w / 2) + 1, h + 7, Math.floor(w / 2) - 3, Math.floor(h / 2) - 2, '#3d84cf');
    P.rect(2, 4, 2, h + 6, '#7a4b25'); P.rect(w - 2, 4, 2, h + 6, '#7a4b25');
    P.rect(0, 1, w + 2, 4, '#b8433a'); P.rect(1, 0, w, 1, '#d8634a');
  }
  if (!P) return null;
  return { c: P.outline().canvas(), ax, ay };
}
function gold() { return '#f2c94c'; }

// ---------- La carte (dessinée une seule fois, en tuiles de 16 pixels d'art) ----------
const WALLS_T = 'b#kcxgT', WATER_T = '~vL', NATURAL_T = '.hsnmd~=icT';
const THEMES = {
  village: { herbe: ['#68b36b', '#5ea763', '#76c177', '#4f9455'], falaise: ['#b86f3c', '#8a4a26', '#d68e52', '#6a3a1e'], arbres: ['#2f7a3f', '#3f9a4a', '#5cb860', '#215a2e'], fond: '#2f7a3f' },
  foret:   { herbe: ['#4f9a4f', '#468d47', '#5aa858', '#3a7a3d'], falaise: ['#a0623a', '#7a4524', '#c07f4c', '#5a3218'], arbres: ['#25603a', '#2f7a44', '#4f9a52', '#183f26'], fond: '#183f26' },
  desert:  { herbe: ['#8fb35a', '#82a650', '#9cc065', '#6f9445'], falaise: ['#c98f52', '#9e6a38', '#e2ad6e', '#7a4f28'], arbres: ['#3f7a3a', '#4f9a4a', '#6cb860', '#2a5a2e'], fond: '#9e6a38' },
  donjon:  { herbe: ['#5a5f6a', '#525763', '#646a75', '#454a55'], falaise: ['#6d6a7a', '#4a4757', '#8a8796', '#33313f'], arbres: ['#2f4a3a', '#3f5a4a', '#5a7a5a', '#1f3328'], fond: '#141019' },
  hiver:   { herbe: ['#eef4fa', '#e2ebf4', '#ffffff', '#c8d8e8'], falaise: ['#b8cde0', '#8aa3be', '#e4eff8', '#6a84a0'], arbres: ['#2f6a4a', '#3f8a5a', '#e8f2fa', '#1f4a35'], fond: '#8aa3be' },
  colisee: { herbe: ['#8fb35a', '#82a650', '#9cc065', '#6f9445'], falaise: ['#c9a36a', '#9e7c48', '#e2c08a', '#7a5e34'], arbres: ['#3f7a3a', '#4f9a4a', '#6cb860', '#2a5a2e'], fond: '#9e7c48' },
  marais:  { herbe: ['#6f8048', '#64743f', '#7d8f55', '#55653a'], falaise: ['#7a6a4a', '#5a4a32', '#9a8a62', '#3f3322'], arbres: ['#3f5a32', '#4f6d3a', '#6a8a4a', '#2a3f22'], fond: '#2a3f22' },
};
const HEAL_NOM = { fontaine: 'Fontaine de soin', source: 'Source de soin', autel: 'Autel de soin', feu: 'Feu de camp (soigne)' };

let mapLayer = null, topLayer = null, mapAnim = null;
function buildMapLayers(map) {
  const TH = THEMES[map.theme] || THEMES.village, TS = map.T / PX;   // 16 pixels d'art par tuile
  const AW = map.cols * TS, AH = map.rows * TS;
  const tile = (i, j) => (i < 0 || j < 0 || i >= map.cols || j >= map.rows ? (WALLS_T.includes(map.tiles[Math.max(0, Math.min(map.rows - 1, j))][Math.max(0, Math.min(map.cols - 1, i))]) ? map.tiles[Math.max(0, Math.min(map.rows - 1, j))][Math.max(0, Math.min(map.cols - 1, i))] : 'c') : map.tiles[j][i]);
  // bruit déterministe
  const hsh = (x, y, s = 0) => { let h = (x * 374761393 + y * 668265263 + s * 974711) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const noise = (x, y, s = 0) => {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const a = hsh(xi, yi, s), b = hsh(xi + 1, yi, s), c = hsh(xi, yi + 1, s), d = hsh(xi + 1, yi + 1, s);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };
  // 1) tuile visible pour chaque pixel : bords naturels ondulés, constructions bien droites
  const vt = new Array(AW * AH);
  for (let y = 0; y < AH; y++) for (let x = 0; x < AW; x++) {
    const raw = tile(Math.floor(x / TS), Math.floor(y / TS));
    let t = raw;
    if (NATURAL_T.includes(raw)) {
      const jx = (noise(x / 7, y / 7, 1) - 0.5) * 9, jy = (noise(x / 7, y / 7, 2) - 0.5) * 9;
      const s = tile(Math.floor((x + jx) / TS), Math.floor((y + jy) / TS));
      if (NATURAL_T.includes(s)) t = s;
    }
    vt[y * AW + x] = t;
  }
  const V = (x, y) => (x < 0 || y < 0 || x >= AW || y >= AH ? vt[Math.max(0, Math.min(AH - 1, y)) * AW + Math.max(0, Math.min(AW - 1, x))] : vt[y * AW + x]);
  const isW = t => t === '~';
  // cellules arrondies (eau, rochers, feuillages)
  function cells(x, y, size, s) {
    const cx = Math.floor(x / size), cy = Math.floor(y / size);
    let d1 = 1e9, d2 = 1e9, best = null;
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
      const px = (cx + i + 0.15 + hsh(cx + i, cy + j, s) * 0.7) * size, py = (cy + j + 0.15 + hsh(cy + j, cx + i, s + 7) * 0.7) * size;
      const d = Math.hypot(x - px, y - py);
      if (d < d1) { d2 = d1; d1 = d; best = [px, py, cx + i, cy + j]; } else if (d < d2) d2 = d;
    }
    return { d1, d2, px: best[0], py: best[1], id: hsh(best[2], best[3], s + 3) };
  }

  const ground = document.createElement('canvas'); ground.width = AW; ground.height = AH;
  const g = ground.getContext('2d');
  const img = g.createImageData(AW, AH), data = img.data;
  const H = map.theme === 'hiver';
  for (let y = 0; y < AH; y++) for (let x = 0; x < AW; x++) {
    const t = vt[y * AW + x], tx = Math.floor(x / TS), ty = Math.floor(y / TS), lx = x % TS, ly = y % TS, h = hsh(x, y);
    let c;
    if (WALLS_T.includes(t)) {
      // ----- murs vus de 3/4 : dessus clair, face avant plus foncée -----
      const below = tile(tx, ty + 1), front = !WALLS_T.includes(below) && ly >= 9;
      const edge = !WALLS_T.includes(V(x - 1, y)) || !WALLS_T.includes(V(x + 1, y)) || !WALLS_T.includes(V(x, y - 1)) || !WALLS_T.includes(V(x, y + 1));
      if (t === 'T' || t === 'c') {
        const pal = t === 'T' ? TH.arbres : TH.falaise, cl = cells(x, y, t === 'T' ? 11 : 8, t === 'T' ? 5 : 9), r = t === 'T' ? 7 : 5;
        if (cl.d1 > r && cl.d2 - cl.d1 < 1.5) c = pal[3];
        else {
          const dx = x - cl.px, dy = y - cl.py;
          c = dx + dy < -r * 0.6 ? pal[2] : dx + dy > r * 0.7 ? pal[3] : cl.id < 0.5 ? pal[0] : pal[1];
          if (t === 'T' && cl.id > 0.85 && Math.abs(dx) < 1 && Math.abs(dy - 1) < 1) c = map.theme === 'hiver' ? '#ffffff' : '#c9433a';
          if (t === 'c' && cl.d2 - cl.d1 < 1) c = pal[3];
        }
        if (t === 'T' && H && dy0(y, cl) && cl.d1 < r) c = '#f4f8ff';
        if (edge) c = OUT;
      } else {
        const P = {
          b: ['#b0603a', '#7e3a20', '#8a4428', '#5e2a16', '#cf7a4a'],
          '#': ['#a3abb5', '#7d858f', '#7a828d', '#5c636d', '#c3cad3'],
          k: ['#5e5a72', '#48445a', '#454157', '#332f43', '#76728a'],
          x: ['#9b6b3a', '#7a4b25', '#8b5a2b', '#5e3a1a', '#b8844c'],
          g: ['#dcc08a', '#b89a62', '#c2a26a', '#9a7c48', '#efd8a6'],
        }[t];
        if (front) {
          const fy = ly - 9;
          c = P[2];
          if (t === 'x') c = fy % 3 === 0 ? P[4] : fy % 3 === 2 ? P[3] : P[2];
          else if (t === 'g') c = fy % 4 < 2 ? P[0] : P[3];
          else if (fy % 3 === 2 || (fy % 6 < 3 ? (x % 8 === 0) : ((x + 4) % 8 === 0))) c = P[3];
          if (ly === TS - 1) c = OUT;
        } else {
          c = P[0];
          if (t === 'x') { if (x % 4 === 3) c = P[1]; }
          else if (t === 'g') { c = ly % 4 < 2 ? P[4] : ly % 4 === 2 ? P[2] : P[3]; if (x % 12 === 0 && ly % 4 < 2) c = P[1]; }
          else if (ly % 4 === 3 || ((Math.floor(ly / 4) % 2 ? x + 4 : x) % 8 === 0)) c = P[1];
          if (!WALLS_T.includes(tile(tx, ty - 1)) && ly === 0) c = P[4];
          if (h < 0.03) c = P[4];
        }
        if (edge) c = OUT;
      }
    } else if (t === '~') {
      // ----- eau : petites cellules claires, bord plus foncé -----
      let shore = false;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const n = V(x + dx, y + dy); if (n !== '~' && n !== 'B' && n !== '=') shore = true; }
      if (shore) c = '#4f8fc4';
      else {
        const cl = cells(x, y, 7, 21);
        c = cl.d2 - cl.d1 < 1.1 ? '#c4e5f8' : cl.id < 0.3 ? '#84bfe6' : '#8fc8ec';
        if (map.theme === 'donjon') c = cl.d2 - cl.d1 < 1.1 ? '#6a9ac8' : '#3d6a9a';
        if (map.theme === 'marais') c = cl.d2 - cl.d1 < 1.1 ? '#8fb8a0' : '#5a8a78';
      }
    } else if (t === '=') {
      const cl = cells(x, y, 6, 33);
      c = cl.d1 < 2 && cl.id < 0.35 ? '#9aa7b0' : cl.d2 - cl.d1 < 1 ? '#d8f0fb' : '#a9daf3';
    } else if (t === 'i') {
      const cl = cells(x, y, 14, 41);
      c = cl.d2 - cl.d1 < 0.9 ? '#a8d0e8' : Math.sin((x + y * 0.4) * 0.25 + noise(x / 20, y / 20) * 6) > 0.92 ? '#ffffff' : h < 0.5 ? '#d4ecf8' : '#cde8f6';
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (V(x + dx, y + dy) !== 'i') c = '#9fc6e0';
    } else if (t === 'v') {
      const up = V(x, y - 1) !== 'v', up2 = V(x, y - 3) !== 'v';
      c = up ? OUT : up2 ? '#3a3046' : V(x, y - 6) !== 'v' ? '#241c30' : '#0f0b16';
    } else if (t === 'L') {
      const cl = cells(x, y, 6, 51);
      c = cl.d2 - cl.d1 < 1.2 ? '#ffd25a' : cl.id < 0.4 ? '#e2552a' : '#f07a2a';
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (V(x + dx, y + dy) !== 'L') c = '#7a2a1a';
    } else if (t === 'B') {
      // pont : planches dans le sens de la traversée
      let hr = 0, vr = 0;
      for (let k = -4; k <= 4; k++) { if (tile(tx + k, ty) === 'B') hr++; if (tile(tx, ty + k) === 'B') vr++; }
      const along = hr >= vr;   // on traverse de gauche à droite
      const a = along ? x : y, b = along ? y : x, bTile = along ? ly : lx;
      const sideA = along ? tile(tx, ty - 1) !== 'B' : tile(tx - 1, ty) !== 'B', sideB = along ? tile(tx, ty + 1) !== 'B' : tile(tx + 1, ty) !== 'B';
      c = a % 5 === 4 ? '#6b4423' : (Math.floor(a / 5) % 2 ? '#b07a45' : '#a06c3c');
      if (a % 5 === 0) c = '#c99060';
      if ((sideA && bTile < 2) || (sideB && bTile > TS - 3)) c = bTile === 0 || bTile === TS - 1 ? OUT : '#5a3a1e';
    } else {
      // ----- sols -----
      if (t === '.') { const p = noise(x / 18, y / 18, 3); c = p > 0.62 ? TH.herbe[1] : p < 0.3 ? TH.herbe[2] : TH.herbe[0]; if (h < 0.02) c = TH.herbe[3]; }
      else if (t === 'h') { c = hsh(x, y, 22) < 0.5 ? shade(TH.herbe[0], 0.72) : shade(TH.herbe[3], 0.85); }
      else if (t === 's') { c = noise(x / 16, y / 16, 4) > 0.6 ? '#e2c27c' : '#ecd08f'; if (h < 0.04) c = '#cfa962'; if (Math.sin(x * 0.12 + y * 0.35 + noise(x / 30, y / 30, 5) * 7) > 0.95) c = '#d8b36e'; }
      else if (t === 'n') { c = noise(x / 16, y / 16, 6) > 0.6 ? '#e2ebf4' : '#eef4fa'; if (h < 0.02) c = '#c8d8e8'; if (h > 0.995) c = '#ffffff'; }
      else if (t === 'd') {
        c = H ? (h < 0.5 ? '#d3dfeb' : '#c9d7e5') : map.theme === 'donjon' ? '#4a4a5a' : (h < 0.06 ? '#b8935c' : h < 0.55 ? '#d4b07a' : '#cba872');
        let side = false;
        for (const [dx, dy] of [[2, 0], [-2, 0], [0, 2], [0, -2]]) { const n = V(x + dx, y + dy); if (n !== 'd' && !WALLS_T.includes(n) && n !== 'p') side = true; }
        if (side) c = hsh(x >> 1, y >> 1, 9) < 0.5 ? (H ? '#b8c8d8' : '#b5ab98') : (H ? '#c3d1df' : '#c09a64');
      }
      else if (t === 'p') {
        const row = Math.floor(y / 5), bx = Math.floor((x + (row % 2) * 4) / 8), warm = map.theme === 'desert';
        const v = hsh(bx, row, 11);
        c = (y % 5 === 4 || (x + (row % 2) * 4) % 8 === 7) ? (warm ? '#a8946c' : '#8b867c') : warm ? (v < 0.33 ? '#d9c7a0' : v < 0.66 ? '#cdbb94' : '#e2d2ae') : (v < 0.33 ? '#bcb7ad' : v < 0.66 ? '#c8c3b9' : '#b0aba1');
      }
      else if (t === 'f') {
        const v = hsh(x >> 3, y >> 3, 13);
        c = (x % 8 === 0 || y % 8 === 0) ? '#353d57' : v < 0.33 ? '#56607f' : v < 0.66 ? '#4d5675' : '#5c6787';
        if (x % 8 === 1 && y % 8 !== 0 && map.theme !== 'donjon') c = '#66719a';
        if (map.theme === 'donjon' && h < 0.015) c = '#3f4762';
      }
      else if (t === 'w') {
        const row = Math.floor(y / 4);
        c = y % 4 === 3 || (x + row * 5) % 13 === 0 ? '#a87a48' : row % 2 ? '#e2b67c' : '#d8ab70';
      }
      else if (t === 't') {
        let d = 9;
        for (let k = 1; k <= 3; k++) for (const [dx, dy] of [[k, 0], [-k, 0], [0, k], [0, -k]]) if (V(x + dx, y + dy) !== 't') d = Math.min(d, k);
        c = d === 1 ? '#7a2350' : d === 2 ? '#e3b341' : ((x + y) % 6 === 0 || (x - y + 600) % 6 === 0) ? '#c8508a' : '#a8336a';
      }
      else if (t === 'm') {
        const qs = map.theme === 'desert';
        c = qs ? (Math.sin(Math.hypot(x - tx * TS, y - ty * TS) * 0.6) > 0.7 ? '#c49a50' : '#d8b46a') : (noise(x / 6, y / 6, 7) > 0.68 ? '#5a4c26' : h < 0.05 ? '#8f7d48' : '#6b5c30');
      }
      else c = TH.herbe[0];
      // ombre portée par les murs juste au-dessus
      if (WALLS_T.includes(tile(tx, ty - 1)) && ly < 4 && !WALLS_T.includes(t)) c = shade(c, 0.82);
      // plage autour de l'eau
      if (t !== 'B' && t !== '=' && t !== 'v' && t !== 'L' && t !== 'p' && t !== 'f' && t !== 'w' && t !== 't') {
        let nw = 9;
        for (let k = 1; k <= 3 && nw > 3; k++) for (const [dx, dy] of [[k, 0], [-k, 0], [0, k], [0, -k], [k, k], [-k, -k], [k, -k], [-k, k]]) if (isW(V(x + dx, y + dy))) { nw = Math.min(nw, k); break; }
        if (nw <= 2) c = H ? '#d8e6f2' : map.theme === 'donjon' ? '#5a5a6a' : map.theme === 'marais' ? '#8a7a4a' : '#ecd496';
        else if (nw === 3 && (t === '.' || t === 'n')) c = H ? '#c6d6e6' : map.theme === 'marais' ? '#6a5a32' : '#c9a865';
      }
    }
    const k = (y * AW + x) * 4, col = rgb(c);
    data[k] = col[0]; data[k + 1] = col[1]; data[k + 2] = col[2]; data[k + 3] = 255;
  }
  function dy0(y, cl) { return y - cl.py < -3; }
  g.putImageData(img, 0, 0);

  const top = document.createElement('canvas'); top.width = AW; top.height = AH;
  const tg = top.getContext('2d');
  g.imageSmoothingEnabled = false; tg.imageSmoothingEnabled = false;
  let seed = 11;
  const R = (a, b) => { seed = (seed * 16807) % 2147483647; return a + (seed / 2147483647) * (b - a); };
  const dot = (x, y, c) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), 1, 1); };
  const near = (x, y, r, set) => { for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) if (set.includes(V(x + i, y + j))) return true; return false; };

  // petits décors sans collision : touffes, fleurs, cailloux, champignons, os, nénuphars…
  for (let n = 0; n < AW * AH / 90; n++) {
    const x = Math.floor(R(2, AW - 3)), y = Math.floor(R(2, AH - 3)), t = V(x, y), r = R(0, 1);
    if (near(x, y, 2, WALLS_T + '~vLB')) { if (t === '~' && !near(x, y, 3, WALLS_T + '.snd') && r < 0.06 && map.theme !== 'donjon') { g.fillStyle = '#3d9a4a'; g.fillRect(x - 1, y, 4, 2); g.fillRect(x, y - 1, 2, 4); if (r < 0.025) dot(x + 1, y, '#f7a8d0'); } continue; }
    if (t === '.') {
      if (r < 0.35) { const c = TH.herbe[3]; dot(x, y, c); dot(x + 2, y, c); dot(x + 1, y - 1, c); }
      else if (r < 0.42 && map.theme !== 'marais') { const c = ['#fff3a8', '#ffd1e8', '#ffffff', '#c9b8ff', '#ff9a7a'][Math.floor(R(0, 5))]; dot(x, y - 1, c); dot(x - 1, y, c); dot(x + 1, y, c); dot(x, y + 1, c); dot(x, y, '#f2b632'); }
      else if (r < 0.45 && (map.theme === 'foret' || map.theme === 'marais')) { g.fillStyle = '#efe3cf'; g.fillRect(x, y, 1, 2); g.fillStyle = '#d84a3a'; g.fillRect(x - 1, y - 1, 3, 1); }
      else if (r < 0.47 && map.theme === 'marais') { g.fillStyle = '#4f6a2a'; g.fillRect(x, y - 3, 1, 4); g.fillStyle = '#6b4423'; g.fillRect(x, y - 5, 1, 2); }
    } else if (t === 's') {
      if (r < 0.15) { dot(x, y, '#c9a25a'); dot(x + 1, y, '#b08a4a'); }
      else if (r < 0.17) { g.fillStyle = '#f4f0e6'; g.fillRect(x, y, 3, 2); dot(x, y + 2, '#f4f0e6'); dot(x + 2, y + 2, '#f4f0e6'); dot(x + 1, y + 1, OUT); }
      else if (r < 0.19) { dot(x, y, '#9aa0ab'); dot(x + 1, y, '#7d858f'); dot(x, y - 1, '#c3c7d0'); }
    } else if (t === 'n') {
      if (r < 0.15) { dot(x, y, '#c3d5e6'); dot(x + 1, y, '#ffffff'); }
    } else if (t === 'f' && map.theme === 'donjon') {
      if (r < 0.04) { g.fillStyle = '#e8e2d0'; g.fillRect(x, y, 4, 1); dot(x - 1, y - 1, '#e8e2d0'); dot(x + 4, y + 1, '#e8e2d0'); }
      else if (r < 0.08) { dot(x, y, '#2a2238'); dot(x + 1, y + 1, '#2a2238'); dot(x + 2, y + 1, '#2a2238'); }
    } else if (t === 'p' || t === 'd') {
      if (r < 0.04) { g.fillStyle = '#6c8f4a'; g.fillRect(x, y, 2, 1); }
    }
  }
  // lieu de soin
  const HL = map.heal;
  if (HL) {
    const hx = Math.round(HL.x / PX), hy = Math.round(HL.y / PX);
    let P, cx, cy;
    if (HL.kind === 'fontaine') {
      P = new Painter(40, 34); cx = 20; cy = 18;
      P.ellipse(cx, cy, 17, 12, '#cfc6b3'); P.ellipse(cx, cy, 14, 9, '#a69c86'); P.ellipse(cx, cy - 1, 13, 8, '#3d9ad6'); P.ellipse(cx - 3, cy - 3, 5, 2, '#9be8ff');
      P.rect(cx - 2, cy - 12, 4, 11, '#cfc6b3'); P.rect(cx - 1, cy - 12, 1, 11, '#e8e0cf'); P.ellipse(cx, cy - 13, 4, 2, '#e8e0cf');
    } else if (HL.kind === 'source') {
      P = new Painter(34, 26); cx = 17; cy = 13;
      for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; P.disc(cx + Math.round(Math.cos(a) * 13), cy + Math.round(Math.sin(a) * 9), 2, i % 2 ? '#9aa0ab' : '#b7bcc6'); }
      P.ellipse(cx, cy, 11, 7, '#5ad0e8'); P.ellipse(cx - 2, cy - 2, 5, 2, '#bff4ff');
    } else if (HL.kind === 'autel') {
      P = new Painter(30, 34); cx = 15; cy = 20;
      P.rect(3, 20, 24, 10, '#6d6a7a'); P.rect(3, 20, 24, 2, '#8a8796'); P.rect(5, 30, 20, 2, '#45424f');
      P.rect(12, 6, 6, 14, '#b98cff'); P.rect(13, 3, 4, 3, '#b98cff'); P.rect(13, 7, 2, 10, '#e2ccff');
    } else {
      P = new Painter(28, 22); cx = 14; cy = 12;
      for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; P.disc(cx + Math.round(Math.cos(a) * 10), cy + 2 + Math.round(Math.sin(a) * 6), 2, '#8a8f99'); }
      P.rect(7, 12, 14, 3, '#6b4423'); P.rect(9, 10, 10, 2, '#8b5a2b');
    }
    g.drawImage(P.outline().canvas(), hx - cx, hy - cy);
  }
  // objets : la partie au-dessus du rectangle de collision va dans la couche du dessus (les joueurs passent derrière)
  const sorted = [...map.objs].sort((a, b) => (a.y + a.h) - (b.y + b.h));
  for (const o of sorted) {
    const s = spriteFor(o);
    if (!s) continue;
    const sx = Math.round(o.x / PX - s.ax), sy = Math.round(o.y / PX - s.ay);
    g.fillStyle = '#00000030';
    g.beginPath(); g.ellipse(Math.round((o.x + o.w / 2) / PX), Math.round((o.y + o.h) / PX), Math.round(o.w / PX / 2) + 2, 3, 0, 0, 7); g.fill();
    const split = Math.max(0, Math.min(s.c.height, Math.round(s.ay)));
    if (split > 0) tg.drawImage(s.c, 0, 0, s.c.width, split, sx, sy, s.c.width, split);
    g.drawImage(s.c, 0, split, s.c.width, s.c.height - split, sx, sy + split, s.c.width, s.c.height - split);
  }
  // hautes herbes : des brins dans la couche du dessus cachent le bas des joueurs
  const bladeA = shade(TH.herbe[0], 0.7), bladeM = shade(TH.herbe[0], 0.88), bladeB = shade(TH.herbe[2], 1.12), bladeC = shade(TH.herbe[3], 0.8);
  for (let y = 0; y < AH; y += 2) for (let x = (y >> 1) % 2; x < AW; x += 2) {
    if (V(x, y) !== 'h') continue;
    const hgt = 6 + Math.floor(hsh(x, y, 23) * 6), lean = hsh(x, y, 24) < 0.5 ? -1 : 1, lit = hsh(x, y, 25) < 0.4;
    for (let k = 0; k < hgt; k++) {
      tg.fillStyle = k >= hgt - 2 ? (lit ? bladeB : bladeM) : k < 2 ? bladeC : bladeA;
      tg.fillRect(x + (k > hgt * 0.55 ? lean : 0) + (k > hgt * 0.85 ? lean : 0), y - k, 1, 1);
    }
  }
  // buissons (cachettes) : dessus, pour couvrir à moitié les joueurs cachés
  for (const b of map.bushes) {
    const r = Math.round(b.r / PX), P = new Painter(r * 2 + 6, r * 2 + 6), c = r + 3;
    const snow = map.theme === 'hiver', dark = map.theme === 'marais';
    const base = dark ? '#3f5a2a' : '#2f7a3a', mid = dark ? '#4f6d33' : '#3f9a48', hi = dark ? '#6a8a44' : '#62b85a';
    for (let i = 0; i < 7; i++) { const a = i * 0.9; P.disc(c + Math.round(Math.cos(a) * r * 0.45), c + Math.round(Math.sin(a) * r * 0.35), Math.round(r * 0.55), base); }
    P.disc(c - 2, c - 3, Math.round(r * 0.5), mid); P.disc(c - 4, c - 5, Math.round(r * 0.22), hi);
    if (snow) P.ellipse(c, c - Math.round(r * 0.45), Math.round(r * 0.75), Math.round(r * 0.25), '#f4f8ff');
    else for (let i = 0; i < 6; i++) P.px(c + Math.round(Math.cos(i * 2.1) * r * 0.55), c + Math.round(Math.sin(i * 2.1) * r * 0.4), '#d9334a');
    tg.globalAlpha = 0.92;
    tg.drawImage(P.outline().canvas(), Math.round(b.x / PX) - c, Math.round(b.y / PX) - c);
    tg.globalAlpha = 1;
  }
  // éléments animés : reflets sur l'eau, torches sur les murs du donjon
  const glints = [], torches = [];
  for (let j = 0; j < map.rows; j++) for (let i = 0; i < map.cols; i++) {
    const t = tile(i, j);
    if (t === '~' && hsh(i, j, 17) < 0.25) glints.push([(i + hsh(i, j, 18)) * map.T, (j + hsh(i, j, 19)) * map.T, hsh(i, j, 20) * 6]);
    if ((t === 'k' || (t === '#' && map.theme === 'colisee')) && !WALLS_T.includes(tile(i, j + 1)) && 'fp'.includes(tile(i, j + 1)) && (i * 7 + j * 3) % 6 === 0) torches.push([(i + 0.5) * map.T, (j + 0.55) * map.T]);
  }
  for (const o of map.objs) if (o.kind === 'brazier') torches.push([o.x + o.w / 2, o.y - 40]);
  mapAnim = { glints, torches };
  mapLayer = ground; topLayer = top;
}

// ---------- Petits dessins dynamiques : coffres, objets, boss ----------
const dynCache = {};
function chestSprite(open) {
  const key = 'chest' + open;
  if (dynCache[key]) return dynCache[key];
  const P = new Painter(18, 16);
  if (!open) {
    P.rect(1, 3, 16, 12, '#a0642e'); P.rect(1, 3, 16, 5, '#c08040'); P.rect(1, 8, 16, 1, '#6b3f1a');
    P.rect(1, 3, 2, 12, '#e3b341'); P.rect(15, 3, 2, 12, '#e3b341'); P.rect(7, 7, 4, 4, '#e3b341'); P.px(8, 9, OUT); P.rect(2, 4, 14, 1, '#d89a58');
  } else {
    P.rect(1, 7, 16, 8, '#a0642e'); P.rect(1, 0, 16, 5, '#c08040'); P.rect(2, 5, 14, 2, '#3a2214');
    P.rect(1, 0, 2, 5, '#e3b341'); P.rect(15, 0, 2, 5, '#e3b341'); P.rect(1, 7, 2, 8, '#e3b341'); P.rect(15, 7, 2, 8, '#e3b341');
  }
  return (dynCache[key] = P.outline().canvas());
}
function itemSprite(k) {
  const key = 'it' + k;
  if (dynCache[key]) return dynCache[key];
  const P = new Painter(12, 14);
  const potion = (c, l) => { P.rect(4, 1, 4, 2, '#e8e2d0'); P.rect(5, 3, 2, 2, '#cfe6f2'); P.disc(6, 9, 4, c); P.rect(4, 7, 2, 2, l); };
  if (k === 'potion') potion('#e04a5a', '#ffb0b8');
  else if (k === 'grandepotion') { potion('#ff3a6a', '#ffd0dc'); P.px(9, 4, '#ffd25a'); }
  else if (k === 'vitesse') { P.rect(3, 2, 4, 8, '#7a4b25'); P.rect(3, 9, 8, 3, '#7a4b25'); P.rect(3, 9, 8, 1, '#a8743f'); P.rect(1, 4, 2, 1, '#9fd6ff'); P.rect(0, 7, 3, 1, '#9fd6ff'); }
  else if (k === 'force') potion('#ff8a1e', '#ffd25a');
  else if (k === 'bouclier') { P.rect(2, 1, 8, 7, '#3a7ae0'); P.rect(3, 8, 6, 2, '#3a7ae0'); P.rect(4, 10, 4, 2, '#3a7ae0'); P.rect(5, 2, 2, 8, '#e3b341'); }
  else if (k === 'ombre') { P.rect(3, 1, 6, 3, '#4a4f5a'); P.rect(2, 4, 8, 8, '#33363e'); P.rect(4, 4, 4, 2, '#1b1424'); }
  return (dynCache[key] = P.outline().canvas());
}
function barrelSprite(lit) {
  const key = 'barrel' + lit;
  if (dynCache[key]) return dynCache[key];
  const P = new Painter(20, 26); P.oy = 3;
  const body = lit ? '#ff6a4a' : '#c8382a', dark = lit ? '#d04a2a' : '#8e2418', hi = lit ? '#ffb09a' : '#e8604a';
  P.rect(3, 5, 14, 17, body); P.rect(2, 7, 16, 13, body);
  P.rect(4, 5, 2, 17, hi); P.rect(14, 5, 2, 17, dark);
  P.rect(2, 8, 16, 1, '#3a3f4a'); P.rect(2, 18, 16, 1, '#3a3f4a');
  P.ellipse(10, 5, 7, 2, '#a8a0a0'); P.ellipse(10, 5, 5, 1, '#d8d0d0');
  // symbole de danger : flamme jaune
  P.rect(7, 10, 6, 7, '#ffd25a'); P.rect(8, 9, 4, 1, '#ffd25a'); P.rect(9, 12, 2, 4, '#ff8a1e'); P.px(9, 11, '#ff8a1e');
  P.rect(9, 0, 2, 4, '#4a3426');
  if (lit) { P.rect(8, -2, 4, 2, '#ffe27a'); P.px(9, -3, '#ffffff'); }
  return (dynCache[key] = P.outline().canvas());
}
// Portail : anneau de pierres runiques autour d'un disque violet
function portalSprite() {
  if (dynCache.portal) return dynCache.portal;
  const P = new Painter(40, 24);
  P.ellipse(20, 12, 18, 10, '#5a5f6a'); P.ellipse(20, 12, 15, 8, '#3a1f5a'); P.ellipse(20, 12, 12, 6, '#5a2f9a');
  for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2, x = 20 + Math.round(Math.cos(a) * 17), y = 12 + Math.round(Math.sin(a) * 9); P.rect(x - 1, y - 1, 3, 2, '#8a8f99'); P.px(x, y - 1, i % 2 ? '#c9a0ff' : '#b7bcc6'); }
  return (dynCache.portal = P.outline().canvas());
}
// Familiers : petits compagnons qui suivent leur héros (1 chat, 2 chien, 3 bébé dragon, 4 hibou, 5 slime), 4 couleurs chacun
const PET_COULEURS = {
  1: ['#e8923a', '#9aa0ab', '#4a4550', '#f2eee6'],
  2: ['#b07a45', '#e0b060', '#4a4550', '#f2eee6'],
  3: ['#4fbf5a', '#e0503a', '#4a8ae0', '#9a5ae0'],
  4: ['#8b6a45', '#8a8f99', '#ecebe6', '#c0703a'],
  5: ['#5ac85a', '#4aa8e8', '#f080b8', '#a070e0'],
};
function petSprite(k, fr, col = 0) {
  const key = 'pet' + k + fr + col;
  if (dynCache[key]) return dynCache[key];
  const P = new Painter(16, 14), b = fr ? 1 : 0;
  const c = (PET_COULEURS[k] || ['#888'])[col] || PET_COULEURS[k][0], d = shade(c, 0.75), l = shade(c, 1.35);
  if (k === 1) {        // chat
    P.rect(3, 7, 7, 4, c); P.rect(3, 10, 1, 2, d); P.rect(8, 10 - b, 1, 2 + b, d);
    P.rect(9, 3, 5, 5, c); P.px(9, 2, c); P.px(13, 2, c); P.px(12, 5, col === 2 ? '#f2c94c' : OUT); P.px(14, 6, '#f29a8a');
    P.rect(1, 4 + b, 1, 4, c); P.px(2, 7, c); P.rect(4, 8, 1, 2, d); P.rect(6, 8, 1, 2, d);
  } else if (k === 2) { // chien
    P.rect(2, 6, 8, 5, c); P.rect(2, 10, 1, 2, d); P.rect(8, 10 - b, 1, 2 + b, d); P.rect(4, 11, 1, 1, d);
    P.rect(9, 2, 5, 5, c); P.rect(13, 5, 2, 2, c); P.px(14, 5, OUT); P.px(11, 4, col === 2 ? '#f2c94c' : OUT); P.rect(9, 2, 2, 4, d);
    P.rect(0, 4 - b, 2, 1, c); P.px(1, 5, c); P.rect(5, 6, 3, 1, '#d33b3b');
  } else if (k === 3) { // bébé dragon
    P.rect(4, 6, 6, 5, c); P.rect(5, 10, 4, 1, '#f2e08a');
    P.rect(9, 3, 5, 4, c); P.px(10, 2, '#f2e08a'); P.px(12, 2, '#f2e08a'); P.px(12, 4, OUT); P.px(14, 5, d);
    P.rect(1, 9, 3, 1, c); P.px(0, 8, c);
    if (b) { P.rect(4, 2, 4, 3, l); P.px(3, 1, l); } else { P.rect(4, 4, 4, 2, l); P.px(3, 6, l); }
    P.rect(5, 11, 1, 1, d); P.rect(8, 11, 1, 1, d);
  } else if (k === 4) { // hibou
    const belly = col === 2 ? '#ffffff' : '#e8d8b8';
    P.ellipse(8, 7, 4, 5, c); P.ellipse(8, 9, 2, 3, belly);
    P.rect(5, 4, 2, 2, '#ffffff'); P.rect(9, 4, 2, 2, '#ffffff'); P.px(6, 5, OUT); P.px(10, 5, OUT); P.px(8, 6, '#f2c94c');
    P.px(4, 2, d); P.px(12, 2, d);
    if (b) { P.rect(1, 5, 3, 2, d); P.rect(13, 5, 3, 2, d); } else { P.rect(3, 7, 1, 4, d); P.rect(12, 7, 1, 4, d); }
    P.px(7, 12, '#f2c94c'); P.px(9, 12, '#f2c94c');
  } else if (k === 5) { // slime qui rebondit
    const sq = b ? 1 : 0;
    P.ellipse(8, 9 + sq, 6 + sq, 4 - sq, d); P.ellipse(8, 8 + sq, 6 + sq, 4 - sq, c);
    P.rect(5, 6 + sq, 2, 1, l); P.px(4, 7 + sq, l);
    P.rect(6, 8 + sq, 1, 2, OUT); P.rect(10, 8 + sq, 1, 2, OUT);
  }
  return (dynCache[key] = P.outline().canvas());
}
function bossSprite(frame, flash) {
  const key = 'boss' + frame + flash;
  if (dynCache[key]) return dynCache[key];
  const P = new Painter(52, 46), sq = frame ? 1 : 0;
  const b = flash ? '#c8ffc0' : '#5ac85a', bd = flash ? '#8ae08a' : '#3a9a44', bl = flash ? '#ffffff' : '#9af08a';
  P.ellipse(26, 30 + sq, 23 + sq, 14 - sq, bd);
  P.ellipse(26, 28 + sq, 22 + sq, 14 - sq, b);
  P.ellipse(17, 22 + sq, 6, 3, bl); P.px(12, 24, bl);
  P.rect(16, 25, 5, 6, '#ffffff'); P.rect(31, 25, 5, 6, '#ffffff'); P.rect(18, 27, 3, 4, OUT); P.rect(33, 27, 3, 4, OUT);
  P.rect(14, 23, 7, 1, OUT); P.rect(31, 23, 7, 1, OUT);
  P.rect(21, 35, 10, 2, OUT); P.rect(23, 37, 6, 1, '#e04a5a');
  // couronne
  P.rect(17, 9 + sq * 2, 18, 6, '#f2c94c'); P.rect(17, 5 + sq * 2, 3, 4, '#f2c94c'); P.rect(24, 3 + sq * 2, 4, 6, '#f2c94c'); P.rect(32, 5 + sq * 2, 3, 4, '#f2c94c');
  P.px(25, 11 + sq * 2, '#e04a5a'); P.px(19, 11 + sq * 2, '#3a7ae0'); P.px(32, 11 + sq * 2, '#3fbf5a');
  return (dynCache[key] = P.outline().canvas());
}

// ---------- Rendu d'une image ----------
// mine = mon joueur (élève) ou null (vue enseignant : voit tout le monde)
function drawWorld(ctx, world, map, mine, disp, heroScale = PX, teams = null) {
  if (!mapLayer) buildMapLayers(map);
  const big = heroScale > PX;   // vue enseignant : carte réduite, on lisse pour qu'elle reste jolie
  ctx.imageSmoothingEnabled = big;
  ctx.drawImage(mapLayer, 0, 0, mapLayer.width * PX, mapLayer.height * PX);
  const now = performance.now() / 1000;
  const md = mine && (disp.get(mine.id) || mine);
  const sq = (x, y, s, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x / PX) * PX, Math.round(y / PX) * PX, s * PX, s * PX); };
  const img = (c, x, y, s = PX) => ctx.drawImage(c, Math.round(x - c.width * s / 2), Math.round(y - c.height * s / 2), c.width * s, c.height * s);

  // reflets sur l'eau, lieu de soin, torches
  for (const [x, y, ph] of mapAnim.glints) { const t = (now * 0.6 + ph) % 3; if (t < 1) sq(x + t * 12, y, 2 + (t > 0.3 && t < 0.7 ? 1 : 0), '#ffffffaa'); }
  const HL = map.heal;
  if (HL) {
    ctx.fillStyle = '#7dffb01a'; ctx.beginPath(); ctx.arc(HL.x, HL.y, HL.r, 0, 7); ctx.fill();
    for (let k = 0; k < 8; k++) {
      const t = (now * 0.9 + k / 8) % 1, a = k / 8 * Math.PI * 2;
      if (HL.kind === 'fontaine') sq(HL.x + Math.cos(a) * (6 + t * 30), HL.y - 30 + Math.sin(a) * (4 + t * 16) - Math.sin(t * Math.PI) * 24 + t * 30, 1, t < 0.7 ? '#e8fbff' : '#9be8ff');
      else if (HL.kind === 'feu') sq(HL.x + Math.sin(k * 2.3 + now * 3) * 12, HL.y - 6 - t * 50, t < 0.3 ? 3 : 2, t < 0.4 ? '#ffd25a' : t < 0.7 ? '#ff8a1e' : '#c23b1a');
      else sq(HL.x + Math.cos(a + now) * 40 * t, HL.y - 10 - t * 60, 1, HL.kind === 'autel' ? '#e2ccff' : '#bff4ff');
    }
  }
  for (const [x, y] of mapAnim.torches) {
    const f = Math.sin(now * 12 + x) > 0 ? 1 : 0;
    ctx.fillStyle = '#ff9a3018'; ctx.beginPath(); ctx.arc(x, y + 20, 100, 0, 7); ctx.fill();
    sq(x - 4, y - f * 3, 3, '#ff8a1e'); sq(x - 1, y - 4 - f * 3, 1, '#ffe27a'); sq(x - 4, y + 6, 3, '#5a3a1e');
  }
  // coffres et objets cachés
  if (map.chests) map.chests.forEach((c, i) => {
    const open = world.ch && world.ch[i] === '1';
    ctx.globalAlpha = open ? 0.55 : 1;
    img(chestSprite(open), c.x, c.y);
    ctx.globalAlpha = 1;
    if (!open && Math.floor(now * 2 + i) % 3 === 0) sq(c.x + 14 + Math.sin(now * 5 + i) * 6, c.y - 22, 1, '#fff6c0');
  });
  for (const [x, y, k] of world.it || []) {
    const d = md ? Math.hypot(md.x - x, md.y - y) : 0;
    if (mine && d > 190) { if (Math.floor(now * 3 + x) % 4 === 0 && d < 420) sq(x, y - 10, 1, '#ffffffcc'); continue; }   // objet caché : seulement une étincelle de loin
    img(itemSprite(k), x, y - 6 + Math.sin(now * 4 + x) * 3);
  }

  // portails : tourbillon animé
  for (const pair of map.portals || []) for (const [k, P] of pair.entries()) {
    img(portalSprite(), P.x, P.y + 4);
    const col = ['#ffffff', '#e2ccff', '#b98cff', '#8e4ce0'], dir = k ? -1 : 1;
    for (let arm = 0; arm < 3; arm++) for (let i = 0; i < 9; i++) {
      const a = arm * 2.09 + i * 0.5 + now * 4 * dir, r = 4 + i * 3.4;
      sq(P.x + Math.cos(a) * r * 1.5, P.y + 4 + Math.sin(a) * r * 0.75, 2, col[Math.min(3, i >> 1)]);
    }
    for (let i = 0; i < 3; i++) { const t = (now * 0.7 + i / 3 + k * 0.2) % 1; sq(P.x - 24 + i * 22, P.y - t * 70, 1, '#e2ccff'); }
  }
  // flaques gluantes du slime
  for (const [x, y, r, t] of world.pz) {
    ctx.save(); ctx.globalAlpha = Math.min(1, t) * 0.75;
    ctx.fillStyle = '#4fbf5a'; ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.6, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#8af07a'; ctx.beginPath(); ctx.ellipse(x - r * 0.3, y - r * 0.15, r * 0.3, r * 0.14, 0, 0, 7); ctx.fill();
    for (let i = 0; i < 5; i++) { const a = i * 1.3 + now; sq(x + Math.cos(a) * r * 0.6, y + Math.sin(a) * r * 0.35 - ((now * 20 + i * 9) % 18), 2, '#b8ffa8'); }
    ctx.restore();
  }
  // tonneaux explosifs
  (map.barrels || []).forEach((b, i) => {
    const st = world.tb ? world.tb[i] : '1';
    if (st === '0') return;
    ctx.fillStyle = '#00000040'; ctx.fillRect(b.x - 18, b.y + 18, 36, 6);
    const lit = st === '2';
    img(barrelSprite(lit ? 1 : 0), b.x + (lit ? Math.sin(now * 60) * 2 : 0), b.y);
  });

  // effets
  for (const f of world.fx) {
    const t = f.t / f.d;
    ctx.save(); ctx.globalAlpha = Math.max(0, Math.min(1, t * 1.5));
    if (f.k === 'slash') {
      for (let i = 0; i <= 8; i++) { const a = f.a - f.arc / 2 + f.arc * i / 8; sq(f.x + Math.cos(a) * f.r, f.y + Math.sin(a) * f.r, 2, '#ffffff'); }
    } else if (f.k === 'boom') {
      const r = f.r * (1.1 - t * 0.6);
      for (let i = 0; i < 28; i++) { const a = i / 28 * Math.PI * 2; sq(f.x + Math.cos(a) * r, f.y + Math.sin(a) * r, 3, i % 2 ? '#ff8a1e' : '#ffe27a'); sq(f.x + Math.cos(a + 0.1) * r * 0.6, f.y + Math.sin(a + 0.1) * r * 0.6, 2, '#ff4a1a'); }
    } else if (f.k === 'slam') {
      const r = f.r * (1.1 - t);
      for (let i = 0; i < 32; i++) { const a = i / 32 * Math.PI * 2; sq(f.x + Math.cos(a) * r, f.y + 20 + Math.sin(a) * r * 0.6, 3, i % 2 ? '#5ac85a' : '#9af08a'); }
    } else if (f.k === 'zap') {
      for (let i = 0; i <= 14; i++) { const u = i / 14; sq(f.x + (f.x2 - f.x) * u + Math.sin(i * 2 + now * 30) * 6, f.y - 30 + (f.y2 - f.y) * u, 2, i % 2 ? '#ffe27a' : '#ffffff'); }
    } else if (f.k === 'dust') {
      for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; sq(f.x + Math.cos(a) * 22 * (1.3 - t), f.y + Math.sin(a) * 8 * (1.3 - t), 3, i % 2 ? '#d8cfc0' : '#b8ad9a'); }
    } else if (f.k === 'tp') {
      for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2 + now * 4; sq(f.x + Math.cos(a) * 30 * t, f.y - 30 + Math.sin(a) * 40 * t, 2, i % 2 ? '#c9a0ff' : '#ffffff'); }
    } else if (f.k === 'item') {
      for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; sq(f.x + Math.cos(a) * 30 * (1.2 - t), f.y - 30 + Math.sin(a) * 30 * (1.2 - t), 2, '#fff6c0'); }
    } else if (f.k === 'hit') {
      sq(f.x - 9, f.y - 30, 2, '#ffffff'); sq(f.x + 6, f.y - 20, 2, '#ffffff'); sq(f.x - 3, f.y - 12, 2, '#ffe27a');
    } else if (f.k === 'death') {
      for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + now * 3; sq(f.x + Math.cos(a) * 26, f.y - 30 + Math.sin(a) * 10 - (1 - t) * 20, 2, '#ffe27a'); }
    } else if (f.k === 'spawn') {
      const r = 70 * (1 - t) + 20;
      for (let i = 0; i < 20; i++) { const a = i / 20 * Math.PI * 2; sq(f.x + Math.cos(a) * r, f.y + 10 + Math.sin(a) * r * 0.5, 2, '#ffe36b'); }
    } else if (f.k === 'smoke') {
      for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; sq(f.x + Math.cos(a) * (20 + 30 * (1 - t)), f.y + Math.sin(a) * (14 + 20 * (1 - t)), 4, '#6b6878'); }
    } else if (f.k === 'heal') {
      for (let i = 0; i < 5; i++) { const x = f.x - 24 + i * 12, y = f.y - 30 - (1 - t) * 50 - (i % 2) * 10; sq(x - 3, y, 2, '#ff5a7a'); sq(x + 3, y, 2, '#ff5a7a'); sq(x - 3, y + 3, 4, '#ff5a7a'); sq(x, y + 9, 2, '#ff5a7a'); }
    } else if (f.k === 'bark') {
      for (const m of [1, 0.7]) { const r = f.r * (1.1 - t) * m; for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; sq(f.x + Math.cos(a) * r, f.y + Math.sin(a) * r * 0.6, 2, '#fff6c0'); } }
    } else if (f.k === 'owl') {
      const r = f.r * (1 - t);
      for (let i = 0; i < 36; i++) { const a = i / 36 * Math.PI * 2; sq(f.x + Math.cos(a) * r, f.y + Math.sin(a) * r * 0.6, 2, i % 2 ? '#f2c94c' : '#ffffff'); }
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
    } else if (c === 'pet') {
      sq(x - 4, y - 4, 3, '#ff8a1e'); sq(x - 2, y - 2, 1, '#ffe27a'); sq(x - Math.cos(a) * 10, y - Math.sin(a) * 10, 2, '#ffb347');
    } else if (c === 'boss') {
      sq(x - 9, y - 9, 6, '#3a9a44'); sq(x - 6, y - 6, 4, '#5ac85a'); sq(x - 6, y - 6, 1, '#d0ffc0');
    } else {
      for (let i = 0; i < 7; i++) sq(x - Math.cos(a) * i * 3.2, y - Math.sin(a) * i * 3.2, 1, i === 0 ? '#e6ebf2' : i > 5 ? '#e04a3a' : '#7a4b25');
    }
  }
  // joueurs et boss (du haut vers le bas)
  const list = world.p.filter(p => p.al).sort((p, q) => p.y - q.y);
  const B = world.boss;
  let bossDrawn = !B;
  const drawBoss = () => {
    const [x, y, , , , fl] = B, fr = Math.floor(now * 3) % 2;
    ctx.fillStyle = '#00000044'; ctx.beginPath(); ctx.ellipse(x, y + 40, 70, 16, 0, 0, 7); ctx.fill();
    img(bossSprite(fr, fl && Math.floor(now * 20) % 2 ? 1 : 0), x, y - 10, big ? 7 : PX);
    bossDrawn = true;
  };
  for (const p of list) {
    if (!bossDrawn && B[1] < p.y) drawBoss();
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
    // ombre et marqueur au sol (couleur de l'équipe si équipes)
    ctx.fillStyle = '#00000044'; ctx.fillRect(Math.round(d.x) - 15, Math.round(d.y) + 18, 30, 6);
    const tcol = teams && p.tm >= 0 && teams[p.tm] ? teams[p.tm].color : null;
    if (tcol) { ctx.fillStyle = tcol; ctx.fillRect(Math.round(d.x) - 18, Math.round(d.y) + 22, 36, 5); }
    else if (isMe) sq(d.x - 3, d.y + 30, 2, '#ffd54a');
    else { ctx.fillStyle = CLS[p.c].color; ctx.fillRect(Math.round(d.x) - 15, Math.round(d.y) + 24, 30, 3); }
    if (p.st) for (let i = 0; i < 4; i++) sq(d.x - 20 + i * 13, d.y + 10 - ((now * 60 + i * 17) % 50), 1, '#ff8a1e');
    if (p.sl) for (let i = 0; i < 3; i++) sq(d.x - 14 + i * 14, d.y + 6 + ((now * 30 + i * 7) % 16), 2, '#6fd85a');
    if (p.fa) for (let i = 0; i < 3; i++) sq(d.x - 30 - i * 8, d.y + 14 - i * 5, 1, '#9fd6ff');
    if (p.dz) { const dx = d.x - (d.px ?? d.x), dy = d.y - (d.py ?? d.y), l = Math.hypot(dx, dy) || 1; for (let i = 1; i <= 3; i++) sq(d.x - dx / l * i * 16 + (i % 2 ? 8 : -8), d.y - 20 - dy / l * i * 16, 2, '#ffffffaa'); }
    d.px = d.x; d.py = d.y;
    // flèche de visée sous mon héros
    if (isMe) {
      const a = mine.aim ?? p.a, ca = Math.cos(a), sa = Math.sin(a);
      for (const [k, w] of [[44, 0], [38, 1], [32, 2]]) for (let j = -w; j <= w; j++) sq(d.x + ca * k - sa * j * 4, d.y + 8 + sa * k + ca * j * 4, 2, '#ffd54ae0');
    }
    // familier : suit son héros, un peu en retard
    const pet = p.l ? +p.l[5] || 0 : 0;
    let drawPet = null;
    if (pet) {
      const tx = d.x - Math.cos(p.a) * 38 + (Math.sin(p.a) > 0.7 ? 26 : 0), ty = d.y - Math.sin(p.a) * 22 + 14;
      if (d.petX === undefined || Math.hypot(tx - d.petX, ty - d.petY) > 400) { d.petX = tx; d.petY = ty; }
      const vx = (tx - d.petX) * 0.12; d.petX += vx; d.petY += (ty - d.petY) * 0.12;
      if (Math.abs(vx) > 0.3) d.petDir = vx > 0 ? 1 : -1;
      const fly = pet === 3 || pet === 4, moving = Math.hypot(tx - d.petX, ty - d.petY) > 4;
      const fr = fly ? Math.floor(now * 6 + p.id) % 2 : moving || pet === 5 ? Math.floor(now * (pet === 5 ? 4 : 8)) % 2 : 0;
      const px = d.petX, py = d.petY - (fly ? 34 + Math.sin(now * 4 + p.id) * 5 : 0), S = heroScale * 0.8;
      drawPet = () => {
        ctx.fillStyle = '#00000033'; ctx.fillRect(Math.round(px) - 10, Math.round(d.petY) + 14, 20, 4);
        const c = petSprite(pet, fr, +p.l[6] || 0);
        ctx.save(); ctx.translate(Math.round(px), Math.round(py)); if ((d.petDir || 1) < 0) ctx.scale(-1, 1);
        ctx.drawImage(c, -c.width * S / 2, -c.height * S / 2 + 4, c.width * S, c.height * S); ctx.restore();
      };
      if (d.petY < d.y) drawPet();
    }
    drawHeroSprite(ctx, d.x, d.y, p.c, p.l || 'm00', p.a, d.ph, heroScale, p.g);
    if (drawPet && d.petY >= d.y) drawPet();
    if (p.sh) {
      ctx.globalAlpha = alpha * 0.8;
      for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2 + now * 2; sq(d.x + Math.cos(a) * 36, d.y - 10 + Math.sin(a) * 40, 2, '#7fd3ff'); }
    }
    ctx.restore();
  }
  if (!bossDrawn) drawBoss();
  // couche du dessus : feuillages, hauts des objets, buissons
  ctx.imageSmoothingEnabled = big;
  ctx.drawImage(topLayer, 0, 0, topLayer.width * PX, topLayer.height * PX);
  // noms et barres de vie par-dessus tout
  ctx.font = `${big ? 46 : 15}px "Pixelify Sans", monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  for (const p of list) {
    const d = disp.get(p.id) || p;
    const isMe = mine && p.id === mine.id;
    if ((p.hd || p.inv) && !isMe && mine && !(md && Math.hypot(md.x - d.x, md.y - d.y) < (p.inv ? 80 : 130))) continue;
    const ny = Math.round(d.y + 22 - (p.c === 'mage' ? 31 : 28) * heroScale);
    const tcol = teams && p.tm >= 0 && teams[p.tm] ? teams[p.tm].color : null;
    ctx.lineWidth = big ? 9 : 4; ctx.strokeStyle = OUT; ctx.strokeText(p.n, d.x, ny);
    ctx.fillStyle = isMe ? '#ffd54a' : tcol || '#ffffff'; ctx.fillText(p.n, d.x, ny);
    if (p.bz) { ctx.strokeText('❓', d.x, ny - (big ? 50 : 20)); ctx.fillText('❓', d.x, ny - (big ? 50 : 20)); }
    else if (p.lz) { ctx.strokeText('👑', d.x, ny - (big ? 50 : 20)); ctx.fillText('👑', d.x, ny - (big ? 50 : 20)); }
    const bw = big ? 110 : 36, r = p.hp / p.m;
    ctx.fillStyle = OUT; ctx.fillRect(Math.round(d.x - bw / 2) - 3, ny + 6, bw + 6, big ? 20 : 8);
    ctx.fillStyle = '#3a2a3a'; ctx.fillRect(Math.round(d.x - bw / 2), ny + 9, bw, big ? 14 : 3);
    ctx.fillStyle = r > 0.5 ? '#5ad65a' : r > 0.25 ? '#ffcc00' : '#ff3b30';
    ctx.fillRect(Math.round(d.x - bw / 2), ny + 9, Math.round(bw * r / 3) * 3, big ? 14 : 3);
  }
  if (B) {
    const [x, y, hp, max] = B, bw = big ? 300 : 140, ny = y - (big ? 150 : 95);
    ctx.lineWidth = big ? 9 : 4; ctx.strokeStyle = OUT; ctx.strokeText('👑 Roi Gluant', x, ny - 8); ctx.fillStyle = '#9af08a'; ctx.fillText('👑 Roi Gluant', x, ny - 8);
    ctx.fillStyle = OUT; ctx.fillRect(x - bw / 2 - 3, ny, bw + 6, big ? 24 : 12);
    ctx.fillStyle = '#3a2a3a'; ctx.fillRect(x - bw / 2, ny + 3, bw, big ? 18 : 6);
    ctx.fillStyle = '#e04a5a'; ctx.fillRect(x - bw / 2, ny + 3, Math.round(bw * Math.max(0, hp) / max), big ? 18 : 6);
  }
}

// Mini-carte (vue élève)
function drawMinimap(ctx, world, map, mine, x, y, w, teams = null) {
  const s = w / map.W, h = map.H * s;
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.fillStyle = OUT; ctx.fillRect(x - 4, y - 4, w + 8, h + 8);
  ctx.drawImage(mapLayer, x, y, w, h);
  ctx.drawImage(topLayer, x, y, w, h);
  for (const p of world.p) {
    if (!p.al || (mine && p.id === mine.id) || p.hd || p.inv) continue;
    ctx.fillStyle = teams && p.tm >= 0 && teams[p.tm] ? teams[p.tm].color : '#ffffff';
    ctx.fillRect(Math.round(x + p.x * s) - 1, Math.round(y + p.y * s) - 1, 3, 3);
  }
  if (world.boss) { ctx.fillStyle = '#5ac85a'; ctx.fillRect(Math.round(x + world.boss[0] * s) - 4, Math.round(y + world.boss[1] * s) - 4, 8, 8); }
  if (mine && mine.al) {
    ctx.fillStyle = OUT; ctx.fillRect(Math.round(x + mine.x * s) - 4, Math.round(y + mine.y * s) - 4, 8, 8);
    ctx.fillStyle = '#ffd54a'; ctx.fillRect(Math.round(x + mine.x * s) - 3, Math.round(y + mine.y * s) - 3, 6, 6);
  }
  ctx.restore();
}
