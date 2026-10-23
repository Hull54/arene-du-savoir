// Arène du Savoir — serveur de jeu (aucune dépendance, Node 18+)
// Lancer : node server.js   puis ouvrir http://localhost:3000 (élèves) et /prof (enseignant)

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const os = require('os');

const PORT = process.env.PORT || 3000;
const PUBLIC = path.join(__dirname, 'public');
const QUESTIONS = JSON.parse(fs.readFileSync(path.join(__dirname, 'questions.json'), 'utf8'));
const GENERATEURS = require('./generateurs');
const { CARTES, WALL, WATER } = require('./cartes');
// Liste des notions (cases à cocher de l'enseignant), regroupées par matière
const NOTIONS = [];
for (const q of [...QUESTIONS, ...Object.values(GENERATEURS).map(g => g())])
  if (!NOTIONS.some(n => n.s === q.notion)) NOTIONS.push({ s: q.notion, m: q.matiere });

// ---------- Réglages du jeu ----------
const TICK = 1000 / 30;
const R = 22;
const SPAWN_PROTECT = 2.5;
const WRONG_DELAY = 3;

const CLASSES = {
  guerrier: { nom: 'Guerrier', hp: 170, speed: 150, atk: { type: 'melee', range: 72, arc: 1.8, dmg: 26, cd: 0.55 }, power: { nom: 'Bouclier', cd: 10, dur: 3 }, dash: { nom: 'Charge', cd: 3, dist: 160, dur: 0.26, dmg: 12, push: 80 } },
  voleur:   { nom: 'Voleur',   hp: 105, speed: 200, atk: { type: 'melee', range: 55, arc: 1.2, dmg: 18, cd: 0.35, backstab: 2 }, power: { nom: 'Ombre', cd: 9, dur: 4 }, dash: { nom: 'Roulade', cd: 2, dist: 140, dur: 0.24 } },
  mage:     { nom: 'Mage',     hp: 90,  speed: 160, atk: { type: 'proj', speed: 380, dmg: 22, cd: 0.65, r: 10, life: 1.6 }, power: { nom: 'Explosion', cd: 9, radius: 140, dmg: 38 }, dash: { nom: 'Téléportation', cd: 3, dist: 150 } },
  archer:   { nom: 'Archer',   hp: 100, speed: 175, atk: { type: 'proj', speed: 600, dmg: 15, cd: 0.4, r: 6, life: 1.3 }, power: { nom: 'Pluie de flèches', cd: 8, count: 7, spread: 0.9 }, dash: { nom: 'Saut arrière', cd: 3, dist: 130, dur: 0.22 } },
};

// Objets des coffres et objets cachés
const ITEMS = {
  potion:       { nom: 'Potion de vie', ico: '🧪' },
  grandepotion: { nom: 'Grande potion', ico: '❤️' },
  vitesse:      { nom: 'Bottes de vitesse', ico: '👢' },
  force:        { nom: 'Potion de force', ico: '💪' },
  bouclier:     { nom: 'Bouclier magique', ico: '🛡️' },
  ombre:        { nom: 'Cape d\'ombre', ico: '🌑' },
};
const BONS_OBJETS = ['grandepotion', 'vitesse', 'force', 'bouclier', 'ombre'];
const OBJETS_CACHES = ['potion', 'potion', 'vitesse', 'force'];

const TEAMS = [
  { nom: 'Rouges', color: '#e04a3a' }, { nom: 'Bleus', color: '#3a7ae0' },
  { nom: 'Verts', color: '#3fbf5a' }, { nom: 'Jaunes', color: '#f2c94c' },
];
const MODES = { libre: 'Chacun pour soi', equipes: 'Équipes', boss: 'Boss coopératif' };

// ---------- État ----------
let nextId = 1;
const players = new Map();   // id -> joueur
const conns = new Set();     // connexions WebSocket
let projectiles = [];
let fx = [];
let feed = [];
let paused = false;
const subjects = new Set(NOTIONS.map(n => n.s));
const stats = {};            // nom -> { notion: {ok, ko} }

let carte = CARTES[0], T = carte.T, W = carte.W, H = carte.H;
let chests = [], items = [], itemTimer = 0;
let mode = 'libre', nbTeams = 2;
let boss = null;
let timer = { dur: 0, left: 0 };   // minuterie de manche (secondes), dur = 0 : sans limite
let ended = null;                  // résultats de fin de manche
let eclair = null;                 // question éclair en cours

// ---------- Utilitaires ----------
const rand = (a, b) => a + Math.random() * (b - a);
const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const angDiff = (a, b) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));

function tileAt(x, y) {
  const i = Math.floor(x / T), j = Math.floor(y / T);
  if (i < 0 || j < 0 || i >= carte.cols || j >= carte.rows) return 'c';
  return carte.tiles[j][i];
}
function circleHitsRect(x, y, r, o) {
  const cx = clamp(x, o.x, o.x + o.w), cy = clamp(y, o.y, o.y + o.h);
  return (x - cx) ** 2 + (y - cy) ** 2 < r * r;
}
const healCore = () => carte.heal && carte.heal.kind !== 'source';
// Pour les joueurs : murs, eau, fosses, objets
function blocked(x, y, r) {
  if (x < r || y < r || x > W - r || y > H - r) return true;
  const k = r * 0.75;
  for (const [px, py] of [[x, y], [x + k, y], [x - k, y], [x, y + k], [x, y - k]]) {
    const t = tileAt(px, py);
    if (WALL.has(t) || WATER.has(t)) return true;
  }
  if (carte.objs.some(o => circleHitsRect(x, y, r, o))) return true;
  if (healCore() && Math.hypot(x - carte.heal.x, y - carte.heal.y) < 30 + r) return true;
  return false;
}
// Pour les projectiles : seulement les murs et les objets
function blockedShot(x, y, r) {
  if (x < 0 || y < 0 || x > W || y > H) return true;
  return WALL.has(tileAt(x, y)) || carte.objs.some(o => circleHitsRect(x, y, r, o));
}
const inBush = p => carte.bushes.some(b => Math.hypot(b.x - p.x, b.y - p.y) < b.r);
function freeSpot(team = -1) {
  for (let i = 0; i < 500; i++) {
    const x = rand(80, W - 80), y = rand(80, H - 80);
    if (blocked(x, y, R + 12) || WATER.has(tileAt(x, y + 40))) continue;
    if (boss && Math.hypot(boss.x - x, boss.y - y) < 400 && i < 300) continue;
    let near = false;
    for (const p of players.values()) if (p.alive && Math.hypot(p.x - x, p.y - y) < 250 && (team < 0 || p.team !== team)) near = true;
    if (!near || i > 250) return { x, y };
  }
  return { x: W / 2, y: H / 2 };
}
function addFeed(text) {
  feed.push({ text, t: 6 });
  if (feed.length > 6) feed.shift();
}
function send(conn, obj) { if (conn) conn.send(JSON.stringify(obj)); }
function sendAll(obj) { const s = JSON.stringify(obj); for (const c of conns) if (c.role === 'prof' || c.player) c.send(s); }

// ---------- Carte : grille de marche (pour les robots) ----------
let walk = [];
function setCarte(c) {
  carte = c; T = c.T; W = c.W; H = c.H;
  walk = [];
  for (let j = 0; j < c.rows; j++) for (let i = 0; i < c.cols; i++) {
    const t = c.tiles[j][i], x = (i + 0.5) * T, y = (j + 0.5) * T;
    walk.push(!WALL.has(t) && !WATER.has(t) && !c.objs.some(o => circleHitsRect(x, y, 16, o)));
  }
  chests = c.chests.map(ch => ({ ...ch, open: 0, by: 0 }));
  items = []; itemTimer = 0;
  projectiles = []; fx = [];
}
// Plus court chemin (en tuiles) d'un point à un autre
function pathTo(x0, y0, x1, y1) {
  const C = carte.cols, Rr = carte.rows;
  const s = Math.floor(y0 / T) * C + Math.floor(x0 / T), g = Math.floor(y1 / T) * C + Math.floor(x1 / T);
  if (s === g || !walk[g]) return null;
  const prev = new Int32Array(C * Rr).fill(-1), q = [s];
  prev[s] = s;
  for (let h = 0; h < q.length; h++) {
    const c = q[h];
    if (c === g) break;
    const cx = c % C, cy = (c - cx) / C;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = cx + dx, ny = cy + dy, n = ny * C + nx;
      if (nx < 0 || ny < 0 || nx >= C || ny >= Rr || prev[n] >= 0 || !walk[n]) continue;
      prev[n] = c; q.push(n);
    }
  }
  if (prev[g] < 0) return null;
  const path = [];
  for (let c = g; c !== s; c = prev[c]) path.push(c);
  return path.reverse().map(c => ({ x: (c % C + 0.5) * T, y: (Math.floor(c / C) + 0.5) * T }));
}
function clearLine(x0, y0, x1, y1) {
  const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 20);
  for (let i = 1; i <= n; i++) if (blocked(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, R)) return false;
  return true;
}

// ---------- Joueurs ----------
function smallestTeam() {
  const n = Array(nbTeams).fill(0);
  for (const p of players.values()) if (p.team >= 0 && p.team < nbTeams) n[p.team]++;
  return n.indexOf(Math.min(...n));
}
function createPlayer(name, cls, bot = false, look = '') {
  const c = CLASSES[cls] || CLASSES.guerrier;
  const team = mode === 'equipes' ? smallestTeam() : -1;
  const p = {
    id: nextId++, name: String(name).slice(0, 16) || 'Héros', cls: CLASSES[cls] ? cls : 'guerrier', bot, team,
    hp: c.hp, maxHp: c.hp, alive: true, angle: 0,
    look: /^[fm][0-3][0-3]$/.test(look) ? look : (Math.random() < 0.5 ? 'f' : 'm') + ri(0, 3) + ri(0, 3),
    input: { u: 0, d: 0, l: 0, r: 0 }, cdA: 0, cdP: 0, cdD: 0, dash: null, shield: 0, stealth: 0, revealed: 0, hidden: false, protect: SPAWN_PROTECT,
    fast: 0, strong: 0, busy: false, streak: 0, dmgBoss: 0,
    kills: 0, deaths: 0, good: 0, bad: 0, question: null, waitQ: 0, conn: null, botT: 0,
    ...freeSpot(team),
  };
  players.set(p.id, p);
  if (!stats[p.name]) stats[p.name] = {};
  addFeed(`${p.name} entre dans l'arène !`);
  return p;
}

function newQuestion(p) {
  // On choisit d'abord une notion au hasard (parmi celles cochées), puis une question de cette notion
  const actives = NOTIONS.filter(n => subjects.has(n.s));
  const notion = pick(actives.length ? actives : NOTIONS).s;
  const list = QUESTIONS.filter(q => q.notion === notion);
  const gen = GENERATEURS[notion];
  p.recent = p.recent || [];
  let q;
  if (gen && (!list.length || Math.random() < 0.75)) q = gen();
  else {
    for (let i = 0; i < 10; i++) {
      q = pick(list);
      if (!p.recent.includes(q)) break;
    }
    p.recent.push(q);
    if (p.recent.length > 12) p.recent.shift();
  }
  // Mélanger les choix
  const order = q.choix.map((_, i) => i).sort(() => Math.random() - 0.5);
  return { q, order, answer: order.indexOf(q.reponse) };
}
const questionMsg = (Q, kind, extra = {}) => ({ t: 'q', kind, matiere: Q.q.matiere, notion: Q.q.notion, question: Q.q.question, svg: Q.q.svg || '', choix: Q.order.map(i => Q.q.choix[i]), ...extra });
function askQuestion(p, kind, extra = {}) {
  p.question = { ...newQuestion(p), kind, ...extra };
  send(p.conn, questionMsg(p.question, kind));
  if (p.bot) p.botT = rand(2, 6);
}

// Note la réponse : statistiques, séries, coup de savoir contre le boss
function record(p, q, ok) {
  const s = (stats[p.name][q.notion] = stats[p.name][q.notion] || { ok: 0, ko: 0 });
  if (ok) {
    p.good++; s.ok++; p.streak++;
    if (p.streak % 3 === 0) {
      const k = pick(BONS_OBJETS);
      addFeed(`🔥 ${p.name} : ${p.streak} bonnes réponses de suite !`);
      p.pending = k;   // donné au prochain moment où le joueur est en vie
      send(p.conn, { t: 'serie', n: p.streak, k, nom: ITEMS[k].nom, ico: ITEMS[k].ico });
    }
    if (boss && boss.hp > 0) {
      const d = Math.round(boss.max * 0.03);
      boss.hp -= d; p.dmgBoss += d;
      fx.push({ k: 'zap', x: p.x, y: p.y, x2: Math.round(boss.x), y2: Math.round(boss.y), t: 0.5, d: 0.5 });
      if (boss.hp <= 0) bossDefeated(p);
    }
  } else { p.bad++; s.ko++; p.streak = 0; }
}

function giveItem(p, k, src) {
  if (k === 'potion') p.hp = Math.min(p.maxHp, p.hp + 50);
  else if (k === 'grandepotion') p.hp = p.maxHp;
  else if (k === 'vitesse') p.fast = 10;
  else if (k === 'force') p.strong = 10;
  else if (k === 'bouclier') p.shield = 4;
  else if (k === 'ombre') p.stealth = 5;
  fx.push({ k: 'item', x: p.x, y: p.y, t: 0.7, d: 0.7 });
  send(p.conn, { t: 'item', k, nom: ITEMS[k].nom, ico: ITEMS[k].ico, src });
  if (src === 'coffre') addFeed(`${p.name} ouvre un coffre : ${ITEMS[k].ico} ${ITEMS[k].nom}`);
}

function kill(target, killer) {
  target.alive = false;
  target.hp = 0;
  target.deaths++;
  target.shield = 0; target.stealth = 0; target.fast = 0; target.strong = 0; target.dash = null;
  if (killer && killer !== target) {
    killer.kills++;
    addFeed(`${killer.name} a vaincu ${target.name}`);
  } else if (killer === null && boss) addFeed(`Le Roi Gluant a vaincu ${target.name}`);
  fx.push({ k: 'death', x: target.x, y: target.y, t: 0.6, d: 0.6 });
  target.waitQ = 1;  // petite pause avant la question
}

function respawn(p) {
  Object.assign(p, freeSpot(p.team));
  p.hp = p.maxHp; p.alive = true; p.protect = SPAWN_PROTECT; p.question = null;
  p.cdA = 0; p.cdP = 0; p.cdD = 0; p.dash = null;
  fx.push({ k: 'spawn', x: p.x, y: p.y, t: 0.6, d: 0.6 });
}

function answer(p, i) {
  if (eclair) { if (eclair.ids.includes(p.id) && !eclair.answers.has(p.id)) eclair.answers.set(p.id, i); return; }
  if (!p.question) return;
  const Q = p.question, ok = i === Q.answer;
  record(p, Q.q, ok);
  if (Q.kind === 'chest') {
    const ch = chests[Q.chest];
    p.question = null; p.busy = false; p.protect = 0.8;
    if (ch) { ch.open = 40; ch.by = 0; }
    const k = ok ? pick(BONS_OBJETS) : 'potion';
    send(p.conn, { t: 'res', kind: 'chest', ok, bonne: Q.answer, explication: ok ? '' : Q.q.explication || '', k, nom: ITEMS[k].nom, ico: ITEMS[k].ico });
    giveItem(p, k, 'coffre');
    return;
  }
  if (p.alive) return;
  if (ok) {
    send(p.conn, { t: 'res', ok: true });
    respawn(p);
  } else {
    send(p.conn, { t: 'res', ok: false, bonne: Q.answer, explication: Q.q.explication || '' });
    p.question = null;
    p.waitQ = WRONG_DELAY;
  }
}

const canHit = (a, b) => b.alive && a !== b && mode !== 'boss' && !(mode === 'equipes' && a && a.team === b.team);
function damage(target, amount, attacker) {
  if (!target.alive || target.protect > 0 || target.busy || (target.dash && target.dash.inv)) return;
  if (attacker && attacker.strong > 0) amount *= 1.5;
  if (target.shield > 0) amount *= 0.25;
  target.hp -= amount;
  fx.push({ k: 'hit', x: target.x, y: target.y, t: 0.25, d: 0.25 });
  if (target.hp <= 0) kill(target, attacker);
}
function hitBoss(amount, attacker) {
  if (!boss || boss.hp <= 0) return;
  if (attacker && attacker.strong > 0) amount *= 1.5;
  boss.hp -= amount; boss.flash = 0.15;
  if (attacker) attacker.dmgBoss += amount;
  fx.push({ k: 'hit', x: boss.x + rand(-30, 30), y: boss.y - 20, t: 0.25, d: 0.25 });
  if (boss.hp <= 0) bossDefeated(attacker);
}

function shoot(p, angle, a) {
  projectiles.push({
    x: p.x + Math.cos(angle) * (R + 4), y: p.y + Math.sin(angle) * (R + 4),
    vx: Math.cos(angle) * a.speed, vy: Math.sin(angle) * a.speed,
    r: a.r, dmg: a.dmg, life: a.life, owner: p.id, cls: p.cls,
  });
}

function attack(p) {
  if (!p.alive || p.cdA > 0 || paused || p.busy) return;
  const a = CLASSES[p.cls].atk;
  p.cdA = a.cd;
  p.revealed = 1;                       // attaquer révèle le joueur caché dans un buisson
  const fromShadow = p.stealth > 0;
  p.stealth = 0;
  if (a.type === 'proj') return shoot(p, p.angle, a);
  fx.push({ k: 'slash', x: p.x, y: p.y, a: p.angle, r: a.range + R, arc: a.arc, t: 0.18, d: 0.18 });
  if (boss && boss.hp > 0) {
    const dx = boss.x - p.x, dy = boss.y - p.y;
    if (Math.hypot(dx, dy) < a.range + R + boss.r && angDiff(Math.atan2(dy, dx), p.angle) < a.arc / 2 + 0.5) hitBoss(a.dmg * (fromShadow ? 1.5 : 1), p);
  }
  for (const o of players.values()) {
    if (!canHit(p, o)) continue;
    const dx = o.x - p.x, dy = o.y - p.y, dist = Math.hypot(dx, dy);
    if (dist > a.range + R * 2) continue;
    if (angDiff(Math.atan2(dy, dx), p.angle) > a.arc / 2 + 0.3) continue;
    let dmg = a.dmg;
    // Voleur : dégâts doublés si la cible regarde dans la même direction que l'attaque (elle nous tourne le dos)
    if (a.backstab && angDiff(o.angle, Math.atan2(dy, dx)) < 1.2) {
      dmg *= a.backstab;
      fx.push({ k: 'crit', x: o.x, y: o.y - 30, txt: 'Dans le dos !', t: 0.8, d: 0.8 });
    }
    if (fromShadow) dmg *= 1.5;
    damage(o, dmg, p);
  }
}

function power(p) {
  if (!p.alive || p.cdP > 0 || paused || p.busy) return;
  const pw = CLASSES[p.cls].power;
  p.cdP = pw.cd;
  if (p.cls === 'guerrier') {
    p.shield = pw.dur;
  } else if (p.cls === 'mage') {
    fx.push({ k: 'boom', x: p.x, y: p.y, r: pw.radius, t: 0.4, d: 0.4 });
    for (const o of players.values())
      if (canHit(p, o) && Math.hypot(o.x - p.x, o.y - p.y) < pw.radius + R) damage(o, pw.dmg, p);
    if (boss && Math.hypot(boss.x - p.x, boss.y - p.y) < pw.radius + boss.r) hitBoss(pw.dmg, p);
  } else if (p.cls === 'archer') {
    const a = CLASSES.archer.atk;
    for (let i = 0; i < pw.count; i++) shoot(p, p.angle - pw.spread / 2 + (pw.spread * i) / (pw.count - 1), a);
  } else if (p.cls === 'voleur') {
    // Ombre : invisible et plus rapide ; la prochaine attaque fait +50 %
    p.stealth = pw.dur;
    fx.push({ k: 'smoke', x: p.x, y: p.y, t: 0.5, d: 0.5 });
  }
}

// ---------- Habileté de déplacement (Espace) ----------
function dash(p) {
  if (!p.alive || p.cdD > 0 || paused || p.busy || p.dash) return;
  const d = CLASSES[p.cls].dash;
  // direction : celle du mouvement, sinon celle de la visée (l'archer saute vers l'arrière)
  let a = p.angle;
  if (p.bot) { if (p.moveAngle != null) a = p.moveAngle; }
  else { const mx = p.input.r - p.input.l, my = p.input.d - p.input.u; if (mx || my) a = Math.atan2(my, mx); }
  if (p.cls === 'archer') a = p.angle + Math.PI;
  p.cdD = d.cd;
  if (p.cls === 'mage') {
    // téléportation : le point libre le plus loin sur la ligne, sans traverser les murs (l'eau, oui)
    let best = null;
    for (let k = d.dist; k >= 30; k -= 10) {
      const x = p.x + Math.cos(a) * k, y = p.y + Math.sin(a) * k;
      let wall = false;
      for (let u = 0; u <= k; u += 12) if (WALL.has(tileAt(p.x + Math.cos(a) * u, p.y + Math.sin(a) * u))) { wall = true; break; }
      if (!wall && !blocked(x, y, R)) { best = { x, y }; break; }
    }
    if (!best) { p.cdD = 0.3; return; }
    fx.push({ k: 'tp', x: p.x, y: p.y, t: 0.4, d: 0.4 });
    p.x = best.x; p.y = best.y;
    fx.push({ k: 'tp', x: p.x, y: p.y, t: 0.4, d: 0.4 });
    return;
  }
  const sp = d.dist / d.dur;
  p.dash = { vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, t: d.dur, inv: p.cls === 'voleur', hit: new Set() };
  fx.push({ k: 'dust', x: p.x, y: p.y + 18, t: 0.35, d: 0.35 });
  if (p.cls === 'archer') shoot(p, p.angle, CLASSES.archer.atk);
}
function dashStep(p, dt) {
  const D = p.dash;
  const mx = D.vx * dt, my = D.vy * dt;
  const bx = blocked(p.x + mx, p.y, R), by = blocked(p.x, p.y + my, R);
  if (!bx) p.x += mx;
  if (!by) p.y += my;
  if (p.cls === 'guerrier') {
    // la charge bouscule les adversaires touchés
    const d = CLASSES.guerrier.dash, len = Math.hypot(D.vx, D.vy);
    for (const o of players.values()) {
      if (!canHit(p, o) || D.hit.has(o.id) || Math.hypot(o.x - p.x, o.y - p.y) > R * 2 + 6) continue;
      D.hit.add(o.id);
      damage(o, d.dmg, p);
      for (let k = d.push; k > 0; k -= 10) { const nx = o.x + D.vx / len * k, ny = o.y + D.vy / len * k; if (!blocked(nx, ny, R)) { o.x = nx; o.y = ny; break; } }
    }
    if (boss && boss.hp > 0 && !D.hit.has('boss') && Math.hypot(boss.x - p.x, boss.y - p.y) < boss.r + R + 6) { D.hit.add('boss'); hitBoss(d.dmg, p); }
  }
  if ((D.t -= dt) <= 0 || (bx && by)) { p.dash = null; if (p.cls !== 'archer') fx.push({ k: 'dust', x: p.x, y: p.y + 18, t: 0.3, d: 0.3 }); }
}

// ---------- Coffres et objets cachés ----------
function updateLoot(dt) {
  for (const ch of chests) if (ch.open > 0) ch.open = Math.max(0, ch.open - dt);
  // un objet caché réapparaît de temps en temps, jusqu'à 6 sur la carte
  if ((itemTimer -= dt) <= 0 && items.length < 6 && carte.spots.length) {
    itemTimer = 8;
    const free = carte.spots.filter(s => !items.some(it => it.x === s.x && it.y === s.y));
    if (free.length) { const s = pick(free); items.push({ x: s.x, y: s.y, k: pick(OBJETS_CACHES) }); }
  }
  for (const p of players.values()) {
    if (!p.alive || p.busy) continue;
    const it = items.find(it => Math.hypot(it.x - p.x, it.y - p.y) < 42);
    if (it) { items.splice(items.indexOf(it), 1); giveItem(p, it.k, 'cache'); }
    if (p.bot) continue;
    const i = chests.findIndex(ch => !ch.open && !ch.by && Math.hypot(ch.x - p.x, ch.y - p.y) < 50);
    if (i >= 0 && !eclair) {
      chests[i].by = p.id; p.busy = true; p.busyT = 25;
      askQuestion(p, 'chest', { chest: i });
    }
  }
}
function cancelChest(p) {
  if (!p.busy) return;
  const ch = p.question && chests[p.question.chest];
  if (ch) ch.by = 0;
  p.busy = false; p.question = null;
  send(p.conn, { t: 'close' });
}

// ---------- Boss coopératif : le Roi Gluant ----------
function spawnBoss() {
  const n = Math.max(1, players.size);
  const spot = freeSpot();
  boss = { x: carte.heal ? carte.heal.x + 220 : spot.x, y: carte.heal ? carte.heal.y : spot.y, r: 56, hp: 0, max: 0, cdSlam: 3, cdShot: 2, flash: 0, angle: 0, path: null, pathT: 0 };
  if (blocked(boss.x, boss.y, 44)) Object.assign(boss, freeSpot());
  boss.max = boss.hp = 400 + 140 * n;
  addFeed('👑 Le Roi Gluant arrive ! Unissez vos forces !');
}
function bossDefeated(by) {
  if (ended) return;
  addFeed(`🎉 Le Roi Gluant est vaincu${by ? ' (coup final : ' + by.name + ')' : ''} !`);
  fx.push({ k: 'boom', x: boss.x, y: boss.y, r: 200, t: 0.8, d: 0.8 });
  endRound('boss-gagne');
}
function bossThink(dt) {
  if (!boss || boss.hp <= 0) return;
  boss.cdSlam -= dt; boss.cdShot -= dt; boss.flash = Math.max(0, boss.flash - dt); boss.pathT -= dt;
  let best = null, bd = Infinity;
  for (const p of players.values()) {
    if (!p.alive || p.busy) continue;
    const d = Math.hypot(p.x - boss.x, p.y - boss.y);
    if (d < bd) { bd = d; best = p; }
  }
  if (!best) return;
  // se déplace lentement vers le joueur le plus proche
  let tx = best.x, ty = best.y;
  if (!clearLine(boss.x, boss.y, tx, ty)) {
    if (boss.pathT <= 0) { boss.path = pathTo(boss.x, boss.y, tx, ty); boss.pathT = 0.6; }
    if (boss.path && boss.path.length) { while (boss.path.length > 1 && Math.hypot(boss.path[0].x - boss.x, boss.path[0].y - boss.y) < 30) boss.path.shift(); tx = boss.path[0].x; ty = boss.path[0].y; }
  }
  boss.angle = Math.atan2(ty - boss.y, tx - boss.x);
  if (bd > 90) {
    const sp = 75 * dt, mx = Math.cos(boss.angle) * sp, my = Math.sin(boss.angle) * sp;
    if (!blocked(boss.x + mx, boss.y, 30)) boss.x += mx;
    if (!blocked(boss.x, boss.y + my, 30)) boss.y += my;
  }
  if (bd < 170 && boss.cdSlam <= 0) {
    boss.cdSlam = 3.2;
    fx.push({ k: 'slam', x: Math.round(boss.x), y: Math.round(boss.y), r: 180, t: 0.5, d: 0.5 });
    for (const p of players.values()) if (p.alive && Math.hypot(p.x - boss.x, p.y - boss.y) < 180 + R) damage(p, 22, null);
  }
  if (bd < 750 && boss.cdShot <= 0) {
    boss.cdShot = 1.4;
    const a = Math.atan2(best.y - boss.y, best.x - boss.x);
    for (const da of [-0.25, 0, 0.25]) projectiles.push({ x: boss.x, y: boss.y - 20, vx: Math.cos(a + da) * 300, vy: Math.sin(a + da) * 300, r: 14, dmg: 13, life: 2.4, owner: -1, cls: 'boss' });
  }
}

// ---------- Manche : modes, minuterie, résultats ----------
function endRound(why) {
  if (ended) return;
  const ps = [...players.values()];
  const top = (key, n = 3) => [...ps].sort((a, b) => b[key] - a[key] || b.good - a.good).slice(0, n).filter(p => p[key] > 0).map(p => ({ n: p.name, c: p.cls, l: p.look, v: Math.round(p[key]), team: p.team }));
  ended = { why, mode, top: top(mode === 'boss' ? 'dmgBoss' : 'kills'), cerveaux: top('good') };
  if (mode === 'equipes') ended.teams = teamScores().map((s, i) => ({ ...TEAMS[i], ...s })).sort((a, b) => b.score - a.score);
  paused = true;
  for (const p of players.values()) cancelChest(p);
  sendAll({ t: 'fin', ...ended });
}
function teamScores() {
  const s = Array.from({ length: nbTeams }, () => ({ score: 0, good: 0, n: 0 }));
  for (const p of players.values()) if (p.team >= 0 && p.team < nbTeams) { s[p.team].score += p.kills; s[p.team].good += p.good; s[p.team].n++; }
  return s;
}
function assignTeams() {
  const ps = [...players.values()].sort(() => Math.random() - 0.5);
  ps.forEach((p, i) => { p.team = mode === 'equipes' ? i % nbTeams : -1; });
}
function newRound() {
  ended = null; paused = false;
  for (const q of players.values()) {
    q.kills = q.deaths = q.good = q.bad = q.streak = q.dmgBoss = 0;
    q.fast = q.strong = q.shield = q.stealth = 0; q.pending = null;
    cancelChest(q);
    if (q.alive) respawn(q); else { q.alive = true; respawn(q); send(q.conn, { t: 'close' }); }
  }
  for (const k in stats) stats[k] = {};
  timer.left = timer.dur;
  boss = null;
  if (mode === 'boss') spawnBoss();
  chests.forEach(c => { c.open = 0; c.by = 0; });
  items = [];
  sendAll({ t: 'debut' });
  addFeed('🔄 Nouvelle manche !');
}

// ---------- Question éclair : la même question pour toute la classe ----------
function startEclair() {
  if (eclair || ended) return;
  const Q = newQuestion({});
  eclair = { ...Q, left: 20, answers: new Map(), ids: [] };
  for (const p of players.values()) {
    cancelChest(p);
    eclair.ids.push(p.id);
    p.question = null;
    if (p.bot) p.botT = rand(3, 12);
    else send(p.conn, questionMsg(Q, 'eclair', { temps: 20 }));
  }
  addFeed('⚡ Question éclair pour toute la classe !');
}
function finishEclair() {
  const E = eclair;
  const counts = E.order.map(() => 0);
  let nbOk = 0;
  for (const id of E.ids) {
    const p = players.get(id);
    if (!p) continue;
    const i = E.answers.has(id) ? E.answers.get(id) : -1;
    if (i >= 0) counts[i]++;
    const ok = i === E.answer;
    if (i >= 0) record(p, E.q, ok);
    if (ok) { nbOk++; p.pending = 'force'; }
    send(p.conn, { t: 'res', kind: 'eclair', ok, bonne: E.answer, explication: ok ? '' : E.q.explication || '', repondu: i >= 0 });
    if (!p.alive) { p.question = null; p.waitQ = 2.5; }
  }
  const res = { t: 'eclairRes', question: E.q.question, svg: E.q.svg || '', choix: E.order.map(i => E.q.choix[i]), counts, bonne: E.answer, nbOk, total: E.ids.length };
  for (const c of conns) if (c.role === 'prof') send(c, res);
  addFeed(`⚡ ${nbOk} bonne${nbOk > 1 ? 's' : ''} réponse${nbOk > 1 ? 's' : ''} sur ${E.ids.length}`);
  eclair = null;
}

// ---------- Robots (pour tester ou compléter la classe) ----------
const BOT_NAMES = ['Robo-Gaston', 'Bip-Lucie', 'Zorg', 'Mécano', 'Tic-Tac', 'Boulon', 'Pixel', 'Ressort', 'Écrou', 'Circuit', 'Turbo', 'Gizmo', 'Vis-Vis', 'Radar', 'Piston', 'Bidule'];
function botThink(p, dt) {
  if (eclair) {
    if (!eclair.answers.has(p.id) && (p.botT -= dt) <= 0) eclair.answers.set(p.id, Math.random() < 0.7 ? eclair.answer : (eclair.answer + 1) % eclair.order.length);
    return;
  }
  if (!p.alive) {
    if (!p.question) return;
    p.botT -= dt;
    if (p.botT <= 0) answer(p, Math.random() < 0.7 ? p.question.answer : (p.question.answer + 1) % p.question.order.length);
    return;
  }
  // cible : le boss, ou l'adversaire le plus proche
  let best = null, bd = Infinity;
  if (mode === 'boss' && boss && boss.hp > 0) { best = boss; bd = Math.hypot(boss.x - p.x, boss.y - p.y) - boss.r + R; }
  else for (const o of players.values()) {
    if (!canHit(p, o) || o.busy) continue;
    const d = Math.hypot(o.x - p.x, o.y - p.y);
    if ((o.hidden || o.stealth > 0) && d > 120) continue;
    if (d < bd) { bd = d; best = o; }
  }
  p.input = { u: 0, d: 0, l: 0, r: 0 };
  if (p.stuckT > 0) { p.stuckT -= dt; return; }
  p.pathT = (p.pathT || 0) - dt;
  const goTo = (tx, ty) => {
    if (clearLine(p.x, p.y, tx, ty)) return Math.atan2(ty - p.y, tx - p.x);
    if (p.pathT <= 0 || !p.path) { p.path = pathTo(p.x, p.y, tx, ty); p.pathT = 0.5; }
    if (!p.path || !p.path.length) return Math.atan2(ty - p.y, tx - p.x);
    while (p.path.length > 1 && Math.hypot(p.path[0].x - p.x, p.path[0].y - p.y) < 26) p.path.shift();
    return Math.atan2(p.path[0].y - p.y, p.path[0].x - p.x);
  };
  if (!best || bd > 900) {
    // Personne en vue : se promener vers un point au hasard
    if (!p.goal || Math.hypot(p.goal.x - p.x, p.goal.y - p.y) < 60 || Math.random() < 0.003) { p.goal = freeSpot(); p.path = null; }
    p.moveAngle = p.angle = goTo(p.goal.x, p.goal.y);
    return;
  }
  p.angle = Math.atan2(best.y - p.y, best.x - p.x);
  const a = CLASSES[p.cls].atk;
  const want = a.type === 'melee' ? a.range + R : 320;
  const seen = clearLine(p.x, p.y, best.x, best.y);
  const dir = !seen || bd > want ? 1 : bd < want * 0.6 ? -1 : 0;
  const ang = seen ? p.angle + Math.sin(Date.now() / 700 + p.id) * 0.5 : goTo(best.x, best.y);
  p.moveAngle = dir ? (dir > 0 ? ang : ang + Math.PI) : null;
  if (seen && bd < want + 30 && Math.random() < 0.5) attack(p);
  if (seen && bd < 200 && Math.random() < 0.01) power(p);
  // habileté : foncer (corps à corps) ou s'éloigner (à distance)
  if (seen && Math.random() < 0.02) {
    if (a.type === 'melee' && bd > 110 && bd < 260) { p.moveAngle = p.angle; dash(p); }
    else if (a.type === 'proj' && bd < 110) { p.moveAngle = p.angle + Math.PI; dash(p); }
  }
}

// ---------- Boucle de jeu ----------
let last = Date.now(), tickCount = 0;
function step() {
  const now = Date.now();
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;

  if (eclair) {
    eclair.left -= dt;
    for (const p of players.values()) if (p.bot) botThink(p, dt);
    const waiting = eclair.ids.some(id => players.has(id) && !eclair.answers.has(id));
    if (eclair.left <= 0 || !waiting) finishEclair();
  }
  const frozen = paused || !!eclair;
  if (!frozen && timer.dur && !ended) { timer.left -= dt; if (timer.left <= 0) { timer.left = 0; endRound(mode === 'boss' ? 'boss-perdu' : 'temps'); } }

  for (const p of players.values()) {
    if (frozen) continue;
    if (p.bot) botThink(p, dt);
    if (!p.alive) {
      if (p.waitQ > 0 && (p.waitQ -= dt) <= 0) askQuestion(p, 'respawn');
      continue;
    }
    if (p.pending) { giveItem(p, p.pending, 'serie'); p.pending = null; }
    p.cdA = Math.max(0, p.cdA - dt); p.cdP = Math.max(0, p.cdP - dt); p.cdD = Math.max(0, p.cdD - dt);
    p.shield = Math.max(0, p.shield - dt); p.protect = Math.max(0, p.protect - dt);
    p.stealth = Math.max(0, p.stealth - dt); p.revealed = Math.max(0, p.revealed - dt);
    p.fast = Math.max(0, p.fast - dt); p.strong = Math.max(0, p.strong - dt);
    p.hidden = p.revealed <= 0 && inBush(p);
    if (p.busy) { if ((p.busyT -= dt) <= 0) cancelChest(p); continue; }
    const hl = carte.heal;
    if (hl && Math.hypot(p.x - hl.x, p.y - hl.y) < hl.r) p.hp = Math.min(p.maxHp, p.hp + hl.heal * dt);
    if (p.dash) { dashStep(p, dt); continue; }
    let mx, my;
    if (p.bot) {
      mx = p.moveAngle == null ? 0 : Math.cos(p.moveAngle);
      my = p.moveAngle == null ? 0 : Math.sin(p.moveAngle);
    } else {
      mx = p.input.r - p.input.l; my = p.input.d - p.input.u;
      const len = Math.hypot(mx, my) || 1; mx /= len; my /= len;
    }
    let sp = CLASSES[p.cls].speed * dt;
    const under = tileAt(p.x, p.y + 12);
    if (under === 'm') sp *= 0.55;          // boue, sables mouvants : ralentit
    else if (under === '=') sp *= 0.7;      // gué : on traverse l'eau lentement
    else if (under === 'i') sp *= 1.4;      // glace : on glisse plus vite !
    if (p.stealth > 0) sp *= 1.2;
    if (p.fast > 0) sp *= 1.35;
    const bx = blocked(p.x + mx * sp, p.y, R), by = blocked(p.x, p.y + my * sp, R);
    if (!bx) p.x += mx * sp;
    if (!by) p.y += my * sp;
    if (p.bot && p.moveAngle != null && bx && by) { p.moveAngle += Math.PI / 2 * (Math.random() < 0.5 ? 1 : -1); p.stuckT = 0.4; p.path = null; }
  }

  if (!frozen) {
    bossThink(dt);
    updateLoot(dt);
    projectiles = projectiles.filter(b => {
      b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
      if (b.life <= 0 || blockedShot(b.x, b.y, b.r)) return false;
      const owner = players.get(b.owner) || null;
      if (b.owner !== -1 && boss && boss.hp > 0 && Math.hypot(boss.x - b.x, boss.y - 20 - b.y) < boss.r + b.r) { hitBoss(b.dmg, owner); return false; }
      for (const o of players.values()) {
        if (o.id === b.owner || !o.alive) continue;
        if (b.owner === -1 ? false : !canHit(owner, o)) continue;
        if (Math.hypot(o.x - b.x, o.y - b.y) < R + b.r) {
          damage(o, b.dmg, owner);
          return false;
        }
      }
      return true;
    });
  }
  fx = fx.filter(f => (f.t -= dt) > 0);
  feed = feed.filter(f => (f.t -= dt) > 0);

  if ((tickCount = (tickCount + 1) % 2) === 0) broadcast();   // 15 envois/s : assez fluide, moins lourd pour le Wi-Fi
}

function publicState() {
  return JSON.stringify({
    // joueurs en tableaux compacts (décodés par unpackWorld dans draw.js) pour alléger le Wi-Fi
    p: [...players.values()].map(p => [
      p.id, p.name, p.cls, p.look, Math.round(p.x), Math.round(p.y), +p.angle.toFixed(2), Math.max(0, Math.round(p.hp)), p.maxHp, p.kills,
      (p.alive ? 1 : 0) | (p.shield > 0 ? 2 : 0) | (p.protect > 0 ? 4 : 0) | (p.hidden ? 8 : 0) | (p.stealth > 0 ? 16 : 0) | (p.strong > 0 ? 32 : 0) | (p.fast > 0 ? 64 : 0) | (p.busy ? 128 : 0) | (p.dash ? 256 : 0),
      p.team,
    ]),
    b: projectiles.map(b => [Math.round(b.x), Math.round(b.y), b.cls, +Math.atan2(b.vy, b.vx).toFixed(2)]),
    fx: fx.map(f => { const o = {}; for (const k in f) o[k] = typeof f[k] === 'number' ? Math.round(f[k] * 100) / 100 : f[k]; return o; }),
    ch: chests.map(c => (c.open > 0 ? 1 : 0)).join(''),
    it: items.map(it => [it.x, it.y, it.k]),
    boss: boss && boss.hp > 0 ? [Math.round(boss.x), Math.round(boss.y), Math.round(boss.hp), boss.max, +boss.angle.toFixed(1), boss.flash > 0 ? 1 : 0] : 0,
    tm: timer.dur ? Math.ceil(timer.left) : -1,
    mode, te: mode === 'equipes' ? teamScores().map(s => s.score) : 0,
    feed: feed.map(f => f.text), paused, ec: eclair ? Math.ceil(eclair.left) : 0,
  });
}

function broadcast() {
  const common = publicState();
  for (const c of conns) {
    if (c.role === 'prof') c.send(`{"t":"s","w":${common}}`);
    else if (c.player) {
      const p = c.player;
      const me = { id: p.id, cdA: +p.cdA.toFixed(2), cdP: +p.cdP.toFixed(2), cdD: +p.cdD.toFixed(2), alive: p.alive, kills: p.kills, deaths: p.deaths, good: p.good, fa: Math.ceil(p.fast), st: Math.ceil(p.strong), sk: p.streak, team: p.team };
      c.send(`{"t":"s","me":${JSON.stringify(me)},"w":${common}}`);
    }
  }
}

function lanAddresses() {
  return Object.values(os.networkInterfaces()).flat()
    .filter(i => i && i.family === 'IPv4' && !i.internal).map(i => `http://${i.address}:${PORT}`);
}

setInterval(() => {
  const info = JSON.stringify({
    t: 'info', subjects: NOTIONS.map(n => ({ ...n, on: subjects.has(n.s) })),
    stats, urls: lanAddresses(), paused,
    carte: carte.id, cartes: CARTES.map(c => ({ id: c.id, nom: c.nom, desc: c.desc })),
    mode, modes: MODES, nbTeams, teams: TEAMS.slice(0, nbTeams), timer: timer.dur,
    eclair: eclair ? { left: Math.ceil(eclair.left), n: eclair.answers.size, total: eclair.ids.length, question: eclair.q.question } : null,
    players: [...players.values()].map(p => ({ id: p.id, n: p.name, c: p.cls, l: p.look, k: p.kills, d: p.deaths, g: p.good, b: p.bad, bot: p.bot, team: p.team, dm: Math.round(p.dmgBoss) })),
  });
  for (const c of conns) if (c.role === 'prof') c.send(info);
}, 1000);

const welcome = () => ({ t: 'welcome', map: carte, classes: CLASSES, teams: TEAMS, items: ITEMS });
setCarte(CARTES[0]);
setInterval(step, TICK);

// ---------- Messages ----------
function onMessage(conn, msg) {
  let m;
  try { m = JSON.parse(msg); } catch { return; }
  const p = conn.player;
  switch (m.t) {
    case 'join':
      if (p) return;
      conn.player = createPlayer(m.name, m.cls, false, String(m.look || ''));
      conn.player.conn = conn;
      send(conn, { ...welcome(), id: conn.player.id });
      if (ended) send(conn, { t: 'fin', ...ended });
      break;
    case 'in':
      if (p) { p.input = { u: +!!m.u, d: +!!m.d, l: +!!m.l, r: +!!m.r }; if (typeof m.a === 'number') p.angle = m.a; }
      break;
    case 'atk': if (p) attack(p); break;
    case 'dash': if (p) dash(p); break;
    case 'pow': if (p) power(p); break;
    case 'ans': if (p && Number.isInteger(m.i)) answer(p, m.i); break;
    case 'prof':
      conn.role = 'prof';
      send(conn, welcome());
      if (ended) send(conn, { t: 'fin', ...ended });
      break;
  }
  if (conn.role !== 'prof') return;
  switch (m.t) {
    case 'subject': m.on ? subjects.add(m.s) : subjects.delete(m.s); break;
    case 'pause': if (!ended) { paused = !paused; addFeed(paused ? '⏸ Partie en pause' : '▶ La partie reprend !'); } break;
    case 'addbot': {
      const cls = Object.keys(CLASSES)[Math.floor(Math.random() * 4)];
      const used = new Set([...players.values()].map(q => q.name));
      const free = BOT_NAMES.filter(n => !used.has(n));
      createPlayer(free.length ? pick(free) : 'Robot ' + nextId, cls, true);
      break;
    }
    case 'rmbots': for (const [id, q] of players) if (q.bot) players.delete(id); break;
    case 'kick': {
      const q = players.get(m.id);
      if (q) { players.delete(q.id); if (q.conn) { send(q.conn, { t: 'kicked' }); q.conn.player = null; } }
      break;
    }
    case 'reset': newRound(); break;
    case 'carte': {
      const c = CARTES.find(c => c.id === m.id);
      if (!c || c === carte) break;
      setCarte(c);
      for (const q of players.values()) { cancelChest(q); if (q.alive) respawn(q); }
      if (boss) { const s = freeSpot(); boss.x = s.x; boss.y = s.y; boss.path = null; }
      sendAll({ t: 'carte', map: carte });
      addFeed(`🗺️ Nouvelle carte : ${carte.nom}`);
      break;
    }
    case 'mode':
      if (!MODES[m.mode]) break;
      mode = m.mode;
      if (m.nb >= 2 && m.nb <= 4) nbTeams = m.nb;
      assignTeams();
      newRound();
      addFeed(`🎮 Mode : ${MODES[mode]}${mode === 'equipes' ? ' (' + nbTeams + ')' : ''}`);
      break;
    case 'timer':
      timer.dur = [0, 3, 5, 10, 15, 20].includes(m.min) ? m.min * 60 : 0;
      timer.left = timer.dur;
      break;
    case 'finir': endRound(mode === 'boss' ? 'boss-perdu' : 'temps'); break;
    case 'eclair': startEclair(); break;
  }
}

function onClose(conn) {
  conns.delete(conn);
  if (conn.player) { cancelChest(conn.player); players.delete(conn.player.id); addFeed(`${conn.player.name} a quitté l'arène`); }
}

// ---------- Serveur HTTP + WebSocket minimal ----------
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png' };
const server = http.createServer((req, res) => {
  let file = decodeURIComponent(req.url.split('?')[0]);
  if (file === '/') file = '/index.html';
  if (file === '/prof') file = '/prof.html';
  const full = path.join(PUBLIC, path.normalize(file));
  if (!full.startsWith(PUBLIC)) { res.writeHead(403); return res.end(); }
  fs.readFile(full, (err, data) => {
    if (err) { res.writeHead(404); return res.end('Introuvable'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(full)] || 'application/octet-stream' });
    res.end(data);
  });
});

server.on('upgrade', (req, socket) => {
  const key = req.headers['sec-websocket-key'];
  if (!key) return socket.destroy();
  const accept = crypto.createHash('sha1').update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
  socket.write(`HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ${accept}\r\n\r\n`);
  socket.setNoDelay(true);

  const conn = {
    role: 'eleve', player: null,
    send(str) {
      if (socket.destroyed) return;
      const data = Buffer.from(str);
      let head;
      if (data.length < 126) head = Buffer.from([0x81, data.length]);
      else if (data.length < 65536) { head = Buffer.alloc(4); head[0] = 0x81; head[1] = 126; head.writeUInt16BE(data.length, 2); }
      else { head = Buffer.alloc(10); head[0] = 0x81; head[1] = 127; head.writeBigUInt64BE(BigInt(data.length), 2); }
      socket.write(Buffer.concat([head, data]));
    },
  };
  conns.add(conn);

  let buf = Buffer.alloc(0);
  socket.on('data', chunk => {
    buf = Buffer.concat([buf, chunk]);
    while (buf.length >= 2) {
      const op = buf[0] & 0x0f;
      let len = buf[1] & 0x7f, off = 2;
      if (len === 126) { if (buf.length < 4) return; len = buf.readUInt16BE(2); off = 4; }
      else if (len === 127) { if (buf.length < 10) return; len = Number(buf.readBigUInt64BE(2)); off = 10; }
      const masked = buf[1] & 0x80;
      if (buf.length < off + (masked ? 4 : 0) + len) return;
      let payload;
      if (masked) {
        const mask = buf.slice(off, off + 4); off += 4;
        payload = Buffer.alloc(len);
        for (let i = 0; i < len; i++) payload[i] = buf[off + i] ^ mask[i % 4];
      } else payload = buf.slice(off, off + len);
      buf = buf.slice(off + len);
      if (op === 1) onMessage(conn, payload.toString());
      else if (op === 8) { socket.end(); return; }
      else if (op === 9) socket.write(Buffer.concat([Buffer.from([0x8a, payload.length]), payload]));
    }
  });
  socket.on('close', () => onClose(conn));
  socket.on('error', () => socket.destroy());
});

server.listen(PORT, () => {
  console.log('\n⚔️  Arène du Savoir est prête !\n');
  console.log(`   Enseignant : http://localhost:${PORT}/prof`);
  const urls = lanAddresses();
  if (urls.length) console.log(`   Élèves     : ${urls.join('  ou  ')}`);
  console.log('\n   (Ctrl+C pour arrêter)\n');
});
