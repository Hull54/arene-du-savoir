// Arène du Savoir — serveur de jeu (aucune dépendance, Node 18+)
// Lancer : node server.js   puis ouvrir http://localhost:3000 (élèves) et /prof.html (enseignant)

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const os = require('os');

const PORT = process.env.PORT || 3000;
const PUBLIC = path.join(__dirname, 'public');
const QUESTIONS = JSON.parse(fs.readFileSync(path.join(__dirname, 'questions.json'), 'utf8'));
const GENERATEURS = require('./generateurs');
const Monde = require('./public/monde.js');
// Liste des notions (cases à cocher de l'enseignant), regroupées par matière
const NOTIONS = [];
for (const q of [...QUESTIONS, ...Object.values(GENERATEURS).map(g => g())])
  if (!NOTIONS.some(n => n.s === q.notion)) NOTIONS.push({ s: q.notion, m: q.matiere });

// ---------- Réglages du jeu ----------
const TICK = 1000 / 30;
const W = Monde.W, H = Monde.H, R = 22;
const SPAWN_PROTECT = 2.5;
const WRONG_DELAY = 3;

const CLASSES = {
  guerrier: { nom: 'Guerrier', hp: 170, speed: 150, atk: { type: 'melee', range: 72, arc: 1.8, dmg: 26, cd: 0.55 }, power: { nom: 'Bouclier', cd: 10, dur: 3 } },
  voleur:   { nom: 'Voleur',   hp: 105, speed: 200, atk: { type: 'melee', range: 55, arc: 1.2, dmg: 18, cd: 0.35, backstab: 2 }, power: { nom: 'Ombre', cd: 9, dur: 4 } },
  mage:     { nom: 'Mage',     hp: 90,  speed: 160, atk: { type: 'proj', speed: 380, dmg: 22, cd: 0.65, r: 10, life: 1.6 }, power: { nom: 'Explosion', cd: 9, radius: 140, dmg: 38 } },
  archer:   { nom: 'Archer',   hp: 100, speed: 175, atk: { type: 'proj', speed: 600, dmg: 15, cd: 0.4, r: 6, life: 1.3 }, power: { nom: 'Pluie de flèches', cd: 8, count: 7, spread: 0.9 } },
};

// ---------- La carte : 6 régions reliées par une rivière et des ponts ----------
// Les formes (rivière, régions, étangs, boue) viennent de public/monde.js, partagé avec le navigateur.
// Générateur pseudo-aléatoire fixe : la carte est la même à chaque lancement
let seed = 20261023;
const srand = (a, b) => { seed = (seed * 16807) % 2147483647; return a + (seed / 2147483647) * (b - a); };

const FOUNTAIN = { x: Monde.PLAZA.x, y: Monde.PLAZA.y, r: 110, heal: 10 };
const WALLS = [];   // bloquent les joueurs et les projectiles
const BUSHES = [];  // cachent les joueurs
const D = Monde.DONJON;

const rectsOverlap = (a, b, pad) => a.x < b.x + b.w + pad && a.x + a.w + pad > b.x && a.y < b.y + b.h + pad && a.y + a.h + pad > b.y;
function terrainOk(o, region, pathPad = 55) {
  for (const [px, py] of [[o.x, o.y], [o.x + o.w, o.y], [o.x, o.y + o.h], [o.x + o.w, o.y + o.h], [o.x + o.w / 2, o.y + o.h / 2]]) {
    if (px < 70 || py < 70 || px > W - 70 || py > H - 70) return false;
    if (Monde.regionAt(px, py) !== region) return false;
    if (Monde.isWater(px, py) || Monde.inRiver(px, py) || Monde.isIce(px, py) || Monde.pathDist(px, py) < pathPad) return false;
    if (Math.hypot(px - FOUNTAIN.x, py - FOUNTAIN.y) < Monde.PLAZA.r + 30) return false;
    if (region !== 'donjon' && px > D.x - 80 && px < D.x + D.w + 80 && py > D.y - 80 && py < D.y + D.h + 80) return false;
  }
  return true;
}
function scatter(kind, region, n, w, h, pad = 60) {
  for (let i = 0, k = 0; k < n && i < n * 60; i++) {
    const o = { x: srand(0, W), y: srand(0, H), w, h, kind };
    if (terrainOk(o, region) && !WALLS.some(q => rectsOverlap(o, q, pad))) { WALLS.push(o); k++; }
  }
}
function bushes(region, n, rmin = 50, rmax = 70) {
  for (let i = 0, k = 0; k < n && i < n * 80; i++) {
    const b = { x: srand(0, W), y: srand(0, H), r: srand(rmin, rmax) };
    const box = { x: b.x - b.r, y: b.y - b.r, w: b.r * 2, h: b.r * 2 };
    if (terrainOk(box, region, 40) && !WALLS.some(q => rectsOverlap(box, q, 10)) && !BUSHES.some(o => Math.hypot(o.x - b.x, o.y - b.y) < o.r + b.r + 20)) { BUSHES.push({ ...b, region }); k++; }
  }
}

// Village : maisons autour de la place, étals du marché
const HOUSES = [[1230, 1420, 200, 150], [1860, 1390, 190, 150], [1150, 1840, 190, 150], [1900, 1880, 210, 150], [1380, 2020, 170, 130], [2000, 1610, 150, 120]];
for (const [x, y, w, h] of HOUSES) WALLS.push({ x, y, w, h, kind: 'house', roof: Math.floor(srand(0, 3)) });
WALLS.push({ x: 1370, y: 1560, w: 90, h: 50, kind: 'stall' }, { x: 1740, y: 1860, w: 90, h: 50, kind: 'stall' });
WALLS.push({ x: 1795, y: 1555, w: 44, h: 44, kind: 'barrels' }, { x: 1335, y: 1835, w: 44, h: 44, kind: 'barrels' });
scatter('oak', 'village', 8, 44, 36, 80);
bushes('village', 4);

// Donjon : forteresse avec trois portes, des salles et des piliers
const T = 48;
WALLS.push(
  { x: D.x, y: D.y, w: 440, h: T, kind: 'dwall' }, { x: D.x + 580, y: D.y, w: D.w - 580, h: T, kind: 'dwall' },             // nord (porte)
  { x: D.x, y: D.y + D.h - T, w: D.w, h: T, kind: 'dwall' },                                                              // sud
  { x: D.x, y: D.y, w: T, h: 240, kind: 'dwall' }, { x: D.x, y: D.y + 400, w: T, h: D.h - 400, kind: 'dwall' },            // ouest (porte)
  { x: D.x + D.w - T, y: D.y, w: T, h: 300, kind: 'dwall' }, { x: D.x + D.w - T, y: D.y + 440, w: T, h: D.h - 440, kind: 'dwall' }, // est (porte)
  { x: D.x + 260, y: D.y + T, w: T, h: 170, kind: 'dwall' }, { x: D.x + 260, y: D.y + 330, w: T, h: 150, kind: 'dwall' },
  { x: D.x + 520, y: D.y + 340, w: 300 - T, h: T, kind: 'dwall' }, { x: D.x + 520, y: D.y + 340, w: T, h: 170, kind: 'dwall' },
  { x: D.x + 420, y: D.y + 200, w: 56, h: 56, kind: 'dpillar' }, { x: D.x + 640, y: D.y + 170, w: 56, h: 56, kind: 'dpillar' },
  { x: D.x + 120, y: D.y + 520, w: 56, h: 56, kind: 'dpillar' }, { x: D.x + 360, y: D.y + 500, w: 56, h: 56, kind: 'dpillar' },
);
scatter('rock', 'donjon', 6, 56, 44, 90);
scatter('deadtree', 'donjon', 4, 30, 30, 90);

// Toundra glacée
scatter('snowpine', 'neige', 28, 40, 36, 60);
scatter('snowrock', 'neige', 7, 56, 44, 80);
scatter('snowman', 'neige', 3, 34, 34, 120);
bushes('neige', 3);
// Forêt
scatter('oak', 'foret', 26, 44, 36, 55);
scatter('pine', 'foret', 12, 40, 36, 55);
scatter('stump', 'foret', 6, 30, 24, 60);
bushes('foret', 14);
// Marais
scatter('deadtree', 'marais', 12, 30, 30, 70);
scatter('willow', 'marais', 5, 48, 40, 90);
bushes('marais', 5);
// Désert : cactus, rochers et palmiers autour de l'oasis
scatter('cactus', 'desert', 20, 30, 34, 70);
scatter('rock', 'desert', 8, 56, 44, 90);
for (let i = 0; i < 5; i++) {
  const a = i / 5 * Math.PI * 2 + 0.4, P = Monde.PONDS[1];
  const o = { x: P.x + Math.cos(a) * (P.r + 70) - 17, y: P.y + Math.sin(a) * (P.r + 60) - 15, w: 34, h: 30, kind: 'palm' };
  if (terrainOk(o, 'desert', 30)) WALLS.push(o);
}

const MAP = { W, H, walls: WALLS, bushes: BUSHES, fountain: FOUNTAIN };

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

// ---------- Utilitaires ----------
const rand = (a, b) => a + Math.random() * (b - a);
const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const angDiff = (a, b) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));

function circleHitsRect(x, y, r, o) {
  const cx = clamp(x, o.x, o.x + o.w), cy = clamp(y, o.y, o.y + o.h);
  return (x - cx) ** 2 + (y - cy) ** 2 < r * r;
}
// Pour les joueurs : murs + eau (rivière hors des ponts, étangs)
function blocked(x, y, r) {
  if (x < r + 20 || y < r + 20 || x > W - r - 20 || y > H - r - 20) return true;
  if (WALLS.some(o => circleHitsRect(x, y, r, o))) return true;
  if (Math.hypot(x - FOUNTAIN.x, y - FOUNTAIN.y) < 34 + r) return true;   // bassin de la fontaine
  const k = r * 0.55;
  return Monde.isWater(x, y) || Monde.isWater(x + k, y) || Monde.isWater(x - k, y) || Monde.isWater(x, y + k) || Monde.isWater(x, y - k);
}
// Pour les projectiles : seulement les murs
function blockedShot(x, y, r) {
  if (x < 0 || y < 0 || x > W || y > H) return true;
  return WALLS.some(o => circleHitsRect(x, y, r, o));
}
const inBush = p => BUSHES.some(b => Math.hypot(b.x - p.x, b.y - p.y) < b.r);
function freeSpot() {
  for (let i = 0; i < 400; i++) {
    const x = rand(80, W - 80), y = rand(80, H - 80);
    if (!blocked(x, y, R + 10)) {
      let near = false;
      for (const p of players.values()) if (p.alive && Math.hypot(p.x - x, p.y - y) < 250) near = true;
      if (!near || i > 200) return { x, y };
    }
  }
  return { x: FOUNTAIN.x, y: FOUNTAIN.y + 150 };
}
function addFeed(text) {
  feed.push({ text, t: 6 });
  if (feed.length > 6) feed.shift();
}

// ---------- Joueurs ----------
function createPlayer(name, cls, bot = false, look = '') {
  const c = CLASSES[cls] || CLASSES.guerrier;
  const p = {
    id: nextId++, name: String(name).slice(0, 16) || 'Héros', cls: CLASSES[cls] ? cls : 'guerrier', bot,
    hp: c.hp, maxHp: c.hp, alive: true, angle: 0,
    look: /^[fm][0-3][0-3]$/.test(look) ? look : (Math.random() < 0.5 ? 'f' : 'm') + ri(0, 3) + ri(0, 3),
    input: { u: 0, d: 0, l: 0, r: 0 }, cdA: 0, cdP: 0, shield: 0, stealth: 0, revealed: 0, hidden: false, protect: SPAWN_PROTECT,
    kills: 0, deaths: 0, good: 0, bad: 0, question: null, waitQ: 0, conn: null, botT: 0,
    ...freeSpot(),
  };
  players.set(p.id, p);
  if (!stats[p.name]) stats[p.name] = {};
  addFeed(`${p.name} entre dans l'arène !`);
  return p;
}

function pickQuestion(p) {
  // On choisit d'abord une notion au hasard (parmi celles cochées), puis une question de cette notion
  const actives = NOTIONS.filter(n => subjects.has(n.s));
  const notion = (actives.length ? actives : NOTIONS)[Math.floor(Math.random() * (actives.length || NOTIONS.length))].s;
  const list = QUESTIONS.filter(q => q.notion === notion);
  const gen = GENERATEURS[notion];
  p.recent = p.recent || [];
  let q;
  if (gen && (!list.length || Math.random() < 0.75)) q = gen();
  else {
    for (let i = 0; i < 10; i++) {
      q = list[Math.floor(Math.random() * list.length)];
      if (!p.recent.includes(q)) break;
    }
    p.recent.push(q);
    if (p.recent.length > 12) p.recent.shift();
  }
  // Mélanger les choix
  const order = q.choix.map((_, i) => i).sort(() => Math.random() - 0.5);
  p.question = { q, order, answer: order.indexOf(q.reponse) };
  send(p.conn, { t: 'q', matiere: q.matiere, notion: q.notion, question: q.question, svg: q.svg || '', choix: order.map(i => q.choix[i]) });
}

function kill(target, killer) {
  target.alive = false;
  target.hp = 0;
  target.deaths++;
  target.shield = 0;
  target.stealth = 0;
  if (killer && killer !== target) {
    killer.kills++;
    addFeed(`${killer.name} a vaincu ${target.name}`);
  }
  fx.push({ k: 'death', x: target.x, y: target.y, t: 0.6, d: 0.6 });
  target.waitQ = 1;  // petite pause avant la question
}

function respawn(p) {
  Object.assign(p, freeSpot());
  p.hp = p.maxHp; p.alive = true; p.protect = SPAWN_PROTECT; p.question = null;
  p.cdA = 0; p.cdP = 0;
  fx.push({ k: 'spawn', x: p.x, y: p.y, t: 0.6, d: 0.6 });
}

function answer(p, i) {
  if (!p.question || p.alive) return;
  const { q, answer: good } = p.question;
  const s = (stats[p.name][q.notion] = stats[p.name][q.notion] || { ok: 0, ko: 0 });
  if (i === good) {
    p.good++; s.ok++;
    send(p.conn, { t: 'res', ok: true });
    respawn(p);
  } else {
    p.bad++; s.ko++;
    send(p.conn, { t: 'res', ok: false, bonne: good, explication: q.explication || '' });
    p.question = null;
    p.waitQ = WRONG_DELAY;
  }
}

function damage(target, amount, attacker) {
  if (!target.alive || target.protect > 0) return;
  if (target.shield > 0) amount *= 0.25;
  target.hp -= amount;
  fx.push({ k: 'hit', x: target.x, y: target.y, t: 0.25, d: 0.25 });
  if (target.hp <= 0) kill(target, attacker);
}

function shoot(p, angle, a) {
  projectiles.push({
    x: p.x + Math.cos(angle) * (R + 4), y: p.y + Math.sin(angle) * (R + 4),
    vx: Math.cos(angle) * a.speed, vy: Math.sin(angle) * a.speed,
    r: a.r, dmg: a.dmg, life: a.life, owner: p.id, cls: p.cls,
  });
}

function attack(p) {
  if (!p.alive || p.cdA > 0 || paused) return;
  const a = CLASSES[p.cls].atk;
  p.cdA = a.cd;
  p.revealed = 1;                       // attaquer révèle le joueur caché dans un buisson
  const fromShadow = p.stealth > 0;
  p.stealth = 0;
  if (a.type === 'proj') return shoot(p, p.angle, a);
  fx.push({ k: 'slash', x: p.x, y: p.y, a: p.angle, r: a.range + R, arc: a.arc, t: 0.18, d: 0.18 });
  for (const o of players.values()) {
    if (o === p || !o.alive) continue;
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
  if (!p.alive || p.cdP > 0 || paused) return;
  const pw = CLASSES[p.cls].power;
  p.cdP = pw.cd;
  if (p.cls === 'guerrier') {
    p.shield = pw.dur;
  } else if (p.cls === 'mage') {
    fx.push({ k: 'boom', x: p.x, y: p.y, r: pw.radius, t: 0.4, d: 0.4 });
    for (const o of players.values())
      if (o !== p && o.alive && Math.hypot(o.x - p.x, o.y - p.y) < pw.radius + R) damage(o, pw.dmg, p);
  } else if (p.cls === 'archer') {
    const a = CLASSES.archer.atk;
    for (let i = 0; i < pw.count; i++) shoot(p, p.angle - pw.spread / 2 + (pw.spread * i) / (pw.count - 1), a);
  } else if (p.cls === 'voleur') {
    // Ombre : invisible et plus rapide ; la prochaine attaque fait +50 %
    p.stealth = pw.dur;
    fx.push({ k: 'smoke', x: p.x, y: p.y, t: 0.5, d: 0.5 });
  }
}

// ---------- Robots (pour tester ou compléter la classe) ----------
const BOT_NAMES = ['Robo-Gaston', 'Bip-Lucie', 'Zorg', 'Mécano', 'Tic-Tac', 'Boulon', 'Pixel', 'Ressort', 'Écrou', 'Circuit', 'Turbo', 'Gizmo', 'Vis-Vis', 'Radar', 'Piston', 'Bidule'];
function botThink(p, dt) {
  if (!p.alive) {
    if (!p.question) return;
    p.botT -= dt;
    if (p.botT <= 0) answer(p, Math.random() < 0.7 ? p.question.answer : (p.question.answer + 1) % p.question.order.length);
    return;
  }
  let best = null, bd = Infinity;
  for (const o of players.values()) {
    if (o === p || !o.alive) continue;
    const d = Math.hypot(o.x - p.x, o.y - p.y);
    if ((o.hidden || o.stealth > 0) && d > 120) continue;
    if (d < bd) { bd = d; best = o; }
  }
  p.input = { u: 0, d: 0, l: 0, r: 0 };
  if (p.stuckT > 0) { p.stuckT -= dt; return; }
  if (!best || bd > 900) {
    // Personne en vue : se promener vers un point au hasard
    if (!p.goal || Math.hypot(p.goal.x - p.x, p.goal.y - p.y) < 60 || Math.random() < 0.003) p.goal = freeSpot();
    p.moveAngle = p.angle = Math.atan2(p.goal.y - p.y, p.goal.x - p.x);
    return;
  }
  const ang = Math.atan2(best.y - p.y, best.x - p.x) + Math.sin(Date.now() / 700 + p.id) * 0.5;
  p.angle = Math.atan2(best.y - p.y, best.x - p.x);
  const a = CLASSES[p.cls].atk;
  const want = a.type === 'melee' ? a.range + R : 320;
  const dir = bd > want ? 1 : bd < want * 0.6 ? -1 : 0;
  p.moveAngle = dir ? (dir > 0 ? ang : ang + Math.PI) : null;
  if (bd < want + 30 && Math.random() < 0.5) attack(p);
  if (bd < 200 && Math.random() < 0.01) power(p);
}

// ---------- Boucle de jeu ----------
let last = Date.now(), tickCount = 0;
function step() {
  const now = Date.now();
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;

  for (const p of players.values()) {
    if (p.bot) botThink(p, dt);
    if (!p.alive) {
      if (p.waitQ > 0 && (p.waitQ -= dt) <= 0) {
        pickQuestion(p);
        if (p.bot) p.botT = rand(2, 6);
      }
      continue;
    }
    p.cdA = Math.max(0, p.cdA - dt); p.cdP = Math.max(0, p.cdP - dt);
    p.shield = Math.max(0, p.shield - dt); p.protect = Math.max(0, p.protect - dt);
    p.stealth = Math.max(0, p.stealth - dt); p.revealed = Math.max(0, p.revealed - dt);
    p.hidden = p.revealed <= 0 && inBush(p);
    if (paused) continue;
    if (Math.hypot(p.x - FOUNTAIN.x, p.y - FOUNTAIN.y) < FOUNTAIN.r) p.hp = Math.min(p.maxHp, p.hp + FOUNTAIN.heal * dt);
    let mx, my;
    if (p.bot) {
      mx = p.moveAngle == null ? 0 : Math.cos(p.moveAngle);
      my = p.moveAngle == null ? 0 : Math.sin(p.moveAngle);
    } else {
      mx = p.input.r - p.input.l; my = p.input.d - p.input.u;
      const len = Math.hypot(mx, my) || 1; mx /= len; my /= len;
    }
    let sp = CLASSES[p.cls].speed * dt;
    if (Monde.isMud(p.x, p.y)) sp *= 0.55;          // boue du marais : ralentit
    else if (Monde.isIce(p.x, p.y)) sp *= 1.35;     // lac gelé : on glisse plus vite !
    if (p.stealth > 0) sp *= 1.2;
    const bx = blocked(p.x + mx * sp, p.y, R), by = blocked(p.x, p.y + my * sp, R);
    if (!bx) p.x += mx * sp;
    if (!by) p.y += my * sp;
    if (p.bot && p.moveAngle != null && bx && by) { p.moveAngle += Math.PI / 2 * (Math.random() < 0.5 ? 1 : -1); p.stuckT = 0.6; }
  }

  if (!paused) {
    projectiles = projectiles.filter(b => {
      b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
      if (b.life <= 0 || blockedShot(b.x, b.y, b.r)) return false;
      for (const o of players.values()) {
        if (o.id === b.owner || !o.alive) continue;
        if (Math.hypot(o.x - b.x, o.y - b.y) < R + b.r) {
          damage(o, b.dmg, players.get(b.owner));
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
      (p.alive ? 1 : 0) | (p.shield > 0 ? 2 : 0) | (p.protect > 0 ? 4 : 0) | (p.hidden ? 8 : 0) | (p.stealth > 0 ? 16 : 0),
    ]),
    b: projectiles.map(b => [Math.round(b.x), Math.round(b.y), b.cls, +Math.atan2(b.vy, b.vx).toFixed(2)]),
    fx: fx.map(f => { const o = {}; for (const k in f) o[k] = typeof f[k] === 'number' ? Math.round(f[k] * 100) / 100 : f[k]; return o; }),
    feed: feed.map(f => f.text), paused,
  });
}

function broadcast() {
  const common = publicState();
  for (const c of conns) {
    if (c.role === 'prof') c.send(`{"t":"s","w":${common}}`);
    else if (c.player) {
      const p = c.player;
      const me = { id: p.id, cdA: +p.cdA.toFixed(2), cdP: +p.cdP.toFixed(2), alive: p.alive, kills: p.kills, deaths: p.deaths, good: p.good };
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
    players: [...players.values()].map(p => ({ id: p.id, n: p.name, c: p.cls, l: p.look, k: p.kills, d: p.deaths, g: p.good, b: p.bad, bot: p.bot })),
  });
  for (const c of conns) if (c.role === 'prof') c.send(info);
}, 1000);

setInterval(step, TICK);

// ---------- Messages ----------
function send(conn, obj) { if (conn) conn.send(JSON.stringify(obj)); }

function onMessage(conn, msg) {
  let m;
  try { m = JSON.parse(msg); } catch { return; }
  const p = conn.player;
  switch (m.t) {
    case 'join':
      if (p) return;
      conn.player = createPlayer(m.name, m.cls, false, String(m.look || ''));
      conn.player.conn = conn;
      send(conn, { t: 'welcome', id: conn.player.id, ...MAP, classes: CLASSES });
      break;
    case 'in':
      if (p) { p.input = { u: +!!m.u, d: +!!m.d, l: +!!m.l, r: +!!m.r }; if (typeof m.a === 'number') p.angle = m.a; }
      break;
    case 'atk': if (p) attack(p); break;
    case 'pow': if (p) power(p); break;
    case 'ans': if (p) answer(p, m.i); break;
    case 'prof':
      conn.role = 'prof';
      send(conn, { t: 'welcome', ...MAP, classes: CLASSES });
      break;
  }
  if (conn.role !== 'prof') return;
  switch (m.t) {
    case 'subject': m.on ? subjects.add(m.s) : subjects.delete(m.s); break;
    case 'pause': paused = !paused; addFeed(paused ? '⏸ Partie en pause' : '▶ La partie reprend !'); break;
    case 'addbot': {
      const cls = Object.keys(CLASSES)[Math.floor(Math.random() * 4)];
      const used = new Set([...players.values()].map(q => q.name));
      const free = BOT_NAMES.filter(n => !used.has(n));
      createPlayer(free.length ? free[Math.floor(Math.random() * free.length)] : 'Robot ' + nextId, cls, true);
      break;
    }
    case 'rmbots': for (const [id, q] of players) if (q.bot) players.delete(id); break;
    case 'kick': {
      const q = players.get(m.id);
      if (q) { players.delete(q.id); if (q.conn) { send(q.conn, { t: 'kicked' }); q.conn.player = null; } }
      break;
    }
    case 'reset':
      for (const q of players.values()) { q.kills = q.deaths = q.good = q.bad = 0; }
      for (const k in stats) stats[k] = {};
      addFeed('🔄 Nouvelle manche !');
      break;
  }
}

function onClose(conn) {
  conns.delete(conn);
  if (conn.player) { players.delete(conn.player.id); addFeed(`${conn.player.name} a quitté l'arène`); }
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
