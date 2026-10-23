// Dessin de l'arène et des héros, partagé entre la vue élève et la vue enseignant
const CLS = {
  guerrier: { nom: ['Guerrière', 'Guerrier'], ico: '⚔️', color: '#3a6fd8', desc: 'Très résistant. Épée et bouclier, au corps à corps.', pow: '🛡️ Bouclier : réduit les dégâts pendant 3 s' },
  voleur:   { nom: ['Voleuse', 'Voleur'],     ico: '🗡️', color: '#d64545', desc: 'Rapide, corps à corps. Dégâts doublés en frappant dans le dos !', pow: '👤 Ombre : invisible 4 s, prochaine attaque +50 %' },
  mage:     { nom: ['Mage', 'Mage'],          ico: '🔮', color: '#8e4ce0', desc: 'Fragile mais puissant. Lance des boules de feu.', pow: '💥 Explosion : dégâts tout autour' },
  archer:   { nom: ['Archère', 'Archer'],     ico: '🏹', color: '#2f9e55', desc: 'Rapide. Tire des flèches de loin.', pow: '🌧️ Pluie de flèches : 7 flèches en éventail' },
};
const SKIN = ['#f7d7b8', '#e2ae80', '#b87a4b', '#6f4428'];
const HAIR = ['#2a1c14', '#6b3e1f', '#e0b04a', '#b8432c'];
const nomClasse = (c, look) => CLS[c].nom[look && look[0] === 'f' ? 0 : 1];

// ---------- Héros ----------
// look = "f12" : f/m, teinte de peau (0-3), couleur de cheveux (0-3)
function drawHero(g, x, y, cls, look, angle, walk, scale = 1) {
  const fem = look[0] === 'f', skin = SKIN[+look[1]] || SKIN[0], hair = HAIR[+look[2]] || HAIR[0];
  g.save();
  g.translate(x, y);
  g.scale(scale, scale);
  let a = angle;
  if (Math.cos(angle) < 0) { g.scale(-1, 1); a = Math.PI - angle; }   // regarde vers la gauche : on retourne le dessin
  const step = Math.sin(walk) * 3;
  const line = (w, c) => { g.lineWidth = w; g.strokeStyle = c; };

  // cheveux longs (derrière la tête)
  if (fem && cls !== 'voleur') {
    g.fillStyle = hair;
    g.beginPath(); g.ellipse(-2, -10, 13, 17, 0, 0, 7); g.fill();
    if (cls === 'archer') { g.beginPath(); g.ellipse(-15, -14, 5, 12, 0.5, 0, 7); g.fill(); }   // queue de cheval
  }
  // capuchon du voleur (derrière la tête)
  if (cls === 'voleur') { g.fillStyle = '#2e3138'; g.beginPath(); g.arc(0, -19, 15, 0, 7); g.fill(); }

  // jambes
  g.fillStyle = '#3a2a1e';
  g.beginPath(); g.roundRect(-8, 8 + step, 7, 12, 3); g.fill();
  g.beginPath(); g.roundRect(1, 8 - step, 7, 12, 3); g.fill();

  // bouclier du guerrier (bras arrière)
  if (cls === 'guerrier') {
    g.fillStyle = '#3a6fd8'; line(3, '#c9d3df');
    g.beginPath(); g.arc(-12, 3, 9, 0, 7); g.fill(); g.stroke();
    g.fillStyle = '#f2c94c'; g.beginPath(); g.arc(-12, 3, 3, 0, 7); g.fill();
  }

  // corps
  if (cls === 'mage') {
    g.fillStyle = '#6a3fc1';
    g.beginPath(); g.moveTo(-10, -7); g.lineTo(10, -7); g.lineTo(14, 18); g.lineTo(-14, 18); g.closePath(); g.fill();
    g.fillStyle = '#f2c94c'; g.fillRect(-11, 3, 22, 3);
    g.fillStyle = '#ffffffaa'; g.font = '8px serif'; g.textAlign = 'center'; g.fillText('★', 6, 14);
  } else {
    const body = { guerrier: '#9aa7b8', voleur: '#3b3f46', archer: '#2f8f4e' }[cls];
    g.fillStyle = body; g.beginPath(); g.roundRect(-11, -7, 22, 19, 6); g.fill();
    if (fem) { g.beginPath(); g.moveTo(-11, 8); g.lineTo(11, 8); g.lineTo(13, 15); g.lineTo(-13, 15); g.closePath(); g.fill(); }
    if (cls === 'guerrier') { g.fillStyle = '#c9d3df'; g.beginPath(); g.roundRect(-7, -4, 14, 9, 3); g.fill(); g.fillStyle = '#3a6fd8'; g.fillRect(-11, 6, 22, 3); }
    if (cls === 'voleur') { g.fillStyle = '#c23b3b'; g.beginPath(); g.roundRect(-9, -8, 18, 5, 2); g.fill(); g.fillStyle = '#8b5a2b'; g.fillRect(-11, 5, 22, 3); }
    if (cls === 'archer') { g.fillStyle = '#8b5a2b'; g.fillRect(-11, 4, 22, 3); line(3, '#8b5a2b'); g.beginPath(); g.moveTo(-10, -6); g.lineTo(8, 6); g.stroke(); }
  }

  // tête
  g.fillStyle = skin; g.beginPath(); g.arc(0, -19, 11, 0, 7); g.fill();
  // cheveux (dessus)
  if (cls !== 'voleur') {
    g.fillStyle = hair;
    g.beginPath(); g.arc(0, -21, 11.5, Math.PI * 0.95, Math.PI * 2.05); g.fill();
    g.beginPath(); g.ellipse(4, -27, 8, 4, 0.3, 0, 7); g.fill();
    if (fem) { g.beginPath(); g.ellipse(-9, -14, 4, 9, 0.15, 0, 7); g.fill(); }
  }
  // yeux et sourire
  g.fillStyle = '#1d1d1d';
  g.beginPath(); g.ellipse(3, -19, 1.6, 2.2, 0, 0, 7); g.fill();
  g.beginPath(); g.ellipse(8, -19, 1.6, 2.2, 0, 0, 7); g.fill();
  if (fem) { line(1.2, '#1d1d1d'); g.beginPath(); g.moveTo(1, -22); g.lineTo(2.5, -21.5); g.moveTo(9.8, -22); g.lineTo(8.6, -21.5); g.stroke(); }
  line(1.3, '#7a3b2e'); g.beginPath(); g.arc(6, -15, 2.5, 0.2, Math.PI - 0.2); g.stroke();
  g.fillStyle = '#ff8a8a55'; g.beginPath(); g.arc(10, -16, 2, 0, 7); g.fill();

  // couvre-chefs
  if (cls === 'guerrier') {
    g.fillStyle = '#b8c3d1'; g.beginPath(); g.arc(0, -21, 12.5, Math.PI, Math.PI * 2); g.fill();
    g.fillRect(-12.5, -22, 25, 3);
    g.fillStyle = '#d33'; g.beginPath(); g.ellipse(-3, -35, 9, 4, -0.4, 0, 7); g.fill();
  } else if (cls === 'voleur') {
    g.fillStyle = '#2e3138'; g.beginPath(); g.arc(0, -20, 13, Math.PI * 0.92, Math.PI * 2.08); g.fill();
    if (fem) {
      // mèches sous le capuchon et longue tresse sur l'épaule
      g.fillStyle = hair;
      g.beginPath(); g.ellipse(2, -26, 9, 3.5, 0.2, 0, 7); g.fill();
      for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(-10 + i * 1.2, -12 + i * 5, 3.8 - i * 0.3, 0, 7); g.fill(); }
      g.fillStyle = '#c23b3b'; g.beginPath(); g.arc(-5, 12, 2.5, 0, 7); g.fill();
    }
  } else if (cls === 'mage') {
    g.fillStyle = '#4b2a8f';
    g.beginPath(); g.ellipse(0, -27, 17, 4.5, 0, 0, 7); g.fill();
    g.beginPath(); g.moveTo(-10, -27); g.quadraticCurveTo(-2, -42, -8, -52); g.quadraticCurveTo(4, -42, 10, -27); g.closePath(); g.fill();
    g.fillStyle = '#f2c94c'; g.font = '9px serif'; g.textAlign = 'center'; g.fillText('★', 1, -32);
  } else if (cls === 'archer') {
    g.fillStyle = '#2f8f4e'; g.beginPath(); g.arc(0, -23, 11.5, Math.PI * 1.05, Math.PI * 1.95); g.fill();
    g.beginPath(); g.moveTo(-11, -24); g.lineTo(-17, -20); g.lineTo(-9, -21); g.fill();
    g.fillStyle = '#e04a3a'; g.beginPath(); g.ellipse(-12, -33, 3, 9, -0.6, 0, 7); g.fill();
  }

  // bras avant + arme, orientés vers la visée
  g.save();
  g.translate(5, 1);
  g.rotate(a);
  if (cls === 'guerrier') {
    g.fillStyle = '#e6ebf2'; g.beginPath(); g.moveTo(8, -2.5); g.lineTo(34, -2); g.lineTo(38, 0); g.lineTo(34, 2); g.lineTo(8, 2.5); g.fill();
    g.fillStyle = '#c9a227'; g.fillRect(5, -6, 3, 12);
    g.fillStyle = '#6b4423'; g.fillRect(-1, -1.5, 6, 3);
  } else if (cls === 'voleur') {
    g.fillStyle = '#e6ebf2'; g.beginPath(); g.moveTo(6, -2); g.lineTo(20, 0); g.lineTo(6, 2); g.fill();
    g.fillStyle = '#c9a227'; g.fillRect(4, -4, 2, 8);
  } else if (cls === 'mage') {
    line(3.5, '#7a4b25'); g.beginPath(); g.moveTo(-10, 0); g.lineTo(26, 0); g.stroke();
    const orb = g.createRadialGradient(29, 0, 1, 29, 0, 7);
    orb.addColorStop(0, '#fff'); orb.addColorStop(0.4, '#c58bff'); orb.addColorStop(1, '#6a3fc1');
    g.fillStyle = orb; g.beginPath(); g.arc(29, 0, 6, 0, 7); g.fill();
  } else if (cls === 'archer') {
    line(3, '#8b5a2b'); g.beginPath(); g.arc(4, 0, 15, -1.2, 1.2); g.stroke();
    line(1, '#eee'); g.beginPath(); g.moveTo(4 + 15 * Math.cos(-1.2), 15 * Math.sin(-1.2)); g.lineTo(0, 0); g.lineTo(4 + 15 * Math.cos(1.2), 15 * Math.sin(1.2)); g.stroke();
    line(2, '#5a3a1e'); g.beginPath(); g.moveTo(0, 0); g.lineTo(22, 0); g.stroke();
    g.fillStyle = '#bbb'; g.beginPath(); g.moveTo(22, -3); g.lineTo(27, 0); g.lineTo(22, 3); g.fill();
  }
  g.fillStyle = skin; g.beginPath(); g.arc(0, 0, 3.5, 0, 7); g.fill();
  g.restore();
  g.restore();
}

// ---------- Décor (dessiné une seule fois dans une image en mémoire) ----------
let mapLayer = null;
function buildMapLayer(map) {
  const c = document.createElement('canvas');
  c.width = map.W; c.height = map.H;
  const g = c.getContext('2d');
  let seed = 7;
  const R = (a, b) => { seed = (seed * 16807) % 2147483647; return a + (seed / 2147483647) * (b - a); };
  const inR = (x, y, o, pad = 0) => x > o.x - pad && x < o.x + o.w + pad && y > o.y - pad && y < o.y + o.h + pad;
  const blob = (x, y, r, col) => { g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); };
  const zone = n => map.zones.find(z => z.nom.startsWith(n));
  const fz = zone('Forêt'), sz = zone('Marais'), rz = zone('Ruines'), lz = zone('Lac'), cz = zone('Colisée');
  const F = map.fountain;

  // herbe
  g.fillStyle = '#7dbb5a'; g.fillRect(0, 0, map.W, map.H);
  for (let i = 0; i < 500; i++) { g.globalAlpha = 0.25; blob(R(0, map.W), R(0, map.H), R(30, 110), R(0, 1) < 0.5 ? '#6faa4c' : '#8cc866'); }
  g.globalAlpha = 1;

  // sol des zones (bords adoucis)
  const soft = (col, fn) => { g.save(); g.fillStyle = col; g.shadowColor = col; g.shadowBlur = 60; fn(); g.restore(); };
  soft('#4f8f3f', () => { g.beginPath(); g.roundRect(fz.x, fz.y, fz.w, fz.h, 80); g.fill(); });
  soft('#6f7a45', () => { g.beginPath(); g.roundRect(sz.x, sz.y, sz.w, sz.h, 80); g.fill(); });
  soft('#a89c7f', () => { g.beginPath(); g.roundRect(rz.x, rz.y, rz.w, rz.h, 60); g.fill(); });
  for (let i = 0; i < 160; i++) { g.globalAlpha = 0.3; blob(R(fz.x, fz.x + fz.w), R(fz.y, fz.y + fz.h), R(20, 70), '#3f7a32'); }
  for (let i = 0; i < 120; i++) { g.globalAlpha = 0.3; blob(R(sz.x, sz.x + sz.w), R(sz.y, sz.y + sz.h), R(20, 70), '#5b6236'); }
  g.globalAlpha = 1;

  // dalles des ruines
  for (let x = rz.x + 20; x < rz.x + rz.w - 40; x += 50)
    for (let y = rz.y + 20; y < rz.y + rz.h - 40; y += 50) {
      if (R(0, 1) < 0.12) continue;
      const v = Math.floor(R(150, 185));
      g.fillStyle = `rgb(${v},${v - 10},${v - 30})`;
      g.fillRect(x + 2, y + 2, 46, 46);
      if (R(0, 1) < 0.15) { g.strokeStyle = '#7d735e'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x + R(5, 20), y + R(5, 45)); g.lineTo(x + R(25, 45), y + R(5, 45)); g.stroke(); }
      if (R(0, 1) < 0.1) { g.globalAlpha = 0.6; blob(x + R(5, 45), y + R(5, 45), R(5, 12), '#6c8f4a'); g.globalAlpha = 1; }
    }

  // sentiers de terre
  const path = pts => {
    for (const [w, col] of [[86, '#a8844e'], [70, '#c9a66b']]) {
      g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round';
      g.beginPath(); g.moveTo(...pts[0]);
      for (let i = 1; i < pts.length - 1; i++) g.quadraticCurveTo(pts[i][0], pts[i][1], (pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2);
      g.lineTo(...pts[pts.length - 1]); g.stroke();
    }
  };
  path([[F.x, F.y], [1300, 900], [1050, 950], [700, 700]]);
  path([[F.x, F.y], [1900, 900], [2150, 950], [2500, 700]]);
  path([[F.x, F.y], [1300, 1300], [1100, 1250], [700, 1500]]);
  path([[F.x, F.y], [1900, 1300], [2100, 1250], [2350, 1750]]);
  path([[F.x, F.y], [1600, 600], [1500, 300], [1600, 20]]);
  path([[F.x, F.y], [1600, 1600], [1700, 1900], [1600, 2180]]);
  for (let i = 0; i < 300; i++) { const x = R(0, map.W), y = R(0, map.H); g.globalAlpha = 0.5; blob(x, y, R(1.5, 3), '#9b7b4a'); }
  g.globalAlpha = 1;

  // rive de sable autour du lac
  const wx0 = Math.min(...map.water.map(w => w.x)), wy0 = Math.min(...map.water.map(w => w.y));
  const wx1 = Math.max(...map.water.map(w => w.x + w.w)), wy1 = Math.max(...map.water.map(w => w.y + w.h));
  soft('#e3d29b', () => { g.beginPath(); g.roundRect(wx0 - 35, wy0 - 35, wx1 - wx0 + 70, wy1 - wy0 + 70, 70); g.fill(); });

  // Colisée : mur circulaire, sable ratissé
  const ccx = cz.x + cz.w / 2, ccy = cz.y + cz.h / 2, cr = cz.w / 2;
  blob(ccx, ccy + 8, cr + 4, '#0003');
  blob(ccx, ccy, cr, '#8d8577');
  g.strokeStyle = '#6f685c'; g.lineWidth = 2;
  for (let i = 0; i < 64; i++) { const a = i / 64 * Math.PI * 2; g.beginPath(); g.moveTo(ccx + Math.cos(a) * (cr - 30), ccy + Math.sin(a) * (cr - 30)); g.lineTo(ccx + Math.cos(a) * cr, ccy + Math.sin(a) * cr); g.stroke(); }
  blob(ccx, ccy, cr - 30, '#e6cf98');
  g.strokeStyle = '#d4bb82'; g.lineWidth = 3;
  for (let r = 140; r < cr - 40; r += 34) { g.beginPath(); g.arc(ccx, ccy, r, 0, 7); g.stroke(); }
  // ouvertures du colisée vers les sentiers
  for (const a of [-Math.PI / 2, Math.PI / 2, -2.5, -0.64, 2.5, 0.64]) {
    g.save(); g.translate(ccx + Math.cos(a) * (cr - 15), ccy + Math.sin(a) * (cr - 15)); g.rotate(a);
    g.fillStyle = '#c9a66b'; g.fillRect(-18, -36, 36, 72); g.restore();
  }

  // eau (lac)
  for (const w of map.water) {
    const gr = g.createLinearGradient(w.x, w.y, w.x, w.y + w.h);
    gr.addColorStop(0, '#3b8fd6'); gr.addColorStop(1, '#2566a8');
    g.fillStyle = gr; g.beginPath(); g.roundRect(w.x, w.y, w.w, w.h, 26); g.fill();
    g.strokeStyle = '#9fd6ff'; g.lineWidth = 4; g.stroke();
    g.strokeStyle = '#ffffff30'; g.lineWidth = 2;
    for (let i = 0; i < 14; i++) { const x = R(w.x + 30, w.x + w.w - 60), y = R(w.y + 20, w.y + w.h - 20); g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 15, y - 5, x + 30, y); g.stroke(); }
    for (let i = 0; i < 5; i++) {
      const x = R(w.x + 30, w.x + w.w - 30), y = R(w.y + 30, w.y + w.h - 30), r = R(9, 15);
      g.fillStyle = '#3d9a4a'; g.beginPath(); g.arc(x, y, r, 0.5, Math.PI * 2); g.lineTo(x, y); g.fill();
      if (R(0, 1) < 0.4) blob(x + 3, y - 3, 4, '#f7a8d0');
    }
  }
  // boue du marais
  for (const s of map.swamp) {
    g.fillStyle = '#3f3a22'; g.beginPath(); g.roundRect(s.x - 6, s.y - 6, s.w + 12, s.h + 12, 46); g.fill();
    g.fillStyle = '#56502c'; g.beginPath(); g.roundRect(s.x, s.y, s.w, s.h, 40); g.fill();
    for (let i = 0; i < s.w * s.h / 5000; i++) { g.globalAlpha = 0.5; blob(R(s.x + 15, s.x + s.w - 15), R(s.y + 15, s.y + s.h - 15), R(3, 7), '#6d6538'); }
    g.globalAlpha = 1;
    for (let i = 0; i < 3; i++) { const x = R(s.x + 20, s.x + s.w - 20), y = R(s.y + 20, s.y + s.h - 20); g.fillStyle = '#4d7a3a'; g.beginPath(); g.arc(x, y, 10, 0.6, Math.PI * 2); g.lineTo(x, y); g.fill(); }
    // roseaux sur le bord
    for (let i = 0; i < 10; i++) {
      const side = Math.floor(R(0, 4)), t = R(0.1, 0.9);
      const x = side < 2 ? s.x + s.w * t : side === 2 ? s.x : s.x + s.w, y = side < 2 ? (side ? s.y + s.h : s.y) : s.y + s.h * t;
      for (let k = -1; k <= 1; k++) {
        g.strokeStyle = '#5f8a3a'; g.lineWidth = 2; g.beginPath(); g.moveTo(x + k * 5, y + 6); g.lineTo(x + k * 6, y - 18); g.stroke();
        g.fillStyle = '#6b4423'; g.beginPath(); g.ellipse(x + k * 6, y - 20, 2.5, 6, 0, 0, 7); g.fill();
      }
    }
  }
  // ponts
  for (const b of map.bridges) {
    g.fillStyle = '#0004'; g.fillRect(b.x + 6, b.y + 6, b.w, b.h);
    g.fillStyle = '#a8743f'; g.fillRect(b.x, b.y, b.w, b.h);
    g.strokeStyle = '#7a5129'; g.lineWidth = 3;
    const horiz = b.w > b.h;
    for (let i = 0; i < (horiz ? b.w : b.h); i += 26) {
      g.beginPath();
      if (horiz) { g.moveTo(b.x + i, b.y); g.lineTo(b.x + i, b.y + b.h); } else { g.moveTo(b.x, b.y + i); g.lineTo(b.x + b.w, b.y + i); }
      g.stroke();
    }
    g.fillStyle = '#6b4423';
    if (horiz) { g.fillRect(b.x, b.y - 4, b.w, 7); g.fillRect(b.x, b.y + b.h - 3, b.w, 7); }
    else { g.fillRect(b.x - 4, b.y, 7, b.h); g.fillRect(b.x + b.w - 3, b.y, 7, b.h); }
  }

  // fontaine de soin
  g.fillStyle = '#0003'; g.beginPath(); g.arc(F.x + 5, F.y + 7, F.r + 4, 0, 7); g.fill();
  g.fillStyle = '#d7cfbd'; g.beginPath();
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2 + Math.PI / 8; g.lineTo(F.x + Math.cos(a) * (F.r + 6), F.y + Math.sin(a) * (F.r + 6)); }
  g.closePath(); g.fill(); g.strokeStyle = '#a69c86'; g.lineWidth = 3; g.stroke();
  const fw = g.createRadialGradient(F.x, F.y, 10, F.x, F.y, F.r - 12);
  fw.addColorStop(0, '#9be8ff'); fw.addColorStop(1, '#2f9fd6');
  g.fillStyle = fw; g.beginPath(); g.arc(F.x, F.y, F.r - 12, 0, 7); g.fill();
  blob(F.x, F.y, 20, '#d7cfbd'); blob(F.x, F.y, 12, '#bfe9ff');

  // petits décors : fleurs, champignons, cailloux, souches
  const free = (x, y) => !map.walls.some(o => inR(x, y, o, 20)) && !map.water.some(o => inR(x, y, o, 30)) && !map.swamp.some(o => inR(x, y, o, 10)) && Math.hypot(x - ccx, y - ccy) > cr + 20;
  for (let i = 0; i < 420; i++) {
    const x = R(30, map.W - 30), y = R(30, map.H - 30);
    if (!free(x, y) || inR(x, y, rz)) continue;
    const col = ['#fff7c2', '#ffd1e8', '#ffffff', '#ffe066', '#c9b8ff'][Math.floor(R(0, 5))];
    for (let k = 0; k < 5; k++) blob(x + Math.cos(k * 1.26) * 3.5, y + Math.sin(k * 1.26) * 3.5, 2.6, col);
    blob(x, y, 2, '#f2b632');
  }
  for (let i = 0; i < 40; i++) {
    const x = R(fz.x + 40, fz.x + fz.w - 40), y = R(fz.y + 40, fz.y + fz.h - 40);
    if (!free(x, y)) continue;
    g.fillStyle = '#efe3cf'; g.fillRect(x - 2, y - 2, 4, 7);
    g.fillStyle = '#d84a3a'; g.beginPath(); g.arc(x, y - 2, 7, Math.PI, 0); g.fill();
    blob(x - 3, y - 5, 1.5, '#fff'); blob(x + 2, y - 4, 1.5, '#fff');
  }
  for (let i = 0; i < 160; i++) {
    const x = R(0, map.W), y = R(0, map.H);
    if (!free(x, y)) continue;
    g.strokeStyle = '#4f8a35'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(x - 4, y); g.lineTo(x - 6, y - 8); g.moveTo(x, y); g.lineTo(x, y - 10); g.moveTo(x + 4, y); g.lineTo(x + 6, y - 8); g.stroke();
  }

  // buissons
  for (const b of map.bushes) {
    g.fillStyle = '#0003'; g.beginPath(); g.ellipse(b.x + 6, b.y + b.r * 0.55, b.r, b.r * 0.4, 0, 0, 7); g.fill();
    for (let i = 0; i < 7; i++) { const a = i * 0.9; blob(b.x + Math.cos(a) * b.r * 0.5, b.y + Math.sin(a) * b.r * 0.45, b.r * 0.55, '#2f6e2b'); }
    for (let i = 0; i < 5; i++) { const a = i * 1.3 + 0.4; blob(b.x + Math.cos(a) * b.r * 0.35 - 4, b.y + Math.sin(a) * b.r * 0.3 - 6, b.r * 0.4, '#3f8d37'); }
    blob(b.x - b.r * 0.25, b.y - b.r * 0.3, b.r * 0.22, '#5aac4b');
    for (let i = 0; i < 5; i++) blob(b.x + R(-b.r * 0.6, b.r * 0.6), b.y + R(-b.r * 0.5, b.r * 0.4), 3, '#d9334a');
  }

  // obstacles
  for (const o of map.walls) {
    const cx = o.x + o.w / 2, cy = o.y + o.h / 2;
    if (o.kind === 'tree') {
      g.fillStyle = '#0004'; g.beginPath(); g.ellipse(cx + 10, cy + o.h * 0.35, o.w * 0.8, o.h * 0.35, 0, 0, 7); g.fill();
      g.fillStyle = '#5a3a1e'; g.fillRect(cx - 6, cy, 12, o.h * 0.45);
      blob(cx, cy - 6, o.w * 0.78, '#1f5a24');
      blob(cx - 6, cy - 12, o.w * 0.55, '#2c7530');
      blob(cx - 12, cy - 18, o.w * 0.28, '#4a9a3f');
    } else if (o.kind === 'deadtree') {
      g.strokeStyle = '#3d3022'; g.lineWidth = 9; g.lineCap = 'round';
      g.beginPath(); g.moveTo(cx, cy + 22); g.lineTo(cx, cy - 20); g.moveTo(cx, cy - 4); g.lineTo(cx - 18, cy - 22); g.moveTo(cx, cy + 2); g.lineTo(cx + 17, cy - 15); g.moveTo(cx - 10, cy - 13); g.lineTo(cx - 14, cy - 28); g.stroke();
    } else if (o.kind === 'rock') {
      g.fillStyle = '#0004'; g.beginPath(); g.ellipse(cx + 6, cy + o.h * 0.35, o.w * 0.55, o.h * 0.3, 0, 0, 7); g.fill();
      g.fillStyle = '#7d828c'; g.beginPath();
      for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2; g.lineTo(cx + Math.cos(a) * o.w * R(0.42, 0.55), cy + Math.sin(a) * o.h * R(0.42, 0.55)); }
      g.closePath(); g.fill();
      g.fillStyle = '#a3a8b2'; g.beginPath(); g.ellipse(cx - o.w * 0.12, cy - o.h * 0.15, o.w * 0.28, o.h * 0.2, -0.3, 0, 7); g.fill();
      g.globalAlpha = 0.7; blob(cx + o.w * 0.2, cy + o.h * 0.15, 6, '#6c8f4a'); g.globalAlpha = 1;
    } else if (o.kind === 'pillar') {
      g.fillStyle = '#0004'; g.beginPath(); g.ellipse(cx + 8, cy + 10, o.w * 0.55, o.h * 0.4, 0, 0, 7); g.fill();
      g.fillStyle = '#b3a98f'; g.fillRect(o.x, o.y, o.w, o.h);
      blob(cx, cy, o.w * 0.4, '#e8dfc9'); blob(cx - 4, cy - 4, o.w * 0.22, '#fff8e6');
      g.strokeStyle = '#8a8068'; g.lineWidth = 2; g.strokeRect(o.x, o.y, o.w, o.h);
    } else {
      // murs de briques des ruines
      g.fillStyle = '#0004'; g.fillRect(o.x + 6, o.y + 8, o.w, o.h);
      g.fillStyle = '#b2a68a'; g.fillRect(o.x, o.y, o.w, o.h);
      g.strokeStyle = '#8c8066'; g.lineWidth = 1.5;
      const horiz = o.w >= o.h;
      for (let i = 0, n = 0; i < (horiz ? o.h : o.w); i += 13, n++)
        for (let j = (n % 2) * 13; j < (horiz ? o.w : o.h); j += 26) {
          if (horiz) g.strokeRect(o.x + j, o.y + i, 26, 13); else g.strokeRect(o.x + i, o.y + j, 13, 26);
        }
      g.fillStyle = '#cfc4a8'; g.fillRect(o.x, o.y, o.w, 4);
      g.globalAlpha = 0.8;
      for (let i = 0; i < (o.w + o.h) / 40; i++) blob(o.x + R(0, o.w), o.y + R(0, o.h), R(3, 7), '#5f8a3a');
      g.globalAlpha = 1;
    }
  }

  // bordure : haie de forêt
  for (let i = 0; i < (map.W + map.H) * 2; i += 38) {
    let x, y;
    if (i < map.W) { x = i; y = 0; } else if (i < map.W + map.H) { x = map.W; y = i - map.W; }
    else if (i < map.W * 2 + map.H) { x = map.W - (i - map.W - map.H); y = map.H; } else { x = 0; y = map.H - (i - map.W * 2 - map.H); }
    blob(x, y, 34, '#1f4d22'); blob(x + R(-8, 8), y + R(-8, 8), 22, '#2c6a2e');
  }

  // noms des zones
  g.font = 'bold 40px system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle';
  for (const z of map.zones) {
    const ly = z.round ? z.y + 105 : z.y + z.h / 2;
    g.lineWidth = 6; g.strokeStyle = '#00000040'; g.strokeText(z.nom, z.x + z.w / 2, ly);
    g.fillStyle = '#ffffffb0'; g.fillText(z.nom, z.x + z.w / 2, ly);
  }
  return c;
}

// mine = mon joueur (élève) ou null (vue enseignant : voit tout le monde)
function drawWorld(ctx, world, map, mine, disp) {
  if (!mapLayer) mapLayer = buildMapLayer(map);
  ctx.drawImage(mapLayer, 0, 0);
  const now = performance.now() / 1000;
  const md = mine && (disp.get(mine.id) || mine);

  // animations du décor : reflets sur l'eau, fontaine, torches
  ctx.save();
  ctx.strokeStyle = '#ffffff55'; ctx.lineWidth = 2;
  for (const [i, w] of map.water.entries())
    for (let k = 0; k < 6; k++) {
      const x = w.x + 40 + ((k * 137 + now * 25 + i * 60) % (w.w - 90)), y = w.y + 30 + ((k * 89 + i * 40) % (w.h - 50)) + Math.sin(now * 1.5 + k) * 4;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 18, y); ctx.stroke();
    }
  const F = map.fountain;
  for (let k = 0; k < 8; k++) {
    const t = (now * 0.8 + k / 8) % 1, a = k / 8 * Math.PI * 2;
    ctx.globalAlpha = 1 - t; ctx.fillStyle = '#e8fbff';
    ctx.beginPath(); ctx.arc(F.x + Math.cos(a) * (14 + t * 40), F.y + Math.sin(a) * (14 + t * 40) - Math.sin(t * Math.PI) * 14, 3, 0, 7); ctx.fill();
  }
  ctx.globalAlpha = 1;
  for (const o of map.walls) {
    if (o.kind !== 'pillar' || o.w < 60) continue;
    const cx = o.x + o.w / 2, cy = o.y + o.h / 2, f = 1 + Math.sin(now * 13 + cx) * 0.15;
    const gl = ctx.createRadialGradient(cx, cy, 2, cx, cy, 60 * f);
    gl.addColorStop(0, '#ffb34766'); gl.addColorStop(1, '#ffb34700');
    ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(cx, cy, 60 * f, 0, 7); ctx.fill();
    ctx.fillStyle = '#ff8a1e'; ctx.beginPath(); ctx.ellipse(cx, cy - 4, 7 * f, 11 * f, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#ffe27a'; ctx.beginPath(); ctx.ellipse(cx, cy - 2, 3.5 * f, 6 * f, 0, 0, 7); ctx.fill();
  }
  ctx.restore();

  // effets
  for (const f of world.fx) {
    const t = f.t / f.d;
    ctx.save(); ctx.globalAlpha = Math.max(0, t);
    if (f.k === 'slash') {
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 8;
      ctx.beginPath(); ctx.arc(f.x, f.y, f.r, f.a - f.arc / 2, f.a + f.arc / 2); ctx.stroke();
    } else if (f.k === 'boom') {
      const gr = ctx.createRadialGradient(f.x, f.y, 5, f.x, f.y, f.r * (1.2 - t * 0.5));
      gr.addColorStop(0, '#fff3b0cc'); gr.addColorStop(0.5, '#ff9a2eaa'); gr.addColorStop(1, '#ff4a1a00');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(f.x, f.y, f.r * (1.2 - t * 0.5), 0, 7); ctx.fill();
    } else if (f.k === 'hit') {
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(f.x, f.y - 10, 26, 0, 7); ctx.fill();
    } else if (f.k === 'death') {
      ctx.font = '40px serif'; ctx.textAlign = 'center'; ctx.fillText('💫', f.x, f.y - (1 - t) * 30);
    } else if (f.k === 'spawn') {
      ctx.strokeStyle = '#ffe36b'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(f.x, f.y, 70 * (1 - t) + 20, 0, 7); ctx.stroke();
    } else if (f.k === 'smoke') {
      ctx.fillStyle = '#55555588'; ctx.beginPath(); ctx.arc(f.x, f.y, 30 + 40 * (1 - t), 0, 7); ctx.fill();
    } else if (f.k === 'crit') {
      ctx.font = 'bold 20px system-ui'; ctx.textAlign = 'center'; ctx.lineWidth = 4; ctx.strokeStyle = '#000';
      ctx.strokeText(f.txt, f.x, f.y - 20 - (1 - t) * 30); ctx.fillStyle = '#ffd54a'; ctx.fillText(f.txt, f.x, f.y - 20 - (1 - t) * 30);
    }
    ctx.restore();
  }
  // projectiles
  for (const [x, y, c, a] of world.b) {
    if (c === 'mage') {
      const gr = ctx.createRadialGradient(x, y, 1, x, y, 14);
      gr.addColorStop(0, '#fff6c0'); gr.addColorStop(0.5, '#ff8a1e'); gr.addColorStop(1, '#ff4a1a00');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, 14, 0, 7); ctx.fill();
    } else {
      ctx.strokeStyle = '#5a3a1e'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(x - Math.cos(a) * 22, y - Math.sin(a) * 22); ctx.lineTo(x, y); ctx.stroke();
      ctx.fillStyle = '#ddd'; ctx.beginPath(); ctx.arc(x, y, 2.5, 0, 7); ctx.fill();
      ctx.fillStyle = '#e04a3a'; ctx.fillRect(x - Math.cos(a) * 22 - 2, y - Math.sin(a) * 22 - 2, 4, 4);
    }
  }
  // joueurs (du haut vers le bas, pour que ceux devant cachent ceux derrière)
  const list = world.p.filter(p => p.al).sort((p, q) => p.y - q.y);
  for (const p of list) {
    const d = disp.get(p.id) || p;
    if (d.lx === undefined) { d.lx = d.x; d.ly = d.y; d.ph = 0; }
    if (Math.hypot(d.x - d.lx, d.y - d.ly) > 0.4) d.ph = (d.ph || 0) + 0.32;
    d.lx = d.x; d.ly = d.y;
    const isMe = mine && p.id === mine.id;
    let alpha = 1;
    if (p.hd || p.inv) {
      // caché (buisson ou Ombre) : visible seulement de très près, par soi-même et par l'enseignant
      if (isMe || !mine) alpha = 0.45;
      else if (md && Math.hypot(md.x - d.x, md.y - d.y) < (p.inv ? 80 : 130)) alpha = 0.3;
      else continue;
    }
    ctx.save();
    ctx.globalAlpha = alpha * (p.pr ? 0.55 + 0.3 * Math.sin(performance.now() / 80) : 1);
    // anneau au sol (jaune = moi, couleur de la classe pour les autres)
    ctx.fillStyle = '#0005'; ctx.beginPath(); ctx.ellipse(d.x, d.y + 22, 19, 7, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = isMe ? '#ffd54a' : CLS[p.c].color; ctx.lineWidth = isMe ? 4 : 3;
    ctx.beginPath(); ctx.ellipse(d.x, d.y + 22, 21, 8, 0, 0, 7); ctx.stroke();
    const hs = mine ? 1.15 : 1.9;   // vue enseignant (projecteur) : héros plus gros pour être visibles de loin
    drawHero(ctx, d.x, d.y, p.c, p.l || 'm00', p.a, d.ph || 0, hs);
    if (p.sh) {
      ctx.strokeStyle = '#7fd3ffcc'; ctx.lineWidth = 4; ctx.fillStyle = '#7fd3ff22';
      ctx.beginPath(); ctx.arc(d.x, d.y - 8, 36, 0, 7); ctx.fill(); ctx.stroke();
    }
    ctx.font = `bold ${mine ? 14 : 24}px system-ui`; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    const ny = d.y - (p.c === 'mage' ? 61 : 50) * hs;
    ctx.lineWidth = 3; ctx.strokeStyle = '#000a'; ctx.strokeText(p.n, d.x, ny);
    ctx.fillStyle = '#fff'; ctx.fillText(p.n, d.x, ny);
    ctx.fillStyle = '#000a'; ctx.fillRect(d.x - 25, ny + 5, 50, 7);
    const r = p.hp / p.m;
    ctx.fillStyle = r > 0.5 ? '#4cd964' : r > 0.25 ? '#ffcc00' : '#ff3b30';
    ctx.fillRect(d.x - 24, ny + 6, 48 * r, 5);
    ctx.restore();
  }
}

// Mini-carte (vue élève) : zones, joueurs visibles, et soi-même en jaune
function drawMinimap(ctx, world, map, mine, x, y, w) {
  const s = w / map.W, h = map.H * s;
  ctx.save();
  ctx.globalAlpha = 0.9;
  ctx.drawImage(mapLayer, x, y, w, h);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.strokeRect(x, y, w, h);
  for (const p of world.p) {
    if (!p.al || (mine && p.id === mine.id) || p.hd || p.inv) continue;
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x + p.x * s, y + p.y * s, 2.5, 0, 7); ctx.fill();
  }
  if (mine && mine.al) {
    ctx.fillStyle = '#ffd54a'; ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(x + mine.x * s, y + mine.y * s, 5, 0, 7); ctx.fill(); ctx.stroke();
  }
  ctx.restore();
}
