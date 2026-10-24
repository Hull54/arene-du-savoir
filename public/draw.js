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
// tenues 7-9, accessoires 4-5 et couleurs de familier 4-5 : à acheter à la boutique (pièces d'or)
const OUTFIT = [null, '#d33b3b', '#3a6fd8', '#2f9e55', '#8e4ce0', '#e89a2a', '#e06aa8', '#2a2833', '#e0b23a', '#ecebe4'];
const OUTFIT_NOMS = ['Classique', 'Rouge', 'Bleu', 'Vert', 'Violet', 'Orange', 'Rose', 'Noire', 'Dorée', 'Blanche'];
const ACCESSOIRES = ['Aucun', 'Cape', 'Lunettes', 'Écharpe', '👑 Couronne', '🪽 Ailes'];
const FAMILIERS = ['Aucun', '🐱 Chat', '🐺 Loup', '🐲 Dragon', '🦉 Hibou', '🟢 Slime'];
const PET_ICO = [null, '😺', '🐺', '🔥', '🦉', '🟢'];
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
  w.mn = w.mn || [];
  w.p = w.p.map(([id, n, c, l, x, y, a, hp, m, k, f, tm, g]) => ({ id, n, c, l, x, y, a, hp, m, k, tm, g: g || 0, al: !!(f & 1), sh: !!(f & 2), pr: !!(f & 4), hd: !!(f & 8), inv: !!(f & 16), st: !!(f & 32), fa: !!(f & 64), bz: !!(f & 128), dz: !!(f & 256), lz: !!(f & 512), sl: !!(f & 1024), sz: !!(f & 2048) }));
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
  const fem = look[0] === 'f', out = OUTFIT[+look[3] || 0], acc = +look[4] || 0, G = gearOf(gearCode);
  const s = SKIN[+look[1]] || SKIN[0], sD = shade(s, 0.78), sH = shade(s, 1.12);
  const h = HAIR[+look[2]] || HAIR[0], hD = shade(h, 0.68), hH = shade(h, 1.4);
  const E = '#1b1424', line = '#2a1d2e';
  // trois tons par matière : clair (haut, gauche), moyen, sombre (bas, droite)
  const T3 = c => [shade(c, 1.3), c, shade(c, 0.66)];
  const box = (x, y, w, hh, c) => { const [hi, m, lo] = T3(c); P.rect(x, y, w, hh, m); P.rect(x, y, w, 1, hi); P.rect(x, y, 1, hh, hi); P.rect(x + w - 1, y + 1, 1, hh - 1, lo); P.rect(x + 1, y + hh - 1, w - 1, 1, lo); };
  // palette par classe : couleurs plus sombres et plus sobres
  const K = {
    guerrier: { main: '#8f98a6', acc: '#8e2a2a', cloth: '#4a3a3a', pants: '#3e3a44' },
    voleur:   { main: '#3c3846', acc: '#7a1f2a', cloth: '#2a2632', pants: '#2a2630' },
    mage:     { main: '#3a2f6a', acc: '#d9a93a', cloth: '#2c2452', pants: '#2c2452' },
    archer:   { main: '#4a6a2e', acc: '#6b4a2a', cloth: '#3a5424', pants: '#4a3a2a' },
  }[cls];
  if (out) { if (cls === 'guerrier') K.acc = out; else if (cls === 'voleur') K.acc = out; else { K.main = shade(out, 0.75); K.cloth = shade(out, 0.55); } }
  const steel = G.casque ? TIER_C[G.casque] : '#8f98a6';
  const blade = G.epee ? shade(TIER_C[G.epee], 1.1) : '#d8dee8', bladeD = shade(blade, 0.65);
  const crystal = G.epee ? TIER_C[G.epee] : cls === 'mage' ? '#7fe0ff' : '#c9a0ff';
  const wood = '#5a3a20', woodH = '#7a5030', gold = '#d9a93a', leather = '#5a3a24';
  const bootC = G.bottes ? TIER_C[G.bottes] : '#3a2a22';
  const capeC = out ? shade(out, 0.8) : '#6a1f24', scarf = out || '#8e2a2a';
  const lA = frame === 1 ? -1 : 0, lB = frame === 2 ? -1 : 0;
  const side = dir === 'side', up = dir === 'up', down = dir === 'down';

  // ===== derrière le corps =====
  if (acc === 5) {   // ailes blanches, plumes claires et ombrées
    const wc = '#f4f2ea', wd = '#c9c6d6', wl = '#ffffff';
    const wing = (x0, dirx) => { for (let j = 0; j < 7; j++) { const len = 6 - Math.abs(j - 2); for (let i = 0; i < len; i++) P.px(x0 + dirx * i, 8 + j, j > 3 ? wd : i === len - 1 ? wl : wc); } };
    if (side) wing(4, -1); else { wing(2, -1); wing(13, 1); }
  }
  if (acc === 1 && !up) { if (side) { P.rect(1, 10, 4, 9, capeC); P.rect(1, 18, 4, 1, shade(capeC, 0.65)); P.rect(2, 11, 1, 6, shade(capeC, 1.2)); } else P.rect(3, 10, 10, 9, shade(capeC, 0.7)); }
  if (up) {
    if (cls === 'guerrier') { P.rect(13, 1, 1, 13, blade); P.rect(12, 14, 3, 1, gold); }
    if (cls === 'mage') { P.rect(13, 0, 1, 18, wood); P.rect(12, -3, 3, 3, crystal); }
  }
  if (cls === 'archer' && !up) {   // carquois dans le dos
    if (side) { P.rect(2, 8, 3, 7, leather); P.px(2, 7, '#e8e2d0'); P.px(3, 6, '#c23b3b'); P.px(4, 7, '#e8e2d0'); }
    else { P.rect(11, 6, 2, 3, '#e8e2d0'); P.px(12, 5, '#c23b3b'); }
  }
  if (side && fem && cls !== 'voleur') P.rect(4, 4, 2, cls === 'mage' ? 9 : 8, h);

  // ===== jambes et bottes =====
  if (cls === 'mage') {
    if (side) { P.rect(frame === 1 ? 5 : 6, 18, 3, 1, bootC); P.rect(frame === 2 ? 6 : 8, 18, 3, 1, shade(bootC, 0.8)); }
    else { P.rect(5, 18 + lA, 2, 1, bootC); P.rect(9, 18 + lB, 2, 1, bootC); }
  } else if (side) {
    const f = frame === 0 ? [6, 8] : frame === 1 ? [5, 9] : [9, 5];
    P.rect(f[1], 15, 2, 2, shade(K.pants, 0.75)); P.rect(f[1], 17, 3, 2, shade(bootC, 0.75));
    P.rect(f[0], 15, 2, 2, K.pants); P.rect(f[0], 17, 3, 2, bootC); P.px(f[0], 17, shade(bootC, 1.4));
  } else {
    for (const [x, d] of [[5, lA], [9, lB]]) {
      P.rect(x, 15 + d, 2, 2, K.pants); P.px(x + 1, 15 + d, shade(K.pants, 0.7));
      P.rect(x, 17 + d, 2, 2, bootC); P.px(x, 17 + d, shade(bootC, 1.45)); P.px(x + 1, 18 + d, shade(bootC, 0.6));
      if (cls === 'guerrier') P.px(x, 16 + d, steel);   // genouillère
    }
  }

  // ===== corps =====
  const bx = side ? 5 : 4, bw = side ? 6 : 8;
  if (cls === 'mage') {
    box(bx, 10, bw, 8, K.main); P.rect(bx - 1, 15, 1, 3, K.main); P.rect(bx + bw, 15, 1, 3, shade(K.main, 0.66));
    P.rect(bx - 1, 17, bw + 2, 1, gold);
    if (!up) { P.rect(side ? 8 : 7, 10, side ? 1 : 2, 7, gold); P.rect(bx, 13, bw, 1, leather); P.px(side ? 8 : 7, 13, gold); }
  } else if (cls === 'guerrier') {
    box(bx, 10, bw, 5, '#8f98a6');                                  // plastron
    if (!up) { P.rect(side ? 7 : 6, 11, side ? 3 : 4, 5, K.acc); P.rect(side ? 7 : 6, 11, 1, 5, shade(K.acc, 1.25)); P.rect(side ? 9 : 9, 11, 1, 5, shade(K.acc, 0.7)); }   // tabard
    else { P.rect(5, 10, 6, 6, K.acc); P.rect(5, 10, 6, 1, shade(K.acc, 1.25)); }
    P.rect(bx, 14, bw, 1, leather); P.px(side ? 8 : 7, 14, gold); if (!side) P.px(8, 14, gold);
  } else if (cls === 'voleur') {
    box(bx, 10, bw, 5, K.main);
    if (!up) { for (let i = 0; i < 5; i++) P.px(bx + 1 + i, 10 + i, leather); P.px(bx + 3, 12, '#9aa3b0'); }   // sangle et boucle
    P.rect(bx, 14, bw, 1, K.acc);
  } else {
    box(bx, 10, bw, 5, K.acc === '#6b4a2a' ? '#6b4a2a' : leather);   // gilet de cuir
    P.rect(bx + (side ? 0 : 1), 10, side ? 2 : 2, 5, K.cloth); if (!side) P.rect(bx + bw - 3, 10, 2, 5, K.cloth);
    P.rect(bx, 14, bw, 1, '#3a2614'); P.px(bx + (bw >> 1), 14, gold);
  }
  if (fem && cls !== 'mage') { const c = cls === 'guerrier' ? K.acc : cls === 'voleur' ? K.main : K.cloth; P.rect(bx - 1, 15, bw + 2, 1, c); P.rect(bx, 16, bw, 1, shade(c, 0.7)); }
  // armure trouvée : plastron aux couleurs du niveau
  if (G.armure) {
    const tc = TIER_C[G.armure], x0 = side ? 6 : 5, w0 = side ? 4 : 6;
    P.rect(x0, 11, w0, 3, tc); P.rect(x0, 11, w0, 1, shade(tc, 1.3)); P.rect(x0 + w0 - 1, 12, 1, 2, shade(tc, 0.7)); P.rect(x0, 13, w0, 1, shade(tc, 0.75));
    if (!up && G.armure === 3) P.px(x0 + (w0 >> 1), 12, '#c0303a');
  }
  if (acc === 3) {
    if (side) { P.rect(5, 9, 6, 2, scarf); P.rect(3, 10, 2, 4, shade(scarf, 0.75)); P.px(5, 9, shade(scarf, 1.3)); }
    else { P.rect(4, 9, 8, 2, scarf); P.rect(4, 9, 8, 1, shade(scarf, 1.3)); if (down) P.rect(9, 11, 2, 4, shade(scarf, 0.75)); else P.rect(5, 11, 2, 4, shade(scarf, 0.75)); }
  }
  if (acc === 1 && up) { box(4, 10, 8, 9, capeC); P.rect(6, 11, 1, 7, shade(capeC, 0.8)); P.rect(9, 11, 1, 7, shade(capeC, 0.8)); }

  // ===== bras et épaulières =====
  const armC = cls === 'guerrier' ? '#8f98a6' : cls === 'mage' ? K.main : cls === 'voleur' ? K.main : K.cloth;
  if (side) {
    P.rect(8, 11, 2, 4, shade(armC, 0.85)); P.px(8, 11, shade(armC, 1.2));
    P.px(9, 15, cls === 'guerrier' ? steel : s);
    if (cls === 'guerrier') { P.rect(7, 9, 4, 2, steel); P.rect(7, 9, 4, 1, shade(steel, 1.3)); }
  } else {
    const aw = cls === 'mage' ? 2 : 2;
    box(2, 10, aw, 5, armC); box(12, 10, aw, 5, armC);
    const hand = cls === 'guerrier' ? steel : s;
    P.rect(2, 15, 2, 1, hand); P.rect(12, 15, 2, 1, hand);
    if (cls === 'guerrier') {   // épaulières
      for (const x of [1, 11]) { P.rect(x, 9, 4, 2, steel); P.rect(x, 9, 4, 1, shade(steel, 1.35)); P.px(x + 3, 10, shade(steel, 0.6)); }
    }
    if (cls === 'archer') { P.rect(2, 13, 2, 2, leather); P.rect(12, 13, 2, 2, leather); }   // brassards
  }

  // ===== tête =====
  const faceDark = cls === 'voleur' || cls === 'archer';   // visage dans l'ombre de la capuche
  if (side) {
    P.rect(5, 3, 7, 6, s); P.rect(6, 2, 5, 1, s); P.rect(6, 9, 5, 1, sD); P.px(12, 6, s); P.rect(5, 8, 6, 1, sD);
    P.rect(10, 6, 1, 2, E); P.rect(9, 5, 2, 1, line); P.px(11, 8, sD);
  } else {
    P.rect(4, 3, 8, 6, s); P.rect(5, 2, 6, 1, s); P.rect(5, 9, 6, 1, sD); P.px(3, 6, s); P.px(12, 6, sD);
    P.rect(4, 8, 8, 1, sD); P.rect(11, 3, 1, 6, sD);
    if (down) {
      P.rect(6, 6, 1, 2, E); P.rect(9, 6, 1, 2, E); P.px(6, 6, '#ffffff');  P.px(9, 6, '#ffffff');
      P.px(5, 5, line); P.px(6, 5, line); P.px(9, 5, line); P.px(10, 5, line); P.px(5, 4, line); P.px(10, 4, line);   // sourcils froncés
      P.rect(7, 8, 2, 1, shade(s, 0.62));
      if (!fem && cls !== 'mage') { P.px(5, 9, sD); P.px(10, 9, sD); }
      if (fem) { P.px(5, 7, line); P.px(10, 7, line); }
    }
  }
  // lunettes
  if (acc === 2 && cls !== 'guerrier') {
    const lens = '#9fd6ff', rim = '#2a2030';
    if (down) { P.rect(5, 6, 2, 2, lens); P.rect(9, 6, 2, 2, lens); P.rect(4, 5, 8, 1, rim); P.px(6, 7, E); P.px(9, 7, E); }
    else if (side) { P.rect(9, 6, 3, 2, lens); P.rect(6, 5, 6, 1, rim); P.px(10, 7, E); }
  }

  // ===== cheveux, casques, capuches, chapeaux =====
  if (cls === 'guerrier') {
    const [hi, m, lo] = T3(steel);
    if (fem) { if (down) { P.rect(3, 6, 1, 7, h); P.rect(12, 6, 1, 7, hD); } else if (up) P.rect(4, 8, 8, 4, h); else P.rect(4, 6, 2, 7, h); }
    if (side) {
      P.rect(5, 1, 7, 8, m); P.rect(6, 0, 5, 1, m); P.rect(5, 1, 7, 1, hi); P.rect(5, 8, 7, 1, lo); P.rect(5, 2, 1, 6, hi);
      P.rect(9, 4, 3, 1, E); P.rect(10, 3, 1, 5, gold); P.rect(5, 5, 4, 1, lo);
      P.rect(5, -3, 3, 3, K.acc); P.px(4, -2, K.acc); P.px(3, -1, K.acc); P.px(6, -3, shade(K.acc, 1.3));
    } else {
      P.rect(4, 1, 8, 8, m); P.rect(5, 0, 6, 1, m); P.rect(4, 1, 8, 1, hi); P.rect(4, 2, 1, 6, hi); P.rect(11, 2, 1, 7, lo); P.rect(4, 8, 8, 1, lo);
      if (down) { P.rect(5, 5, 6, 1, E); P.rect(7, 2, 2, 7, gold); P.px(7, 2, shade(gold, 1.3)); P.rect(5, 7, 2, 1, lo); P.rect(9, 7, 2, 1, lo); P.px(8, 5, E); P.px(7, 5, E); }
      else { P.rect(7, 1, 2, 7, lo); }
      P.rect(7, -3, 2, 3, K.acc); P.px(9, -2, K.acc); P.px(9, -1, K.acc); P.px(7, -3, shade(K.acc, 1.3));
    }
  } else if (cls === 'voleur') {
    const hood = K.cloth, [hi, m, lo] = T3(hood);
    if (up) { P.rect(3, 1, 10, 10, m); P.rect(4, 0, 8, 1, m); P.rect(4, 11, 8, 2, lo); P.rect(3, 1, 1, 9, hi); P.rect(7, 1, 1, 9, lo); if (fem) for (let i = 0; i < 5; i++) P.px(8, 11 + i, i % 2 ? hD : h); }
    else if (side) {
      P.rect(4, 1, 8, 4, m); P.rect(5, 0, 6, 1, m); P.rect(4, 5, 3, 6, m); P.rect(4, 1, 8, 1, hi); P.rect(4, 5, 1, 6, lo);
      P.rect(7, 5, 5, 4, shade(s, 0.5)); P.px(10, 6, '#ffd84a'); P.rect(7, 7, 5, 3, K.acc); P.px(11, 7, shade(K.acc, 1.3));
    } else {
      P.rect(3, 1, 10, 4, m); P.rect(4, 0, 8, 1, m); P.rect(3, 5, 2, 6, m); P.rect(11, 5, 2, 6, lo); P.rect(3, 1, 10, 1, hi); P.rect(3, 2, 1, 8, hi);
      P.rect(5, 5, 6, 3, shade(s, 0.45)); P.px(6, 6, '#ffd84a'); P.px(9, 6, '#ffd84a'); P.px(5, 5, E); P.px(10, 5, E);
      P.rect(5, 7, 6, 3, K.acc); P.rect(5, 7, 6, 1, shade(K.acc, 1.3)); P.px(10, 9, shade(K.acc, 0.7));
      if (fem) { P.rect(13, 8, 1, 6, h); P.px(13, 14, hD); }
    }
  } else if (cls === 'mage') {
    const hat = K.cloth, [hi, m, lo] = T3(hat);
    if (!up && !fem) {   // barbe de sage
      const bc = +look[2] === 0 ? '#d8d4cc' : shade(h, 1.1);
      if (down) { P.rect(5, 7, 6, 3, bc); P.rect(6, 10, 4, 2, bc); P.px(7, 12, bc); P.px(8, 12, shade(bc, 0.8)); P.rect(7, 8, 2, 1, shade(bc, 0.7)); P.px(10, 9, shade(bc, 0.8)); }
      else if (side) { P.rect(8, 7, 4, 3, bc); P.rect(9, 10, 2, 2, bc); }
    }
    if (fem && !up) { if (down) { P.rect(3, 3, 1, 10, h); P.rect(12, 3, 1, 10, hD); P.rect(4, 3, 1, 3, h); P.rect(11, 3, 1, 3, hD); } }
    if (fem && up) { P.rect(3, 3, 10, 10, h); P.rect(4, 12, 8, 1, hD); }
    if (!fem && up) { P.rect(4, 3, 8, 7, +look[2] === 0 ? '#d8d4cc' : h); P.rect(5, 9, 6, 1, hD); }
    if (side) {
      P.rect(2, 2, 12, 1, lo); P.rect(4, 0, 8, 2, m); P.rect(5, -2, 6, 2, m); P.rect(5, -4, 5, 2, m); P.rect(4, -6, 4, 2, m); P.rect(2, -7, 3, 2, m); P.px(1, -7, m);
      P.rect(4, 1, 8, 1, gold); P.rect(5, -2, 1, 2, hi); P.rect(5, -4, 1, 2, hi);
    } else {
      P.rect(1, 2, 14, 1, lo); P.rect(2, 1, 12, 1, m); P.rect(4, -1, 8, 2, m); P.rect(5, -3, 6, 2, m); P.rect(6, -5, 4, 2, m); P.rect(8, -7, 3, 2, m); P.rect(10, -8, 2, 1, m);
      P.rect(4, 0, 8, 1, gold); P.rect(4, -1, 1, 2, hi); P.rect(5, -3, 1, 2, hi); P.rect(6, -5, 1, 2, hi); P.rect(11, -1, 1, 2, lo);
      if (down) { P.px(8, -2, '#7fe0ff'); }
    }
  } else if (cls === 'archer') {
    const hood = K.main, [hi, m, lo] = T3(hood);
    if (up) { P.rect(3, 1, 10, 9, m); P.rect(4, 0, 8, 1, m); P.px(7, -1, m); P.px(8, -2, m); P.rect(3, 1, 1, 8, hi); P.rect(4, 10, 8, 2, lo); P.rect(10, 4, 2, 8, leather); P.px(10, 3, '#e8e2d0'); P.px(11, 2, '#c23b3b'); if (fem) for (let i = 0; i < 4; i++) P.px(7, 11 + i, i % 2 ? hD : h); }
    else if (side) {
      P.rect(4, 1, 8, 3, m); P.rect(5, 0, 6, 1, m); P.px(4, -1, m); P.px(3, -2, m); P.rect(4, 4, 2, 7, m); P.rect(4, 1, 8, 1, hi); P.rect(4, 4, 1, 7, lo);
      P.rect(6, 4, 6, 1, shade(s, 0.6)); if (fem) P.rect(3, 6, 1, 6, h);
    } else {
      P.rect(3, 1, 10, 3, m); P.rect(4, 0, 8, 1, m); P.px(7, -1, m); P.px(8, -2, hi); P.rect(3, 4, 1, 7, m); P.rect(12, 4, 1, 7, lo); P.rect(3, 1, 10, 1, hi); P.rect(3, 2, 1, 8, hi);
      P.rect(4, 4, 8, 1, shade(s, 0.55)); P.rect(4, 5, 1, 3, shade(s, 0.65)); P.rect(11, 5, 1, 3, shade(s, 0.55));
      P.rect(3, 10, 10, 1, lo);
      if (fem) { P.rect(5, 4, 6, 1, h); P.px(13, 8, h); P.px(13, 9, hD); P.px(13, 10, h); P.px(13, 11, hD); }
    }
  }
  // casque trouvé (autres classes) : un bandeau de métal sur le front
  if (G.casque && cls !== 'guerrier') {
    const tc = TIER_C[G.casque];
    if (side) { P.rect(5, 3, 7, 1, tc); P.rect(5, 4, 7, 1, shade(tc, 0.7)); }
    else if (cls !== 'voleur' || up) { P.rect(4, 3, 8, 1, tc); P.rect(4, 4, 8, 1, shade(tc, 0.7)); if (down) P.px(7, 3, G.casque === 3 ? '#c0303a' : shade(tc, 1.3)); }
    else { P.rect(4, 2, 8, 1, tc); P.px(7, 2, G.casque === 3 ? '#c0303a' : shade(tc, 1.3)); }
  }

  // ===== armes devant =====
  if (down) {
    if (cls === 'guerrier') {
      P.rect(14, 3, 1, 12, blade); P.rect(13, 4, 1, 10, bladeD); P.px(14, 2, blade); P.rect(12, 14, 4, 1, gold); P.px(13, 15, leather); P.px(14, 16, gold);
      // bouclier : écu sombre avec emblème
      P.rect(-1, 10, 5, 7, K.acc); P.rect(0, 17, 3, 1, K.acc); P.px(1, 18, K.acc);
      P.rect(-1, 10, 5, 1, steel); P.rect(-1, 10, 1, 7, steel); P.rect(3, 10, 1, 7, shade(steel, 0.6));
      P.rect(1, 12, 1, 4, gold); P.rect(0, 13, 3, 1, gold);
    }
    if (cls === 'voleur') {
      P.rect(13, 13, 1, 4, blade); P.px(13, 17, bladeD); P.rect(12, 12, 3, 1, '#7a5a2a');
      P.rect(2, 13, 1, 4, blade); P.px(2, 17, bladeD); P.rect(1, 12, 3, 1, '#7a5a2a');
    }
    if (cls === 'mage') {
      P.rect(14, 1, 1, 17, wood); P.rect(14, 1, 1, 17, wood); P.px(14, 5, woodH); P.px(14, 9, woodH);
      P.rect(13, -2, 3, 3, crystal); P.px(13, -2, '#ffffff'); P.px(14, -3, crystal); P.rect(13, 1, 3, 1, gold);
    }
    if (cls === 'archer') {
      P.px(0, 8, wood); P.px(-1, 9, wood); P.rect(-2, 10, 1, 5, woodH); P.px(-1, 15, wood); P.px(0, 16, wood);
      P.rect(0, 9, 1, 7, '#d8d0c0'); P.rect(1, 12, 2, 2, s);
    }
  } else if (up) {
    if (cls === 'guerrier') { P.rect(0, 10, 4, 7, K.acc); P.rect(0, 10, 4, 1, steel); P.rect(1, 12, 2, 3, shade(K.acc, 0.7)); }
    if (cls === 'voleur') { P.rect(2, 11, 1, 4, blade); P.rect(13, 11, 1, 4, blade); }
    if (cls === 'archer') { P.rect(14, 9, 1, 7, woodH); }
  } else {
    if (cls === 'guerrier') { P.rect(11, 13, 8, 1, blade); P.rect(11, 14, 7, 1, bladeD); P.px(19, 13, blade); P.rect(10, 12, 1, 3, gold); P.rect(2, 10, 3, 7, K.acc); P.rect(2, 10, 3, 1, steel); }
    if (cls === 'voleur') { P.rect(11, 13, 5, 1, blade); P.px(16, 13, bladeD); P.rect(10, 12, 1, 3, '#7a5a2a'); }
    if (cls === 'mage') { P.rect(11, 1, 1, 17, wood); P.px(11, 6, woodH); P.rect(10, -2, 3, 3, crystal); P.px(10, -2, '#ffffff'); P.rect(10, 1, 3, 1, gold); }
    if (cls === 'archer') { P.px(12, 7, wood); P.px(13, 8, wood); P.rect(14, 9, 1, 6, woodH); P.px(13, 15, wood); P.px(12, 16, wood); P.rect(12, 8, 1, 8, '#d8d0c0'); P.rect(8, 12, 6, 1, '#5a3a1e'); P.px(14, 12, '#cfd6de'); }
  }
  if (acc === 4) {   // couronne d'or par-dessus tout
    const cy = cls === 'guerrier' ? -2 : cls === 'mage' ? -3 : -1, cx = side ? 6 : 5;
    P.rect(cx, cy + 1, 6, 2, '#f2c94c'); P.px(cx, cy, '#f2c94c'); P.px(cx + 2, cy - 1, '#f2c94c'); P.px(cx + 3, cy - 1, '#f2c94c'); P.px(cx + 5, cy, '#f2c94c');
    P.rect(cx, cy + 1, 6, 1, '#fff2b0'); P.px(cx + 2, cy + 2, '#c0303a'); P.px(cx + 4, cy + 2, '#3a7ae0');
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
// Feuillage en touffes rondes, ombré comme la bordure de forêt : clair en haut à gauche, sombre en bas à droite
function leafBlob(P, cx, cy, r, pal, alt) {
  for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) {
    if (i * i + j * j > r * r + r * 0.6) continue;
    P.px(cx + i, cy + j, i + j < -r * 0.6 ? pal[2] : i + j > r * 0.7 ? pal[3] : alt ? pal[0] : pal[1]);
  }
}
function spriteFor(o, TH = THEMES.village) {
  const w = Math.round(o.w / PX), h = Math.round(o.h / PX);
  let P, ax, ay;   // ax, ay : où se trouve le coin haut-gauche du rectangle de collision dans le dessin
  const kind = o.kind;
  if (kind === 'oak' || kind === 'willow') {
    P = new Painter(30, 34); ax = 15 - w / 2; ay = 34 - h - 1;
    P.rect(13, 20, 4, 11, '#5a3a20'); P.rect(13, 20, 1, 11, '#7a5030'); P.rect(16, 21, 1, 10, '#3e2614'); P.px(12, 30, '#5a3a20'); P.px(17, 30, '#5a3a20');
    const pal = kind === 'oak' ? TH.arbres : TH.arbres.map(c => shade(c, 1.12));
    const blobs = [[15, 5, 6], [9, 9, 6], [21, 9, 6], [15, 11, 7], [8, 15, 5], [22, 15, 5], [12, 18, 5], [18, 18, 5]];
    blobs.forEach(([x, y, r], i) => leafBlob(P, x, y, r, pal, i % 2));
    if (kind === 'willow') for (let i = 0; i < 7; i++) { P.rect(5 + i * 3, 19, 1, 5 + (i % 3) * 2, pal[3]); P.px(5 + i * 3, 19, pal[1]); }
    else for (const [x, y] of [[10, 9], [20, 15], [15, 12]]) P.px(x, y, TH === THEMES.hiver ? '#ffffff' : '#c9433a');
  } else if (kind === 'pine' || kind === 'snowpine') {
    P = new Painter(26, 36); ax = 13 - w / 2; ay = 36 - h - 1;
    P.rect(11, 27, 4, 7, '#4a3018'); P.rect(11, 27, 1, 7, '#6a4428');
    const pal = TH.arbres.slice(); if (kind === 'snowpine') pal[2] = shade(pal[0], 1.25);
    // étages du bas vers le haut pour que chaque étage recouvre celui du dessous
    for (const [ty, hw] of [[21, 12], [15, 10], [9, 9], [3, 7]]) {
      for (let j = 0; j < 8; j++) {
        const ww = Math.round(hw * (0.3 + j / 10));
        for (let i = -ww; i < ww; i++) P.px(13 + i, ty + j, j > 5 ? pal[3] : i < -ww * 0.35 ? pal[2] : i > ww * 0.4 ? pal[3] : (i + j) % 5 ? pal[0] : pal[1]);
      }
      if (kind === 'snowpine') for (let j = 0; j < 3; j++) { const ww = Math.round(hw * (0.3 + j / 10)); P.rect(13 - ww, ty + j, ww * 2, 1, j === 2 ? '#cfe0ee' : '#f4f8ff'); }
    }
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
  } else if (kind === 'lamp') {
    // réverbère de fer forgé avec sa lanterne
    P = new Painter(12, 32); ax = 6 - w / 2; ay = 32 - h - 1;
    P.rect(4, 27, 4, 3, '#2e2a33'); P.rect(5, 9, 2, 19, '#3a3640'); P.px(5, 10, '#5a5664');
    P.rect(2, 7, 8, 2, '#2e2a33'); P.rect(3, 1, 6, 6, '#2e2a33'); P.rect(4, 2, 4, 4, '#ffd27a'); P.px(4, 2, '#fff3c0'); P.rect(4, 0, 4, 1, '#2e2a33');
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
  village: { herbe: ['#6a9a55', '#61904e', '#76a660', '#4f7d42'], falaise: ['#b86f3c', '#8a4a26', '#d68e52', '#6a3a1e'], arbres: ['#2f7a3f', '#3f9a4a', '#5cb860', '#215a2e'], fond: '#2f7a3f' },
  foret:   { herbe: ['#56884a', '#4d7d43', '#629553', '#3d6a37'], falaise: ['#a0623a', '#7a4524', '#c07f4c', '#5a3218'], arbres: ['#25603a', '#2f7a44', '#4f9a52', '#183f26'], fond: '#183f26' },
  desert:  { herbe: ['#8fb35a', '#82a650', '#9cc065', '#6f9445'], falaise: ['#c98f52', '#9e6a38', '#e2ad6e', '#7a4f28'], arbres: ['#3f7a3a', '#4f9a4a', '#6cb860', '#2a5a2e'], fond: '#9e6a38' },
  donjon:  { herbe: ['#5a5f6a', '#525763', '#646a75', '#454a55'], falaise: ['#6d6a7a', '#4a4757', '#8a8796', '#33313f'], arbres: ['#2f4a3a', '#3f5a4a', '#5a7a5a', '#1f3328'], fond: '#141019' },
  hiver:   { herbe: ['#eef4fa', '#e2ebf4', '#ffffff', '#c8d8e8'], falaise: ['#b8cde0', '#8aa3be', '#e4eff8', '#6a84a0'], arbres: ['#2f6a4a', '#3f8a5a', '#e8f2fa', '#1f4a35'], fond: '#8aa3be' },
  cite:    { herbe: ['#6a8a55', '#61804e', '#76955f', '#4f6d42'], falaise: ['#8a8590', '#66626e', '#a8a4ae', '#46424e'], arbres: ['#3f6a3a', '#4a7a44', '#6a9a5a', '#2a4a28'], fond: '#46424e' },
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
  // distance au rivage pour chaque pixel d'eau (deux passes, rapide) : sert à foncer l'eau profonde
  const wd = new Uint8Array(AW * AH);
  for (let y = 0; y < AH; y++) for (let x = 0; x < AW; x++) {
    const k = y * AW + x;
    if (vt[k] !== '~') { wd[k] = 0; continue; }
    wd[k] = Math.min(255, 1 + Math.min(x ? wd[k - 1] : 255, y ? wd[k - AW] : 255));
  }
  for (let y = AH - 1; y >= 0; y--) for (let x = AW - 1; x >= 0; x--) {
    const k = y * AW + x;
    if (!wd[k]) continue;
    wd[k] = Math.min(wd[k], 1 + Math.min(x < AW - 1 ? wd[k + 1] : 255, y < AH - 1 ? wd[k + AW] : 255));
  }
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
      // ----- eau : plus profonde au large, reflets discrets -----
      let shore = false;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const n = V(x + dx, y + dy); if (n !== '~' && n !== 'B' && n !== '=') shore = true; }
      if (shore) c = '#2f5a6e';
      else {
        const u = Math.min(1, wd[y * AW + x] / 16), cl = cells(x, y, 9, 21);
        const W0 = map.theme === 'marais' ? [88, 128, 104] : map.theme === 'donjon' ? [58, 92, 128] : [92, 158, 176];
        const W1 = map.theme === 'marais' ? [42, 72, 58] : map.theme === 'donjon' ? [24, 40, 70] : [34, 82, 112];
        const mix = i => Math.round(W0[i] + (W1[i] - W0[i]) * u);
        c = '#' + [mix(0), mix(1), mix(2)].map(v => v.toString(16).padStart(2, '0')).join('');
        if (cl.d2 - cl.d1 < 0.9 && u < 0.6) c = shade(c, 1.18);
        if (Math.sin(x * 0.21 + Math.sin(y * 0.09) * 3 + noise(x / 20, y / 20, 8) * 6) > 0.975 && hsh(x >> 3, y >> 1, 40) < 0.35) c = shade(c, 1.22);
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
      // quai de pierre le long du canal de la cité
      if (t === 'p' && map.theme === 'cite') {
        let q = 9;
        for (let k = 1; k <= 3 && q > 3; k++) for (const [dx, dy] of [[k, 0], [-k, 0], [0, k], [0, -k]]) if (isW(V(x + dx, y + dy))) { q = Math.min(q, k); break; }
        if (q <= 3) c = q === 1 ? '#3e3a46' : (x + y) % 6 === 0 ? '#5a5664' : '#77737f';
      }
      // plage autour de l'eau
      if (t !== 'B' && t !== '=' && t !== 'v' && t !== 'L' && t !== 'p' && t !== 'f' && t !== 'w' && t !== 't') {
        let nw = 9;
        for (let k = 1; k <= 3 && nw > 3; k++) for (const [dx, dy] of [[k, 0], [-k, 0], [0, k], [0, -k], [k, k], [-k, -k], [k, -k], [-k, k]]) if (isW(V(x + dx, y + dy))) { nw = Math.min(nw, k); break; }
        if (nw <= 2) c = H ? '#d8e6f2' : map.theme === 'donjon' ? '#5a5a6a' : map.theme === 'marais' ? '#8a7a4a' : '#c8b27c';
        else if (nw === 3 && (t === '.' || t === 'n')) c = H ? '#c6d6e6' : map.theme === 'marais' ? '#6a5a32' : '#a8925e';
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
    const s = spriteFor(o, TH);
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
    // même feuillage en touffes que les arbres et la bordure de forêt
    const bp = dark ? ['#4f6d33', '#46632e', '#6a8a44', '#2f4520'] : TH.arbres, br = Math.max(4, Math.round(r * 0.42));
    const spots = [[0, -0.45], [-0.5, -0.15], [0.5, -0.15], [0, 0.05], [-0.4, 0.35], [0.4, 0.35]];
    spots.forEach(([dx, dy], i) => leafBlob(P, c + Math.round(dx * r), c + Math.round(dy * r), br, bp, i % 2));
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
  const lamps = map.objs.filter(o => o.kind === 'lamp').map(o => [o.x + o.w / 2, o.y - 72]);
  mapAnim = { glints, torches, lamps };
  // ----- finition « plateau de jeu de rôle » (calculée une seule fois au chargement) -----
  // 1) ombres portées des arbres, toits et buissons, décalées vers le bas à droite
  const sc = document.createElement('canvas'); sc.width = AW; sc.height = AH;
  const sg = sc.getContext('2d');
  sg.drawImage(top, 0, 0); sg.globalCompositeOperation = 'source-in'; sg.fillStyle = 'rgba(16,12,24,0.34)'; sg.fillRect(0, 0, AW, AH);
  g.drawImage(sc, 4, 6);
  // 2) quadrillage discret sur les sols praticables (1 case = 1 tuile)
  const floorT = t => !WALLS_T.includes(t) && !WATER_T.includes(t);
  g.fillStyle = map.theme === 'hiver' ? 'rgba(60,80,110,0.14)' : 'rgba(20,14,8,0.16)';
  for (let j = 0; j < map.rows; j++) for (let i = 0; i < map.cols; i++) {
    if (!floorT(tile(i, j))) continue;
    if (i > 0 && floorT(tile(i - 1, j))) for (let y = 0; y < TS; y += 2) g.fillRect(i * TS, j * TS + y, 1, 1);
    if (j > 0 && floorT(tile(i, j - 1))) for (let x = 0; x < TS; x += 2) g.fillRect(i * TS + x, j * TS, 1, 1);
  }
  // 3) couleurs plus sobres : moins saturées, plus chaudes, avec des taches de lumière et des bords assombris
  // taches de lumière précalculées par blocs de 4 pixels (plus rapide)
  const MW = (AW >> 2) + 1, MH = (AH >> 2) + 1, mot = new Float32Array(MW * MH);
  for (let j = 0; j < MH; j++) for (let i = 0; i < MW; i++) mot[j * MW + i] = 0.86 + noise(i / 7.5, j / 7.5, 31) * 0.16 + noise(i / 1.75, j / 1.75, 32) * 0.07;
  const grade = (cv, mottle) => {
    const cx = cv.getContext('2d'), im = cx.getImageData(0, 0, AW, AH), d = im.data;
    const cold = map.theme === 'hiver', sat = cold ? 0.85 : 0.76;
    for (let y = 0; y < AH; y++) for (let x = 0; x < AW; x++) {
      const k = (y * AW + x) * 4;
      if (!d[k + 3]) continue;
      let r = d[k], gg = d[k + 1], b = d[k + 2];
      const L = r * 0.3 + gg * 0.59 + b * 0.11;
      r = L + (r - L) * sat; gg = L + (gg - L) * sat; b = L + (b - L) * sat;
      let m = 1;
      if (mottle) {
        m = mot[(y >> 2) * MW + (x >> 2)];
        const e = Math.min(x, y, AW - 1 - x, AH - 1 - y);
        if (e < 48) m *= 0.78 + 0.22 * (e / 48);
      }
      if (cold) { m = 1 + (m - 1) * 0.35; d[k] = Math.min(255, r * 0.97 * m); d[k + 1] = Math.min(255, gg * m); d[k + 2] = Math.min(255, b * 1.03 * m); }
      else { d[k] = Math.min(255, r * 1.04 * m); d[k + 1] = Math.min(255, gg * 1.0 * m); d[k + 2] = Math.min(255, b * 0.9 * m); }
    }
    cx.putImageData(im, 0, 0);
  };
  grade(ground, true); grade(top, false);
  mapLayer = ground; topLayer = top;
}

// ---------- Petits dessins dynamiques : coffres, objets, boss ----------
const dynCache = {};
// coffre doré : plus difficile (2 questions de suite), meilleur trésor
function chestSprite(open, gold = false) {
  const key = 'chest' + open + gold;
  if (dynCache[key]) return dynCache[key];
  const P = new Painter(18, 16);
  const body = gold ? '#d9a020' : '#a0642e', top = gold ? '#f2c94c' : '#c08040', line = gold ? '#8a5a10' : '#6b3f1a', band = gold ? '#fff2b0' : '#e3b341', hi = gold ? '#ffe27a' : '#d89a58';
  if (!open) {
    P.rect(1, 3, 16, 12, body); P.rect(1, 3, 16, 5, top); P.rect(1, 8, 16, 1, line);
    P.rect(1, 3, 2, 12, band); P.rect(15, 3, 2, 12, band); P.rect(7, 7, 4, 4, band); P.px(8, 9, gold ? '#c0303a' : OUT); P.rect(2, 4, 14, 1, hi);
    if (gold) { P.px(9, 9, '#c0303a'); P.px(8, 8, '#ff8a8a'); }
  } else {
    P.rect(1, 7, 16, 8, body); P.rect(1, 0, 16, 5, top); P.rect(2, 5, 14, 2, '#3a2214');
    P.rect(1, 0, 2, 5, band); P.rect(15, 0, 2, 5, band); P.rect(1, 7, 2, 8, band); P.rect(15, 7, 2, 8, band);
  }
  return (dynCache[key] = P.outline().canvas());
}
function flagSprite(col, fr, hill = false) {
  const key = 'flag' + col + fr + hill;
  if (dynCache[key]) return dynCache[key];
  const P = new Painter(16, 24);
  P.rect(1, 0, 2, 24, '#6b4a2a'); P.px(1, 0, '#f2c94c'); P.px(2, 0, '#f2c94c');
  const w = fr ? [0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1] : [1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0];
  for (let i = 0; i < 11; i++) { P.rect(3 + i, 2 + w[i], 1, 8, col); P.px(3 + i, 2 + w[i], shade(col, 1.3)); P.px(3 + i, 9 + w[i], shade(col, 0.65)); }
  if (hill) { P.px(7, 6, '#5a4a3a'); P.rect(6, 7, 3, 1, '#5a4a3a'); P.rect(5, 8, 5, 1, '#5a4a3a'); P.px(7, 6, '#ffffff'); }
  else P.rect(7, 5 + w[4], 3, 2, '#ffffff');
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
// Familiers féroces qui suivent leur héros (1 chat sauvage, 2 loup, 3 dragon, 4 grand-duc, 5 slime), 4 couleurs chacun
const PET_COULEURS = {
  1: ['#e8923a', '#9aa0ab', '#4a4550', '#f2eee6', '#e8b83a', '#a8eaff'],
  2: ['#b07a45', '#e0b060', '#4a4550', '#f2eee6', '#e8b83a', '#a8eaff'],
  3: ['#4fbf5a', '#e0503a', '#4a8ae0', '#9a5ae0', '#e8b83a', '#a8eaff'],
  4: ['#8b6a45', '#8a8f99', '#ecebe6', '#c0703a', '#e8b83a', '#a8eaff'],
  5: ['#5ac85a', '#4aa8e8', '#f080b8', '#a070e0', '#e8b83a', '#a8eaff'],
};
function petSprite(k, fr, col = 0) {
  const key = 'pet' + k + fr + col;
  if (dynCache[key]) return dynCache[key];
  const P = new Painter(18, 16), b = fr ? 1 : 0;
  const c = (PET_COULEURS[k] || ['#888'])[col] || PET_COULEURS[k][0], d = shade(c, 0.66), l = shade(c, 1.3), dd = shade(c, 0.45);
  const eye = '#ffd84a';
  if (k === 1) {        // chat sauvage : silhouette fine, oreilles pointues, queue dressée
    P.rect(3, 8, 8, 4, c); P.rect(3, 8, 8, 1, l); P.rect(4, 11, 7, 1, d);
    P.rect(3, 11, 1, 3, d); P.rect(5, 11, 1, 3 - b, c); P.rect(8, 11, 1, 3, d); P.rect(10, 11, 1, 3 - (1 - b), c);
    P.rect(10, 4, 6, 5, c); P.rect(10, 4, 6, 1, l); P.px(10, 3, c); P.px(10, 2, c); P.px(15, 3, c); P.px(15, 2, c); P.px(11, 3, l); P.px(14, 3, l);
    P.px(12, 6, eye); P.px(14, 6, eye); P.px(11, 5, dd); P.px(12, 5, dd); P.px(14, 5, dd); P.px(15, 5, dd);
    P.rect(16, 7, 1, 1, '#d87a7a'); P.rect(12, 8, 4, 1, d);
    P.rect(1, 6 - b, 1, 4, c); P.rect(2, 9, 1, 1, c); P.px(1, 5 - b, d);
    if (col !== 2) { P.px(5, 9, d); P.px(7, 9, d); P.px(6, 10, d); }
  } else if (k === 2) { // loup : oreilles dressées, collerette de fourrure, museau long
    P.rect(2, 7, 9, 5, c); P.rect(2, 7, 9, 1, l); P.rect(3, 11, 8, 1, d);
    P.rect(2, 11, 2, 3, d); P.rect(5, 11, 1, 3 - b, c); P.rect(8, 11, 2, 3, d);
    P.rect(9, 5, 3, 5, l); P.px(9, 10, l); P.px(11, 10, l);   // collerette
    P.rect(11, 3, 5, 5, c); P.rect(11, 3, 5, 1, l); P.rect(15, 6, 3, 2, c); P.px(17, 6, '#1b1424'); P.rect(15, 8, 2, 1, d); P.px(16, 8, '#ffffff');
    P.px(11, 1, c); P.px(11, 2, c); P.px(13, 1, c); P.px(13, 2, c); P.px(12, 2, dd);
    P.px(14, 5, eye); P.px(13, 4, dd); P.px(14, 4, dd);
    P.rect(0, 6 - b, 2, 2, c); P.px(0, 5 - b, l); P.rect(1, 8, 1, 1, d);
  } else if (k === 3) { // dragon : cornes, piques, ailes de chauve-souris
    P.rect(4, 7, 7, 5, c); P.rect(4, 7, 7, 1, l); P.rect(5, 11, 5, 1, '#e8c86a'); P.rect(5, 10, 5, 1, '#d8b85a');
    for (let i = 0; i < 4; i++) P.px(4 + i * 2, 6, d);   // piques du dos
    P.rect(10, 3, 6, 5, c); P.rect(10, 3, 6, 1, l); P.rect(15, 6, 2, 2, c); P.px(16, 7, '#ffffff');
    P.px(10, 1, '#e8e2d0'); P.px(11, 2, '#e8e2d0'); P.px(13, 1, '#e8e2d0'); P.px(13, 2, '#e8e2d0');
    P.px(13, 5, eye); P.px(12, 4, dd); P.px(13, 4, dd); P.px(16, 5, dd);
    P.rect(0, 10, 4, 1, c); P.px(0, 9, c); P.px(0, 11, d);
    if (b) { P.rect(3, 1, 5, 5, d); P.rect(4, 0, 2, 1, d); P.px(4, 2, l); P.px(6, 3, l); P.rect(3, 5, 5, 1, dd); }
    else { P.rect(2, 5, 6, 3, d); P.px(1, 6, d); P.px(3, 6, l); P.px(5, 6, l); }
    P.rect(5, 12, 1, 1, dd); P.rect(9, 12, 1, 1, dd);
  } else if (k === 4) { // grand-duc : aigrettes, regard sévère, serres
    const belly = col === 2 ? '#ffffff' : shade(c, 1.55);
    P.ellipse(9, 8, 5, 6, c); P.ellipse(9, 10, 3, 3, belly); for (let i = 0; i < 3; i++) P.px(8 + i, 9 + (i % 2) * 2, d);
    P.px(5, 1, d); P.px(6, 2, c); P.px(13, 1, d); P.px(12, 2, c);   // aigrettes
    P.rect(6, 5, 2, 2, eye); P.rect(10, 5, 2, 2, eye); P.px(7, 6, '#1b1424'); P.px(10, 6, '#1b1424');
    P.rect(5, 4, 3, 1, dd); P.rect(10, 4, 3, 1, dd); P.px(8, 5, dd); P.px(9, 5, dd);   // sourcils froncés
    P.px(9, 7, '#d9a93a'); P.px(9, 8, '#b8892a');
    if (b) { P.rect(1, 5, 3, 3, d); P.rect(14, 5, 3, 3, d); P.px(0, 6, d); P.px(17, 6, d); } else { P.rect(4, 7, 1, 5, d); P.rect(13, 7, 1, 5, d); }
    P.rect(7, 14, 2, 1, '#d9a93a'); P.rect(10, 14, 2, 1, '#d9a93a');
  } else if (k === 5) { // slime en colère : sourcils, crocs, reflet
    const sq = b ? 1 : 0;
    P.ellipse(9, 10 + sq, 7 + sq, 5 - sq, d); P.ellipse(9, 9 + sq, 7 + sq, 5 - sq, c); P.ellipse(9, 7 + sq, 4, 2, l);
    P.rect(5, 6 + sq, 2, 1, '#ffffff'); P.px(4, 7 + sq, '#ffffff');
    P.rect(6, 8 + sq, 2, 2, '#1b1424'); P.rect(11, 8 + sq, 2, 2, '#1b1424'); P.px(6, 8 + sq, '#ff5a3a'); P.px(12, 8 + sq, '#ff5a3a');
    P.px(5, 7 + sq, dd); P.px(6, 7 + sq, dd); P.px(12, 7 + sq, dd); P.px(13, 7 + sq, dd);
    P.rect(7, 11 + sq, 5, 1, '#1b1424'); P.px(8, 12 + sq, '#ffffff'); P.px(10, 12 + sq, '#ffffff');
    P.px(3, 13, d); P.px(15, 13 - sq, d);
  }
  return (dynCache[key] = P.outline().canvas());
}
// Boss du mois : noms et couleurs affichés (le serveur a les mêmes)
const BOSS_INFO = {
  gobelin: { nom: 'Gobelin du Bruit', ico: '📢', col: '#9be05a' },
  dragon:  { nom: 'Dragon des Citrouilles', ico: '🎃', col: '#ffa040' },
  gluant:  { nom: 'Roi Gluant', ico: '👑', col: '#9af08a' },
};
function bossSprite(frame, flash, k = 'gluant') {
  const key = 'boss' + k + frame + flash;
  if (dynCache[key]) return dynCache[key];
  const P = new Painter(52, 46), sq = frame ? 1 : 0;
  const F = c => flash ? shade(c, 1.55) : c;   // flash blanc quand il est touché
  if (k === 'gobelin') {
    // Gobelin du Bruit : grandes oreilles, bouche grande ouverte qui crie, mégaphone et cymbale
    const sk = F('#6fae3a'), skD = F('#4a8226'), skL = F('#9be05a'), gold = F('#e8b83a'), goldD = F('#a87a1a');
    P.rect(17, 37 + sq, 6, 6, skD); P.rect(29, 37 - sq, 6, 6, skD); P.rect(15, 42, 9, 3, F('#5a3a20')); P.rect(28, 42, 9, 3, F('#5a3a20'));
    P.ellipse(26, 31, 13, 9, F('#7a3a2a')); P.ellipse(23, 28, 6, 3, F('#9a4a34')); P.rect(14, 33, 24, 2, F('#3a2414'));
    P.ellipse(26, 36, 6, 4, F('#c9a06a')); P.rect(20, 34, 13, 1, F('#8a2a2a')); P.rect(20, 38, 13, 1, F('#8a2a2a')); P.px(26, 33, gold);
    P.rect(9, 24 - sq, 5, 10, sk); P.disc(8, 36 - sq, 5, gold); P.disc(8, 36 - sq, 2, goldD); P.px(6, 34 - sq, F('#fff6c0'));
    P.rect(38, 24, 5, 7, sk);
    for (let i = 0; i < 9; i++) { const h = 4 + i; P.rect(42 + i, 25 - (h >> 1), 1, h, i === 8 ? goldD : gold); P.px(42 + i, 25 - (h >> 1), F('#fff2b0')); }
    for (let i = 0; i < 10; i++) { P.rect(4 + i, 8 + (i >> 2), 1, 3 + (i >> 1), i < 2 ? skD : sk); P.rect(47 - i, 8 + (i >> 2), 1, 3 + (i >> 1), i < 2 ? skD : sk); }
    P.ellipse(26, 15, 12, 10, sk); P.ellipse(21, 10, 5, 3, skL);
    P.rect(15, 4, 22, 3, F('#c0303a')); P.rect(15, 4, 22, 1, F('#e85a5a')); P.rect(11, 5, 4, 2, F('#c0303a')); P.px(10, 7, F('#c0303a'));
    P.rect(18, 11, 4, 3, '#ffe27a'); P.rect(30, 11, 4, 3, '#ffe27a'); P.px(20, 12, OUT); P.px(31, 12, OUT);
    P.rect(17, 9, 3, 1, OUT); P.rect(20, 10, 2, 1, OUT); P.rect(32, 9, 3, 1, OUT); P.rect(30, 10, 2, 1, OUT);
    P.rect(25, 14, 2, 2, skD);
    P.ellipse(26, 20, 6, 3 + sq, '#3a1414'); P.rect(21, 17, 10, 1, '#ffffff'); P.px(22, 18, '#ffffff'); P.px(29, 18, '#ffffff'); P.rect(24, 21 + sq, 4, 1, '#e04a5a');
  } else if (k === 'dragon') {
    // Dragon des Citrouilles : corps-citrouille sculpté qui luit, ailes de chauve-souris, cornes en vrilles
    const o = F('#e8781e'), oD = F('#b8521a'), oL = F('#ffa040'), glow = '#ffe27a', vine = F('#3a6a2a'), vineL = F('#5a9a3a'), wing = F('#4a2a5a'), wingL = F('#6a3f80');
    for (let i = 0; i < 13; i++) { const h = 13 - Math.floor(i * 0.7); P.rect(2 + i, 6 + Math.floor(i * 0.5) + sq, 1, h, i % 4 === 0 ? wingL : wing); P.rect(49 - i, 6 + Math.floor(i * 0.5) + sq, 1, h, i % 4 === 0 ? wingL : wing); }
    P.rect(4, 38, 8, 2, vine); P.rect(3, 34, 2, 5, vine); P.rect(4, 33, 3, 1, vineL);
    P.rect(15, 40, 6, 5, oD); P.rect(31, 40, 6, 5, oD); P.px(15, 44, '#e8e2d0'); P.px(17, 44, '#e8e2d0'); P.px(31, 44, '#e8e2d0'); P.px(33, 44, '#e8e2d0');
    P.ellipse(26, 32, 17, 11, o); P.ellipse(26, 33, 17, 10, o);
    for (const x of [15, 21, 31, 37]) P.rect(x, 24, 1, 18, oD);
    P.ellipse(19, 27, 4, 2, oL);
    P.rect(18, 29, 5, 1, glow); P.rect(19, 30, 3, 1, glow); P.px(20, 31, glow);
    P.rect(30, 29, 5, 1, glow); P.rect(31, 30, 3, 1, glow); P.px(32, 31, glow);
    P.rect(18, 35, 16, 3, glow); P.px(21, 35, oD); P.px(26, 35, oD); P.px(31, 35, oD); P.px(23, 37, oD); P.px(29, 37, oD);
    P.ellipse(26, 14, 10, 7, o); P.rect(32, 13, 9, 6, o); P.rect(32, 13, 9, 1, oL); P.rect(36, 19, 5, 1, oD); P.px(40, 14, OUT);
    P.rect(35, 18, 1, 1, '#ffffff'); P.rect(38, 18, 1, 1, '#ffffff');
    for (const x of [21, 26, 31]) P.rect(x, 8, 1, 12, oD);
    P.rect(25, 3, 3, 4, vine); P.px(28, 3, vineL); P.px(29, 2, vineL);
    P.rect(18, 7, 2, 2, vine); P.px(17, 5, vine); P.px(16, 4, vine); P.px(16, 3, vineL); P.rect(32, 7, 2, 2, vine); P.px(34, 5, vine); P.px(35, 4, vine); P.px(36, 3, vineL);
    P.rect(22, 12, 3, 2, '#9aff5a'); P.rect(29, 12, 3, 2, '#9aff5a'); P.px(23, 13, OUT); P.px(30, 13, OUT);
    P.rect(21, 11, 4, 1, OUT); P.rect(29, 11, 4, 1, OUT);
  } else {
    const b = flash ? '#c8ffc0' : '#5ac85a', bd = flash ? '#8ae08a' : '#3a9a44', bl = flash ? '#ffffff' : '#9af08a';
    P.ellipse(26, 30 + sq, 23 + sq, 14 - sq, bd);
    P.ellipse(26, 28 + sq, 22 + sq, 14 - sq, b);
    P.ellipse(17, 22 + sq, 6, 3, bl); P.px(12, 24, bl);
    P.rect(16, 25, 5, 6, '#ffffff'); P.rect(31, 25, 5, 6, '#ffffff'); P.rect(18, 27, 3, 4, OUT); P.rect(33, 27, 3, 4, OUT);
    P.rect(14, 23, 7, 1, OUT); P.rect(31, 23, 7, 1, OUT);
    P.rect(21, 35, 10, 2, OUT); P.rect(23, 37, 6, 1, '#e04a5a');
    P.rect(17, 9 + sq * 2, 18, 6, '#f2c94c'); P.rect(17, 5 + sq * 2, 3, 4, '#f2c94c'); P.rect(24, 3 + sq * 2, 4, 6, '#f2c94c'); P.rect(32, 5 + sq * 2, 3, 4, '#f2c94c');
    P.px(25, 11 + sq * 2, '#e04a5a'); P.px(19, 11 + sq * 2, '#3a7ae0'); P.px(32, 11 + sq * 2, '#3fbf5a');
  }
  return (dynCache[key] = P.outline().canvas());
}
// Sbires appelés par le boss enragé
function minionSprite(k, fr, flash) {
  const key = 'mn' + k + fr + flash;
  if (dynCache[key]) return dynCache[key];
  const P = new Painter(18, 18), b = fr ? 1 : 0;
  const F = c => flash ? shade(c, 1.6) : c;
  if (k === 'gobelin') {
    const sk = F('#6fae3a');
    P.rect(6, 14, 2, 3 - b, F('#4a8226')); P.rect(10, 14, 2, 2 + b, F('#4a8226'));
    P.rect(5, 10, 8, 5, F('#7a3a2a')); P.rect(5, 12, 8, 1, F('#3a2414'));
    P.rect(4, 3, 10, 7, sk); P.rect(1, 4, 3, 2, sk); P.px(0, 3, sk); P.rect(14, 4, 3, 2, sk); P.px(17, 3, sk);
    P.rect(4, 1, 10, 2, F('#c0303a'));
    P.px(6, 5, '#ffe27a'); P.px(11, 5, '#ffe27a'); P.rect(7, 7, 4, 2, '#3a1414'); P.px(7, 7, '#ffffff'); P.px(10, 7, '#ffffff');
    P.rect(14, 9 - b, 1, 5, F('#8a5a2a')); P.px(14, 8 - b, F('#e8b83a'));
  } else if (k === 'citrouille') {
    const o = F('#e8781e'), oD = F('#b8521a');
    P.rect(5, 15, 2, 2 - b, F('#3a6a2a')); P.rect(11, 15, 2, 1 + b, F('#3a6a2a'));
    P.ellipse(9, 10 - b, 7, 5, o); P.rect(6, 6 - b, 1, 9, oD); P.rect(12, 6 - b, 1, 9, oD);
    P.rect(8, 2 - b, 2, 3, F('#3a6a2a')); P.px(10, 2 - b, F('#5a9a3a'));
    P.rect(5, 8 - b, 2, 2, '#ffe27a'); P.rect(11, 8 - b, 2, 2, '#ffe27a'); P.rect(6, 12 - b, 6, 1, '#ffe27a'); P.px(8, 12 - b, oD);
  } else {
    const c = F('#5ac85a');
    P.ellipse(9, 12, 7 + b, 5 - b, F('#3a9a44')); P.ellipse(9, 11, 7 + b, 5 - b, c); P.ellipse(7, 9, 2, 1, F('#9af08a'));
    P.rect(6, 10, 2, 2, OUT); P.rect(11, 10, 2, 2, OUT); P.rect(8, 13, 3, 1, OUT);
  }
  return (dynCache[key] = P.outline().canvas());
}
const SBIRE_DE = { gobelin: 'gobelin', dragon: 'citrouille', gluant: 'slime' };

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
  for (const [x, y] of mapAnim.lamps || []) {
    const f = 0.1 + Math.sin(now * 5 + x) * 0.015;
    ctx.fillStyle = `rgba(255,200,110,${f})`; ctx.beginPath(); ctx.arc(x, y + 50, 90, 0, 7); ctx.fill();
    if (Math.sin(now * 9 + x * 3) > 0.2) sq(x - 1, y + 4, 1, '#ffffff');
  }
  for (const [x, y] of mapAnim.torches) {
    const f = Math.sin(now * 12 + x) > 0 ? 1 : 0;
    ctx.fillStyle = '#ff9a3018'; ctx.beginPath(); ctx.arc(x, y + 20, 100, 0, 7); ctx.fill();
    sq(x - 4, y - f * 3, 3, '#ff8a1e'); sq(x - 1, y - 4 - f * 3, 1, '#ffe27a'); sq(x - 4, y + 6, 3, '#5a3a1e');
  }
  // coffres et objets cachés
  if (map.chests) map.chests.forEach((c, i) => {
    const open = world.ch && world.ch[i] === '1', gold = world.gc === i;
    if (gold && !open) {   // halo doré qui pulse
      ctx.fillStyle = `rgba(255,214,90,${0.16 + Math.sin(now * 4) * 0.06})`; ctx.beginPath(); ctx.arc(c.x, c.y, 46, 0, 7); ctx.fill();
      for (let k = 0; k < 4; k++) { const a = now * 1.5 + k * Math.PI / 2; sq(c.x + Math.cos(a) * 34, c.y - 6 + Math.sin(a) * 20, 1 + (Math.floor(now * 6 + k) % 2), '#fff6c0'); }
    }
    ctx.globalAlpha = open ? 0.55 : 1;
    img(chestSprite(open, gold), c.x, c.y);
    ctx.globalAlpha = 1;
    if (!open && Math.floor(now * 2 + i) % 3 === 0) sq(c.x + 14 + Math.sin(now * 5 + i) * 6, c.y - 22, 1, '#fff6c0');
  });
  // colline : cercle qui pulse, de la couleur de l'équipe qui la tient (blanc : libre, rouge clignotant : contestée)
  if (world.hl) {
    const [x, y, r, own] = world.hl;
    const col = own >= 0 && teams && teams[own] ? teams[own].color : own === -2 ? (Math.floor(now * 4) % 2 ? '#ffffff' : '#ff5a4a') : '#f4ecd8';
    ctx.save(); ctx.globalAlpha = 0.28 + Math.sin(now * 3) * 0.07; ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
    ctx.lineWidth = big ? 16 : 7; ctx.strokeStyle = OUT; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.stroke();
    ctx.lineWidth = big ? 9 : 4; ctx.strokeStyle = col; ctx.setLineDash([big ? 30 : 18, big ? 14 : 9]); ctx.lineDashOffset = -now * 20; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.stroke(); ctx.restore();
    for (let k = 0; k < 6; k++) { const t = (now * 0.7 + k / 6) % 1, a = k * 1.7; sq(x + Math.cos(a) * r * 0.6, y + Math.sin(a) * r * 0.5 - t * 40, big ? 3 : 1, col); }
    img(flagSprite('#f4ecd8', 0, true), x, y - 20, big ? 6 : PX);
  }
  // drapeau : socle de chaque base
  if (world.fl) world.fl.forEach(([, , , hx, hy], i) => {
    const col = teams && teams[i] ? teams[i].color : '#ffffff';
    ctx.save(); ctx.globalAlpha = 0.35; ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(hx, hy + 10, 70, 44, 0, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
    ctx.lineWidth = big ? 14 : 6; ctx.strokeStyle = OUT; ctx.beginPath(); ctx.ellipse(hx, hy + 10, 70, 44, 0, 0, 7); ctx.stroke();
    ctx.lineWidth = big ? 8 : 3; ctx.strokeStyle = col; ctx.beginPath(); ctx.ellipse(hx, hy + 10, 70, 44, 0, 0, 7); ctx.stroke(); ctx.restore();
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
      for (let i = 0; i < 28; i++) { const a = i / 28 * Math.PI * 2; sq(f.x + Math.cos(a) * r, f.y + Math.sin(a) * r, 3, i % 2 ? (f.gold ? '#fff6c0' : '#ff8a1e') : '#ffe27a'); sq(f.x + Math.cos(a + 0.1) * r * 0.6, f.y + Math.sin(a + 0.1) * r * 0.6, 2, f.gold ? '#f2c94c' : '#ff4a1a'); }
    } else if (f.k === 'slam') {
      const r = f.r * (1.1 - t);
      for (let i = 0; i < 32; i++) { const a = i / 32 * Math.PI * 2; sq(f.x + Math.cos(a) * r, f.y + 20 + Math.sin(a) * r * 0.6, 3, i % 2 ? '#5ac85a' : '#9af08a'); }
    } else if (f.k === 'cri') {   // cri assourdissant : ondes sonores
      for (const m of [1, 0.7, 0.4]) {
        const r = f.r * Math.min(1, (1 - t) * 1.3 + (1 - m) * 0.2) * m;
        for (let i = 0; i < 30; i++) { if (i % 3 === 2) continue; const a = i / 30 * Math.PI * 2; sq(f.x + Math.cos(a) * r, f.y - 10 + Math.sin(a) * r * 0.7, big ? 4 : 2, m === 1 ? '#ffd54a' : '#ffffff'); }
      }
    } else if (f.k === 'souffle') {   // souffle de feu du dragon
      for (let i = 0; i < 46; i++) {
        const u = ((i * 37) % 100) / 100, d = f.r * u * Math.min(1, (1 - t) * 2), a = f.a + (((i * 53) % 100) / 100 - 0.5) * 0.9 * u;
        sq(f.x + Math.cos(a) * d, f.y + Math.sin(a) * d, u < 0.3 ? 4 : 3, u < 0.35 ? '#fff2a0' : u < 0.7 ? '#ff8a1e' : '#c23b1a');
      }
    } else if (f.k === 'cible') {   // citrouille qui va tomber ici
      ctx.globalAlpha = 1;
      ctx.save(); ctx.globalAlpha = 0.18 + (1 - t) * 0.3; ctx.fillStyle = '#ff3a2a'; ctx.beginPath(); ctx.ellipse(f.x, f.y + 10, f.r, f.r * 0.6, 0, 0, 7); ctx.fill(); ctx.restore();
      for (let i = 0; i < 24; i++) { if (i % 2) continue; const a = i / 24 * Math.PI * 2 + now; sq(f.x + Math.cos(a) * f.r, f.y + 10 + Math.sin(a) * f.r * 0.6, big ? 4 : 2, '#ff5a3a'); }
    } else if (f.k === 'lob') {
      ctx.globalAlpha = 1;
      const u = 1 - t, px = f.x + (f.x2 - f.x) * u, py = f.y + (f.y2 - f.y) * u - Math.sin(u * Math.PI) * 140;
      img(minionSprite('citrouille', 0, 0), px, py, big ? 5 : 2);
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
    } else if (c === 'note') {   // notes de musique du Gobelin du Bruit
      const col = Math.floor(now * 8 + x) % 2 ? '#ffd54a' : '#ffffff';
      sq(x - 6, y + 3, 3, OUT); sq(x - 5, y + 4, 2, col); sq(x, y - 12, 1, col); sq(x, y - 9, 1, col); sq(x, y - 6, 1, col); sq(x, y - 3, 1, col); sq(x + 3, y - 12, 1, col); sq(x + 6, y - 9, 1, col);
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
    const [x, y, , , ang, fl, bk, shield, phase] = B, fr = Math.floor(now * 3) % 2, bs = big ? 7 : PX;
    ctx.fillStyle = '#00000044'; ctx.beginPath(); ctx.ellipse(x, y + 40, 70, 16, 0, 0, 7); ctx.fill();
    if (phase === 2) for (let k = 0; k < 10; k++) { const t = (now * 0.8 + k / 10) % 1; sq(x + Math.sin(k * 2.7) * 70, y + 30 - t * 120, big ? 4 : 2, t < 0.5 ? '#ff5a3a' : '#a8201a'); }
    const spr = bossSprite(fr, fl && Math.floor(now * 20) % 2 ? 1 : 0, bk);
    ctx.save(); ctx.translate(Math.round(x), Math.round(y - 10)); if (Math.cos(ang) < -0.2) ctx.scale(-1, 1);
    ctx.drawImage(spr, Math.round(-spr.width * bs / 2), Math.round(-spr.height * bs / 2), spr.width * bs, spr.height * bs); ctx.restore();
    if (shield) {   // Bouclier du savoir : bulle bleue
      ctx.save(); ctx.globalAlpha = 0.22 + Math.sin(now * 5) * 0.08; ctx.fillStyle = '#9fd6ff'; ctx.beginPath(); ctx.arc(x, y - 6, big ? 200 : 92, 0, 7); ctx.fill();
      ctx.globalAlpha = 0.9; ctx.lineWidth = big ? 10 : 4; ctx.strokeStyle = '#dff2ff'; ctx.setLineDash([14, 8]); ctx.lineDashOffset = now * 30; ctx.beginPath(); ctx.arc(x, y - 6, big ? 200 : 92, 0, 7); ctx.stroke(); ctx.restore();
    }
    bossDrawn = true;
  };
  // sbires
  const mk = B ? SBIRE_DE[B[6]] || 'slime' : 'slime';
  for (const [x, y, hp, fl, a] of world.mn) {
    const ms = big ? 6 : PX;
    ctx.fillStyle = '#00000040'; ctx.beginPath(); ctx.ellipse(x, y + 22, 20, 6, 0, 0, 7); ctx.fill();
    const spr = minionSprite(mk, Math.floor(now * 6 + x) % 2, fl && Math.floor(now * 20) % 2 ? 1 : 0);
    ctx.save(); ctx.translate(Math.round(x), Math.round(y)); if (Math.cos(a) < -0.2) ctx.scale(-1, 1);
    ctx.drawImage(spr, Math.round(-spr.width * ms / 2), Math.round(-spr.height * ms / 2), spr.width * ms, spr.height * ms); ctx.restore();
    const bw = big ? 70 : 28;
    ctx.fillStyle = OUT; ctx.fillRect(Math.round(x - bw / 2) - 2, Math.round(y - 9 * ms) - 2, bw + 4, big ? 12 : 6);
    ctx.fillStyle = '#e04a5a'; ctx.fillRect(Math.round(x - bw / 2), Math.round(y - 9 * ms), Math.round(bw * hp / 100), big ? 8 : 2);
  }
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
    ctx.fillStyle = '#0000004d'; ctx.beginPath(); ctx.ellipse(Math.round(d.x) + 2, Math.round(d.y) + 21, 17, 6, 0, 0, 7); ctx.fill();
    const tcol = teams && p.tm >= 0 && teams[p.tm] ? teams[p.tm].color : null;
    if (tcol) { ctx.fillStyle = tcol; ctx.fillRect(Math.round(d.x) - 18, Math.round(d.y) + 22, 36, 5); }
    else if (isMe) sq(d.x - 3, d.y + 30, 2, '#ffd54a');
    else { ctx.fillStyle = CLS[p.c].color; ctx.fillRect(Math.round(d.x) - 15, Math.round(d.y) + 24, 30, 3); }
    if (p.st) for (let i = 0; i < 4; i++) sq(d.x - 20 + i * 13, d.y + 10 - ((now * 60 + i * 17) % 50), 1, '#ff8a1e');
    if (p.sz) for (let i = 0; i < 3; i++) { const a = now * 6 + i * 2.1; sq(d.x + Math.cos(a) * 18, d.y + 26 - 27 * heroScale + Math.sin(a) * 6, 2, '#ffe27a'); }
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
    // au repos, le héros respire (1 pixel) ; le cristal du mage luit doucement
    const breathe = !d.ph && Math.sin(now * 2.6 + p.id) > 0.3 ? -heroScale / 3 : 0;
    drawHeroSprite(ctx, d.x, d.y + breathe, p.c, p.l || 'm00', p.a, d.ph, heroScale, p.g);
    if (p.c === 'mage') {
      const dd = dirFromAngle(p.a), S = heroScale, gx = d.x + (dd === 'down' ? 6 * S : dd === 'up' ? 5 * S : dd === 'right' ? 2 * S : -2 * S), gy = d.y + breathe + 22 - (dd === 'up' ? 22 : 21) * S;
      const pul = 0.18 + Math.sin(now * 3 + p.id) * 0.06;
      ctx.fillStyle = `rgba(127,224,255,${pul})`; ctx.beginPath(); ctx.arc(gx, gy, 5 * S, 0, 7); ctx.fill();
      ctx.fillStyle = `rgba(200,245,255,${pul + 0.1})`; ctx.beginPath(); ctx.arc(gx, gy, 2.5 * S, 0, 7); ctx.fill();
    }
    if (p.c === 'voleur' && dirFromAngle(p.a) === 'down' && Math.sin(now * 1.7 + p.id) > 0.6) {   // reflet sur les dagues
      const S = heroScale; sq(d.x + 5 * S, d.y + breathe + 22 - 6 * S + Math.floor((now * 6) % 3) * S, 1, '#ffffff');
    }
    if (drawPet && d.petY >= d.y) drawPet();
    if (p.sh) {
      ctx.globalAlpha = alpha * 0.8;
      for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2 + now * 2; sq(d.x + Math.cos(a) * 36, d.y - 10 + Math.sin(a) * 40, 2, '#7fd3ff'); }
    }
    ctx.restore();
  }
  if (!bossDrawn) drawBoss();
  // drapeaux (portés : au-dessus du porteur)
  if (world.fl) world.fl.forEach(([x, y, carried], i) => {
    const col = teams && teams[i] ? teams[i].color : '#ffffff';
    const fs = big ? 6 : PX;
    img(flagSprite(col, Math.floor(now * 5 + i) % 2), x + (carried ? 14 : 6) * fs / PX, y - (carried ? 52 : 26) * fs / PX, fs);
  });
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
    const [x, y, hp, max, , , bk] = B, bw = big ? 300 : 140, ny = y - (big ? 150 : 95), BI = BOSS_INFO[bk] || BOSS_INFO.gluant, lbl = BI.ico + ' ' + BI.nom;
    ctx.lineWidth = big ? 9 : 4; ctx.strokeStyle = OUT; ctx.strokeText(lbl, x, ny - 8); ctx.fillStyle = BI.col; ctx.fillText(lbl, x, ny - 8);
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
  if (world.hl) {
    const [hx, hy, hr, own] = world.hl;
    ctx.strokeStyle = own >= 0 && teams && teams[own] ? teams[own].color : '#ffffff'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x + hx * s, y + hy * s, Math.max(5, hr * s), 0, 7); ctx.stroke();
  }
  if (world.fl) world.fl.forEach(([fx, fy], i) => {
    ctx.fillStyle = OUT; ctx.fillRect(Math.round(x + fx * s) - 4, Math.round(y + fy * s) - 5, 8, 8);
    ctx.fillStyle = teams && teams[i] ? teams[i].color : '#fff'; ctx.fillRect(Math.round(x + fx * s) - 3, Math.round(y + fy * s) - 4, 6, 6);
  });
  for (const [mx, my] of world.mn || []) { ctx.fillStyle = '#e04a5a'; ctx.fillRect(Math.round(x + mx * s) - 2, Math.round(y + my * s) - 2, 4, 4); }
  if (world.boss) { ctx.fillStyle = '#5ac85a'; ctx.fillRect(Math.round(x + world.boss[0] * s) - 4, Math.round(y + world.boss[1] * s) - 4, 8, 8); }
  if (mine && mine.al) {
    ctx.fillStyle = OUT; ctx.fillRect(Math.round(x + mine.x * s) - 4, Math.round(y + mine.y * s) - 4, 8, 8);
    ctx.fillStyle = '#ffd54a'; ctx.fillRect(Math.round(x + mine.x * s) - 3, Math.round(y + mine.y * s) - 3, 6, 6);
  }
  ctx.restore();
}
