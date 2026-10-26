// Dessin en pixel art de l'arène et des héros, partagé entre la vue élève et la vue enseignant.
// 1 pixel d'art = 3 unités du monde. Tout est dessiné par le code (aucune image externe).
const PX = 3;
const OUT = '#1b1424';   // couleur des contours

const CLS = {
  guerrier: { nom: ['Guerrière', 'Guerrier'], ico: '⚔️', color: '#3a6fd8', desc: 'Très résistant. Épée et bouclier, au corps à corps.', pow: '🛡️ Bouclier : réduit les dégâts pendant 3 s', dash: '💨 Charge : fonce et bouscule' },
  voleur:   { nom: ['Voleuse', 'Voleur'],     ico: '🗡️', color: '#d64545', desc: 'Rapide, corps à corps. Dégâts doublés en frappant dans le dos !', pow: '👤 Ombre : invisible 4 s, prochaine attaque +50 %', dash: '🌀 Roulade : esquive, invincible un instant' },
  mage:     { nom: ['Mage', 'Mage'],          ico: '🔮', color: '#8e4ce0', desc: 'Fragile mais puissant. Lance des boules de feu.', pow: '💥 Explosion : dégâts tout autour', dash: '✨ Téléportation : 3 cases plus loin' },
  druide:   { nom: ['Druidesse', 'Druide'],   ico: '🌿', color: '#5aa832', desc: 'Soigne son équipe. Lance des graines magiques.', pow: '🌿 Cercle de soin : soigne toi et tes coéquipiers proches', dash: '🍃 Bond : saute et laisse des racines qui ralentissent' },
  archer:   { nom: ['Archère', 'Archer'],     ico: '🏹', color: '#2f9e55', desc: 'Rapide. Tire des flèches de loin.', pow: '🌧️ Pluie de flèches : 7 flèches en éventail', dash: '🦘 Saut arrière : recule en tirant' },
};
const SKIN = ['#f7d3b0', '#dca274', '#a8693d', '#6b3f22'];
const ORC_SKIN = ['#9cc47a', '#7fa85c', '#648c46', '#4a6a34'];   // peau des orcs (selon la teinte choisie)
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

// Règles expliquées avant la partie, selon le mode (élèves et projecteur)
const REGLES = {
  libre: { ico: '⚔️', titre: 'Chacun pour soi', but: 'Marque le plus de points !', pts: ['Vaincre un adversaire : 1 point.', 'Le meneur porte une couronne 👑 : le vaincre rapporte 2 points.', 'Les bonnes réponses donnent des pièces d\'or et des bonus.'] },
  equipes: { ico: '🤝', titre: 'Équipes', but: 'Fais gagner ton équipe !', pts: ['Ton équipe a une couleur : tu ne peux pas blesser tes coéquipiers.', 'Chaque adversaire vaincu donne 1 point à ton équipe.', 'Restez ensemble et aidez-vous !'] },
  colline: { ico: '⛰️', titre: 'Roi de la colline', but: 'Tiens la zone en cercle avec ton équipe !', pts: ['Ton équipe seule dans la zone : 1 point par seconde.', 'Deux équipes dans la zone : elle clignote et personne ne marque.', 'La zone change de place toutes les 75 secondes. 120 points pour gagner.'] },
  drapeau: { ico: '🚩', titre: 'Capture du drapeau', but: 'Ramène le drapeau adverse dans ta base !', pts: ['Touche le drapeau adverse pour le prendre (tu avances un peu moins vite).', 'Tu marques seulement si ton propre drapeau est dans ta base.', 'Un porteur K.O. lâche le drapeau : touche-le pour le ramener. 3 captures pour gagner.'] },
  boss: { ico: '👑', titre: 'Boss coopératif', but: 'Toute la classe ensemble contre le Boss !', pts: ['On ne peut pas se blesser entre nous.', 'Chaque bonne réponse enlève 3 % de vie au Boss : tout le monde est utile !', '🛡️ Bouclier du savoir : répondez juste ensemble pour le briser.', 'À la moitié de sa vie, il s\'enrage et appelle des sbires.'] },
};
Object.assign(REGLES, {
  runes: { ico: '✨', titre: 'Course aux runes', but: 'Capture 12 runes avec ton équipe !', pts: ['Des runes brillantes apparaissent sur la carte.', 'Touche une rune : une question s\'ouvre. Bonne réponse = la rune est à ton équipe.', 'Mauvaise réponse : la rune t\'échappe 3 secondes.', 'Défends les runes et empêche l\'autre équipe de les prendre !'] },
  chariot: { ico: '🛒', titre: 'Escorte du chariot', but: 'Pousseurs : amenez le chariot au bout du chemin. Défenseurs : arrêtez-le !', pts: ['Le chariot avance quand il y a plus de Pousseurs que de Défenseurs autour de lui.', 'Près du chariot, tu reçois une question toutes les 8 secondes.', 'Bonne réponse d\'un Pousseur : le chariot reçoit de l\'énergie. Bonne réponse d\'un Défenseur : il en perd.', 'Sans énergie, le chariot s\'arrête !'] },
  survie: { ico: '🌊', titre: 'Survie coopérative', but: 'Toute la classe ensemble contre 8 vagues de monstres !', pts: ['On ne peut pas se blesser entre nous.', 'Chaque vague est plus forte que la précédente.', 'Entre deux vagues : une question éclair. Bonne réponse = bonus de force.', 'Si tout le monde tombe en même temps, les monstres gagnent.'] },
  zombie: { ico: '🧟', titre: 'Contagion', but: 'Humains : survivez ! Zombies : attrapez tout le monde !', pts: ['Un zombie qui te touche te pose une question : bonne réponse = tu résistes 3 secondes.', 'Mauvaise réponse : tu deviens un zombie à ton tour.', 'Les coups des humains repoussent et étourdissent les zombies.', 'Survivre rapporte des points. Les zombies vont un peu plus vite.'] },
  entrainement: { ico: '🎯', titre: 'Entraînement', but: 'Entraîne-toi contre les robots !', pts: ['Les élèves ne peuvent pas se blesser entre eux : seulement les robots.', 'Les robots frappent moins fort.', 'Les questions reviennent plus souvent sur les notions que tu rates.'] },
});
// Modes en équipes : noms et scores affichés en haut de l'écran
const MODES_EQUIPE = ['equipes', 'colline', 'drapeau', 'runes', 'chariot', 'zombie'];
function equipesDe(world, base) {
  if (!world || !MODES_EQUIPE.includes(world.mode)) return null;
  if (world.tn) { const c = world.mode === 'zombie' ? ['#3a7ae0', '#5ac85a'] : ['#e0a03a', '#3a7ae0']; return world.tn.map((nom, i) => ({ nom, color: c[i] })); }
  return base || null;
}
function scoresEquipes(world, teams) {
  const m = world.mode;
  if (m === 'chariot' && world.ca) return [[`🛒 ${world.ca[2]} % du chemin · ⚡ ${world.ca[3]}${['', '', ' · bloqué !', ' · plus d\'énergie !'][world.ca[4]]}`, '#e0a03a']];
  if (!teams || !world.te) return [];
  const ico = { colline: '⛰️ ', drapeau: '🚩 ', runes: '✨ ', zombie: '' }[m] || '', max = { colline: '/120', drapeau: '/3', runes: '/12' }[m] || '';
  return world.te.map((sc, i) => teams[i] ? [`${ico}${teams[i].nom} ${sc}${max}`, teams[i].color] : null).filter(Boolean);
}
function infoMode(world) {
  if (!world.sv) return '';
  const [v, repos, n] = world.sv;
  return repos > 0 ? `   🌊 Vague ${v + 1} dans ${repos} s` : `   🌊 Vague ${v}/8 · ${n} monstre${n > 1 ? 's' : ''}`;
}
let ROUTE = null;   // chemin du chariot (reçu au début de la manche)
const REGLE_KO = 'Tu tombes ? Réponds à une question pour revenir au combat.';
function reglesHTML(mode, extra = '') {
  const R = REGLES[mode] || REGLES.libre;
  return `<h2 class="rgT">${R.ico} ${R.titre}</h2><div class="rgB">${R.but}</div><ul class="rgL">${R.pts.map(t => `<li>${t}</li>`).join('')}<li>💫 ${REGLE_KO}</li></ul>${extra}`;
}

// Décode l'état compact envoyé par le serveur
function unpackWorld(w) {
  w.pz = w.pz || [];
  w.mn = w.mn || [];
  w.p = w.p.map(([id, n, c, l, x, y, a, hp, m, k, f, tm, g]) => ({ id, n, c, l, x, y, a, hp, m, k, tm, g: g || 0, al: !!(f & 1), sh: !!(f & 2), pr: !!(f & 4), hd: !!(f & 8), inv: !!(f & 16), st: !!(f & 32), fa: !!(f & 64), bz: !!(f & 128), dz: !!(f & 256), lz: !!(f & 512), sl: !!(f & 1024), sz: !!(f & 2048), at: !!(f & 4096) }));
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
function line2(P, x0, y0, x1, y1, c) {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
  for (let i = 0; i <= n; i++) P.px(Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), c);
}
// Nain : silhouette trapue. On retire 3 rangées (milieu du torse, haut des jambes) en gardant les pieds au sol,
// et on élargit le corps de 2 colonnes au centre.
function trapu(P) {
  const W = P.w, H = P.h, enlever = new Set([20, 24, 25]), g = new Array(W * H).fill(null);
  let ny = H - 1;
  for (let y = H - 1; y >= 0; y--) {
    if (enlever.has(y)) continue;
    for (let x = 0; x < W; x++) {
      const c = P.g[y * W + x];
      if (!c) continue;
      if (x <= 11) { if (x >= 1) g[ny * W + x - 1] = c; if (x === 11) g[ny * W + x] = c; }
      else { if (x + 1 < W) g[ny * W + x + 1] = c; if (x === 12) g[ny * W + x] = c; }
    }
    ny--;
  }
  P.g = g;
}
function heroSprite(cls, look, dir, frame, gearCode = 0) {
  const key = cls + look + dir + frame + 'g' + gearCode;
  if (heroCache[key]) return heroCache[key];
  const P = new Painter(24, 30); P.ox = 4; P.oy = 8;
  const fem = look[0] === 'f', out = OUTFIT[+look[3] || 0], acc = +look[4] || 0, G = gearOf(gearCode);
  const race = +look[7] || 0;   // 0 humain, 1 elfe, 2 nain, 3 orc
  const s = (race === 3 ? ORC_SKIN : SKIN)[+look[1]] || SKIN[0], sD = shade(s, 0.78), sH = shade(s, 1.12);
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
    druide:   { main: '#4a7a34', acc: '#8a6a3a', cloth: '#335a24', pants: '#3a2a1a' },
  }[cls];
  const leaf = '#5aa832', leafD = '#3a7a24', leafL = '#9ad84a';
  // bâton de druide : bois tordu, feuilles et graine lumineuse (x, y = haut du manche)
  const staffD = (x, y, len) => { P.rect(x, y, 1, len, wood); P.px(x, y + 4, woodH); P.px(x, y + 9, woodH); P.px(x - 1, y - 1, wood); P.px(x - 1, y - 2, wood); P.px(x, y - 3, wood); P.px(x + 1, y - 2, wood);
    P.px(x, y - 2, leafL); P.px(x - 2, y - 2, leaf); P.px(x + 2, y - 1, leaf); P.px(x + 1, y - 4, leafD); P.px(x - 1, y + 1, leaf); };
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
    if (cls === 'druide') staffD(13, 1, 17);
  }
  if (cls === 'archer' && !up) {   // carquois dans le dos
    if (side) { P.rect(2, 8, 3, 7, leather); P.px(2, 7, '#e8e2d0'); P.px(3, 6, '#c23b3b'); P.px(4, 7, '#e8e2d0'); }
    else { P.rect(11, 6, 2, 3, '#e8e2d0'); P.px(12, 5, '#c23b3b'); }
  }
  if (side && fem && cls !== 'voleur') P.rect(4, 4, 2, cls === 'mage' || cls === 'druide' ? 9 : 8, h);

  // ===== jambes et bottes =====
  if (cls === 'mage' || cls === 'druide') {
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
  } else if (cls === 'druide') {   // robe verte, ceinture de corde, broche feuille
    box(bx, 10, bw, 8, K.main); P.rect(bx - 1, 15, 1, 3, K.main); P.rect(bx + bw, 15, 1, 3, shade(K.main, 0.66));
    P.rect(bx - 1, 17, bw + 2, 1, shade(K.main, 0.6));
    if (!up) { P.rect(bx, 13, bw, 1, K.acc); P.px(side ? 9 : 8, 14, K.acc); P.px(side ? 9 : 8, 15, shade(K.acc, 0.7)); P.px(side ? 7 : 6, 11, leafL); P.px(side ? 8 : 7, 11, leaf); }
  } else if (cls === 'voleur') {
    box(bx, 10, bw, 5, K.main);
    if (!up) { for (let i = 0; i < 5; i++) P.px(bx + 1 + i, 10 + i, leather); P.px(bx + 3, 12, '#9aa3b0'); }   // sangle et boucle
    P.rect(bx, 14, bw, 1, K.acc);
  } else {
    box(bx, 10, bw, 5, K.acc === '#6b4a2a' ? '#6b4a2a' : leather);   // gilet de cuir
    P.rect(bx + (side ? 0 : 1), 10, side ? 2 : 2, 5, K.cloth); if (!side) P.rect(bx + bw - 3, 10, 2, 5, K.cloth);
    P.rect(bx, 14, bw, 1, '#3a2614'); P.px(bx + (bw >> 1), 14, gold);
  }
  if (fem && cls !== 'mage' && cls !== 'druide') { const c = cls === 'guerrier' ? K.acc : cls === 'voleur' ? K.main : K.cloth; P.rect(bx - 1, 15, bw + 2, 1, c); P.rect(bx, 16, bw, 1, shade(c, 0.7)); }
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
  // balancement des bras à la marche (sw), bras d'arme levé à l'attaque
  const sw = frame === 1 ? 1 : frame === 2 ? -1 : 0, atk = frame === 3;
  const hL = sw + (atk && cls !== 'mage' && cls !== 'druide' ? 1 : 0), hR = atk ? -2 : -sw;   // décalage vertical des mains (vue de face/dos)
  if (side) {
    const fx = atk ? 2 : sw;
    P.rect(8, 11, 2, 2, shade(armC, 0.85)); P.rect(8 + fx, 13, 2, 2, shade(armC, 0.85)); P.px(8, 11, shade(armC, 1.2));
    P.px(9 + fx, 15 - (atk ? 1 : 0), cls === 'guerrier' ? steel : s);
    if (cls === 'guerrier') { P.rect(7, 9, 4, 2, steel); P.rect(7, 9, 4, 1, shade(steel, 1.3)); }
  } else {
    const aw = cls === 'mage' ? 2 : 2;
    box(2, 10, aw, Math.max(3, 5 + hL), armC); box(12, 10, aw, Math.max(3, 5 + hR), armC);
    const hand = cls === 'guerrier' ? steel : s;
    P.rect(2, 15 + hL, 2, 1, hand); P.rect(12, 15 + hR, 2, 1, hand);
    if (cls === 'guerrier') {   // épaulières
      for (const x of [1, 11]) { P.rect(x, 9, 4, 2, steel); P.rect(x, 9, 4, 1, shade(steel, 1.35)); P.px(x + 3, 10, shade(steel, 0.6)); }
    }
    if (cls === 'archer') { P.rect(2, 13 + hL, 2, 2, leather); P.rect(12, 13 + hR, 2, 2, leather); }   // brassards
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
    // casque ouvert à nasal : le visage (et la race) reste visible
    if (side) {
      P.rect(5, 1, 7, 4, m); P.rect(6, 0, 5, 1, m); P.rect(5, 1, 7, 1, hi); P.rect(5, 2, 1, 6, hi);
      P.rect(5, 5, 3, 4, m); P.rect(5, 8, 3, 1, lo); P.rect(5, 4, 7, 1, lo); P.px(11, 5, m); P.px(11, 6, lo); P.px(8, 4, gold);
      P.rect(5, -3, 3, 3, K.acc); P.px(4, -2, K.acc); P.px(3, -1, K.acc); P.px(6, -3, shade(K.acc, 1.3));
    } else if (down) {
      P.rect(4, 1, 8, 4, m); P.rect(5, 0, 6, 1, m); P.rect(4, 1, 8, 1, hi); P.rect(4, 2, 1, 3, hi); P.rect(11, 2, 1, 3, lo);
      P.rect(4, 4, 8, 1, lo); P.px(5, 4, gold); P.px(10, 4, gold);   // bandeau et rivets
      P.rect(4, 5, 1, 4, m); P.px(4, 5, hi); P.rect(11, 5, 1, 4, lo);   // protège-joues
      P.rect(7, 3, 2, 4, m); P.px(7, 3, gold); P.px(7, 4, shade(gold, 1.3)); P.px(8, 6, lo);   // nasal
      P.rect(7, -3, 2, 3, K.acc); P.px(9, -2, K.acc); P.px(9, -1, K.acc); P.px(7, -3, shade(K.acc, 1.3));
    } else {
      P.rect(4, 1, 8, 8, m); P.rect(5, 0, 6, 1, m); P.rect(4, 1, 8, 1, hi); P.rect(4, 2, 1, 6, hi); P.rect(11, 2, 1, 7, lo); P.rect(4, 8, 8, 1, lo);
      { P.rect(7, 1, 2, 7, lo); }
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
  } else if (cls === 'druide') {   // cheveux libres et couronne de feuilles fleurie
    const wreath = (x0, x1, y) => { for (let x = x0; x <= x1; x++) P.px(x, y, (x & 1) ? leaf : leafD); };
    if (up) { P.rect(4, 2, 8, fem ? 11 : 8, h); P.rect(4, fem ? 12 : 9, 8, 1, hD); wreath(4, 11, 2); P.px(6, 1, leafL); P.px(9, 1, '#ff8ab0'); }
    else if (side) { P.rect(5, 1, 7, 3, h); P.rect(5, 4, 2, fem ? 8 : 5, h); P.rect(6, 0, 5, 1, h); P.px(11, 4, h); wreath(5, 11, 2); P.px(8, 1, '#ff8ab0'); P.px(10, 1, leafL); }
    else {
      P.rect(4, 1, 8, 2, h); P.rect(5, 0, 6, 1, h); P.rect(3, 3, 1, fem ? 10 : 4, h); P.rect(12, 3, 1, fem ? 10 : 4, hD); P.px(4, 3, h); P.px(11, 3, hD);
      wreath(3, 12, 2); P.px(5, 1, '#ff8ab0'); P.px(10, 1, '#ffd54a'); P.px(8, 1, leafL);
      if (!fem) { P.rect(5, 9, 6, 1, h); P.rect(6, 10, 4, 1, hD); }   // petite barbe
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

  // ===== race : oreilles d'elfe, barbe de nain, défenses d'orc =====
  if (race === 1 || race === 3) {   // oreilles pointues (longues pour l'elfe, petites pour l'orc)
    const lg = race === 1;
    if (side) { P.px(6, 5, sD); P.px(6, 4, s); if (lg) { P.px(5, 3, s); P.px(4, 2, sH); } }
    else {
      P.px(3, 5, s); P.px(2, 4, s); P.px(12, 5, sD); P.px(13, 4, sD); P.px(2, 5, sD); P.px(13, 5, sD);
      if (lg) { P.px(1, 3, sH); P.px(14, 3, sD); } else { P.px(1, 4, sD); P.px(14, 4, sD); P.px(1, 5, shade(s, 0.6)); P.px(14, 5, shade(s, 0.6)); }   // orc : oreilles larges, vers le côté
    }
  }
  if (race === 2 && !up) {
    const b = h, bD = hD;
    if (!fem) {   // grosse barbe tressée
      if (side) { P.rect(8, 7, 4, 3, b); P.rect(9, 10, 3, 2, b); P.px(10, 12, bD); P.rect(9, 7, 3, 1, bD); }
      else { P.rect(4, 7, 8, 4, b); P.rect(5, 11, 6, 1, b); P.rect(6, 12, 4, 1, bD); P.rect(6, 7, 4, 1, bD); P.px(7, 9, bD); P.px(8, 10, bD); P.px(7, 13, '#d9a93a'); P.px(8, 13, '#d9a93a'); }
    } else {   // deux tresses et joues roses
      if (side) { P.rect(5, 6, 1, 7, b); P.px(5, 13, '#d9a93a'); }
      else { P.rect(3, 6, 1, 7, b); P.rect(12, 6, 1, 7, bD); P.px(3, 13, '#d9a93a'); P.px(12, 13, '#d9a93a'); if (down) { P.px(5, 8, '#e88a8a'); P.px(10, 8, '#e88a8a'); } }
    }
  }
  if (race === 3 && !up) {   // petites défenses
    const ivoire = '#f4efe0';
    if (side) P.px(11, 8, ivoire);
    else if (down) { P.px(6, 8, ivoire); P.px(9, 8, ivoire); }
  }

  // ===== armes devant =====
  const oy0 = P.oy, ox0 = P.ox;
  if (atk) {   // geste d'attaque : coup d'épée, coup de dague, sort lancé, arc tendu
    if (down) {
      if (cls === 'guerrier') {
        line2(P, 13, 13, 19, 19, blade); line2(P, 13, 14, 18, 19, bladeD); P.rect(12, 12, 3, 1, gold); P.px(12, 13, gold);
        P.rect(-1, 11, 5, 7, K.acc); P.rect(-1, 11, 5, 1, steel); P.rect(-1, 11, 1, 7, steel); P.rect(1, 13, 1, 4, gold); P.rect(0, 14, 3, 1, gold);
      }
      if (cls === 'voleur') {
        P.rect(13, 13, 1, 6, blade); P.px(13, 19, bladeD); P.rect(12, 12, 3, 1, '#7a5a2a');
        P.rect(2, 14, 1, 4, blade); P.px(2, 18, bladeD); P.rect(1, 13, 3, 1, '#7a5a2a');
      }
      if (cls === 'mage') {
        P.rect(14, -2, 1, 17, wood); P.px(14, 3, woodH); P.px(14, 8, woodH);
        P.rect(13, -5, 3, 3, crystal); P.px(13, -5, '#ffffff'); P.rect(13, -2, 3, 1, gold);
      }
      if (cls === 'druide') { staffD(14, -2, 17); P.px(12, -6, leafL); P.px(17, -5, leaf); P.px(11, -3, leaf); P.px(18, -2, leafL); }
      if (cls === 'archer') {
        P.px(2, 6, wood); P.px(1, 7, wood); P.rect(0, 8, 1, 9, woodH); P.px(1, 17, wood); P.px(2, 18, wood);
        line2(P, 2, 6, 4, 12, '#d8d0c0'); line2(P, 4, 12, 2, 18, '#d8d0c0');
        P.rect(1, 12, 9, 1, '#5a3a1e'); P.px(0, 12, '#cfd6de'); P.px(-1, 12, '#cfd6de'); P.rect(4, 11, 2, 2, s);
      }
    } else if (up) {
      if (cls === 'guerrier') { P.rect(0, 11, 4, 7, K.acc); P.rect(0, 11, 4, 1, steel); line2(P, 13, 9, 17, 3, blade); }
      if (cls === 'voleur') { P.rect(2, 12, 1, 4, blade); P.rect(13, 6, 1, 5, blade); }
      if (cls === 'mage') { P.rect(13, -4, 2, 2, crystal); }
      if (cls === 'archer') { P.rect(13, 6, 1, 8, woodH); P.rect(12, 9, 1, 3, '#d8d0c0'); }
      if (cls === 'druide') { P.px(13, -4, leafL); P.px(14, -5, leaf); }
    } else {
      if (cls === 'guerrier') {
        P.rect(12, 12, 7, 1, blade); P.rect(12, 13, 6, 1, bladeD); P.px(19, 12, blade); P.rect(11, 11, 1, 3, gold);
        P.rect(2, 10, 3, 7, K.acc); P.rect(2, 10, 3, 1, steel);
      }
      if (cls === 'voleur') { P.rect(12, 13, 6, 1, blade); P.px(18, 13, bladeD); P.rect(11, 12, 1, 3, '#7a5a2a'); }
      if (cls === 'druide') { line2(P, 9, 18, 14, 2, wood); P.px(14, 1, wood); P.px(15, 0, wood); P.px(15, 1, leafL); P.px(16, 0, leaf); P.px(13, 0, leaf); P.px(16, 2, leafD); P.px(17, -1, leafL); }
      if (cls === 'mage') {
        line2(P, 9, 18, 14, 2, wood); P.rect(13, -1, 3, 3, crystal); P.px(13, -1, '#ffffff'); P.rect(13, 2, 3, 1, gold);
      }
      if (cls === 'archer') {
        P.px(13, 6, wood); P.px(14, 7, wood); P.rect(15, 8, 1, 8, woodH); P.px(14, 16, wood); P.px(13, 17, wood);
        line2(P, 13, 6, 9, 12, '#d8d0c0'); line2(P, 9, 12, 13, 17, '#d8d0c0');
        P.rect(9, 12, 8, 1, '#5a3a1e'); P.px(17, 12, '#cfd6de'); P.px(18, 12, '#cfd6de'); P.px(8, 12, '#e8e2d0');
      }
    }
  } else if (down) {
    P.oy = oy0 + hR;   // l'arme suit la main droite
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
    if (cls === 'druide') staffD(14, 1, 17);
    if (cls === 'mage') {
      P.rect(14, 1, 1, 17, wood); P.rect(14, 1, 1, 17, wood); P.px(14, 5, woodH); P.px(14, 9, woodH);
      P.rect(13, -2, 3, 3, crystal); P.px(13, -2, '#ffffff'); P.px(14, -3, crystal); P.rect(13, 1, 3, 1, gold);
    }
    if (cls === 'archer') {
      P.px(0, 8, wood); P.px(-1, 9, wood); P.rect(-2, 10, 1, 5, woodH); P.px(-1, 15, wood); P.px(0, 16, wood);
      P.rect(0, 9, 1, 7, '#d8d0c0'); P.rect(1, 12, 2, 2, s);
    }
  } else if (up) {
    P.oy = oy0 - hR;
    if (cls === 'guerrier') { P.rect(0, 10, 4, 7, K.acc); P.rect(0, 10, 4, 1, steel); P.rect(1, 12, 2, 3, shade(K.acc, 0.7)); }
    if (cls === 'voleur') { P.rect(2, 11, 1, 4, blade); P.rect(13, 11, 1, 4, blade); }
    if (cls === 'archer') { P.rect(14, 9, 1, 7, woodH); }
  } else {
    P.ox = ox0 + sw;
    if (cls === 'guerrier') { P.rect(11, 13, 8, 1, blade); P.rect(11, 14, 7, 1, bladeD); P.px(19, 13, blade); P.rect(10, 12, 1, 3, gold); P.rect(2, 10, 3, 7, K.acc); P.rect(2, 10, 3, 1, steel); }
    if (cls === 'voleur') { P.rect(11, 13, 5, 1, blade); P.px(16, 13, bladeD); P.rect(10, 12, 1, 3, '#7a5a2a'); }
    if (cls === 'druide') staffD(11, 1, 17);
    if (cls === 'mage') { P.rect(11, 1, 1, 17, wood); P.px(11, 6, woodH); P.rect(10, -2, 3, 3, crystal); P.px(10, -2, '#ffffff'); P.rect(10, 1, 3, 1, gold); }
    if (cls === 'archer') { P.px(12, 7, wood); P.px(13, 8, wood); P.rect(14, 9, 1, 6, woodH); P.px(13, 15, wood); P.px(12, 16, wood); P.rect(12, 8, 1, 8, '#d8d0c0'); P.rect(8, 12, 6, 1, '#5a3a1e'); P.px(14, 12, '#cfd6de'); }
  }
  P.ox = ox0; P.oy = oy0;
  if (acc === 4) {   // couronne d'or par-dessus tout
    const cy = cls === 'guerrier' ? -2 : cls === 'mage' ? -3 : -1, cx = side ? 6 : 5;
    P.rect(cx, cy + 1, 6, 2, '#f2c94c'); P.px(cx, cy, '#f2c94c'); P.px(cx + 2, cy - 1, '#f2c94c'); P.px(cx + 3, cy - 1, '#f2c94c'); P.px(cx + 5, cy, '#f2c94c');
    P.rect(cx, cy + 1, 6, 1, '#fff2b0'); P.px(cx + 2, cy + 2, '#c0303a'); P.px(cx + 4, cy + 2, '#3a7ae0');
  }
  P.ox = 0; P.oy = 0;
  if (race === 2) trapu(P);
  return (heroCache[key] = P.outline().canvas());
}
function dirFromAngle(a) {
  const c = Math.cos(a), s = Math.sin(a);
  if (Math.abs(c) > Math.abs(s) * 1.1) return c > 0 ? 'right' : 'left';
  return s > 0 ? 'down' : 'up';
}
// Dessine un héros : (x, y) = centre du joueur dans le monde ; S = taille d'un pixel d'art
function drawHeroSprite(g, x, y, cls, look, angle, walk, S = PX, gear = 0, atk = false) {
  const d = dirFromAngle(angle);
  const frame = atk ? 3 : walk ? 1 + (Math.floor(walk) % 2) : 0;
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
    if (TH.rustique) { P.rect(10, 30, 3, 1, '#5a3a20'); P.px(9, 31, '#4a2e18'); P.rect(17, 30, 3, 1, '#4a2e18'); P.px(20, 31, '#4a2e18'); P.px(14, 31, '#5a3a20'); P.px(11, 29, '#7a5030'); }
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
  } else if (kind === 'rock' && TH.rustique) {
    // gros rocher clair, facettes, mousse sur le dessus
    P = new Painter(w + 4, h + 10); ax = 2; ay = 8;
    const cx = Math.floor((w + 4) / 2), cy = Math.floor(h / 2) + 6, rx = Math.floor(w / 2), ry = Math.floor(h / 2) + 3;
    P.ellipse(cx, cy, rx, ry, '#b9bec6');
    P.ellipse(cx + 2, cy + 2, Math.floor(rx * 0.75), Math.floor(ry * 0.7), '#9aa0aa');
    P.ellipse(cx - 2, cy - 2, Math.floor(rx * 0.6), Math.floor(ry * 0.55), '#dfe3e8');
    P.ellipse(cx - 3, cy - 3, Math.floor(rx * 0.3), Math.floor(ry * 0.25), '#f4f6f8');
    for (let i = -rx + 2; i < rx - 1; i++) P.px(cx + i, cy + ry - 2 - (i * i) % 3, '#7d838e');   // base dans l'ombre
    line2(P, cx + 1, cy - ry + 3, cx + 4, cy + 1, '#9aa0aa');   // fissure
    const moss = ['#6cbd48', '#4f9a34', '#8ad65c'];
    for (let i = 0; i < Math.max(4, rx); i++) { const mx = cx - rx + 3 + ((i * 7) % (rx * 2 - 4)), my = cy - ry + 2 + ((i * 3) % 3); P.px(mx, my, moss[i % 3]); P.px(mx + 1, my, moss[(i + 1) % 3]); if (i % 2) P.px(mx, my + 1, moss[1]); }
    P.px(cx - rx + 1, cy + ry - 1, '#4f9a34'); P.px(cx - rx + 2, cy + ry, '#6cbd48'); P.px(cx + rx - 2, cy + ry, '#4f9a34');
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
// cheminée de pierre avec un feu (sur le mur du fond des cabanes)
function cheminee() {
  const P = new Painter(16, 18);
  P.rect(5, 0, 6, 5, '#8a8f99'); P.rect(5, 0, 6, 1, '#b7bcc6');   // conduit
  P.rect(1, 5, 14, 12, '#9aa0ab'); P.rect(1, 5, 14, 2, '#c3c7d0');
  for (const [x, y] of [[2, 8], [9, 8], [5, 11], [12, 11], [2, 14], [9, 14]]) P.rect(x, y, 3, 2, '#b7bcc6');
  P.rect(4, 9, 8, 8, '#2a1d2e'); P.ellipse(8, 14, 3, 2, '#ff8a1e'); P.ellipse(8, 14, 2, 1, '#ffd25a'); P.px(7, 11, '#ff8a1e'); P.px(9, 12, '#ffb347');
  P.rect(0, 16, 16, 2, '#6d7380');
  return P.outline().canvas();
}
// trophée accroché au mur : tête de cerf ou d'ours sur une plaque de bois
function trophee(k) {
  const P = new Painter(12, 12), b = '#7a4b25';
  P.ellipse(6, 7, 4, 3, b); P.ellipse(6, 7, 3, 2, '#9b6b3a');
  if (k === 'cerf') {
    P.rect(5, 4, 3, 6, '#a8784a'); P.rect(5, 9, 3, 2, '#c9a27a'); P.px(5, 6, OUT); P.px(7, 6, OUT); P.px(6, 10, OUT);
    for (const s of [-1, 1]) { const x = 6 + s * 2; P.px(x, 3, '#e8dcc0'); P.px(x + s, 2, '#e8dcc0'); P.px(x + s * 2, 1, '#e8dcc0'); P.px(x + s, 0, '#e8dcc0'); P.px(x + s * 3, 2, '#e8dcc0'); }
  } else {
    P.ellipse(6, 7, 3, 3, '#6e3a1e'); P.px(3, 4, '#6e3a1e'); P.px(9, 4, '#6e3a1e'); P.rect(5, 8, 3, 2, '#a86034'); P.px(5, 6, OUT); P.px(7, 6, OUT); P.px(6, 8, OUT);
  }
  return P.outline().canvas();
}
// peau d'ours (ou de loup blanc en hiver) étalée au sol : corps, 4 pattes, tête vers le bas
function peauSprite(w, h, blanc) {
  const P = new Painter(w, h), cx = w >> 1, cy = (h >> 1) - 2;
  const f = blanc ? ['#e8e4dc', '#c9c2b4', '#f8f6f0', '#a8a090'] : ['#8a4a26', '#6e3a1e', '#a86034', '#4a2614'];
  for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {   // pattes en étoile
    const px = cx + sx * Math.round(w * 0.32), py = cy + sy * Math.round(h * 0.28);
    P.ellipse(px, py, 4, 3, f[1]); P.px(px + sx * 4, py + 2, '#e8e2d0'); P.px(px + sx * 3, py + 3, '#e8e2d0');
  }
  P.ellipse(cx, cy, Math.round(w * 0.3), Math.round(h * 0.36), f[0]);
  P.ellipse(cx - 2, cy - 2, Math.round(w * 0.16), Math.round(h * 0.18), f[2]);
  for (let i = 0; i < 14; i++) P.px(cx - Math.round(w * 0.22) + ((i * 7) % Math.round(w * 0.44)), cy - Math.round(h * 0.25) + ((i * 5) % Math.round(h * 0.5)), f[1]);
  const hy = cy + Math.round(h * 0.36);   // tête
  P.ellipse(cx, hy, 5, 4, f[1]); P.ellipse(cx, hy + 1, 3, 2, f[0]); P.px(cx - 4, hy - 3, f[1]); P.px(cx + 4, hy - 3, f[1]);
  P.px(cx - 2, hy, OUT); P.px(cx + 2, hy, OUT); P.rect(cx - 1, hy + 3, 2, 1, OUT);
  return P.outline().canvas();
}

// ---------- La carte (dessinée une seule fois, en tuiles de 16 pixels d'art) ----------
const WALLS_T = 'b#kcxgT', WATER_T = '~vL', NATURAL_T = '.hsnmd~=icT';
const THEMES = {
  village: { herbe: ['#5dae3e', '#54a238', '#6cbd48', '#3f8a2e'], falaise: ['#b86f3c', '#8a4a26', '#d68e52', '#6a3a1e'], arbres: ['#3a9238', '#4aa842', '#7ccd58', '#23652a'], fond: '#2f7a3f', rustique: true },
  foret:   { rustique: true, herbe: ['#4f9a3c', '#478e36', '#5eab48', '#367a2c'], falaise: ['#a0623a', '#7a4524', '#c07f4c', '#5a3218'], arbres: ['#25603a', '#2f7a44', '#4f9a52', '#183f26'], fond: '#183f26' },
  desert:  { herbe: ['#8fb35a', '#82a650', '#9cc065', '#6f9445'], falaise: ['#c98f52', '#9e6a38', '#e2ad6e', '#7a4f28'], arbres: ['#3f7a3a', '#4f9a4a', '#6cb860', '#2a5a2e'], fond: '#9e6a38' },
  donjon:  { herbe: ['#5a5f6a', '#525763', '#646a75', '#454a55'], falaise: ['#6d6a7a', '#4a4757', '#8a8796', '#33313f'], arbres: ['#2f4a3a', '#3f5a4a', '#5a7a5a', '#1f3328'], fond: '#141019' },
  hiver:   { rustique: true, herbe: ['#eef4fa', '#e2ebf4', '#ffffff', '#c8d8e8'], falaise: ['#b8cde0', '#8aa3be', '#e4eff8', '#6a84a0'], arbres: ['#2f6a4a', '#3f8a5a', '#e8f2fa', '#1f4a35'], fond: '#8aa3be' },
  cite:    { herbe: ['#6a8a55', '#61804e', '#76955f', '#4f6d42'], falaise: ['#8a8590', '#66626e', '#a8a4ae', '#46424e'], arbres: ['#3f6a3a', '#4a7a44', '#6a9a5a', '#2a4a28'], fond: '#46424e' },
  colisee: { herbe: ['#8fb35a', '#82a650', '#9cc065', '#6f9445'], falaise: ['#c9a36a', '#9e7c48', '#e2c08a', '#7a5e34'], arbres: ['#3f7a3a', '#4f9a4a', '#6cb860', '#2a5a2e'], fond: '#9e7c48' },
  marais:  { rustique: true, herbe: ['#6f8048', '#64743f', '#7d8f55', '#55653a'], falaise: ['#7a6a4a', '#5a4a32', '#9a8a62', '#3f3322'], arbres: ['#3f5a32', '#4f6d3a', '#6a8a4a', '#2a3f22'], fond: '#2a3f22' },
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
    if (t === 't' && TH.rustique) {   // sous la peau de bête : le même sol que la pièce
      const tx0 = Math.floor(x / TS), ty0 = Math.floor(y / TS);
      for (let k = 1; k < 8; k++) { const n = tile(tx0 - k, ty0); if (n !== 't') { t = WALLS_T.includes(n) ? 'w' : n; break; } }
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
      } else if (t === 'b' && TH.rustique) {
        // ----- cabane en rondins : rondins horizontaux, bouts ronds aux coins -----
        const lg = ['#8a5530', '#6e4024', '#a86a3c', '#4a2a16', '#5a361e'];
        const corner = !WALLS_T.includes(tile(tx - 1, ty)) || !WALLS_T.includes(tile(tx + 1, ty));
        if (front) {
          const fy = ly - 9, r = fy % 4;
          c = r === 0 ? lg[2] : r === 3 ? lg[3] : lg[0];
          if (corner && (lx < 4 && !WALLS_T.includes(tile(tx - 1, ty)) || lx > TS - 5 && !WALLS_T.includes(tile(tx + 1, ty)))) { const ex = lx < 4 ? lx : TS - 1 - lx; c = r === 3 ? lg[3] : (ex + r) % 3 === 0 ? '#c99a5c' : '#b07a45'; }
          else if (hsh(x >> 3, (y >> 2), 61) < 0.12 && x % 8 === 3) c = lg[4];   // nœud du bois
          if (ly === TS - 1) c = OUT;
        } else {
          const r = y % 4;
          c = r === 0 ? lg[2] : r === 3 ? lg[3] : lg[0];
          if ((x + (y >> 2) * 5) % 23 === 0) c = lg[1];
          if (h < 0.03) c = lg[1];
        }
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
      else if (t === 'w' && !TH.rustique) {
        const row = Math.floor(y / 4);
        c = y % 4 === 3 || (x + row * 5) % 13 === 0 ? '#a87a48' : row % 2 ? '#e2b67c' : '#d8ab70';
      }
      else if ((t === 't' || t === 'w') && TH.rustique) {   // dalles de pierre irrégulières dans les cabanes
        const cl = cells(x, y, 6, 71);
        c = cl.d2 - cl.d1 < 1.1 ? '#6e5a40' : cl.id < 0.33 ? '#b39a74' : cl.id < 0.66 ? '#a48c68' : '#c2aa82';
        if (cl.d2 - cl.d1 >= 1.1 && x - cl.px + y - cl.py < -2) c = shade(c, 1.08);
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
      // herbe surélevée : un petit talus de terre sous le bord de l'herbe (thèmes rustiques)
      if (TH.rustique && (t === 'd' || t === 's')) {
        const g1 = V(x, y - 1), g2 = V(x, y - 2), g3 = V(x, y - 3), gr = u => u === '.' || u === 'h';
        if (gr(g1)) c = OUT;
        else if (gr(g2)) c = '#5a3a20';
        else if (gr(g3)) c = hsh(x, y, 62) < 0.3 ? '#4a2e18' : '#6e4a2a';
        else if (gr(V(x - 1, y)) || gr(V(x + 1, y))) c = shade(c, 0.8);
      }
      if (TH.rustique && (t === '.' || t === 'h')) {
        const b1 = V(x, y + 1), b2 = V(x, y + 2), d = u => u === 'd' || u === 's';
        if (d(b1)) c = shade(TH.herbe[3], 0.85);
        else if (d(b2)) c = TH.herbe[2];
      }
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
      if (r < 0.35 && TH.rustique) {   // touffe d'herbe : brins foncés à la base, pointes claires
        const d = shade(TH.herbe[3], 0.9), l = shade(TH.herbe[2], 1.15);
        dot(x, y, d); dot(x + 1, y, d); dot(x + 2, y, d); dot(x - 1, y - 1, l); dot(x + 1, y - 1, d); dot(x + 1, y - 2, l); dot(x + 3, y - 1, l);
      }
      else if (r < 0.35) { const c = TH.herbe[3]; dot(x, y, c); dot(x + 2, y, c); dot(x + 1, y - 1, c); }
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
  // peaux de bête : à la place des tapis, dans les maisons des thèmes rustiques
  if (TH.rustique) {
    const vu = new Set();
    for (let j = 0; j < map.rows; j++) for (let i = 0; i < map.cols; i++) {
      if (tile(i, j) !== 't' || vu.has(j * map.cols + i)) continue;
      let i0 = i, i1 = i, j0 = j, j1 = j; const pile = [[i, j]]; vu.add(j * map.cols + i);
      while (pile.length) {
        const [a, b] = pile.pop(); i0 = Math.min(i0, a); i1 = Math.max(i1, a); j0 = Math.min(j0, b); j1 = Math.max(j1, b);
        for (const [da, db] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const na = a + da, nb = b + db; if (tile(na, nb) === 't' && !vu.has(nb * map.cols + na)) { vu.add(nb * map.cols + na); pile.push([na, nb]); } }
      }
      const pw = (i1 - i0 + 1) * TS, ph = (j1 - j0 + 1) * TS;
      g.drawImage(peauSprite(pw + 10, ph + 6, map.theme === 'hiver'), i0 * TS - 5, j0 * TS - 3);
      // mur du fond de la cabane : cheminée au-dessus de la peau, trophées de chaque côté
      let jw = j0 - 1; while (jw > 0 && tile(i0, jw) !== 'b') jw--;
      if (tile(i0, jw) === 'b' && !WALLS_T.includes(tile(i0, jw + 1))) {
        const fy = jw * TS + 9, mx = Math.round((i0 + i1 + 1) / 2 * TS);
        if (tile(Math.floor(mx / TS) , jw) === 'b') g.drawImage(cheminee(), mx - 8, fy - 9);
        // trophées : à gauche et à droite de la cheminée, là où aucun meuble ne les cache
        const libre = d => { const ax = mx + d; return tile(Math.floor(ax / TS), jw) === 'b' && !map.objs.some(o => ax * PX > o.x - 30 && ax * PX < o.x + o.w + 30 && o.y < (fy + 30) * PX && o.y + o.h > (fy - 10) * PX); };
        const places = [-26, 26, -44, 44, -60, 60].filter(libre);
        ['cerf', 'ours'].forEach((k, n) => { if (places[n] != null) g.drawImage(trophee(k), mx + places[n] - 6, fy - 4); });
      }
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
    // cachette : buisson de fougères pointues vert lime avec des baies violettes (bien différent des arbres ronds)
    const bp = dark ? ['#a3a83c', '#8a922e', '#c8cc66', '#5e6420'] : snow ? ['#6aa890', '#548f78', '#a8d8c4', '#36604e'] : ['#8fcf3c', '#76b82e', '#c0ec70', '#4a8420'];
    const ry = Math.round(r * 0.78);
    P.ellipse(c, c + 1, r - 1, ry - 1, bp[1]);
    for (let k = 0; k < 22; k++) {   // feuilles pointues qui rayonnent du centre
      const a = k / 22 * Math.PI * 2 + (k % 2) * 0.12, len = (k % 3 === 0 ? 1.05 : 0.85);
      const ex = c + Math.round(Math.cos(a) * r * len), ey = c + 1 + Math.round(Math.sin(a) * ry * len);
      line2(P, c + Math.round(Math.cos(a) * r * 0.25), c + 1 + Math.round(Math.sin(a) * ry * 0.25), ex, ey, Math.sin(a) < -0.2 ? bp[2] : Math.sin(a) > 0.5 ? bp[3] : bp[0]);
      P.px(ex + Math.round(Math.cos(a + 1.4)), ey + Math.round(Math.sin(a + 1.4)), bp[k % 2 ? 0 : 1]);
    }
    for (let k = 0; k < 14; k++) {   // feuilles plus sombres entre les autres : du relief
      const a = (k + 0.5) / 14 * Math.PI * 2, ex = c + Math.round(Math.cos(a) * r * 0.7), ey = c + 1 + Math.round(Math.sin(a) * ry * 0.7);
      line2(P, c + Math.round(Math.cos(a) * r * 0.35), c + 1 + Math.round(Math.sin(a) * ry * 0.35), ex, ey, Math.sin(a) > 0 ? bp[3] : bp[1]);
    }
    P.ellipse(c - 2, c - 2, Math.round(r * 0.3), Math.round(ry * 0.25), bp[2]);
    if (snow) P.ellipse(c, c - Math.round(ry * 0.5), Math.round(r * 0.7), Math.round(ry * 0.25), '#f4f8ff');
    for (let i = 0; i < 5; i++) {   // grappes de baies
      const bx = c + Math.round(Math.cos(i * 2.4 + 0.5) * r * 0.5), by = c + 1 + Math.round(Math.sin(i * 2.4 + 0.5) * ry * 0.45);
      P.px(bx, by, '#7a4ad8'); P.px(bx + 1, by, '#5a32a8'); P.px(bx, by + 1, '#5a32a8'); P.px(bx, by - 1, '#c9b0ff');
    }
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
  const herbe = [];
  const presArbre = (i, j) => { for (let dj = -1; dj <= 2; dj++) for (let di = -1; di <= 1; di++) if (tile(i + di, j + dj) === 'T') return true; return false; };
  for (let j = 1; j < map.rows - 1; j++) for (let i = 1; i < map.cols - 1; i++) if (tile(i, j) === '.' && !presArbre(i, j) && !(map.bushes || []).some(b => Math.hypot(b.x - (i + 0.5) * map.T, b.y - (j + 0.5) * map.T) < b.r + 40) && !map.objs.some(o => (i + 0.5) * map.T > o.x - 20 && (i + 0.5) * map.T < o.x + o.w + 20 && (j + 0.5) * map.T > o.y - 20 && (j + 0.5) * map.T < o.y + o.h + 20)) herbe.push([(i + 0.5) * map.T, (j + 0.5) * map.T, i, j]);
  mapAnim = { glints, torches, lamps, herbe };
  bestioles = null;
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
  // 2b) décor de saison (selon le mois réel) : citrouilles, feuilles, cadeaux, bonshommes de neige, fleurs…
  decorSaison(g, map, herbe, TS, hsh);
  // 3) couleurs plus sobres : moins saturées, plus chaudes, avec des taches de lumière et des bords assombris
  // taches de lumière précalculées par blocs de 4 pixels (plus rapide)
  const MW = (AW >> 2) + 1, MH = (AH >> 2) + 1, mot = new Float32Array(MW * MH);
  for (let j = 0; j < MH; j++) for (let i = 0; i < MW; i++) mot[j * MW + i] = 0.86 + noise(i / 7.5, j / 7.5, 31) * 0.16 + noise(i / 1.75, j / 1.75, 32) * 0.07;
  const grade = (cv, mottle) => {
    const cx = cv.getContext('2d'), im = cx.getImageData(0, 0, AW, AH), d = im.data;
    const cold = map.theme === 'hiver', sat = cold ? 0.9 : TH.rustique ? 1.0 : 0.85;
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
      else { d[k] = Math.min(255, r * 1.03 * m); d[k + 1] = Math.min(255, gg * 1.0 * m); d[k + 2] = Math.min(255, b * 0.93 * m); }
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
  else if (k === 'piege') { P.rect(1, 8, 10, 3, '#6a6e78'); P.rect(1, 8, 10, 1, '#a8aeb8'); for (let i = 0; i < 5; i++) { P.px(1 + i * 2, 6, '#c8ced8'); P.px(2 + i * 2, 7, '#8a909a'); } P.rect(5, 3, 2, 5, '#7a4b25'); }
  else if (k === 'fumee') { P.disc(6, 8, 5, '#3a3f4a'); P.disc(5, 7, 2, '#6a707a'); P.rect(6, 1, 1, 3, '#7a4b25'); P.px(7, 0, '#ffd25a'); P.px(8, 1, '#ff8a1e'); }
  else if (k === 'ombre') { P.rect(3, 1, 6, 3, '#4a4f5a'); P.rect(2, 4, 8, 8, '#33363e'); P.rect(4, 4, 4, 2, '#1b1424'); }
  return (dynCache[key] = P.outline().canvas());
}
// Rune : pierre dressée avec un symbole lumineux
function runeSprite(fr) {
  const key = 'rune' + fr;
  if (dynCache[key]) return dynCache[key];
  const P = new Painter(14, 18);
  P.rect(3, 2, 8, 14, '#6a6e7a'); P.rect(4, 1, 6, 1, '#6a6e7a'); P.rect(3, 2, 2, 14, '#8a8e9a'); P.rect(9, 3, 2, 13, '#4a4e5a'); P.rect(2, 15, 10, 2, '#4a4e5a');
  const g = fr ? '#bff4ff' : '#7fe0ff';
  P.rect(6, 4, 2, 8, g); P.px(5, 6, g); P.px(8, 6, g); P.px(5, 9, g); P.px(8, 10, g); P.px(4, 11, g); P.px(9, 5, g);
  return (dynCache[key] = P.outline().canvas());
}
// Chariot de bois à deux roues, chargé d'un coffre
function cartSprite(fr) {
  const key = 'cart' + fr;
  if (dynCache[key]) return dynCache[key];
  const P = new Painter(30, 22);
  P.rect(2, 6, 26, 9, '#7a4b25'); P.rect(2, 6, 26, 2, '#a8743f'); P.rect(2, 14, 26, 1, '#4a2c14'); for (const x of [8, 15, 22]) P.rect(x, 8, 1, 6, '#5a3418');
  P.rect(9, 1, 12, 5, '#d9a93a'); P.rect(9, 1, 12, 1, '#ffe27a'); P.rect(14, 3, 2, 2, '#7a4b25');
  P.rect(27, 10, 3, 2, '#5a3418');
  for (const cx of [7, 22]) { P.disc(cx, 17, 4, '#3a2a1a'); P.disc(cx, 17, 2, '#8a6a3a'); P.px(cx + (fr ? 1 : -1), 15, '#c8a060'); P.px(cx - (fr ? 1 : -1), 19, '#c8a060'); }
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
  gobelin:   { nom: 'Gobelin du Bruit', ico: '🥁', col: '#e8a890' },
  dragon:    { nom: 'Dragon des Citrouilles', ico: '🎃', col: '#ffa040' },
  ombres:    { nom: 'Seigneur des Ombres', ico: '👻', col: '#c8c8d8' },
  givre:     { nom: 'Dragon du Givre', ico: '❄️', col: '#8ae0d8' },
  cyclope:   { nom: 'Cyclope du Temps perdu', ico: '⏳', col: '#f0c890' },
  minotaure: { nom: 'Minotaure de la Discorde', ico: '🐂', col: '#b8c0d8' },
  kraken:    { nom: 'Kraken du Chaos', ico: '🐙', col: '#b8a8e0' },
  golem:     { nom: 'Golem des Devoirs', ico: '📚', col: '#f0e4c8' },
  titan:     { nom: 'Titan du Bruit', ico: '💪', col: '#ff8a6a' },
  empereur:  { nom: 'Empereur du Chaos', ico: '😈', col: '#ff5a4a' },
  gluant:    { nom: 'Roi Gluant', ico: '👑', col: '#9af08a' },
};
const SBIRE_DE = { gobelin: 'gobelin', dragon: 'citrouille', ombres: 'ombre', givre: 'glace', cyclope: 'sablier', minotaure: 'diablotin', kraken: 'pieuvre', golem: 'livre', titan: 'gobelin', empereur: 'chevalier', gluant: 'slime' };
// Boss en pixel art (60 x 54), d'après les cartes du système d'émulation. Ils regardent vers la droite.
// f : pas de marche (0-3), a : attaque (bras levés, bouche ouverte), b : respiration, flash : touché
function bossSprite(f, flash, k = 'gluant', a = 0, b = 0) {
  const key = 'boss' + k + f + flash + a + b;
  if (dynCache[key]) return dynCache[key];
  const P = new Painter(60, 54);
  const glow = new Set();
  const G = c => (glow.add(c), c);                              // couleurs lumineuses : pas d'ombrage automatique
  const F = c => flash ? shade(c, 1.55) : c;                    // flash blanc quand il est touché
  const T = c => [F(shade(c, 1.28)), F(c), F(shade(c, 0.7)), F(shade(c, 0.48))];
  const line = (x0, y0, x1, y1, c, w = 1) => { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1; for (let i = 0; i <= n; i++) P.rect(Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), w, w, c); };
  const tri = (ax, ay, bx, by, cx, cy, c) => {
    for (let y = Math.min(ay, by, cy); y <= Math.max(ay, by, cy); y++) for (let x = Math.min(ax, bx, cx); x <= Math.max(ax, bx, cx); x++) {
      const d1 = (x - bx) * (ay - by) - (ax - bx) * (y - by), d2 = (x - cx) * (by - cy) - (bx - cx) * (y - cy), d3 = (x - ax) * (cy - ay) - (cx - ax) * (y - ay);
      if (!((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0))) P.px(x, y, c);
    }
  };
  // volume : sombre dessous, moyen, reflet en haut à gauche
  const ball = (cx, cy, rx, ry, c) => { const [h, m, d] = T(c); P.ellipse(cx, cy, rx, ry, d); P.ellipse(cx - 1, cy - 1, Math.max(1, rx - 1), Math.max(1, ry - 1), m); P.ellipse(cx - Math.ceil(rx * 0.35), cy - Math.ceil(ry * 0.4), Math.max(1, Math.round(rx * 0.4)), Math.max(1, Math.round(ry * 0.35)), h); };
  const limb = (x0, y0, x1, y1, w, c) => { const [h, m, d] = T(c); line(x0, y0, x1, y1, d, w); if (w > 1) line(x0, y0, x1, y1, m, w - 1); if (w > 2) line(x0, y0, x1, y1, h, 1); };
  const box = (x, y, w, h, c) => { const [hi, m, d] = T(c); P.rect(x, y, w, h, m); P.rect(x, y, w, 1, hi); P.rect(x, y, 1, h, hi); P.rect(x + w - 1, y + 1, 1, h - 1, d); P.rect(x + 1, y + h - 1, w - 1, 1, d); };
  // œil lumineux dans une orbite sombre, et sourcil épais en V (regard menaçant)
  const eye = (x, y, c, w = 2, sock = '#1a0e10') => { P.rect(x - 1, y - 1, w + 2, 3, F(sock)); P.rect(x, y, w, a ? 2 : 1, G(c)); P.px(x + (w > 2 ? 1 : 0), y, G('#ffffff')); };
  const brow = (x, y, dir, len, c) => { for (let i = 0; i < len; i++) P.rect(x + dir * i, y + Math.floor(i * 0.6), 1, 2, c); };
  const fangs = (x, y, n, gap, down = 1) => { for (let i = 0; i < n; i++) { P.px(x + i * gap, y, G('#f4f0e0')); P.px(x + i * gap, y + down, G('#d8d0c0')); } };
  const lA = [0, -2, 0, 1][f], lB = [0, 1, 0, -2][f], sw = f === 1 ? -1 : f === 3 ? 1 : 0;

  if (k === 'gobelin') {
    const [sH, s, sD, sDD] = T('#c88c78'), vest = '#5e4234', cloth = '#4a3428', mo = a ? 3 : b;
    // jambes arquées, gros pieds
    limb(25, 40, 23, 47 + lA, 5, '#a8705e'); box(18, 47 + lA, 10, 4, '#a8705e'); for (let i = 0; i < 3; i++) P.px(19 + i * 3, 50 + lA, sDD);
    limb(35, 40, 37, 47 + lB, 5, '#a8705e'); box(34, 47 + lB, 10, 4, '#a8705e'); for (let i = 0; i < 3; i++) P.px(35 + i * 3, 50 + lB, sDD);
    // pagne déchiré
    box(19, 35, 23, 7, cloth); for (let x = 19; x < 42; x += 3) tri(x, 41, x + 3, 41, x + 1, 44 + (x % 2), F(cloth));
    // torse et gilet en lambeaux
    ball(30, 30 + sw, 12, 9, vest); tri(25, 22, 36, 22, 30, 31, F(s)); P.rect(29, 24, 2, 5, F(sD)); P.px(27, 25, F(sH));
    line(18, 22, 38, 39, F('#2e2018'), 2); P.px(28, 30, G('#c8a040'));
    // bras gauche vers le tambour
    limb(21, 25, 14, 31, 4, '#c88c78'); limb(14, 31, 19, 35, 4, '#c88c78'); P.disc(20, 35, 2, F(s));
    line(21, 34, 28, 29, F('#7a4a2a')); P.disc(29, 28, 2, F('#5a3020'));
    // tambour : fût cerclé, peau tendue, cordes
    ball(14, 42, 12, 9, '#8a4a2a'); P.ellipse(16, 39, 9, 6, F('#3a2014')); P.ellipse(16, 39, 8, 5, F('#e8d0bc')); P.ellipse(14, 37, 4, 2, F('#fff4e8'));
    for (let i = 0; i < 5; i++) { line(4 + i * 4, 44, 6 + i * 4, 50, F('#d8c0a0')); P.px(4 + i * 4, 44, F('#5a3020')); }
    P.rect(3, 50, 22, 1, F('#5a3020'));
    // bras droit : baguette levée, ou qui frappe le tambour
    if (a) { limb(39, 24, 43, 31, 4, '#c88c78'); limb(43, 31, 33, 36, 4, '#c88c78'); P.disc(32, 36, 2, F(s)); line(31, 36, 22, 38, F('#7a4a2a')); P.disc(21, 38, 3, F('#5a3020')); for (let i = 0; i < 3; i++) P.px(14 + i * 4, 32 - i, G('#fff6c0')); }
    else { limb(39, 24, 46, 17, 4, '#c88c78'); limb(46, 17, 46, 9, 4, '#c88c78'); P.disc(47, 8, 3, F(s)); line(47, 7, 54, 1, F('#7a4a2a')); P.disc(55, 2, 3, F('#5a3020')); P.px(54, 1, F('#8a5a3a')); }
    // oreilles immenses
    tri(22, 11, 2, 4, 21, 18, F(s)); tri(20, 12, 7, 7, 20, 16, F(sD)); P.px(3, 4, F(sH)); line(4, 5, 20, 11, F(sH));
    tri(38, 11, 58, 4, 39, 18, F(s)); tri(40, 12, 53, 7, 40, 16, F(sD)); line(56, 5, 40, 11, F(sH));
    // tête
    ball(30, 15, 10, 9, '#c88c78');
    for (const [x0, y0, x1, y1] of [[25, 8, 23, 1], [28, 7, 28, 0], [31, 7, 33, 0], [34, 8, 37, 2], [27, 7, 25, 3]]) line(x0, y0, x1, y1, F('#2a1a12'), 2);
    P.px(24, 9, F(sDD)); P.rect(26, 9, 8, 1, F(sD));                            // rides du front
    eye(23, 13, '#ffd84a', 3); eye(33, 13, '#ffd84a', 3); P.px(25, 13, OUT); P.px(33, 13, OUT);
    brow(21, 10, 1, 7, F('#2a1a12')); brow(39, 10, -1, 7, F('#2a1a12'));
    P.rect(28, 14, 4, 5, F(sD)); P.rect(28, 14, 2, 4, F(s)); P.px(28, 18, OUT); P.px(31, 18, OUT); P.px(27, 19, F(sDD)); P.px(32, 19, F(sDD));
    // bouche qui hurle : dents en scie, crocs, langue
    P.ellipse(30, 22 + (mo >> 1), 6, 2 + mo, F('#2a0808')); for (let x = 25; x <= 35; x += 2) P.px(x, 20, G('#fffaf0')); P.rect(25, 20, 11, 1, G('#f4ecd8'));
    P.px(25, 21, G('#ffffff')); P.px(35, 21, G('#ffffff')); P.px(26, 23 + mo, G('#e8e0d0')); P.px(34, 23 + mo, G('#e8e0d0'));
    P.ellipse(30, 23 + mo, 3, 1, F('#b83848'));
  } else if (k === 'dragon' || k === 'givre') {
    const ice = k === 'givre', body = ice ? '#3a8a80' : '#8c939c', [bH, bc, bD, bDD] = T(body);
    const belly = ice ? '#bfe6dc' : '#ddd5bf', wingC = F(ice ? '#2a5e58' : '#5e646c'), wingL = F(ice ? '#4a8e86' : '#80868e'), rib = F(ice ? '#8ad8cc' : '#b8bec6');
    const wf = [0, 2, 4, 2][f] - (a ? 2 : 0), mo = a ? 3 : 0, eyeC = ice ? '#dffcff' : '#ffcc3a';
    // aile du fond (membrane en panneaux, baleines claires)
    const tips = [[41, 1 + wf], [51, 1 + wf], [58, 9 + wf], [58, 21], [50, 27]];
    for (let i = 0; i < tips.length - 1; i++) { const [x1, y1] = tips[i], [x2, y2] = tips[i + 1]; tri(38, 22, x1, y1, x2, y2, i % 2 ? wingC : wingL); }
    for (const [x, y] of tips) line(38, 22, x, y, rib); for (let i = 0; i < tips.length - 1; i++) { const [x1, y1] = tips[i], [x2, y2] = tips[i + 1]; P.px(Math.round((x1 + x2) / 2), Math.round((y1 + y2) / 2) + 1, F(ice ? '#1a3e3a' : '#3e444c')); }
    // socle : trois citrouilles grimaçantes, ou glace
    if (!ice) for (const [x, w] of [[12, 10], [30, 11], [48, 10]]) {
      ball(x, 46, w, 7, '#e07a22'); P.rect(x - 4, 40, 1, 12, F('#a8501a')); P.rect(x + 4, 40, 1, 12, F('#a8501a'));
      tri(x - 6, 44, x - 2, 44, x - 4, 41, G('#ffd24a')); tri(x + 2, 44, x + 6, 44, x + 4, 41, G('#ffd24a')); tri(x - 1, 46, x + 1, 46, x, 45, G('#ffd24a'));
      P.rect(x - 6, 48, 13, 2, G('#ffb02a')); for (let i = 0; i < 4; i++) P.px(x - 5 + i * 3, 48 + (i % 2), F('#a8501a'));
      P.rect(x, 38, 2, 3, F('#3a6a2a')); P.px(x + 2, 38, F('#5a9a3a'));
    } else { P.ellipse(30, 51, 27, 3, F('#d8f2ee')); P.ellipse(30, 50, 22, 2, F('#f4fffd')); for (let i = 0; i < 6; i++) tri(6 + i * 9, 51, 10 + i * 9, 51, 8 + i * 9, 45 - (i % 2) * 2, F('#bfeef0')); }
    const gy = ice ? 4 : 0;
    // queue
    limb(44, 36 + gy, 52, 32 + gy, 4, body); limb(52, 32 + gy, 57, 24 + gy, 3, body); tri(55, 22 + gy, 59, 20 + gy, 58, 26 + gy, F(bD));
    // corps, plaques du ventre, piques du dos
    ball(34, 31 + gy, 13, 10, body); P.ellipse(28, 34 + gy, 7, 6, F(belly)); for (let i = 0; i < 5; i++) P.rect(22, 30 + gy + i * 2, 12, 1, F(shade(belly, 0.82)));
    for (let i = 0; i < 6; i++) tri(32 + i * 3, 22 + gy + (i >> 1), 35 + i * 3, 22 + gy + (i >> 1), 33 + i * 3, 18 + gy + (i >> 1), F(bDD));
    for (let i = 0; i < 14; i++) P.px(30 + ((i * 7) % 16), 27 + gy + ((i * 5) % 8), F(bD));      // écailles
    // pattes : arrière musclée, avant griffue
    ball(42, 40 + gy, 7, 6, body); box(39, 46 + gy, 10, 3, shade(body, 0.8)); for (let i = 0; i < 3; i++) P.px(39 + i * 4, 49 + gy, G('#f0ead8'));
    limb(27, 38 + gy, 23 + sw, 46 + gy, 4, body); for (let i = 0; i < 3; i++) P.px(21 + i * 2 + sw, 47 + gy + (i % 2), G('#f0ead8'));
    // petite aile avant
    tri(29, 24 + gy, 22, 16 + wf, 18, 22 + wf, wingL); tri(29, 24 + gy, 18, 22 + wf, 23, 28 + gy, wingC); line(29, 24 + gy, 22, 16 + wf, rib); line(29, 24 + gy, 18, 22 + wf, rib);
    // cou
    limb(30, 28 + gy, 21, 16, 6, body); line(28, 30 + gy, 20, 19, F(belly), 2);
    // tête : crâne, museau, mâchoire (ouverte en attaque), crocs, naseau qui fume
    ball(18, 12, 7, 6, body); box(4, 11, 13, 5, body); P.rect(4, 11, 13, 1, F(bH));
    P.rect(5, 16, 12, 1 + mo, G(a ? (ice ? '#9ae8f0' : '#ff8a1e') : '#3a0a0a')); box(5, 17 + mo, 11, 3, shade(body, 0.85));
    for (let x = 6; x < 16; x += 2) { P.px(x, 16, G('#ffffff')); P.px(x + 1, 16 + mo, G('#f0ead8')); }
    if (a) for (let i = 0; i < 4; i++) P.rect(1 - i, 15 + (i % 2), 2, 2, G(i % 2 ? (ice ? '#ffffff' : '#ffe27a') : (ice ? '#9ae8f0' : '#ff6a1e')));
    P.px(5, 12, OUT); P.px(6, 12, F(bDD));
    eye(14, 10, eyeC, 3, '#20141a'); P.px(16, 10, OUT);
    line(11, 7, 20, 10, F(bDD), 2); P.rect(11, 6, 4, 1, F(bDD));                    // arcade sourcilière menaçante
    limb(20, 8, 26, 3, 3, ice ? '#d8f4f0' : '#e8e0c8'); line(26, 3, 28, 0, F(ice ? '#ffffff' : '#f4ecd8'), 2);
    limb(22, 11, 29, 7, 2, ice ? '#d8f4f0' : '#e8e0c8'); P.px(30, 6, F('#f4ecd8'));
    for (let i = 0; i < 3; i++) tri(20 + i * 2, 16, 22 + i * 2, 16, 21 + i * 2, 19, F(bD));
    if (ice) for (let i = 0; i < 6; i++) P.px(8 + i * 8, 22 + ((i * 7) % 12), G('#ffffff'));
  } else if (k === 'ombres') {
    const [rH, r, rD, rDD] = T('#66666f'), fy = [0, 1, 2, 1][(f + b * 2) % 4], hand = F('#d6d2c4'), handD = F('#9a968a');
    // aura de fumée
    for (let i = 0; i < 10; i++) { const x = 6 + ((i * 13 + f * 3) % 48), y = 8 + ((i * 7) % 30); P.px(x, y + fy, F('#8a8a9a')); }
    // manches : bras tombants, ou levés grands ouverts en attaque
    for (const d of [-1, 1]) {
      const sx = 30 + d * 7, hx = a ? 30 + d * 25 : 30 + d * 21, hy = a ? 10 : 30;
      tri(sx, 17 + fy, hx, hy + fy, 30 + d * 10, 30 + fy, rD); line(sx, 17 + fy, hx, hy + fy, r, 3); line(sx, 17 + fy, hx, hy + fy, rH, 1);
      const fx0 = hx - (d < 0 ? 3 : 0);
      P.rect(fx0, hy + 1 + fy, 4, 3, hand); P.rect(fx0, hy + 3 + fy, 4, 1, handD);
      for (let i = 0; i < 4; i++) line(fx0 + i, hy + 4 + fy, fx0 + i + d * (a ? 1 : 0) - (a ? d : 0), hy + 7 + (i % 2) + fy, i % 2 ? handD : hand);
    }
    // robe : plis verticaux, plus sombre vers le bas
    for (let y = 15; y < 44; y++) {
      const w = 7 + Math.floor((y - 15) * 0.6);
      for (let x = -w; x < w; x++) { const fold = Math.floor((x + w) * 7 / (2 * w) + Math.sin(y * 0.3 + x * 0.2) * 0.4); const c = fold % 3 === 0 ? rDD : fold % 3 === 1 ? rD : r; P.px(30 + x, y + fy, y > 36 && (x + y) % 2 ? rDD : c); }
      P.px(30 - w, y + fy, rH);
    }
    for (let x = 12; x < 49; x += 2) { const h = 2 + ((x * 7 + f * 2) % 6); for (let j = 0; j < h; j++) P.px(x + ((j + x + f) % 3 === 0 ? 1 : 0), 44 + j + fy, j > h - 3 ? F('#8a8a96') : rDD); }
    // capuche, visage d'ombre, yeux blancs ou rouges en attaque
    ball(30, 10 + fy, 10, 10, '#66666f'); P.ellipse(30, 12 + fy, 6, 7, F('#050508')); P.ellipse(30, 15 + fy, 4, 4, F('#000000'));
    for (let i = 0; i < 4; i++) { P.px(22 + i, 5 + i + fy, rDD); P.px(38 - i, 5 + i + fy, rDD); }
    const ec = a ? '#ff4a3a' : '#ffffff';
    P.px(26, 10 + fy, G(shade(ec, 0.7))); P.rect(27, 11 + fy, 2, 1, G(ec)); P.px(34, 10 + fy, G(shade(ec, 0.7))); P.rect(32, 11 + fy, 2, 1, G(ec));
    if (a) { P.px(26, 11 + fy, G('#ff9a8a')); P.px(34, 11 + fy, G('#ff9a8a')); }
    P.px(30, 0 + fy, rH);
  } else if (k === 'cyclope') {
    const skin = '#c48c64', [sH, s, sD, sDD] = T(skin), mo = a ? 2 : 0;
    // jambes trapues, pieds larges
    limb(24, 40, 23, 48 + lA, 7, skin); box(18, 47 + lA, 11, 5, shade(skin, 0.85)); for (let i = 0; i < 4; i++) P.px(19 + i * 3, 51 + lA, F(sDD));
    limb(36, 40, 37, 48 + lB, 7, skin); box(34, 47 + lB, 11, 5, shade(skin, 0.85)); for (let i = 0; i < 4; i++) P.px(35 + i * 3, 51 + lB, F(sDD));
    box(17, 34, 26, 7, '#5a4030'); for (let x = 17; x < 43; x += 3) tri(x, 40, x + 3, 40, x + 1, 44, F('#5a4030'));
    // torse massif : pectoraux, ventre, taches sur l'épaule
    ball(30, 27 + b, 15, 11, skin); ball(24, 23 + b, 6, 4, skin); ball(36, 23 + b, 6, 4, skin); P.rect(29, 21 + b, 2, 10, F(sD)); P.ellipse(30, 31 + b, 6, 3, F(sD)); P.ellipse(29, 30 + b, 5, 2, F(s));
    for (const [x, y] of [[40, 17], [43, 19], [41, 20], [44, 16], [39, 19]]) P.px(x, y + b, F(sDD));
    // bras gauche : horloge (levée en attaque)
    const cx = a ? 11 : 11, cy = a ? 14 : 27;
    limb(17, 21, 12, cy + 4, 6, skin);
    P.disc(cx, cy, 9, F('#a87830')); P.disc(cx, cy, 8, F('#d8a848')); P.disc(cx, cy, 6, G('#f4ead2'));
    for (let i = 0; i < 12; i++) { const an = i / 12 * Math.PI * 2; P.px(cx + Math.round(Math.cos(an) * 5), cy + Math.round(Math.sin(an) * 5), i % 3 ? F('#8a7a5a') : OUT); }
    const ha = f * Math.PI / 2 - Math.PI / 2; line(cx, cy, cx + Math.round(Math.cos(ha) * 4), cy + Math.round(Math.sin(ha) * 4), OUT); line(cx, cy, cx + 3, cy, OUT); P.px(cx, cy, F('#c03030'));
    // bras droit : sablier
    limb(43, 21, 48, 31, 6, skin); P.disc(48, 32, 3, F(s));
    box(44, 30, 11, 2, '#6a4a2a'); box(44, 46, 11, 2, '#6a4a2a'); P.rect(44, 32, 1, 14, F('#4a3018')); P.rect(54, 32, 1, 14, F('#4a3018'));
    for (let y = 0; y < 7; y++) { P.rect(46 + (y >> 1), 32 + y, 7 - y, 1, G('#dcf0f8')); P.rect(46 + (y >> 1), 45 - y, 7 - y, 1, G('#dcf0f8')); }
    P.rect(47, 41, 5, 4, G('#e8c070')); P.rect(48, 33, 3, 2, G('#e8c070')); P.px(49, 36 + (f % 3), G('#f0d090')); P.px(49, 38 + (f % 2), G('#f0d090'));
    // tête chauve, oreilles pointues, un seul œil immense
    tri(19, 9, 13, 5, 20, 14, F(s)); tri(41, 9, 47, 5, 40, 14, F(s)); P.px(15, 6, F(sH)); P.px(45, 6, F(sH));
    ball(30, 11, 10, 9, skin); P.ellipse(26, 5, 3, 1, F(sH));
    P.disc(30, 10, 5, F('#2a1810')); P.disc(30, 10, 4, G('#f4eedc')); P.disc(30, 10, 3, G(a ? '#e83a2a' : '#a8602a')); P.disc(30, 10, 1, OUT); P.px(29, 9, G('#ffffff'));
    if (a) { P.px(26, 10, G('#ff9a6a')); P.px(34, 10, G('#ff9a6a')); }
    P.rect(25, 5, 11, 1, F(sDD)); P.rect(24, 4, 3, 2, F(sDD)); P.rect(34, 4, 3, 2, F(sDD)); P.rect(28, 6, 5, 1, F(sDD));   // paupière lourde
    P.rect(26, 7, 9, 1, F(sD));
    P.rect(28, 14, 4, 2, F(sD)); P.px(28, 15, OUT); P.px(31, 15, OUT);
    if (a) { P.rect(25, 18, 11, 2 + mo, F('#2a0808')); fangs(26, 18, 4, 3); }
    else { line(25, 19, 35, 19, F(sDD)); P.px(24, 20, F(sDD)); P.px(36, 20, F(sDD)); P.rect(27, 18, 7, 1, F(sD)); }
  } else if (k === 'minotaure') {
    const fur = '#757e8e', [fH, fc, fD, fDD] = T(fur), horn = '#ece2c8', mo = a ? 2 : 0;
    // queue qui fouette
    limb(41, 36, 50, 42 + sw * 2, 2, fur); P.rect(49, 42 + sw * 2, 4, 4, F(fDD));
    // jambes et sabots
    limb(25, 39, 23, 47 + lA, 6, fur); box(19, 47 + lA, 9, 4, '#2a2a32'); P.px(23, 50 + lA, F('#1a1a20'));
    limb(35, 39, 37, 47 + lB, 6, fur); box(33, 47 + lB, 9, 4, '#2a2a32'); P.px(37, 50 + lB, F('#1a1a20'));
    box(19, 33, 22, 7, '#3c404e'); for (let x = 19; x < 41; x += 3) tri(x, 39, x + 3, 39, x + 1, 43, F('#3c404e'));
    // torse : pectoraux, abdominaux, fourrure aux épaules
    ball(30, 26 + b, 13, 10, fur); ball(25, 22 + b, 5, 4, fur); ball(35, 22 + b, 5, 4, fur);
    P.rect(29, 21 + b, 2, 11, F(fD)); for (let i = 0; i < 3; i++) { P.rect(25, 27 + i * 2 + b, 4, 1, F(fD)); P.rect(31, 27 + i * 2 + b, 4, 1, F(fD)); }
    for (let i = 0; i < 8; i++) { P.px(18 + i, 17 + (i % 2), F(fH)); P.px(35 + i, 17 + (i % 2), F(fH)); }
    // bras gauche + hache (levée en attaque)
    if (a) { limb(19, 19, 14, 10, 5, fur); line(15, 12, 5, 0, F('#6a4a2a'), 2); tri(0, 0, 9, 0, 3, 9, F('#c8ced8')); line(0, 1, 6, 1, G('#ffffff')); }
    else { limb(19, 19, 13, 31, 5, fur); line(12, 37, 12, 6, F('#6a4a2a'), 2); tri(3, 3, 11, 7, 3, 16, F('#c8ced8')); line(3, 4, 3, 15, G('#ffffff')); P.rect(10, 6, 2, 9, F('#8a909a')); }
    // bras droit + épée (abattue en attaque)
    if (a) { limb(41, 19, 46, 27, 5, fur); line(47, 27, 58, 42, F('#d8dee8'), 2); line(48, 27, 59, 41, G('#ffffff')); P.rect(44, 25, 6, 2, F('#c8a040')); }
    else { limb(41, 19, 47, 30, 5, fur); line(48, 28, 57, 3, F('#d8dee8'), 2); line(49, 28, 58, 4, F('#9aa0aa')); P.rect(45, 28, 7, 2, F('#c8a040')); P.rect(47, 30, 2, 4, F('#6a4a2a')); }
    // tête de taureau : cornes, oreilles, mufle, anneau, yeux rouges
    limb(23, 7, 15, 5, 3, horn); limb(15, 5, 13, 0, 2, horn); P.px(13, 0, F('#fffaf0')); limb(37, 7, 45, 5, 3, horn); limb(45, 5, 47, 0, 2, horn);
    P.rect(22, 6, 3, 3, F('#8a8270')); P.rect(35, 6, 3, 3, F('#8a8270'));
    tri(22, 10, 15, 9, 21, 13, F(fc)); tri(38, 10, 45, 9, 39, 13, F(fc)); P.px(17, 10, F('#c8a0a8')); P.px(43, 10, F('#c8a0a8'));
    ball(30, 11, 8, 8, fur); P.ellipse(30, 6, 5, 2, F(fH));
    ball(30, 17, 6, 4, '#b4a4ac'); P.rect(27, 17, 2, 2, OUT); P.rect(32, 17, 2, 2, OUT); P.ellipse(30, 21, 2, 1, G('#d8b040')); P.px(30, 22, F('#a88020'));
    if (a) { P.rect(26, 20, 9, 1 + mo, F('#2a0a0a')); for (let i = 0; i < 3; i++) P.px(23 - i * 2, 16 - i, G('#e8f0f8')); for (let i = 0; i < 3; i++) P.px(37 + i * 2, 16 - i, G('#e8f0f8')); }
    eye(24, 11, '#ff3a2a', 2); eye(34, 11, '#ff3a2a', 2);
    brow(22, 8, 1, 6, F(fDD)); brow(38, 8, -1, 6, F(fDD));
  } else if (k === 'kraken') {
    const kc = '#685f84', [kH, km, kD, kDD] = T(kc), sucker = F('#d0c8e0');
    // tentacules qui ondulent (levés en attaque)
    const arms = [[-1, 0.3, 22], [1, 0.3, 22], [-1, 0.9, 19], [1, 0.9, 19], [-1, 1.45, 15], [1, 1.45, 15], [-1, 2.0, 11], [1, 2.0, 11]];
    arms.forEach(([dir, base, len], j) => {
      let x = 30 + dir * 5, y = 26, an = Math.PI / 2 - dir * (base + (a ? 0.9 : 0)) + Math.sin(f * Math.PI / 2 + j) * 0.15;
      for (let i = 0; i < len; i++) {
        const th = i < len * 0.45 ? 4 : i < len * 0.75 ? 3 : i < len * 0.9 ? 2 : 1;
        P.rect(Math.round(x) - (th >> 1), Math.round(y), th, th, (i >> 2) % 2 ? kD : km);
        if (th > 1) P.px(Math.round(x) - (th >> 1), Math.round(y), kH);
        if (i % 3 === 1 && th > 1) P.px(Math.round(x), Math.round(y) + th, sucker);
        x += Math.cos(an) * 1.5; y += Math.sin(an) * 1.5 * 0.8;
        an -= dir * (i < len * 0.5 ? 0.04 : 0.4 + Math.sin(f + j) * 0.05);
      }
    });
    // sablier tenu
    box(26, 40, 9, 2, '#8a6a3a'); box(26, 50, 9, 2, '#8a6a3a'); for (let y = 0; y < 4; y++) { P.rect(27 + (y >> 1), 42 + y, 7 - y, 1, G('#e4f2f8')); P.rect(27 + (y >> 1), 49 - y, 7 - y, 1, G('#e4f2f8')); } P.rect(29, 47, 3, 2, G('#e8c070'));
    // manteau : grosse tête bombée, taches, reflets
    ball(30, 15, 14, 14, kc); P.ellipse(30, 26, 9, 3, F(kD));
    for (const [x, y, rr] of [[36, 6, 1], [40, 11, 2], [22, 9, 1], [38, 18, 1], [25, 4, 1], [33, 3, 1]]) P.disc(x, y, rr, F(kD));
    P.ellipse(23, 6, 3, 2, F(shade(kc, 1.5)));
    // yeux : pupilles fendues horizontales, paupières lourdes en V
    for (const ex of [22, 38]) { P.disc(ex, 20, 4, F('#2a1a28')); P.disc(ex, 20, 3, G(a ? '#ff6a3a' : '#f0e4b0')); P.rect(ex - 2, 20, 5, 1, OUT); P.px(ex - 1, 19, G('#ffffff')); }
    for (const [ex, d] of [[22, 1], [38, -1]]) for (let i = -4; i <= 4; i++) { const t = Math.round((d * i + 4) / 8 * 3); P.rect(ex + i, 15, 1, 2 + t, F(kD)); P.px(ex + i, 17 + t, F(kDD)); }
    brow(16, 14, 1, 8, F(kDD)); brow(44, 14, -1, 8, F(kDD));
    // éclairs du chaos
    if (f % 2 === 0 || a) for (const [bx, d] of [[4, 1], [55, -1]]) { line(bx, 0, bx + d * 4, 5, G('#fff6a0')); line(bx + d * 4, 5, bx + d, 6, G('#fff6a0')); line(bx + d, 6, bx + d * 5, 12, G('#fff6a0')); P.px(bx + d * 5, 13, G('#ffffff')); }
  } else if (k === 'golem') {
    const pc = '#e4d8bc', ln = F('#b0a282'), ink = F('#4a4a5a');
    const blk = (x, y, w, h) => { box(x, y, w, h, pc); for (let j = y + 2; j < y + h - 1; j += 2) P.rect(x + 1, j, w - 2, 1, ln); P.rect(x + 2, y + 1, 1, h - 2, F('#d88a8a')); };
    // jambes en blocs, pieds en livres
    blk(19, 40 + lA, 9, 8); box(16, 47 + lA, 13, 5, '#7a3a2a'); P.rect(16, 48 + lA, 13, 1, F('#f4ecd8'));
    blk(33, 40 + lB, 9, 8); box(32, 47 + lB, 13, 5, '#2a4a7a'); P.rect(32, 48 + lB, 13, 1, F('#f4ecd8'));
    // torse, ceinture, gribouillis d'encre
    blk(16, 20 + b, 28, 14); box(16, 32, 28, 3, '#6a4a2a'); P.rect(28, 32, 4, 3, G('#d8b040'));
    for (const [x, y, w] of [[19, 23, 6], [33, 25, 7], [21, 28, 4], [35, 29, 5]]) P.rect(x, y + b, w, 1, ink);
    P.px(40, 22 + b, F('#c03030')); P.px(41, 23 + b, F('#c03030'));   // une rature rouge
    blk(19, 34, 22, 7);
    // bras : livres serrés, ou levés au-dessus de la tête en attaque
    if (a) { blk(8, 4, 8, 16); blk(44, 4, 8, 16); box(7, 0, 10, 5, pc); box(43, 0, 10, 5, pc); }
    else {
      blk(8, 20, 8, 7); blk(7, 27, 8, 8); blk(44, 20, 8, 7); blk(45, 27, 8, 9); box(45, 36, 8, 4, pc);
      for (let i = 0; i < 4; i++) { const c = ['#8a2a2a', '#2a4a8a', '#2a6a3a', '#7a5a2a'][i]; box(1 + (i % 2), 22 + i * 3, 13, 3, c); P.rect(2 + (i % 2), 23 + i * 3, 11, 1, F('#f4ecd8')); }
    }
    // tête cube : dessus clair, côté sombre, front lourd, yeux ambre, bouche crispée
    blk(19, 4 + sw, 22, 16); P.rect(19, 4 + sw, 22, 2, F('#fff6e0')); P.rect(38, 6 + sw, 3, 14, F('#b8ac8c'));
    P.rect(21, 9 + sw, 17, 2, F('#6a5a3a')); P.rect(28, 10 + sw, 3, 2, F('#6a5a3a'));
    eye(23, 12 + sw, '#ffb02a', 3, '#3a2a18'); eye(33, 12 + sw, '#ffb02a', 3, '#3a2a18');
    brow(21, 9 + sw, 1, 7, F('#3a2a18')); brow(38, 9 + sw, -1, 7, F('#3a2a18'));
    box(28, 13 + sw, 4, 3, shade(pc, 0.8));
    if (a) { P.rect(23, 17 + sw, 13, 2, F('#2a1a0a')); fangs(24, 17 + sw, 6, 2); }
    else { P.rect(24, 17 + sw, 11, 1, OUT); P.px(23, 18 + sw, OUT); P.px(35, 18 + sw, OUT); }
  } else if (k === 'titan') {
    const skin = '#c89c74', [sH, s, sD, sDD] = T(skin), hair = '#5a3820', mo = a ? 3 : 1;
    // deux troncs dans le dos (écorce, anneaux)
    for (const x of [9, 44]) { box(x, 0, 8, 32, '#8a6a44'); for (let y = 2; y < 31; y += 3) P.px(x + 2 + (y % 4), y, F('#5a4428')); P.rect(x + 2, 3, 1, 26, F('#6a5034')); P.ellipse(x + 3, 0, 3, 1, F('#d8b888')); P.px(x + 3, 0, F('#a88858')); }
    // jambes musclées
    limb(24, 39, 22, 48 + lA, 8, skin); box(17, 48 + lA, 12, 4, shade(skin, 0.85)); P.ellipse(23, 43 + lA, 2, 1, F(sH));
    limb(36, 39, 38, 48 + lB, 8, skin); box(33, 48 + lB, 12, 4, shade(skin, 0.85)); P.ellipse(37, 43 + lB, 2, 1, F(sH));
    box(18, 33, 24, 7, '#6a4a30'); for (let x = 18; x < 42; x += 3) tri(x, 39, x + 3, 39, x + 1, 44, F('#6a4a30'));
    // torse : gros pectoraux, abdominaux en grille, ceinture à tête de lion
    ball(30, 25 + b, 15, 10, skin); ball(23, 20 + b, 7, 5, skin); ball(37, 20 + b, 7, 5, skin); P.rect(29, 17 + b, 2, 15, F(sD));
    for (let i = 0; i < 3; i++) { box(24, 26 + i * 3 + b, 5, 3, skin); box(31, 26 + i * 3 + b, 5, 3, skin); }
    box(17, 32, 26, 3, '#4a3020'); ball(30, 34, 4, 4, '#c8a040'); P.px(28, 33, OUT); P.px(32, 33, OUT); P.rect(29, 36, 3, 1, OUT); for (let i = 0; i < 6; i++) P.px(26 + i * 2 - (i > 2 ? 0 : 0), 30 + (i % 2), F('#a87820'));
    // bras : poings levés, ou qui frappent le sol en attaque
    if (a) { limb(16, 18, 13, 30, 6, skin); limb(13, 30, 18, 42, 6, skin); ball(19, 44, 4, 4, skin); limb(44, 18, 47, 30, 6, skin); limb(47, 30, 42, 42, 6, skin); ball(41, 44, 4, 4, skin); for (let i = 0; i < 5; i++) P.px(10 + i * 10, 50, G('#fff6a0')); }
    else { limb(16, 18, 7, 22, 6, skin); limb(7, 22, 7, 11, 6, skin); ball(7, 9, 4, 4, skin); P.rect(5, 8, 5, 1, F(sD)); limb(44, 18, 53, 22, 6, skin); limb(53, 22, 53, 11, 6, skin); ball(53, 9, 4, 4, skin); P.rect(51, 8, 5, 1, F(sD)); }
    // tête : crinière, barbe, sourcils froncés, bouche qui hurle
    ball(30, 9, 11, 9, hair); for (let i = 0; i < 8; i++) tri(19 + i * 3, 3, 21 + i * 3, 3, 20 + i * 3 - 1, 0 + (i % 2), F(hair));
    ball(30, 10, 7, 7, skin); ball(30, 17, 8, 6, hair); for (let i = 0; i < 5; i++) P.px(25 + i * 2, 21 + (i % 2), F('#3a2414'));
    P.rect(25, 6, 10, 1, F(sD)); P.rect(26, 4, 8, 1, F(sD));
    P.rect(24, 9, 4, 2, G('#f4f0e0')); P.rect(32, 9, 4, 2, G('#f4f0e0')); P.px(26, 9, OUT); P.px(33, 9, OUT); P.px(26, 10, OUT); P.px(33, 10, OUT);
    brow(22, 6, 1, 7, F('#2a1810')); brow(38, 6, -1, 7, F('#2a1810'));
    P.rect(29, 11, 2, 3, F(sD)); P.px(28, 13, F(sDD)); P.px(31, 13, F(sDD));
    P.rect(26, 15, 8, 1 + mo, F('#2a0808')); P.rect(26, 15, 8, 1, G('#f4ecd8')); if (a) P.rect(27, 18, 6, 1, G('#e8e0d0'));
    if (f % 2 === 0 || a) { line(1, 14, 4, 18, G('#fff6a0')); line(4, 18, 1, 20, G('#fff6a0')); line(58, 14, 55, 18, G('#fff6a0')); line(55, 18, 58, 20, G('#fff6a0')); }
  } else if (k === 'empereur') {
    const ar = '#585d68', [aH, am, aD, aDD] = T(ar), red = '#ff3a2a', mo = a ? 3 : 1;
    // cape rouge sombre derrière
    tri(18, 16, 42, 16, 10, 50, F('#5a1418')); tri(42, 16, 50, 50, 10, 50, F('#5a1418')); for (let x = 12; x < 50; x += 4) P.rect(x, 40, 1, 10, F('#3a0a0e'));
    // jambes en armure, genouillères à pointe
    box(20, 40 + lA, 8, 8, ar); box(18, 47 + lA, 11, 5, shade(ar, 0.8)); tri(20, 42 + lA, 24, 42 + lA, 22, 38 + lA, F(aH));
    box(32, 40 + lB, 8, 8, ar); box(31, 47 + lB, 11, 5, shade(ar, 0.8)); tri(32, 42 + lB, 36, 42 + lB, 34, 38 + lB, F(aH));
    for (let i = 0; i < 6; i++) box(18 + i * 4, 33, 4, 7 - (i % 2) * 2, shade(ar, 0.8));
    // cuirasse : plaques, fissures rougeoyantes, ceinture à crâne
    ball(30, 25 + b, 13, 10, ar); P.rect(29, 17 + b, 2, 14, F(aDD));
    for (let i = 0; i < 3; i++) { P.rect(23, 25 + i * 3 + b, 5, 1, F(aD)); P.rect(32, 25 + i * 3 + b, 5, 1, F(aD)); }
    line(24, 20 + b, 27, 24 + b, G('#ff5a3a')); line(35, 19 + b, 33, 23 + b, G('#ff5a3a')); P.px(31, 27 + b, G('#ff8a5a'));
    box(17, 30, 26, 3, '#3a3036'); ball(30, 31, 3, 3, '#e8e2d0'); P.px(29, 31, OUT); P.px(31, 31, OUT); P.px(30, 33, OUT);
    // épaulières à pointes
    for (const [x, d] of [[16, -1], [44, 1]]) { ball(x, 16, 7, 5, ar); for (let i = 0; i < 3; i++) tri(x + d * (i * 3 - 2), 13, x + d * (i * 3 + 1), 13, x + d * (i * 3), 6 - i, F(aH)); }
    // bras gauche + épée (levée au-dessus de la tête en attaque)
    if (a) { limb(14, 20, 12, 10, 5, ar); line(12, 8, 1, 0, F('#d8dee8'), 2); line(13, 8, 2, 0, G('#ffffff')); box(9, 8, 8, 2, '#8a6a3a'); }
    else { limb(14, 20, 10, 31, 5, ar); line(10, 30, 10, 2, F('#d8dee8'), 2); P.rect(10, 2, 1, 27, G('#ffffff')); box(6, 29, 10, 2, '#8a6a3a'); P.rect(9, 31, 3, 4, F('#4a3428')); P.disc(10, 36, 1, G('#ff3a2a')); }
    // bras droit : griffe (tendue en attaque, avec énergie rouge)
    if (a) { limb(46, 20, 55, 24, 5, ar); for (let i = 0; i < 4; i++) line(55, 22 + i, 59, 20 + i * 2, F('#c8ccd4')); for (let i = 0; i < 4; i++) P.px(56 + (i % 2), 18 + i * 3, G('#ff6a4a')); }
    else { limb(46, 20, 49, 31, 5, ar); for (let i = 0; i < 4; i++) line(47 + i, 33, 47 + i, 36 + (i % 2), F('#c8ccd4')); }
    // tête de démon : cornes immenses, yeux rouges, crocs
    limb(24, 6, 17, 3, 3, '#3a3438'); limb(17, 3, 15, -1, 2, '#3a3438'); limb(36, 6, 43, 3, 3, '#3a3438'); limb(43, 3, 45, -1, 2, '#3a3438');
    P.px(26, 3, F('#5a545a')); P.px(34, 3, F('#5a545a'));
    ball(30, 10, 8, 8, ar); box(24, 13, 13, 5, shade(ar, 0.7));
    eye(24, 9, red, 3, '#0a0406'); eye(33, 9, red, 3, '#0a0406'); P.px(23, 10, G('#ff8a6a')); P.px(37, 10, G('#ff8a6a'));
    brow(22, 6, 1, 7, F(aDD)); brow(38, 6, -1, 7, F(aDD));
    P.rect(25, 14, 11, 1 + mo, G(a ? '#ff3a1a' : '#2a0a0a')); for (let i = 0; i < 6; i++) P.px(25 + i * 2, 14, G('#ffffff')); P.px(26, 15 + mo, G('#f4f0e0')); P.px(34, 15 + mo, G('#f4f0e0'));
  } else {
    // Roi Gluant
    const [gH, gm, gD] = T('#5ac85a'), sq = (b + (f % 2)) % 2;
    P.ellipse(30, 37 + sq, 26 + sq, 15 - sq, gD); P.ellipse(29, 35 + sq, 25 + sq, 15 - sq, gm); P.ellipse(20, 28 + sq, 7, 3, gH); P.px(14, 31, gH);
    for (let i = 0; i < 4; i++) P.px(12 + i * 12, 49, gD);
    P.rect(18, 32, 6, 6, G('#ffffff')); P.rect(36, 32, 6, 6, G('#ffffff')); P.rect(21, 34, 3, 4, OUT); P.rect(36, 34, 3, 4, OUT);
    brow(15, 28, 1, 9, OUT); brow(45, 28, -1, 9, OUT);
    P.rect(24, 42, 12, 2 + (a ? 2 : 0), F('#2a0a0a')); P.rect(26, 44 + (a ? 2 : 0), 8, 1, F('#e04a5a')); fangs(25, 42, 2, 9);
    const cy = 12 + sq * 2, gold = '#f2c94c';
    box(20, cy + 5, 20, 6, gold); tri(20, cy + 5, 24, cy + 5, 20, cy - 1, F(gold)); tri(27, cy + 5, 33, cy + 5, 30, cy - 4, F(gold)); tri(36, cy + 5, 40, cy + 5, 40, cy - 1, F(gold));
    P.px(30, cy + 7, G('#e04a5a')); P.px(24, cy + 7, G('#3a7ae0')); P.px(36, cy + 7, G('#3fbf5a'));
  }
  // ombrage automatique : bord éclairé en haut à gauche, bord sombre en bas à droite, grain de texture
  const W0 = P.w, H0 = P.h, g0 = P.g.slice();
  for (let y = 0; y < H0; y++) for (let x = 0; x < W0; x++) {
    const i = y * W0 + x, c = g0[i];
    if (!c || glow.has(c) || c === OUT) continue;
    const up = y > 0 && g0[i - W0], left = x > 0 && g0[i - 1], down = y < H0 - 1 && g0[i + W0], right = x < W0 - 1 && g0[i + 1];
    if (!up || !left) P.g[i] = shade(c, 1.16);
    else if (!down || !right) P.g[i] = shade(c, 0.74);
    else { const n = ((x * 73856093) ^ (y * 19349663)) >>> 0, h = (n % 100) / 100; if (h < 0.1) P.g[i] = shade(c, 0.9); else if (h > 0.93) P.g[i] = shade(c, 1.08); }
  }
  return (dynCache[key] = P.outline().canvas());
}
// Sbires appelés par le boss enragé (et objets lancés : citrouille, livre, rocher)
function minionSprite(k, fr, flash) {
  const key = 'mn' + k + fr + flash;
  if (dynCache[key]) return dynCache[key];
  const P = new Painter(18, 18), b = fr ? 1 : 0;
  const F = c => flash ? shade(c, 1.6) : c;
  if (k === 'gobelin') {
    const sk = F('#c48a78'), skD = F('#94604f');
    P.rect(6, 14, 2, 3 - b, skD); P.rect(10, 14, 2, 2 + b, skD);
    P.rect(5, 10, 8, 5, F('#5e4234')); P.ellipse(3, 13, 3, 2, F('#8a4a2a')); P.ellipse(3, 12, 2, 1, F('#efd8c8'));
    P.rect(4, 3, 10, 7, sk); P.rect(1, 3, 3, 2, sk); P.px(0, 2, sk); P.rect(14, 3, 3, 2, sk); P.px(17, 2, sk);
    P.px(7, 1, F('#2e2018')); P.px(9, 0, F('#2e2018')); P.px(11, 1, F('#2e2018'));
    P.px(6, 5, '#fff2c0'); P.px(11, 5, '#fff2c0'); P.rect(7, 7, 4, 2, '#3a1414'); P.px(7, 7, '#ffffff'); P.px(10, 7, '#ffffff');
    P.rect(14, 8 - b, 1, 5, F('#8a5a2a')); P.px(14, 7 - b, F('#6a4030'));
  } else if (k === 'citrouille') {
    const o = F('#e8781e'), oD = F('#b8521a');
    P.rect(5, 15, 2, 2 - b, F('#3a6a2a')); P.rect(11, 15, 2, 1 + b, F('#3a6a2a'));
    P.ellipse(9, 10 - b, 7, 5, o); P.rect(6, 6 - b, 1, 9, oD); P.rect(12, 6 - b, 1, 9, oD);
    P.rect(8, 2 - b, 2, 3, F('#3a6a2a')); P.px(10, 2 - b, F('#5a9a3a'));
    P.rect(5, 8 - b, 2, 2, '#ffe27a'); P.rect(11, 8 - b, 2, 2, '#ffe27a'); P.rect(6, 12 - b, 6, 1, '#ffe27a'); P.px(8, 12 - b, oD);
  } else if (k === 'ombre') {
    const r = F('#5a5a64');
    P.ellipse(9, 5 - b, 4, 4, r); P.ellipse(9, 6 - b, 2, 3, '#08080e'); P.px(8, 6 - b, '#ffffff'); P.px(10, 6 - b, '#ffffff');
    for (let y = 9; y < 16; y++) P.rect(9 - (y - 6) / 2, y - b, y - 6, 1, y % 3 ? r : F('#45454d'));
    for (let x = 5; x < 14; x += 2) P.px(x, 16 + ((x + b) % 2), F('#8a8a94'));
  } else if (k === 'glace') {
    const c = F('#9ae8f0'), d = F('#4ab0c8');
    P.rect(8, 1, 2, 4, c); P.rect(6, 4, 6, 9, c); P.rect(4, 7, 10, 4, c); P.rect(7, 13, 4, 2, d); P.rect(11, 4, 1, 9, d); P.rect(6, 4, 1, 9, F('#ffffff'));
    P.px(7, 8, OUT); P.px(10, 8, OUT); P.rect(7, 10, 4, 1, d);
    P.px(2, 6 + b, '#ffffff'); P.px(15, 9 - b, '#ffffff');
  } else if (k === 'sablier') {
    const w = F('#7a5a2a'), g = F('#d8eef8'), sand = F('#e8c070');
    P.rect(4, 1, 10, 2, w); P.rect(4, 13, 10, 2, w); P.rect(4, 3, 1, 10, w); P.rect(13, 3, 1, 10, w);
    for (let y = 0; y < 5; y++) { P.rect(5 + (y >> 1), 3 + y, 8 - y, 1, g); P.rect(5 + (y >> 1), 12 - y, 8 - y, 1, g); }
    P.rect(7, 10, 4, 2, sand); P.px(9, 7 + b, sand); P.px(7, 4, OUT); P.px(10, 4, OUT);
    P.rect(5, 15, 2, 2 - b, w); P.rect(11, 15, 2, 1 + b, w);
  } else if (k === 'diablotin') {
    const r = F('#c0303a'), rD = F('#8a1a24');
    P.rect(6, 14, 2, 3 - b, rD); P.rect(10, 14, 2, 2 + b, rD);
    P.rect(5, 9, 8, 6, r); P.ellipse(9, 6, 5, 4, r); P.px(5, 2, F('#e8e2d0')); P.px(4, 1, F('#e8e2d0')); P.px(13, 2, F('#e8e2d0')); P.px(14, 1, F('#e8e2d0'));
    P.px(7, 6, '#ffe27a'); P.px(11, 6, '#ffe27a'); P.rect(7, 8, 4, 1, OUT); P.px(8, 9, '#ffffff');
    P.rect(13, 12, 3, 1, rD); P.px(16, 11, rD); P.rect(1, 7 - b, 3, 5, F('#5a1a24'));
  } else if (k === 'pieuvre') {
    const c = F('#7a6a9a'), d = F('#4a4068');
    P.ellipse(9, 6, 6, 5, c); P.ellipse(7, 4, 2, 1, F('#a898c8'));
    for (let i = 0; i < 5; i++) P.rect(4 + i * 2, 10, 1, 4 + ((i + b) % 2) * 2, i % 2 ? d : c);
    P.disc(7, 7, 1, '#ffffff'); P.disc(11, 7, 1, '#ffffff'); P.px(7, 7, OUT); P.px(11, 7, OUT);
  } else if (k === 'livre') {
    const c = F(b ? '#8a2a2a' : '#2a4a8a'), pg = F('#f4ecd8');
    P.rect(3, 6 - b, 12, 8, pg); P.rect(8, 5 - b, 2, 10, c);
    P.rect(1, 4 - b * 2, 7, 3, c); P.rect(10, 4 - b * 2, 7, 3, c);
    for (let y = 8; y < 13; y += 2) { P.rect(4, y - b, 3, 1, F('#b8ac8c')); P.rect(11, y - b, 3, 1, F('#b8ac8c')); }
    P.px(5, 7 - b, OUT); P.px(12, 7 - b, OUT);
  } else if (k === 'chevalier') {
    const a = F('#4a4e58'), aL = F('#7a808a');
    P.rect(6, 14, 2, 3 - b, a); P.rect(10, 14, 2, 2 + b, a);
    P.rect(5, 8, 8, 7, a); P.rect(5, 8, 8, 1, aL); P.rect(4, 2, 10, 7, a); P.rect(4, 2, 10, 1, aL);
    P.rect(5, 5, 8, 1, OUT); P.px(7, 5, '#ff3a2a'); P.px(11, 5, '#ff3a2a'); P.px(4, 0, F('#2e2a2e')); P.px(13, 0, F('#2e2a2e')); P.px(4, 1, F('#2e2a2e')); P.px(13, 1, F('#2e2a2e'));
    P.rect(14, 4 - b, 1, 10, F('#d8dee8')); P.rect(13, 12 - b, 3, 1, F('#8a6a3a'));
  } else if (k === 'rocher') {
    P.ellipse(9, 10, 7, 6, F('#8a8580')); P.ellipse(7, 8, 3, 2, F('#b8b2aa')); P.px(11, 12, F('#5a5550')); P.px(12, 9, F('#5a5550'));
  } else {
    const c = F('#5ac85a');
    P.ellipse(9, 12, 7 + b, 5 - b, F('#3a9a44')); P.ellipse(9, 11, 7 + b, 5 - b, c); P.ellipse(7, 9, 2, 1, F('#9af08a'));
    P.rect(6, 10, 2, 2, OUT); P.rect(11, 10, 2, 2, OUT); P.rect(8, 13, 3, 1, OUT);
  }
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
  const dtW = Math.min(0.05, Math.max(0, now - (drawWorld.t || now))); drawWorld.t = now;
  const leger = typeof eco !== 'undefined' && eco;   // mode économie (écran des élèves)

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
  // escorte : le chemin du chariot, puis le chariot
  if (world.ca && ROUTE) {
    ctx.save(); ctx.strokeStyle = '#e0a03a88'; ctx.lineWidth = big ? 10 : 6; ctx.setLineDash([14, 12]); ctx.beginPath();
    ROUTE.forEach(([x, y], i) => i ? ctx.lineTo(x, y + 10) : ctx.moveTo(x, y + 10)); ctx.stroke(); ctx.setLineDash([]);
    const [ex, ey] = ROUTE[ROUTE.length - 1]; img(flagSprite('#e0a03a'), ex, ey - 20, big ? 6 : PX); ctx.restore();
  }
  if (world.ca) {
    const [x, y, pc, en, st] = world.ca;
    ctx.fillStyle = '#00000044'; ctx.beginPath(); ctx.ellipse(x, y + 26, 40, 10, 0, 0, 7); ctx.fill();
    img(cartSprite(st === 1 ? Math.floor(now * 8) % 2 : 0), x, y, big ? 6 : PX);
    ctx.strokeStyle = st === 1 ? '#e0a03a' : st === 2 ? '#ff5a4a' : '#ffffff55'; ctx.lineWidth = 3; ctx.setLineDash([8, 8]);
    ctx.beginPath(); ctx.ellipse(x, y + 10, 140, 90, 0, 0, 7); ctx.stroke(); ctx.setLineDash([]);
  }
  // runes à capturer
  for (const [x, y] of world.ru || []) {
    const fl = Math.sin(now * 3 + x) * 4;
    ctx.fillStyle = '#00000040'; ctx.beginPath(); ctx.ellipse(x, y + 18, 16, 5, 0, 0, 7); ctx.fill();
    ctx.save(); ctx.globalAlpha = 0.35 + Math.sin(now * 4 + y) * 0.15; ctx.fillStyle = '#7fe0ff'; ctx.beginPath(); ctx.arc(x, y - 4 + fl, big ? 70 : 30, 0, 7); ctx.fill(); ctx.restore();
    img(runeSprite(Math.floor(now * 3 + x) % 2), x, y - 4 + fl, big ? 6 : PX);
  }
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
  // âmes des K.O. : un coéquipier qui reste 2 s à côté peut les relever en répondant à une question
  for (const [x, y, tm, prog, id] of world.am || []) {
    const fl = Math.sin(now * 3 + id) * 4, col = teams && teams[tm] ? teams[tm].color : '#8af07a';
    ctx.save(); ctx.globalAlpha = 0.75;
    sq(x - 6, y - 24 + fl, 4, '#e8f4ff'); sq(x - 9, y - 12 + fl, 6, '#e8f4ff'); sq(x - 3, y - 20 + fl, 1, OUT); sq(x + 3, y - 20 + fl, 1, OUT);
    ctx.globalAlpha = 1; ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(x, y + 16, 26, 9, 0, 0, 7); ctx.stroke();
    if (prog > 0) { ctx.strokeStyle = '#8af07a'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(x, y - 16 + fl, 18, -Math.PI / 2, -Math.PI / 2 + prog * Math.PI * 2); ctx.stroke(); }
    ctx.restore();
  }
  // pièges : visibles seulement pour leur poseur et ses coéquipiers (et au projecteur)
  for (const [x, y, ow, arming] of world.tr || []) {
    const o = world.p.find(q => q.id === ow);
    if (!big && mine && ow !== mine.id && !(o && mine.tm >= 0 && o.tm === mine.tm)) continue;
    ctx.save(); ctx.globalAlpha = arming ? 0.5 : 0.9; img(itemSprite('piege'), x, y - 4); ctx.restore();
  }
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
  for (const [x, y, r, t, ink] of world.pz) {
    if (ink === 2) {   // racines du druide : lianes brunes et feuilles
      ctx.save(); ctx.globalAlpha = Math.min(1, t);
      ctx.fillStyle = '#3a5a2440'; ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.6, 0, 0, 7); ctx.fill();
      for (let i = 0; i < 9; i++) { const a = i * 0.7, d = (i % 3 + 1) / 3.4; const rx = x + Math.cos(a * 2.3) * r * d, ry = y + Math.sin(a * 2.3) * r * 0.55 * d;
        for (let k = 0; k < 4; k++) sq(rx + k * 3 - 6, ry - Math.abs(k - 1.5) * 3, 2, k === 3 ? '#5aa832' : '#6a4a24'); }
      ctx.restore(); continue;
    }
    ctx.save(); ctx.globalAlpha = Math.min(1, t) * 0.75;
    ctx.fillStyle = ink ? '#1e1830' : '#4fbf5a'; ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.6, 0, 0, 7); ctx.fill();
    ctx.fillStyle = ink ? '#4a3a6a' :'#8af07a'; ctx.beginPath(); ctx.ellipse(x - r * 0.3, y - r * 0.15, r * 0.3, r * 0.14, 0, 0, 7); ctx.fill();
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

  if (!leger) drawBestioles(ctx, world, map, sq, dtW, now);
  if (world.zt) drawTempete(ctx, world.zt, map, sq, now, big);
  // effets
  for (const f of world.fx) {
    const t = f.t / f.d;
    ctx.save(); ctx.globalAlpha = Math.max(0, Math.min(1, t * 1.5));
    if (f.k === 'slash') {
      for (let i = 0; i <= 8; i++) { const a = f.a - f.arc / 2 + f.arc * i / 8; sq(f.x + Math.cos(a) * f.r, f.y + Math.sin(a) * f.r, 2, '#ffffff'); }
    } else if (f.k === 'boom' && f.c === 'eclair') {   // éclair du chaos qui tombe du ciel
      ctx.globalAlpha = 1;
      let x = f.x, y = f.y - 260;
      ctx.strokeStyle = t > 0.5 ? '#ffffff' : '#c8a0ff'; ctx.lineWidth = big ? 14 : 6; ctx.beginPath(); ctx.moveTo(x, y);
      for (let i = 0; i < 6; i++) { x = f.x + (i % 2 ? 22 : -18) * (1 - i / 6); y += 260 / 6; ctx.lineTo(x, y); }
      ctx.stroke();
      for (let i = 0; i < 20; i++) { const a = i / 20 * Math.PI * 2, r = f.r * (1.1 - t * 0.6); sq(f.x + Math.cos(a) * r, f.y + Math.sin(a) * r * 0.6, 3, i % 2 ? '#c8a0ff' : '#ffffff'); }
    } else if (f.k === 'boom' && f.c === 'tentacule') {   // tentacule qui jaillit du sol
      ctx.globalAlpha = 1;
      const h = Math.sin((1 - t) * Math.PI) * 90;
      for (let i = 0; i < 12; i++) { const u = i / 12, w = Math.round((1 - u) * 4) + 1; sq(f.x - w * 1.5 + Math.sin(u * 4 + now * 6) * 10 * u, f.y + 10 - h * u, w, i % 3 ? '#6a6284' : '#4a4068'); if (i % 3 === 1) sq(f.x + 6, f.y + 10 - h * u, 1, '#c8c0d8'); }
      for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; sq(f.x + Math.cos(a) * f.r * 0.8, f.y + 10 + Math.sin(a) * f.r * 0.45, 2, '#4a4068'); }
    } else if (f.k === 'boom') {
      const r = f.r * (1.1 - t * 0.6);
      for (let i = 0; i < 28; i++) { const a = i / 28 * Math.PI * 2; sq(f.x + Math.cos(a) * r, f.y + Math.sin(a) * r, 3, i % 2 ? (f.gold ? '#fff6c0' : '#ff8a1e') : '#ffe27a'); sq(f.x + Math.cos(a + 0.1) * r * 0.6, f.y + Math.sin(a + 0.1) * r * 0.6, 2, f.gold ? '#f2c94c' : '#ff4a1a'); }
    } else if (f.k === 'slam') {   // onde de choc, de la couleur du boss
      const r = f.r * (1.1 - t), c = f.b && BOSS_INFO[f.b] ? BOSS_INFO[f.b].col : '#9af08a', c2 = f.b === 'ombres' ? '#2a2a34' : f.b === 'kraken' ? '#3a2a5a' : shade(c, 0.7);
      for (let i = 0; i < 32; i++) { const a = i / 32 * Math.PI * 2; sq(f.x + Math.cos(a) * r, f.y + 20 + Math.sin(a) * r * 0.6, big ? 5 : 3, i % 2 ? c2 : c); }
    } else if (f.k === 'sablier') {   // le temps ralentit : cadran doré et grains de sable
      const r = f.r * Math.min(1, (1 - t) * 1.6);
      for (let i = 0; i < 36; i++) { const a = i / 36 * Math.PI * 2; sq(f.x + Math.cos(a) * r, f.y + Math.sin(a) * r * 0.7, i % 3 ? 2 : 4, i % 3 ? '#e8c070' : '#fff2b0'); }
      for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2 + now; sq(f.x + Math.cos(a) * r * 0.5, f.y + Math.sin(a) * r * 0.35 + (1 - t) * 30, 2, '#e8c070'); }
      ctx.lineWidth = 4; ctx.strokeStyle = '#fff2b0'; ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.lineTo(f.x + Math.cos(now * 8) * r * 0.6, f.y + Math.sin(now * 8) * r * 0.4); ctx.stroke();
    } else if (f.k === 'tourbillon') {   // coups d'arme tout autour
      for (let k = 0; k < 3; k++) for (let i = 0; i < 10; i++) { const a = (1 - t) * 9 + k * 2.1 + i * 0.08, r = f.r * (0.6 + i * 0.04); sq(f.x + Math.cos(a) * r, f.y + Math.sin(a) * r * 0.7, big ? 5 : 3, i > 6 ? '#ffffff' : '#c8ccd4'); }
    } else if (f.k === 'visee') {   // le cyclope vise : ligne rouge qui prévient
      ctx.save(); ctx.globalAlpha = 0.5 + Math.sin(now * 30) * 0.3; ctx.strokeStyle = '#ff3a2a'; ctx.lineWidth = big ? 8 : 3; ctx.setLineDash([16, 10]);
      ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.lineTo(f.x + Math.cos(f.a) * f.long, f.y + Math.sin(f.a) * f.long); ctx.stroke(); ctx.restore();
    } else if (f.k === 'rayon') {
      for (const [w, c] of [[big ? 70 : 40, '#ff6a2a'], [big ? 36 : 20, '#ffd25a'], [big ? 14 : 8, '#ffffff']]) { ctx.strokeStyle = c; ctx.lineWidth = w * t; ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.lineTo(f.x + Math.cos(f.a) * f.long, f.y + Math.sin(f.a) * f.long); ctx.stroke(); }
    } else if (f.k === 'cri') {   // cri assourdissant : ondes sonores
      for (const m of [1, 0.7, 0.4]) {
        const r = f.r * Math.min(1, (1 - t) * 1.3 + (1 - m) * 0.2) * m;
        for (let i = 0; i < 30; i++) { if (i % 3 === 2) continue; const a = i / 30 * Math.PI * 2; sq(f.x + Math.cos(a) * r, f.y - 10 + Math.sin(a) * r * 0.7, big ? 4 : 2, m === 1 ? '#ffd54a' : '#ffffff'); }
      }
    } else if (f.k === 'souffle') {   // souffle de feu du dragon
      const ice = f.c === 'glace';
      for (let i = 0; i < 46; i++) {
        const u = ((i * 37) % 100) / 100, d = f.r * u * Math.min(1, (1 - t) * 2), a = f.a + (((i * 53) % 100) / 100 - 0.5) * 0.9 * u;
        sq(f.x + Math.cos(a) * d, f.y + Math.sin(a) * d, u < 0.3 ? 4 : 3, ice ? (u < 0.35 ? '#ffffff' : u < 0.7 ? '#9ae8f0' : '#4ab0c8') : (u < 0.35 ? '#fff2a0' : u < 0.7 ? '#ff8a1e' : '#c23b1a'));
      }
    } else if (f.k === 'cible') {   // citrouille qui va tomber ici
      ctx.globalAlpha = 1;
      ctx.save(); ctx.globalAlpha = 0.18 + (1 - t) * 0.3; ctx.fillStyle = '#ff3a2a'; ctx.beginPath(); ctx.ellipse(f.x, f.y + 10, f.r, f.r * 0.6, 0, 0, 7); ctx.fill(); ctx.restore();
      for (let i = 0; i < 24; i++) { if (i % 2) continue; const a = i / 24 * Math.PI * 2 + now; sq(f.x + Math.cos(a) * f.r, f.y + 10 + Math.sin(a) * f.r * 0.6, big ? 4 : 2, '#ff5a3a'); }
    } else if (f.k === 'lob') {
      ctx.globalAlpha = 1;
      const u = 1 - t, px = f.x + (f.x2 - f.x) * u, py = f.y + (f.y2 - f.y) * u - Math.sin(u * Math.PI) * 140;
      img(minionSprite(f.c || 'citrouille', 0, 0), px, py, big ? 5 : 2);
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
    } else if (f.k === 'cercle') {   // cercle de soin du druide
      const r = f.r * (1.05 - t * 0.6);
      for (let i = 0; i < 32; i++) { const a = i / 32 * Math.PI * 2 + now; sq(f.x + Math.cos(a) * r, f.y + 10 + Math.sin(a) * r * 0.6, 2, i % 3 ? '#8af07a' : '#ffffff'); }
      for (let i = 0; i < 6; i++) { const a = i * 1.05 + now * 2; sq(f.x + Math.cos(a) * r * 0.5, f.y - (1 - t) * 40 + Math.sin(a) * 8, 2, '#c8ff6a'); }
    } else if (f.k === 'piege') {   // le piège se referme
      for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; sq(f.x + Math.cos(a) * (14 + (1 - t) * 20), f.y + Math.sin(a) * (8 + (1 - t) * 10), 2, i % 2 ? '#c8ced8' : '#ffe36b'); }
    } else if (f.k === 'bark') {
      for (const m of [1, 0.7]) { const r = f.r * (1.1 - t) * m; for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; sq(f.x + Math.cos(a) * r, f.y + Math.sin(a) * r * 0.6, 2, '#fff6c0'); } }
    } else if (f.k === 'owl') {
      const r = f.r * (1 - t);
      for (let i = 0; i < 36; i++) { const a = i / 36 * Math.PI * 2; sq(f.x + Math.cos(a) * r, f.y + Math.sin(a) * r * 0.6, 2, i % 2 ? '#f2c94c' : '#ffffff'); }
    } else if (f.k === 'crit') {
      ctx.font = '22px "Lexend", sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 5; ctx.strokeStyle = OUT;
      ctx.strokeText(f.txt, f.x, f.y - 40 - (1 - t) * 30); ctx.fillStyle = '#ffd54a'; ctx.fillText(f.txt, f.x, f.y - 40 - (1 - t) * 30);
    }
    ctx.restore();
  }
  partsDepuisFx(world, leger ? 50 : 360);
  drawParts(ctx, sq, dtW);
  suivreKO(world, disp);
  drawChutes(ctx, sq, dtW, heroScale);
  // projectiles
  for (const [x, y, c, a] of world.b) {
    if (c === 'mage') {
      sq(x - 6, y - 6, 4, '#ff4a1a'); sq(x - 3, y - 3, 2, '#ffe27a');
      sq(x - Math.cos(a) * 14, y - Math.sin(a) * 14, 2, '#ff8a1e'); sq(x - Math.cos(a) * 24, y - Math.sin(a) * 24, 1, '#ffb347');
    } else if (c === 'druide') {   // graine magique et feuilles
      sq(x - 4, y - 4, 3, '#3a7a24'); sq(x - 3, y - 3, 2, '#9ad84a'); sq(x - 2, y - 3, 1, '#e8ffb0');
      sq(x - Math.cos(a) * 12 - 2, y - Math.sin(a) * 12 + Math.sin(now * 20) * 3, 2, '#5aa832'); sq(x - Math.cos(a) * 22, y - Math.sin(a) * 22 - Math.sin(now * 20) * 3, 1, '#9ad84a');
    } else if (c === 'pet') {
      sq(x - 4, y - 4, 3, '#ff8a1e'); sq(x - 2, y - 2, 1, '#ffe27a'); sq(x - Math.cos(a) * 10, y - Math.sin(a) * 10, 2, '#ffb347');
    } else if (c === 'ombre') {   // boule d'ombre qui ralentit
      sq(x - 8, y - 8, 5, '#1a1424'); sq(x - 5, y - 5, 3, '#4a3a6a'); sq(x - 3, y - 4, 1, '#c8b8ff');
      sq(x - Math.cos(a) * 16, y - Math.sin(a) * 16, 2, '#4a3a6a'); sq(x - Math.cos(a) * 26, y - Math.sin(a) * 26, 1, '#2a2434');
    } else if (c === 'glace') {   // éclat de glace
      for (let i = 0; i < 5; i++) sq(x - Math.cos(a) * i * 3, y - Math.sin(a) * i * 3, i ? 2 : 3, i ? '#9ae8f0' : '#ffffff');
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
    const [x, y, , , ang, fl, bk, shield, phase, an] = B, bs = big ? 7 : PX;
    const fr = an & 2 ? Math.floor(now * 7) % 4 : 0, atk = an & 1 ? 1 : 0, br = Math.floor(now * 1.6) % 2;
    ctx.fillStyle = '#00000044'; ctx.beginPath(); ctx.ellipse(x, y + 40, 70, 16, 0, 0, 7); ctx.fill();
    if (phase === 2) for (let k = 0; k < 10; k++) { const t = (now * 0.8 + k / 10) % 1; sq(x + Math.sin(k * 2.7) * 70, y + 30 - t * 120, big ? 4 : 2, t < 0.5 ? '#ff5a3a' : '#a8201a'); }
    const spr = bossSprite(fr, fl && Math.floor(now * 20) % 2 ? 1 : 0, bk, atk, br);
    ctx.save(); ctx.translate(Math.round(x), Math.round(y - 10)); if (Math.cos(ang) < -0.2) ctx.scale(-1, 1);
    ctx.drawImage(spr, Math.round(-spr.width * bs / 2), Math.round(-spr.height * bs / 2), spr.width * bs, spr.height * bs); ctx.restore();
    if (shield) {   // Bouclier du savoir : bulle bleue
      ctx.save(); ctx.globalAlpha = 0.22 + Math.sin(now * 5) * 0.08; ctx.fillStyle = '#9fd6ff'; ctx.beginPath(); ctx.arc(x, y - 6, big ? 200 : 92, 0, 7); ctx.fill();
      ctx.globalAlpha = 0.9; ctx.lineWidth = big ? 10 : 4; ctx.strokeStyle = '#dff2ff'; ctx.setLineDash([14, 8]); ctx.lineDashOffset = now * 30; ctx.beginPath(); ctx.arc(x, y - 6, big ? 200 : 92, 0, 7); ctx.stroke(); ctx.restore();
    }
    bossDrawn = true;
  };
  // sbires
  const mk = B ? SBIRE_DE[B[6]] || 'slime' : world.mk || 'slime';
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
    const zom = world.mode === 'zombie' && p.tm === 1;
    if (zom) ctx.filter = 'hue-rotate(75deg) saturate(1.7) brightness(0.85)';   // les zombies deviennent verdâtres
    drawHeroSprite(ctx, d.x, d.y + breathe, p.c, p.l || 'm00', p.a, d.ph, heroScale, p.g, p.at);
    if (zom) { ctx.filter = 'none'; const S = heroScale; sq(d.x - 4 * S, d.y + breathe + 22 - 22 * S, 1, '#ff3a3a'); sq(d.x + 2 * S, d.y + breathe + 22 - 22 * S, 1, '#ff3a3a'); }
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
    if (p.pr) {   // protection au retour en jeu : halo doré
      ctx.globalAlpha = 0.85;
      for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2 - now * 3; sq(d.x + Math.cos(a) * 30, d.y + 18 + Math.sin(a) * 9, 2, i % 2 ? '#ffe36b' : '#ffffff'); }
      for (let i = 0; i < 3; i++) { const t = (now * 0.9 + i / 3) % 1; sq(d.x - 20 + i * 20, d.y + 14 - t * 50, 1, '#ffe36b'); }
    }
    if (p.sh) {
      ctx.globalAlpha = alpha * 0.8;
      for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2 + now * 2; sq(d.x + Math.cos(a) * 36, d.y - 10 + Math.sin(a) * 40, 2, '#7fd3ff'); }
    }
    ctx.restore();
  }
  if (!bossDrawn) drawBoss();
  // bulles des messages rapides
  for (const [id, i] of world.bu || []) {
    const p = world.p.find(q => q.id === id); if (!p || !p.al) continue;
    const d = disp.get(id) || p, txt = BULLES[i] || '';
    ctx.save(); ctx.font = (big ? 30 : 15) + 'px "Lexend", sans-serif'; ctx.textAlign = 'center';
    const w = ctx.measureText(txt).width + 14, h = big ? 40 : 22, y = d.y - (big ? 150 : 74);
    ctx.fillStyle = OUT; ctx.fillRect(Math.round(d.x - w / 2) - 2, Math.round(y - h) - 2, Math.round(w) + 4, h + 4);
    ctx.fillStyle = '#fffaf0'; ctx.fillRect(Math.round(d.x - w / 2), Math.round(y - h), Math.round(w), h);
    ctx.fillStyle = OUT; ctx.fillRect(Math.round(d.x) - 3, Math.round(y) + 2, 6, 4);
    ctx.fillStyle = '#2a1f3d'; ctx.fillText(txt, d.x, y - h * 0.28); ctx.restore();
  }
  // nuages de bombe fumigène (par-dessus les joueurs)
  for (const [x, y, r, t] of world.sm || []) {
    ctx.save(); ctx.globalAlpha = Math.min(1, t / 1.2) * 0.82;
    for (let i = 0; i < 14; i++) { const a = i * 2.39 + now * 0.3, d = (i % 4 + 1) / 4 * r * 0.75; const rr = r * (0.32 + (i % 3) * 0.06);
      ctx.fillStyle = i % 2 ? '#8a8e98' : '#a8acb4'; ctx.beginPath(); ctx.arc(x + Math.cos(a) * d, y + Math.sin(a) * d * 0.6, rr, 0, 7); ctx.fill(); }
    ctx.restore();
  }
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
  ctx.font = `${big ? 46 : 15}px "Lexend", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  for (const p of list) {
    const d = disp.get(p.id) || p;
    const isMe = mine && p.id === mine.id;
    if ((p.hd || p.inv) && !isMe && mine && !(md && Math.hypot(md.x - d.x, md.y - d.y) < (p.inv ? 80 : 130))) continue;
    const ny = Math.round(d.y + 22 - (p.c === 'mage' ? 31 : 28) * heroScale);
    const tcol = teams && p.tm >= 0 && teams[p.tm] ? teams[p.tm].color : null;
    ctx.lineWidth = big ? 9 : 4; ctx.strokeStyle = OUT; ctx.strokeText(p.n, d.x, ny);
    ctx.fillStyle = isMe ? '#ffd54a' : tcol || '#ffffff'; ctx.fillText(p.n, d.x, ny);
    if (p.bz) { ctx.strokeText('❓', d.x, ny - (big ? 50 : 20)); ctx.fillText('❓', d.x, ny - (big ? 50 : 20)); }
    else if (p.lz) { const t = '👑' + (world.pm ? ' +' + world.pm : ''); ctx.strokeText(t, d.x, ny - (big ? 50 : 20)); ctx.fillText(t, d.x, ny - (big ? 50 : 20)); }
    const bw = big ? 110 : 36, r = p.hp / p.m;
    ctx.fillStyle = OUT; ctx.fillRect(Math.round(d.x - bw / 2) - 3, ny + 6, bw + 6, big ? 20 : 8);
    ctx.fillStyle = '#3a2a3a'; ctx.fillRect(Math.round(d.x - bw / 2), ny + 9, bw, big ? 14 : 3);
    ctx.fillStyle = r > 0.5 ? '#5ad65a' : r > 0.25 ? '#ffcc00' : '#ff3b30';
    ctx.fillRect(Math.round(d.x - bw / 2), ny + 9, Math.round(bw * r / 3) * 3, big ? 14 : 3);
  }
  if (B) {
    const [x, y, hp, max, , , bk] = B, bw = big ? 300 : 140, ny = y - (big ? 212 : 104), BI = BOSS_INFO[bk] || BOSS_INFO.gluant, lbl = BI.ico + ' ' + BI.nom;
    ctx.lineWidth = big ? 9 : 4; ctx.strokeStyle = OUT; ctx.strokeText(lbl, x, ny - 8); ctx.fillStyle = BI.col; ctx.fillText(lbl, x, ny - 8);
    ctx.fillStyle = OUT; ctx.fillRect(x - bw / 2 - 3, ny, bw + 6, big ? 24 : 12);
    ctx.fillStyle = '#3a2a3a'; ctx.fillRect(x - bw / 2, ny + 3, bw, big ? 18 : 6);
    ctx.fillStyle = '#e04a5a'; ctx.fillRect(x - bw / 2, ny + 3, Math.round(bw * Math.max(0, hp) / max), big ? 18 : 6);
  }
}

// Mini-carte (vue élève)
// ---------- Ambiance vivante : tout est calculé sur l'appareil, rien ne passe par le Wi-Fi ----------
// Particules : étincelles des coups, fumée des K.O., débris des explosions
const PARTS = [];
let fxVus = new Map();
function partsDepuisFx(world, lim) {
  const vus = new Map();
  for (const f of world.fx) {
    const key = f.k + '|' + Math.round(f.x) + '|' + Math.round(f.y), avant = fxVus.get(key);
    vus.set(key, f.t);
    if ((avant !== undefined && f.t <= avant + 0.01) || PARTS.length > lim) continue;
    const add = (n, cols, v, vie, g = 0, up = 0, dy = -24) => {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, sp = v * (0.4 + Math.random() * 0.6);
        PARTS.push({ x: f.x, y: f.y + dy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.7 - up, g, t: vie * (0.6 + Math.random() * 0.4), d: vie, c: cols[i % cols.length], s: Math.random() < 0.4 ? 2 : 1 });
      }
    };
    if (f.k === 'hit') add(7, ['#ffffff', '#ffe27a', '#ffb347'], 220, 0.3);
    else if (f.k === 'death') { add(14, ['#e8e4f0', '#bdb6cc', '#8a8498'], 90, 0.9, -60, 30, -10); add(8, ['#ffe27a', '#ffffff'], 200, 0.6); }
    else if (f.k === 'boom' && !f.c) add(f.gold ? 16 : 22, f.gold ? ['#fff6c0', '#f2c94c'] : ['#ffe27a', '#ff8a1e', '#ff4a1a', '#5a4a3a'], 320, 0.6, 500, 160, 0);
    else if (f.k === 'item' || f.k === 'spawn') add(10, ['#fff6c0', '#ffe36b', '#ffffff'], 120, 0.7, -40, 40);
    else if (f.k === 'cercle' || f.k === 'heal') add(10, ['#8af07a', '#c8ff6a', '#ffffff'], 120, 0.9, -80, 30, 0);
  }
  fxVus = vus;
}
function drawParts(ctx, sq, dt) {
  for (let i = PARTS.length - 1; i >= 0; i--) {
    const q = PARTS[i];
    if ((q.t -= dt) <= 0) { PARTS.splice(i, 1); continue; }
    q.x += q.vx * dt; q.y += q.vy * dt; q.vy += q.g * dt; q.vx *= 0.95;
    ctx.globalAlpha = Math.min(1, q.t / q.d * 1.6); sq(q.x, q.y, q.s, q.c);
  }
  ctx.globalAlpha = 1;
}
// Chute au K.O. : le héros bascule, des étoiles tournent, une petite âme s'envole
const etatsVie = new Map(), chutes = [];
function suivreKO(world, disp) {
  for (const p of world.p) {
    if (etatsVie.get(p.id) === true && !p.al && !p.hd && !p.inv) { const d = disp.get(p.id) || p; chutes.push({ x: d.x, y: d.y, c: p.c, l: p.l || 'm00', a: p.a, g: p.g, t: 0 }); }
    etatsVie.set(p.id, p.al);
  }
}
function drawChutes(ctx, sq, dt, S) {
  for (let i = chutes.length - 1; i >= 0; i--) {
    const k = chutes[i];
    if ((k.t += dt) > 1.4) { chutes.splice(i, 1); continue; }
    const u = Math.min(1, k.t / 0.3);
    ctx.save(); ctx.globalAlpha = k.t < 0.9 ? 1 : Math.max(0, 1 - (k.t - 0.9) / 0.5);
    ctx.translate(Math.round(k.x), Math.round(k.y + 20)); ctx.rotate(u * u * Math.PI / 2 * (Math.cos(k.a) < 0 ? -1 : 1));
    drawHeroSprite(ctx, 0, -20, k.c, k.l, k.a, 0, S, k.g, false);
    ctx.restore();
    if (k.t > 0.25) for (let j = 0; j < 3; j++) { const a = k.t * 7 + j * 2.1; sq(k.x + Math.cos(a) * 18, k.y + Math.sin(a) * 5, 2, j % 2 ? '#ffffff' : '#ffe27a'); }
    if (k.t > 0.45) { const v = (k.t - 0.45) / 0.95; ctx.globalAlpha = 0.85 * (1 - v); sq(k.x - 4 + Math.sin(k.t * 9) * 4, k.y - 24 - v * 70, 3, '#e8f4ff'); sq(k.x - 1 + Math.sin(k.t * 9) * 4, k.y - 16 - v * 70, 1, '#e8f4ff'); ctx.globalAlpha = 1; }
  }
}
// Tempête : tout ce qui est hors du cercle s'assombrit en violet
function drawTempete(ctx, [x, y, r], map, sq, now, big) {
  ctx.save();
  ctx.fillStyle = 'rgba(70,20,110,0.36)'; ctx.beginPath(); ctx.rect(-50, -50, map.W + 100, map.H + 100); ctx.arc(x, y, r, 0, 7); ctx.fill('evenodd');
  ctx.strokeStyle = '#e2b8ff'; ctx.lineWidth = big ? 12 : 4; ctx.setLineDash([18, 12]); ctx.lineDashOffset = -now * 40; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.stroke();
  ctx.restore();
  const n = Math.min(90, Math.round(r / 14));
  for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + now * 0.25, d = r + 10 + ((i * 37 + now * 60) % 60); sq(x + Math.cos(a) * d, y + Math.sin(a) * d, i % 3 ? 2 : 3, i % 2 ? '#c890ff' : '#ffffff'); }
}
// Petits animaux qui se sauvent quand un héros approche
let bestioles = null;
const BESTIOLES = { village: ['papillon', 'papillon', 'lapin', 'oiseau'], foret: ['papillon', 'lapin', 'oiseau', 'lapin'], cite: ['oiseau', 'papillon', 'oiseau'], colisee: ['oiseau', 'papillon'], desert: ['lezard', 'lezard', 'papillon'], hiver: ['lapinB', 'oiseau', 'lapinB'], marais: ['luciole', 'luciole', 'grenouille', 'papillon'], donjon: ['chauve', 'rat', 'rat'] };
const BULLES = ['🆘 Aide-moi !', '🎯 À l\'objectif !', '⚔️ On attaque !', '🛡️ Je défends', '👍 Bravo !'];
const VOLANTS = new Set(['papillon', 'luciole', 'chauve']);
function drawBestioles(ctx, world, map, sq, dt, now) {
  const H = mapAnim && mapAnim.herbe;
  if (!H || !H.length) return;
  const spot = () => H[Math.floor(Math.random() * H.length)];
  if (!bestioles) {
    const types = BESTIOLES[map.theme] || BESTIOLES.village;
    bestioles = [];
    for (let i = 0; i < 12; i++) { const [x, y] = spot(); bestioles.push({ k: types[i % types.length], x, y, hx: x, hy: y, tx: x, ty: y, t: Math.random() * 3, fuite: 0, vx: 0, vy: 0, ph: Math.random() * 6, c: i % 3 }); }
  }
  for (const b of bestioles) {
    let proche = null;
    for (const p of world.p) if (p.al && Math.abs(p.x - b.x) < 110 && Math.abs(p.y - b.y) < 110 && Math.hypot(p.x - b.x, p.y - b.y) < (b.k === 'luciole' ? 60 : 95)) { proche = p; break; }
    if (proche && b.fuite <= 0) { const a = Math.atan2(b.y - proche.y, b.x - proche.x); b.fuite = b.k === 'oiseau' ? 2 : 0.9; const v = b.k === 'oiseau' || VOLANTS.has(b.k) ? 260 : 210; b.vx = Math.cos(a) * v; b.vy = Math.sin(a) * v - (b.k === 'oiseau' ? 140 : 0); }
    if (b.fuite > 0) {
      b.x += b.vx * dt; b.y += b.vy * dt; b.fuite -= dt;
      if (b.fuite <= 0) { if (b.k === 'oiseau') { const [x, y] = spot(); b.x = x; b.y = y; } b.hx = b.tx = b.x; b.hy = b.ty = b.y; }
    } else if (VOLANTS.has(b.k)) {   // vole en boucle autour de son coin
      b.ph += dt; b.x += ((b.hx + Math.sin(b.ph * 0.9) * 40 + Math.sin(b.ph * 2.3) * 12) - b.x) * Math.min(1, dt * 3); b.y += ((b.hy + Math.sin(b.ph * 1.3) * 26 - 10) - b.y) * Math.min(1, dt * 3);
    } else {   // trottine vers un point proche, puis s'arrête
      if ((b.t -= dt) <= 0) { b.t = 1.5 + Math.random() * 3; b.tx = b.hx + (Math.random() - 0.5) * 120; b.ty = b.hy + (Math.random() - 0.5) * 80; }
      const dx = b.tx - b.x, dy = b.ty - b.y, l = Math.hypot(dx, dy);
      if (l > 3) { const v = Math.min(l, (b.k === 'lezard' ? 70 : 45) * dt); b.x += dx / l * v; b.y += dy / l * v; b.vx = dx; }
    }
    // dessin (1 case = 1 pixel d'art)
    const x = b.x, y = b.y, f = Math.floor(now * 10 + b.ph * 3) % 2, dir = (b.vx || 1) > 0 ? 1 : -1, hop = !VOLANTS.has(b.k) && b.k !== 'lezard' && b.k !== 'rat' && (b.fuite > 0 || Math.hypot(b.tx - b.x, b.ty - b.y) > 3) ? -Math.abs(Math.sin(now * 14 + b.ph)) * 6 : 0;
    if (b.k === 'papillon') { const c = ['#ffd54a', '#ff8ac8', '#9fd6ff'][b.c]; sq(x, y, 1, '#3a2a1a'); if (f) { sq(x - PX * 2, y - PX, 2, c); sq(x + PX, y - PX, 2, c); } else { sq(x - PX, y - PX, 1, c); sq(x + PX, y - PX, 1, c); } }
    else if (b.k === 'luciole') { ctx.globalAlpha = 0.25 + 0.2 * Math.sin(now * 4 + b.ph); ctx.fillStyle = '#e8ff7a'; ctx.beginPath(); ctx.arc(x, y, 9, 0, 7); ctx.fill(); ctx.globalAlpha = 1; sq(x, y, 1, '#f4ffb0'); }
    else if (b.k === 'chauve') { sq(x - PX, y, 2, '#2a2234'); if (f) { sq(x - PX * 3, y - PX, 2, '#2a2234'); sq(x + PX, y - PX, 2, '#2a2234'); } else { sq(x - PX * 3, y + PX, 2, '#2a2234'); sq(x + PX, y + PX, 2, '#2a2234'); } sq(x - PX, y, 1, '#ff4a4a'); }
    else if (b.k === 'oiseau') { const vol = b.fuite > 0; sq(x - PX, y + hop, 2, '#7a6a5a'); sq(x + dir * PX, y - PX + hop, 1, '#5a4a3a'); sq(x + dir * PX * 2, y - PX + hop, 1, '#e0a03a'); if (vol) { sq(x - PX * 2, y - PX * (f ? 2 : 0), 1, '#5a4a3a'); sq(x + PX, y - PX * (f ? 2 : 0), 1, '#5a4a3a'); } }
    else if (b.k === 'lapin' || b.k === 'lapinB') { const c = b.k === 'lapinB' ? '#ffffff' : '#b08a6a', c2 = b.k === 'lapinB' ? '#c8d8e8' : '#8a6a4a'; ctx.fillStyle = '#00000030'; ctx.fillRect(x - 6, y + 4, 12, 3); sq(x - PX * 2, y - PX + hop, 3, c); sq(x + dir * PX, y - PX * 2 + hop, 2, c); sq(x + dir * PX, y - PX * 4 + hop, 1, c2); sq(x - dir * PX * 2, y + hop, 1, '#ffffff'); }
    else if (b.k === 'lezard') { sq(x - PX * 2, y, 1, '#4a8a3a'); sq(x - PX, y, 2, '#6aaa4a'); sq(x + dir * PX * 2, y, 1, '#6aaa4a'); sq(x - dir * PX * 3, y + PX, 1, '#4a8a3a'); }
    else if (b.k === 'rat') { sq(x - PX, y, 2, '#6a6478'); sq(x + dir * PX, y, 1, '#8a8498'); sq(x - dir * PX * 2, y + PX, 1, '#d88a9a'); sq(x - dir * PX * 3, y + PX, 1, '#d88a9a'); }
    else if (b.k === 'grenouille') { sq(x - PX, y + hop, 3, '#4a9a3a'); sq(x - PX, y - PX + hop, 1, '#ffffff'); sq(x + PX, y - PX + hop, 1, '#ffffff'); }
  }
}
// Décor selon le mois, peint une seule fois dans la carte (aucun coût pendant le jeu)
function decorSaison(g, map, herbe, TS, hsh) {
  const mois = new Date().getMonth() + 1;
  const pix = (x, y, rows, pal) => rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) if (pal[r[i]]) { g.fillStyle = pal[r[i]]; g.fillRect(x + i, y + j, 1, 1); } });
  const S = {
    citrouille: [['...gg..', '.kkgkk.', 'koOoOok', 'kOoOoOk', 'koOoOok', '.kkkkk.'], { o: '#e8862a', O: '#c8641a', g: '#4a8a2a', k: '#5a2a10' }],
    cadeau: [['.y.y.', 'kkykk', 'rryrr', 'yyyyy', 'rryrr', 'kkkkk'], { r: '#c83a3a', y: '#ffd54a', k: '#4a1a1a' }],
    cadeau2: [['.y.y.', 'kkykk', 'rryrr', 'yyyyy', 'rryrr', 'kkkkk'], { r: '#3a9a4a', y: '#f4f8ff', k: '#1a3a1a' }],
    bonhomme: [['..kk..', '.kwwk.', '.kwok.', '..kk..', '.kwwk.', 'kwwwwk', 'kwwwwk', '.kkkk.'], { w: '#f4f8ff', o: '#ff8a1e', k: '#5a6a80' }],
    coeur: [['.r.r.', 'rrrrr', 'rrrrr', '.rrr.', '..r..'], { r: '#ff5a8a' }],
    oeuf: [['.kk.', 'kabk', 'kbak', 'kabk', '.kk.'], { a: ['#ffd54a', '#9fd6ff', '#ff8ac8'][0], b: '#ffffff', k: '#6a5a7a' }],
    oeuf2: [['.kk.', 'kabk', 'kbak', 'kabk', '.kk.'], { a: '#9fd6ff', b: '#ff8ac8', k: '#5a6a8a' }],
    tulipe: [['r.r', 'rrr', '.g.', 'gg.'], { r: '#e84a6a', g: '#3a8a3a' }],
    tulipe2: [['y.y', 'yyy', '.g.', '.gg'], { y: '#ffd54a', g: '#3a8a3a' }],
    marguerite: [['.w.', 'wyw', '.w.'], { w: '#ffffff', y: '#ffd54a' }],
    champi: [['.rr.', 'rwrr', '.cc.'], { r: '#d83a3a', w: '#ffffff', c: '#f0e0c8' }],
    pomme: [['.g.', 'rrr', 'rRr', '.r.'], { r: '#d83a3a', R: '#ff8a7a', g: '#4a8a2a' }],
  };
  const choix = mois === 10 ? ['citrouille'] : mois === 12 ? ['cadeau', 'cadeau2'] : mois === 1 ? ['bonhomme'] : mois === 2 ? ['bonhomme', 'coeur', 'coeur'] : mois === 3 ? ['tulipe', 'marguerite'] : mois === 4 ? ['oeuf', 'oeuf2', 'tulipe2'] : mois === 9 ? ['pomme', 'champi'] : mois === 11 ? [] : ['tulipe', 'tulipe2', 'marguerite', 'champi'];
  const dense = map.theme === 'donjon' ? 0.012 : 0.03;
  for (const [, , i, j] of herbe) {
    if (mois === 11 || mois === 10) {   // feuilles mortes
      if (hsh(i, j, 81) < 0.25 && map.theme !== 'desert') for (let k = 0; k < 6; k++) { g.fillStyle = ['#c8641a', '#e8a03a', '#a83a2a', '#8a5a2a'][k % 4]; g.fillRect(i * TS + Math.floor(hsh(i, j, 90 + k) * TS), j * TS + Math.floor(hsh(i, j, 99 + k) * TS), 1 + (k % 2), 1); }
    }
    if (!choix.length || hsh(i, j, 77) > dense) continue;
    const [rows, pal] = S[choix[Math.floor(hsh(i, j, 78) * choix.length)]];
    pix(i * TS + Math.floor(hsh(i, j, 79) * (TS - 8)), j * TS + Math.floor(hsh(i, j, 80) * (TS - 9)), rows, pal);
  }
}
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
  if (world.zt) { ctx.strokeStyle = '#d8a0ff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x + world.zt[0] * s, y + world.zt[1] * s, world.zt[2] * s, 0, 7); ctx.stroke(); }
  for (const [rx, ry] of world.ru || []) { ctx.fillStyle = '#7fe0ff'; ctx.fillRect(Math.round(x + rx * s) - 3, Math.round(y + ry * s) - 3, 6, 6); }
  if (world.ca) { ctx.fillStyle = OUT; ctx.fillRect(Math.round(x + world.ca[0] * s) - 5, Math.round(y + world.ca[1] * s) - 5, 10, 10); ctx.fillStyle = '#e0a03a'; ctx.fillRect(Math.round(x + world.ca[0] * s) - 4, Math.round(y + world.ca[1] * s) - 4, 8, 8); }
  for (const [mx, my] of world.mn || []) { ctx.fillStyle = '#e04a5a'; ctx.fillRect(Math.round(x + mx * s) - 2, Math.round(y + my * s) - 2, 4, 4); }
  if (world.boss) { ctx.fillStyle = '#5ac85a'; ctx.fillRect(Math.round(x + world.boss[0] * s) - 4, Math.round(y + world.boss[1] * s) - 4, 8, 8); }
  if (mine && mine.al) {
    ctx.fillStyle = OUT; ctx.fillRect(Math.round(x + mine.x * s) - 4, Math.round(y + mine.y * s) - 4, 8, 8);
    ctx.fillStyle = '#ffd54a'; ctx.fillRect(Math.round(x + mine.x * s) - 3, Math.round(y + mine.y * s) - 3, 6, 6);
  }
  ctx.restore();
}
