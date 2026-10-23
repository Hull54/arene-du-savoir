// Dessin de l'arène, partagé entre la vue élève et la vue enseignant
const CLS = {
  guerrier: { ico: '⚔️', color: '#4f8cff', desc: 'Très résistant. Épée au corps à corps.', pow: '🛡️ Bouclier : réduit les dégâts pendant 3 s' },
  voleur:   { ico: '🗡️', color: '#ff5a4f', desc: 'Rapide, corps à corps. Dégâts doublés s\'il frappe dans le dos !', pow: '👤 Ombre : invisible 4 s, prochaine attaque +50 %' },
  mage:     { ico: '🔮', color: '#b44cff', desc: 'Fragile mais puissant. Lance des boules de feu.', pow: '💥 Explosion : dégâts tout autour' },
  archer:   { ico: '🏹', color: '#3fbf5f', desc: 'Rapide. Tire des flèches de loin.', pow: '🌧️ Pluie de flèches : 7 flèches en éventail' },
};

// Le décor ne bouge pas : on le dessine une seule fois dans une image en mémoire
let mapLayer = null;
function buildMapLayer(map) {
  const c = document.createElement('canvas');
  c.width = map.W; c.height = map.H;
  const g = c.getContext('2d');
  g.fillStyle = '#6aa84f'; g.fillRect(0, 0, map.W, map.H);
  // zones
  for (const z of map.zones) {
    g.fillStyle = z.color;
    if (z.round) { g.beginPath(); g.arc(z.x + z.w / 2, z.y + z.h / 2, z.w / 2, 0, 7); g.fill(); }
    else { g.beginPath(); g.roundRect(z.x, z.y, z.w, z.h, 60); g.fill(); }
  }
  // texture légère
  g.strokeStyle = '#ffffff10'; g.lineWidth = 2;
  for (let x = 0; x <= map.W; x += 100) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, map.H); g.stroke(); }
  for (let y = 0; y <= map.H; y += 100) { g.beginPath(); g.moveTo(0, y); g.lineTo(map.W, y); g.stroke(); }
  // marais
  for (const s of map.swamp) {
    g.fillStyle = '#4b3f22cc'; g.beginPath(); g.roundRect(s.x, s.y, s.w, s.h, 40); g.fill();
    g.fillStyle = '#6b5a2e';
    for (let i = 0; i < s.w * s.h / 6000; i++) { g.beginPath(); g.arc(s.x + 20 + ((i * 97) % (s.w - 40)), s.y + 20 + ((i * 53) % (s.h - 40)), 6, 0, 7); g.fill(); }
  }
  // eau et ponts
  for (const w of map.water) {
    g.fillStyle = '#2f7fc1'; g.fillRect(w.x, w.y, w.w, w.h);
    g.strokeStyle = '#ffffff30'; g.lineWidth = 3;
    for (let y = w.y + 25; y < w.y + w.h; y += 40) { g.beginPath(); g.moveTo(w.x + 20, y); g.quadraticCurveTo(w.x + w.w / 2, y - 12, w.x + w.w - 20, y); g.stroke(); }
  }
  for (const b of map.bridges) {
    g.fillStyle = '#9b6b3a'; g.fillRect(b.x, b.y, b.w, b.h);
    g.strokeStyle = '#6e4723'; g.lineWidth = 3;
    if (b.w > b.h) for (let x = b.x; x < b.x + b.w; x += 30) { g.beginPath(); g.moveTo(x, b.y); g.lineTo(x, b.y + b.h); g.stroke(); }
    else for (let y = b.y; y < b.y + b.h; y += 30) { g.beginPath(); g.moveTo(b.x, y); g.lineTo(b.x + b.w, y); g.stroke(); }
  }
  // fontaine de soin
  const f = map.fountain;
  g.fillStyle = '#d9d2c0'; g.beginPath(); g.arc(f.x, f.y, f.r, 0, 7); g.fill();
  g.fillStyle = '#5fc4f0'; g.beginPath(); g.arc(f.x, f.y, f.r - 14, 0, 7); g.fill();
  g.font = '40px serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('💧', f.x, f.y);
  // buissons
  for (const b of map.bushes) {
    g.fillStyle = '#2e6b2a';
    for (let i = 0; i < 6; i++) { const a = i * 1.05; g.beginPath(); g.arc(b.x + Math.cos(a) * b.r * 0.45, b.y + Math.sin(a) * b.r * 0.45, b.r * 0.6, 0, 7); g.fill(); }
    g.fillStyle = '#3f8a37'; g.beginPath(); g.arc(b.x, b.y, b.r * 0.55, 0, 7); g.fill();
  }
  // murs, arbres, rochers
  for (const o of map.walls) {
    const cx = o.x + o.w / 2, cy = o.y + o.h / 2;
    if (o.kind === 'tree') {
      g.fillStyle = '#0003'; g.beginPath(); g.ellipse(cx, cy + o.h * 0.4, o.w * 0.7, o.h * 0.3, 0, 0, 7); g.fill();
      g.fillStyle = '#5a3a1e'; g.fillRect(cx - 7, cy, 14, o.h * 0.5);
      g.fillStyle = '#1f5a24'; g.beginPath(); g.arc(cx, cy - 4, o.w * 0.65, 0, 7); g.fill();
      g.fillStyle = '#2f7a30'; g.beginPath(); g.arc(cx - 6, cy - 10, o.w * 0.4, 0, 7); g.fill();
    } else if (o.kind === 'deadtree') {
      g.strokeStyle = '#4a3b2a'; g.lineWidth = 9; g.lineCap = 'round';
      g.beginPath(); g.moveTo(cx, cy + 20); g.lineTo(cx, cy - 20); g.moveTo(cx, cy - 5); g.lineTo(cx - 18, cy - 22); g.moveTo(cx, cy); g.lineTo(cx + 16, cy - 16); g.stroke();
    } else {
      const col = o.kind === 'ruin' ? ['#9a8f7a', '#b8ad95', '#5e5546'] : o.kind === 'pillar' ? ['#c9bfa7', '#e2d9c3', '#7d735e'] : ['#6b6f7a', '#8a8f9b', '#3c3f46'];
      g.fillStyle = col[0]; g.fillRect(o.x, o.y, o.w, o.h);
      g.fillStyle = col[1]; g.fillRect(o.x, o.y, o.w, Math.min(12, o.h / 3));
      g.strokeStyle = col[2]; g.lineWidth = 3; g.strokeRect(o.x, o.y, o.w, o.h);
    }
  }
  // noms des zones
  g.font = 'bold 44px system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle';
  for (const z of map.zones) {
    const ly = z.round ? z.y + 120 : z.y + z.h / 2;
    g.fillStyle = '#00000030'; g.fillText(z.nom, z.x + z.w / 2 + 3, ly + 3);
    g.fillStyle = '#ffffff50'; g.fillText(z.nom, z.x + z.w / 2, ly);
  }
  g.strokeStyle = '#3b2a1a'; g.lineWidth = 24; g.strokeRect(0, 0, map.W, map.H);
  return c;
}

// mine = mon joueur (élève) ou null (vue enseignant : voit tout le monde)
function drawWorld(ctx, world, map, mine, disp) {
  if (!mapLayer) mapLayer = buildMapLayer(map);
  ctx.drawImage(mapLayer, 0, 0);
  const md = mine && (disp.get(mine.id) || mine);
  // effets
  for (const f of world.fx) {
    const t = f.t / f.d;
    ctx.save(); ctx.globalAlpha = Math.max(0, t);
    if (f.k === 'slash') {
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 8;
      ctx.beginPath(); ctx.arc(f.x, f.y, f.r, f.a - f.arc / 2, f.a + f.arc / 2); ctx.stroke();
    } else if (f.k === 'boom') {
      ctx.fillStyle = '#ff9a2e88'; ctx.beginPath(); ctx.arc(f.x, f.y, f.r * (1.2 - t * 0.5), 0, 7); ctx.fill();
    } else if (f.k === 'hit') {
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(f.x, f.y, 30, 0, 7); ctx.fill();
    } else if (f.k === 'death') {
      ctx.font = '40px serif'; ctx.textAlign = 'center'; ctx.fillText('💥', f.x, f.y - (1 - t) * 30);
    } else if (f.k === 'spawn') {
      ctx.strokeStyle = '#ffe36b'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(f.x, f.y, 70 * (1 - t) + 20, 0, 7); ctx.stroke();
    } else if (f.k === 'smoke') {
      ctx.fillStyle = '#55555588'; ctx.beginPath(); ctx.arc(f.x, f.y, 30 + 40 * (1 - t), 0, 7); ctx.fill();
    } else if (f.k === 'crit') {
      ctx.font = 'bold 20px system-ui'; ctx.textAlign = 'center'; ctx.lineWidth = 4; ctx.strokeStyle = '#000';
      ctx.strokeText(f.txt, f.x, f.y - (1 - t) * 30); ctx.fillStyle = '#ffd54a'; ctx.fillText(f.txt, f.x, f.y - (1 - t) * 30);
    }
    ctx.restore();
  }
  // projectiles
  for (const [x, y, c, a] of world.b) {
    if (c === 'mage') {
      ctx.fillStyle = '#ff7a1a'; ctx.beginPath(); ctx.arc(x, y, 11, 0, 7); ctx.fill();
      ctx.fillStyle = '#ffe08a'; ctx.beginPath(); ctx.arc(x, y, 5, 0, 7); ctx.fill();
    } else {
      ctx.strokeStyle = '#4a2f12'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(x - Math.cos(a) * 18, y - Math.sin(a) * 18); ctx.lineTo(x, y); ctx.stroke();
    }
  }
  // joueurs
  for (const p of world.p) {
    if (!p.al) continue;
    const d = disp.get(p.id) || p;
    const isMe = mine && p.id === mine.id;
    let alpha = 1;
    if (p.hd || p.inv) {
      // caché (buisson ou Ombre) : visible seulement de très près, par soi-même et par l'enseignant
      if (isMe || !mine) alpha = 0.45;
      else if (md && Math.hypot(md.x - d.x, md.y - d.y) < (p.inv ? 80 : 130)) alpha = 0.3;
      else continue;
    }
    const col = CLS[p.c].color;
    ctx.save();
    ctx.globalAlpha = alpha * (p.pr ? 0.5 + 0.3 * Math.sin(performance.now() / 80) : 1);
    ctx.fillStyle = '#0004'; ctx.beginPath(); ctx.ellipse(d.x, d.y + 20, 22, 8, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = '#222'; ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(d.x, d.y); ctx.lineTo(d.x + Math.cos(p.a) * 38, d.y + Math.sin(p.a) * 38); ctx.stroke();
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(d.x, d.y, 22, 0, 7); ctx.fill();
    ctx.lineWidth = isMe ? 5 : 3; ctx.strokeStyle = isMe ? '#ffd54a' : '#fff';
    ctx.stroke();
    if (p.sh) { ctx.strokeStyle = '#7fd3ff'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(d.x, d.y, 32, 0, 7); ctx.stroke(); }
    ctx.font = '22px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(CLS[p.c].ico, d.x, d.y + 1);
    ctx.font = 'bold 14px system-ui'; ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#000a'; ctx.fillText(p.n, d.x + 1, d.y - 39);
    ctx.fillStyle = '#fff'; ctx.fillText(p.n, d.x, d.y - 40);
    ctx.fillStyle = '#000a'; ctx.fillRect(d.x - 25, d.y - 34, 50, 7);
    const r = p.hp / p.m;
    ctx.fillStyle = r > 0.5 ? '#4cd964' : r > 0.25 ? '#ffcc00' : '#ff3b30';
    ctx.fillRect(d.x - 24, d.y - 33, 48 * r, 5);
    ctx.restore();
  }
}

// Mini-carte (vue élève) : zones, fontaine, joueurs visibles, et soi-même en jaune
function drawMinimap(ctx, world, map, mine, x, y, w) {
  const s = w / map.W, h = map.H * s;
  ctx.save();
  ctx.globalAlpha = 0.85;
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
