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
const NOTIONS_BASE = [];
for (const q of [...QUESTIONS, ...Object.values(GENERATEURS).map(g => g())])
  if (!NOTIONS_BASE.some(n => n.s === q.notion)) NOTIONS_BASE.push({ s: q.notion, m: q.matiere });

// ---------- Codes des élèves (communs à la classe et aux parties à la maison) ----------
// La liste vient du tableau de bord (gardée dans le navigateur de l'enseignant). Chaque appareil d'élève garde aussi
// une copie de sa fiche : si le serveur gratuit s'est endormi et a tout oublié, la fiche revient avec l'élève.
// code -> { code, nom, or, achats: [], badges: [], maison: { q, ok, min, notions }, v } ; la version la plus récente gagne
const CODES = new Map();
const MONDES = new Set();    // la partie de la classe + une partie par élève qui s'entraîne à la maison
const FORMAT_CODE = /^[A-Z]{2,10}\d{2}$/;
function ficheCode(r) {
  const code = String(r.code).trim().toUpperCase().slice(0, 12), ma = r.maison && typeof r.maison === 'object' ? r.maison : null;
  return {
    code, nom: String(r.nom || 'Héros').slice(0, 16), or: Math.max(0, Math.round(+r.or || 0)),
    achats: Array.isArray(r.achats) ? r.achats.map(String).slice(0, 40) : [], badges: Array.isArray(r.badges) ? r.badges.map(String).slice(0, 20) : [],
    maison: ma ? { q: +ma.q || 0, ok: +ma.ok || 0, min: +ma.min || 0, notions: ma.notions && typeof ma.notions === 'object' ? Object.fromEntries(Object.entries(ma.notions).slice(0, 60).map(([n, v]) => [String(n).slice(0, 60), { ok: +v.ok || 0, ko: +v.ko || 0 }])) : {} } : null,
    v: +r.v || 0,
  };
}
function majCode(rec) {
  rec.v = (rec.v || 0) + 1;
  const prof = JSON.stringify({ t: 'codeMaj', rec }), eleve = JSON.stringify({ t: 'compteMaj', rec });
  for (const monde of MONDES) for (const c of monde.conns) {
    if (c.role === 'prof') c.send(prof);
    else if (c.player && c.player.code === rec.code) c.send(eleve);
  }
}

function lanAddresses() {
  return Object.values(os.networkInterfaces()).flat()
    .filter(i => i && i.family === 'IPv4' && !i.internal).map(i => `http://${i.address}:${PORT}`);
}

// Objets de chaque carte rangés par tuile : un test de collision ne regarde que les objets voisins
const GRILLES = new WeakMap(), MARGE = 48;
function grilleObjs(c) {
  let g = GRILLES.get(c);
  if (g) return g;
  g = Array.from({ length: c.cols * c.rows }, () => []);
  for (const o of c.objs) {
    const i0 = Math.max(0, Math.floor((o.x - MARGE) / c.T)), i1 = Math.min(c.cols - 1, Math.floor((o.x + o.w + MARGE) / c.T));
    const j0 = Math.max(0, Math.floor((o.y - MARGE) / c.T)), j1 = Math.min(c.rows - 1, Math.floor((o.y + o.h + MARGE) / c.T));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) g[j * c.cols + i].push(o);
  }
  GRILLES.set(c, g);
  return g;
}

// ---------- Une partie (un « monde ») : la classe, ou un élève seul à la maison ----------
// Tout l'état du jeu vit dans cette fonction : chaque appel crée une partie indépendante.
function creerMonde(opts = {}) {
const solo = !!opts.solo;
const NOTIONS = NOTIONS_BASE.map(n => ({ ...n }));
const partis = new Map();   // élève dont la connexion a coupé : on garde ses scores 2 minutes, il les retrouve en revenant

// ---------- Réglages du jeu ----------
const TICK = 1000 / 30;
const R = 22;
const SPAWN_PROTECT = 2.5;
const WRONG_DELAY = 3;

const CLASSES = {
  guerrier: { nom: 'Guerrier', hp: 170, speed: 150, atk: { type: 'melee', range: 72, arc: 1.8, dmg: 26, cd: 0.55 }, power: { nom: 'Bouclier', cd: 10, dur: 3 }, dash: { nom: 'Charge', cd: 3, dist: 160, dur: 0.26, dmg: 12, push: 80 } },
  voleur:   { nom: 'Voleur',   hp: 105, speed: 200, atk: { type: 'melee', range: 55, arc: 1.2, dmg: 18, cd: 0.35, backstab: 2 }, power: { nom: 'Ombre', cd: 9, dur: 4 }, dash: { nom: 'Roulade', cd: 2, dist: 140, dur: 0.24 } },
  mage:     { nom: 'Mage',     hp: 90,  speed: 160, atk: { type: 'proj', speed: 380, dmg: 22, cd: 0.65, r: 10, life: 1.6 }, power: { nom: 'Explosion', cd: 9, radius: 140, dmg: 38 }, dash: { nom: 'Téléportation', cd: 3, dist: 150 } },
  druide:   { nom: 'Druide',   hp: 115, speed: 165, atk: { type: 'proj', speed: 460, dmg: 16, cd: 0.5, r: 8, life: 1.25 }, power: { nom: 'Cercle de soin', cd: 10, radius: 170, soin: 40 }, dash: { nom: 'Bond', cd: 3, dist: 140, dur: 0.24, racines: 70, rdur: 3 } },
  archer:   { nom: 'Archer',   hp: 100, speed: 175, atk: { type: 'proj', speed: 600, dmg: 15, cd: 0.4, r: 6, life: 1.3 }, power: { nom: 'Pluie de flèches', cd: 8, count: 7, spread: 0.9, dmg: 10 }, dash: { nom: 'Saut arrière', cd: 3, dist: 130, dur: 0.22 } },
};

// Objets des coffres et objets cachés
const ITEMS = {
  potion:       { nom: 'Potion de vie', ico: '🧪' },
  grandepotion: { nom: 'Grande potion', ico: '❤️' },
  vitesse:      { nom: 'Bottes de vitesse', ico: '👢' },
  force:        { nom: 'Potion de force', ico: '💪' },
  bouclier:     { nom: 'Bouclier magique', ico: '🛡️' },
  ombre:        { nom: 'Cape d\'ombre', ico: '🌑' },
  piege:        { nom: 'Piège à ressort', ico: '🪤' },
  fumee:        { nom: 'Bombe fumigène', ico: '💨' },
};
const BONS_OBJETS = ['grandepotion', 'vitesse', 'force', 'bouclier', 'ombre', 'fumee'];
// Équipement : toujours un bonus, gardé jusqu'à la fin de la manche. 3 niveaux : bronze, argent, or.
const GEAR = {
  casque: { nom: 'Casque', ico: '🪖', armure: 5 },
  armure: { nom: 'Armure', ico: '🥋', armure: 10 },
  epee:   { nom: 'Épée',   ico: '🗡️', degats: 15 },   // % de dégâts en plus (une épée en points avantageait trop les attaques rapides)
  bottes: { nom: 'Bottes', ico: '🥾', vitesse: 5 },
};
const GEAR_KEYS = Object.keys(GEAR);
const TIERS = ['', 'de bronze', 'd\'argent', 'd\'or'];
// Familiers : un mini pouvoir sur la touche E (1 chat, 2 chien, 3 bébé dragon, 4 hibou, 5 slime)
const PETS = {
  1: { nom: 'Chat', pouvoir: 'Ronron : +25 points de vie', soin: 25 },
  2: { nom: 'Loup', pouvoir: 'Hurlement : repousse les ennemis proches', radius: 140, push: 90 },
  3: { nom: 'Bébé dragon', pouvoir: 'Petite boule de feu', atk: { speed: 420, dmg: 20, r: 8, life: 1.2 } },
  4: { nom: 'Hibou', pouvoir: 'Œil perçant : révèle les joueurs cachés 4 s', radius: 480, dur: 4 },
  5: { nom: 'Slime', pouvoir: 'Flaque gluante : ralentit les ennemis', r: 90, dur: 4 },
};
const PET_CD = 15;
// Races (8e caractère du look) : un petit bonus chacune, pour le plaisir sans déséquilibrer
const RACES = {
  0: { nom: 'Humain', bonus: 'Polyvalent : pouvoir rechargé 10 % plus vite', pouvoir: 0.9 },
  1: { nom: 'Elfe', bonus: 'Agile : 5 % plus rapide', vitesse: 1.05 },
  2: { nom: 'Nain', bonus: 'Robuste : +10 points de vie', pv: 10 },
  3: { nom: 'Orc', bonus: 'Fort : 5 % de dégâts en plus', degats: 1.05 },
};
const raceDe = p => RACES[+p.look[7]] || RACES[0];
const BARREL = { r: 20, radius: 120, dmg: 30, back: 30 };   // tonneaux explosifs
const OBJETS_CACHES = ['potion', 'potion', 'vitesse', 'force', 'equip', 'piege', 'fumee'];

const TEAMS = [
  { nom: 'Rouges', color: '#e04a3a' }, { nom: 'Bleus', color: '#3a7ae0' },
  { nom: 'Verts', color: '#3fbf5a' }, { nom: 'Jaunes', color: '#f2c94c' },
];
const MODES = { libre: 'Chacun pour soi', equipes: 'Équipes', colline: 'Roi de la colline', drapeau: 'Capture du drapeau', boss: 'Boss coopératif', runes: 'Course aux runes', chariot: 'Escorte du chariot', survie: 'Survie coopérative', zombie: 'Contagion', entrainement: 'Entraînement' };
const TEAM_MODES = new Set(['equipes', 'colline', 'drapeau', 'runes', 'chariot', 'zombie']);
const coop = () => mode === 'boss' || mode === 'survie';   // toute la classe ensemble : pas de dégâts entre joueurs
// noms d'équipes propres à certains modes
const teamsNow = () => mode === 'zombie' ? [{ nom: 'Humains', color: '#3a7ae0' }, { nom: 'Zombies', color: '#5ac85a' }]
  : mode === 'chariot' ? [{ nom: 'Pousseurs', color: '#e0a03a' }, { nom: 'Défenseurs', color: '#3a7ae0' }] : TEAMS.slice(0, nbTeams);
const RUNES = { max: 3, win: 12, respawn: 4 };     // course aux runes : 12 runes pour gagner
const CART = { energie: 120, bonne: 70, contre: 40, vitesse: 45, zone: 140, every: 8, duree: 300 };   // escorte du chariot
const SURVIE = { vagues: 8, repos: 12 };
const TEMPETE = { debut: 180, duree: 120, rMin: 0.22, degats: 10 };   // zone qui rétrécit (chacun pour soi et équipes)
const VAGUE_SBIRES = ['slime', 'gobelin', 'citrouille', 'ombre', 'glace', 'pieuvre', 'livre', 'chevalier'];
let runes = [], runePts = [], runeT = 0, cart = null, surv = null, zomb = null;
const HILL = { r: 120, move: 75, win: 120 };       // colline : 120 points (1 par seconde tenue seul) pour gagner
const FLAG = { caps: 3, back: 20, slow: 0.85 };   // drapeau : 3 captures pour gagner, retour auto après 20 s
const OR = { bonne: 1, serie: 2, dore: 5 };       // pièces d'or gagnées

// ---------- État ----------
let nextId = 1;
const players = new Map();   // id -> joueur
const conns = new Set();     // connexions WebSocket
let projectiles = [];
let fx = [];
let feed = [];
let paused = false;
const subjects = new Set(NOTIONS.map(n => n.s));
// Questions de l'enseignant (gardées dans son navigateur et renvoyées à chaque connexion de /prof)
let PERSO = [], PERSO_BRUT = [];
let reglagesV = 0;   // heure du dernier réglage de l'enseignant (0 : rien depuis le démarrage du serveur)
const reglagesEleve = () => ({ subjects: [...subjects], perso: PERSO_BRUT, ouvert: ouvertTous, v: reglagesV });
const str = (v, n) => typeof v === 'string' ? v.trim().slice(0, n) : '';
function setPerso(qs) {
  if (!Array.isArray(qs)) return;
  PERSO_BRUT = qs;
  const avant = new Set(PERSO.map(q => q.notion));
  PERSO = qs.slice(0, 1000).map(q => ({ matiere: str(q.matiere, 40) || 'Mes questions', notion: str(q.notion, 60), question: str(q.question, 300), choix: (Array.isArray(q.choix) ? q.choix : []).slice(0, 4).map(c => str(c, 120)).filter(Boolean), reponse: 0, explication: str(q.explication, 300) }))
    .filter(q => q.notion && q.question && q.choix.length >= 2 && new Set(q.choix).size === q.choix.length);
  for (let i = NOTIONS.length - 1; i >= 0; i--) if (NOTIONS[i].perso) NOTIONS.splice(i, 1);
  for (const q of PERSO) if (!NOTIONS.some(n => n.s === q.notion)) { NOTIONS.push({ s: q.notion, m: q.matiere, perso: true }); if (!avant.has(q.notion)) subjects.add(q.notion); }
}
const stats = {};            // nom -> { notion: {ok, ko} } pour la manche
const memoire = {};          // nom -> { notion: {ok, ko} } pour toute la séance (révision ciblée, bilans)
const orSeance = {};         // nom -> pièces d'or gagnées pendant la séance
const badgesSeance = {};     // nom -> Set des badges gagnés pendant la séance
const BADGES = {
  serie5: { ico: '🔥', nom: 'Série de 5', txt: '5 bonnes réponses de suite' },
  serie10: { ico: '🌋', nom: 'Cerveau en feu', txt: '10 bonnes réponses de suite' },
  studieux: { ico: '📚', nom: 'Studieux', txt: '25 bonnes réponses dans la séance' },
  sansFaute: { ico: '🎯', nom: 'Sans faute', txt: '10 bonnes réponses dans une manche, sans erreur' },
  sauveur: { ico: '💚', nom: "Sauveur d'équipe", txt: 'Relever 3 coéquipiers' },
  couronne: { ico: '👑', nom: 'Chasseur de couronne', txt: 'Vaincre le meneur' },
  coffres: { ico: '🗝️', nom: 'Pilleur de coffres', txt: 'Ouvrir 5 coffres' },
  runes: { ico: '✨', nom: 'Gardien des runes', txt: 'Capturer 3 runes' },
  boss: { ico: '🐉', nom: 'Tueur de boss', txt: 'Vaincre le boss du mois avec la classe' },
  vagues: { ico: '🌊', nom: 'Héros des vagues', txt: 'Repousser les 8 vagues de la Survie' },
  chariot: { ico: '🛒', nom: 'Roi du chariot', txt: 'Amener le chariot au bout du chemin' },
  survivant: { ico: '🧄', nom: 'Survivant', txt: 'Rester humain jusqu\'à la fin de la Contagion' },
};
const MSGS = ['🆘 Aide-moi !', '🎯 À l\'objectif !', '⚔️ On attaque !', '🛡️ Je défends', '👍 Bravo !'];   // messages rapides (pas de clavier libre)
let bulles = [];             // { id, i, t } bulles au-dessus des joueurs
const codeDe = p => p && p.code && CODES.get(p.code);
function badge(p, id) {
  if (!p || p.bot || !p.name || !BADGES[id]) return;
  const set = badgesSeance[p.name] || (badgesSeance[p.name] = new Set()), rec = codeDe(p);
  if (set.has(id) || (rec && rec.badges.includes(id))) return;
  set.add(id);
  if (rec) { rec.badges.push(id); majCode(rec); }
  const B = BADGES[id];
  send(p.conn, { t: 'badge', id, ...B });
  addFeed(`🏅 ${p.name} gagne le badge ${B.ico} ${B.nom} !`);
}
const badgesDe = p => [...new Set([...(badgesSeance[p.name] || []), ...((codeDe(p) || {}).badges || [])])];

let carte = CARTES[0], T = carte.T, W = carte.W, H = carte.H;
let chests = [], items = [], itemTimer = 0, barrels = [], puddles = [], traps = [], smokes = [], ames = [];   // ames : coéquipiers K.O. qu'on peut relever
let mode = 'libre', nbTeams = 2;
let boss = null;
let hill = null;                   // colline : { x, y, t, owner, pts[] }
let flags = null, caps = [0, 0];   // drapeaux : [{ team, hx, hy, x, y, carrier, back }]
let goldT = 0, goldFrom = -1;      // coffre doré : délai avant qu'un autre coffre devienne doré
let eclairDur = 20;   // durée d'une question éclair (s), au choix de l'enseignant
let tempeteOn = false, tempete = null, roundT = 0;   // tempête : choix de l'enseignant
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
function touchObj(x, y, r) {
  const os = r > MARGE ? carte.objs : grilleObjs(carte)[clamp(Math.floor(y / T), 0, carte.rows - 1) * carte.cols + clamp(Math.floor(x / T), 0, carte.cols - 1)];
  for (const o of os) if (circleHitsRect(x, y, r, o)) return true;
  return false;
}
// Pour les joueurs : murs, eau, fosses, objets
function blocked(x, y, r) {
  if (x < r || y < r || x > W - r || y > H - r) return true;
  const k = r * 0.75;
  const dur = (px, py) => { const t = tileAt(px, py); return WALL.has(t) || WATER.has(t); };
  if (dur(x, y) || dur(x + k, y) || dur(x - k, y) || dur(x, y + k) || dur(x, y - k)) return true;
  if (touchObj(x, y, r)) return true;
  if (healCore() && Math.hypot(x - carte.heal.x, y - carte.heal.y) < 30 + r) return true;
  if (barrels.some(b => !b.t && Math.hypot(x - b.x, y - b.y) < BARREL.r + r - 4)) return true;
  return false;
}
// Pour les projectiles : seulement les murs et les objets
function blockedShot(x, y, r) {
  if (x < 0 || y < 0 || x > W || y > H) return true;
  return WALL.has(tileAt(x, y)) || touchObj(x, y, r);
}
const inBush = p => tileAt(p.x, p.y + 8) === 'h' || carte.bushes.some(b => Math.hypot(b.x - p.x, b.y - p.y) < b.r);
function freeSpot(team = -1) {
  const base = mode === 'drapeau' && flags && flags[team] ? flags[team]
    : mode === 'chariot' && cart && team >= 0 ? (team === 0 ? { hx: cart.x, hy: cart.y } : (({ x, y }) => ({ hx: x, hy: y }))(cartAhead(450))) : null;
  if (base) {   // on revient près de sa base (drapeau) ou du chariot
    const f = base;
    for (let i = 0; i < 300; i++) {
      const x = f.hx + rand(-260, 260), y = f.hy + rand(-260, 260);
      if (x > 60 && y > 60 && x < W - 60 && y < H - 60 && !blocked(x, y, R + 12) && !WATER.has(tileAt(x, y + 40)) && Math.hypot(x - f.hx, y - f.hy) > 70) return { x, y };
    }
  }
  for (let i = 0; i < 500; i++) {
    const x = rand(80, W - 80), y = rand(80, H - 80);
    if (blocked(x, y, R + 12) || WATER.has(tileAt(x, y + 40))) continue;
    if (tempete && i < 450 && Math.hypot(x - tempete.x, y - tempete.y) > tempete.r * 0.8) continue;
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
    walk.push(!WALL.has(t) && !WATER.has(t) && !c.objs.some(o => circleHitsRect(x, y, 16, o)) && !c.barrels.some(b => Math.hypot(b.x - x, b.y - y) < 30));
  }
  chests = c.chests.map(ch => ({ ...ch, open: 0, by: 0, gold: false }));
  pickGold();
  barrels = c.barrels.map(b => ({ ...b, t: 0, fuse: 0, by: null }));
  items = []; itemTimer = 0;
  projectiles = []; fx = []; puddles = []; traps = []; smokes = []; ames = [];
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
// Deux élèves avec le même prénom : le second devient « Léa 2 » (sinon leurs résultats se mélangent)
function uniqueName(name) {
  const base = String(name).trim().slice(0, 16) || 'Héros';
  const taken = new Set([...players.values()].map(p => p.name.toLowerCase()));
  if (!taken.has(base.toLowerCase())) return base;
  for (let i = 2; ; i++) { const n = base.slice(0, 13) + ' ' + i; if (!taken.has(n.toLowerCase())) return n; }
}
// prime sur le meneur : 2 points, +1 toutes les 3 victoires de suite (sans être vaincu), jusqu'à 5
const prime = p => Math.min(5, 2 + Math.floor((p.serieK || 0) / 3));
function leaderId() {
  // le meneur : seul en tête, avec au moins 3 victoires
  let best = null, second = -1;
  for (const p of players.values()) { if (!best || p.kills > best.kills) { second = best ? best.kills : -1; best = p; } else if (p.kills > second) second = p.kills; }
  return best && best.kills >= 3 && best.kills > second ? best.id : 0;
}
// apparence : f/m, peau, cheveux, tenue (0-6), accessoire (0-3), familier (0-5), couleur du familier (0-3)
// tenues 7-9, accessoires 4-5 et couleurs de familier 4-5 : achetés à la boutique avec les pièces d'or
function cleanLook(l) {
  l = String(l || '');
  if (/^[fm][0-3][0-3]$/.test(l)) l += '00000';
  else if (l.length === 6) l += '00';
  else if (l.length === 7) l += '0';   // ancien look, sans race : humain
  return /^[fm][0-3][0-3][0-9][0-5][0-5][0-5][0-3]$/.test(l) ? l : '';
}
const gearCode = p => p.gear.casque + 4 * p.gear.armure + 16 * p.gear.epee + 64 * p.gear.bottes;
const armorOf = p => Math.min(40, GEAR.casque.armure * p.gear.casque + GEAR.armure.armure * p.gear.armure);   // % de dégâts en moins
// Donne une pièce d'équipement : une nouvelle pièce, ou une pièce améliorée. false si tout est déjà en or.
function giveGear(p, src) {
  const open = GEAR_KEYS.filter(k => p.gear[k] < 3);
  if (!open.length) return false;
  const fresh = open.filter(k => p.gear[k] === 0);
  const k = pick(fresh.length && Math.random() < 0.6 ? fresh : open);
  const lvl = ++p.gear[k];
  const g = GEAR[k], bonus = g.armure ? `+${g.armure * lvl} armure` : g.degats ? `+${g.degats * lvl} % dégâts` : `+${g.vitesse * lvl} % vitesse`;
  const nom = `${g.nom} ${TIERS[lvl]}`;
  fx.push({ k: 'item', x: p.x, y: p.y, t: 0.7, d: 0.7 });
  send(p.conn, { t: 'item', k, nom, ico: g.ico, src, gear: true, bonus, lvl });
  if (src === 'coffre') addFeed(`${p.name} trouve : ${g.ico} ${nom}`);
  return true;
}
function createPlayer(name, cls, bot = false, look = '') {
  const c = CLASSES[cls] || CLASSES.guerrier;
  const team = TEAM_MODES.has(mode) ? smallestTeam() : -1;
  const p = {
    id: nextId++, name: uniqueName(name), cls: CLASSES[cls] ? cls : 'guerrier', bot, team,
    hp: c.hp, maxHp: c.hp, alive: true, angle: 0,
    look: cleanLook(look) || (Math.random() < 0.5 ? 'f' : 'm') + ri(0, 3) + ri(0, 3) + (bot ? ri(0, 6) + '' + ri(0, 3) + ri(0, 5) + ri(0, 3) + ri(0, 3) : '00000'),
    gear: { casque: 0, armure: 0, epee: 0, bottes: 0 }, portalCd: 0,
    input: { u: 0, d: 0, l: 0, r: 0 }, cdA: 0, cdP: 0, cdD: 0, cdF: 0, slow: 0, dash: null, shield: 0, stealth: 0, revealed: 0, hidden: false, protect: SPAWN_PROTECT,
    fast: 0, strong: 0, busy: false, streak: 0, dmgBoss: 0, obj: 0, carry: null,
    kills: 0, deaths: 0, good: 0, bad: 0, question: null, waitQ: 0, conn: null, botT: 0,
    ...freeSpot(team),
  };
  p.hp = p.maxHp = c.hp + (raceDe(p).pv || 0);
  players.set(p.id, p);
  if (!stats[p.name]) stats[p.name] = {};
  if (!memoire[p.name] && !bot) memoire[p.name] = {};
  addFeed(`${p.name} entre dans l'arène !`);
  return p;
}

function newQuestion(p) {
  // On choisit d'abord une notion (parmi celles cochées), puis une question de cette notion.
  // Révision ciblée : une notion souvent ratée par cet élève revient plus souvent (jusqu'à 4 fois plus).
  const actives = NOTIONS.filter(n => subjects.has(n.s));
  const pool = actives.length ? actives : NOTIONS, mem = p.name && memoire[p.name];
  const poids = pool.map(n => { const s = mem && mem[n.s]; return s ? clamp((s.ko + 1) / (s.ok + 1), 0.5, 4) : 1; });
  let r = Math.random() * poids.reduce((a, b) => a + b, 0), ni = 0;
  while (ni < pool.length - 1 && (r -= poids[ni]) > 0) ni++;
  const notion = pool[ni].s;
  const list = QUESTIONS.filter(q => q.notion === notion).concat(PERSO.filter(q => q.notion === notion));
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
// Niveau choisi par l'enseignant pour chaque élève : f = facile (3 choix), n = normal, d = défi (réponse à taper si c'est un nombre)
const niveaux = {};
let ouvertTous = false;   // réponses à taper pour tous (questions dont la réponse est un nombre)
const norm = t => String(t).toLowerCase().replace(/[\s\u00a0$]/g, '').replace(',', '.').replace(/\.0+$/, '');
function adapter(p, Q) {
  const nv = niveaux[p.name] || 'n', bon = Q.q.choix[Q.q.reponse];
  if ((nv === 'd' || ouvertTous) && /^[\d\s\u00a0.,]+$/.test(bon)) Q.ouvert = true;
  else if (nv === 'f' && Q.order.length > 3) {
    const faux = Q.order.filter(i => i !== Q.q.reponse);
    Q.order.splice(Q.order.indexOf(faux[Math.floor(Math.random() * faux.length)]), 1);
    Q.answer = Q.order.indexOf(Q.q.reponse);
  }
  return Q;
}
function askQuestion(p, kind, extra = {}) {
  p.question = { ...adapter(p, newQuestion(p)), kind, ...extra };
  send(p.conn, questionMsg(p.question, kind, { ...(extra.gold ? { gold: true, step: extra.step } : {}), ...(p.question.ouvert ? { ouvert: true } : {}) }));
  if (p.bot) p.botT = rand(2, 6);
}

// Note la réponse : statistiques, séries, coup de savoir contre le boss
function gainOr(p, n) {
  if (p.bot || !p.name) return;
  orSeance[p.name] = (orSeance[p.name] || 0) + n;
  const rec = codeDe(p);
  if (rec) { rec.or = Math.max(0, rec.or + n); majCode(rec); }
  send(p.conn, { t: 'or', n });
}
function record(p, q, ok) {
  const fiche = solo && codeDe(p);
  if (fiche) {   // pratique à la maison : notée sur la fiche de l'élève (visible dans le tableau de bord)
    const ma = fiche.maison || (fiche.maison = { q: 0, ok: 0, min: 0, notions: {} }), n = ma.notions[q.notion] || (ma.notions[q.notion] = { ok: 0, ko: 0 });
    ma.q++; if (ok) { ma.ok++; n.ok++; } else n.ko++;
    majCode(fiche);
  }
  const s = (stats[p.name][q.notion] = stats[p.name][q.notion] || { ok: 0, ko: 0 });
  const mem = p.bot ? {} : memoire[p.name] || (memoire[p.name] = {});   // les robots ne comptent pas dans les bilans
  const sm = (mem[q.notion] = mem[q.notion] || { ok: 0, ko: 0 });
  if (ok) {
    p.good++; s.ok++; sm.ok++; p.streak++;
    if (p.streak === 5) badge(p, 'serie5');
    if (p.streak === 10) badge(p, 'serie10');
    if (p.good >= 10 && !p.bad) badge(p, 'sansFaute');
    if (!p.bot && Object.values(stats[p.name]).reduce((t, x) => t + x.ok, 0) >= 25) badge(p, 'studieux');
    gainOr(p, OR.bonne);
    if (p.streak % 3 === 0) {
      if (!p.bot && !p.superP) { p.superP = true; send(p.conn, { t: 'super' }); }   // super-pouvoir : 3 bonnes réponses de suite
      gainOr(p, OR.serie);
      const k = pick(BONS_OBJETS);
      addFeed(`🔥 ${p.name} : ${p.streak} bonnes réponses de suite !`);
      p.pending = k;   // donné au prochain moment où le joueur est en vie
      send(p.conn, { t: 'serie', n: p.streak, k, nom: ITEMS[k].nom, ico: ITEMS[k].ico });
    }
    if (boss && boss.hp > 0 && !boss.shield) {
      const d = Math.round(boss.max * 0.03);
      boss.hp -= d; p.dmgBoss += d;
      fx.push({ k: 'zap', x: p.x, y: p.y, x2: Math.round(boss.x), y2: Math.round(boss.y), t: 0.5, d: 0.5 });
      bossCheck(p);
    }
  } else { p.bad++; s.ko++; sm.ko++; p.streak = 0; }
}

function giveItem(p, k, src) {
  if (k === 'potion') p.hp = Math.min(p.maxHp, p.hp + 50);
  else if (k === 'grandepotion') p.hp = p.maxHp;
  else if (k === 'vitesse') p.fast = 10;
  else if (k === 'force') p.strong = 10;
  else if (k === 'bouclier') p.shield = 4;
  else if (k === 'ombre') p.stealth = 5;
  else if (k === 'piege') traps.push({ x: Math.round(p.x), y: Math.round(p.y + 14), owner: p.id, team: p.team, arm: 1.2, t: 40 });   // posé à ses pieds, armé après 1 s
  else if (k === 'fumee') smokes.push({ x: Math.round(p.x), y: Math.round(p.y), r: 120, t: 6 });   // nuage : on s'y cache comme dans un buisson
  fx.push({ k: 'item', x: p.x, y: p.y, t: 0.7, d: 0.7 });
  send(p.conn, { t: 'item', k, nom: ITEMS[k].nom, ico: ITEMS[k].ico, src });
  if (src === 'coffre') addFeed(`${p.name} ouvre un coffre : ${ITEMS[k].ico} ${ITEMS[k].nom}`);
}

function kill(target, killer) {
  target.alive = false;
  target.hp = 0;
  target.deaths++;
  target.shield = 0; target.stealth = 0; target.fast = 0; target.strong = 0; target.dash = null; target.serieK = 0;
  if (killer && killer !== target) {
    if (target.id === leaderId()) {
      const pr = prime(target);
      killer.kills += pr;   // prime au meneur
      addFeed(`👑 ${killer.name} a vaincu le meneur ${target.name} ! (+${pr})`); badge(killer, 'couronne');
    } else {
      killer.kills++;
      addFeed(`${killer.name} a vaincu ${target.name}`);
    }
    killer.serieK = (killer.serieK || 0) + 1;
  } else if (killer === null && boss) addFeed(`${boss.nom} a vaincu ${target.name}`);
  fx.push({ k: 'death', x: target.x, y: target.y, t: 0.6, d: 0.6 });
  if (teamMode() || coop()) { ames = ames.filter(a => a.id !== target.id); ames.push({ id: target.id, x: Math.round(target.x), y: Math.round(target.y), team: target.team, t: 20, prog: 0, cd: 0 }); }
  target.waitQ = 1;  // petite pause avant la question
}

function respawn(p) {
  Object.assign(p, freeSpot(p.team));
  p.hp = p.maxHp; p.alive = true; p.protect = SPAWN_PROTECT; p.question = null;
  p.cdA = 0; p.cdP = 0; p.cdD = 0; p.dash = null; p.stun = 0;
  fx.push({ k: 'spawn', x: p.x, y: p.y, t: 0.6, d: 0.6 });
}

// Rappel court de la règle quand l'élève se trompe (si la question n'a pas sa propre explication)
const RAPPELS = {
  'Phrase de base': 'La phrase de base contient un groupe sujet (GS) suivi d\'un groupe du verbe (GV). Le complément de phrase (GCP) est facultatif et se déplace.',
  'Classes de mots variables': 'Les 5 classes de mots variables : nom, déterminant, adjectif, pronom et verbe. Elles changent selon le genre, le nombre ou la personne.',
  'Construction du GN': 'Le groupe du nom (GN) a toujours un nom comme noyau. On peut ajouter un déterminant avant, et un adjectif ou un groupe prépositionnel comme expansion.',
  'Accords dans le GN': 'Dans le GN, le nom donne son genre et son nombre au déterminant et à l\'adjectif.',
  'Accord des verbes': 'Le verbe s\'accorde avec le noyau du sujet. Trouve le sujet avec « C\'est… qui » et remplace-le par un pronom (il, elle, ils…).',
  'Angles': 'Angle aigu : moins de 90°. Angle droit : 90°. Angle obtus : entre 90° et 180°. Angle plat : 180°.',
  'Fractions': 'Le dénominateur (en bas) dit en combien de parties égales on partage le tout. Le numérateur (en haut) dit combien de parties on prend.',
  'Triangles': 'Équilatéral : 3 côtés égaux. Isocèle : 2 côtés égaux. Scalène : aucun côté égal. Rectangle : un angle droit.',
  'Numération': 'De droite à gauche : unités, dizaines, centaines, unités de mille, dizaines de mille.',
};
const expl = q => q.explication || RAPPELS[q.notion] || '';

function answer(p, i, txt) {
  if (eclair) { if (eclair.ids.includes(p.id) && !eclair.answers.has(p.id)) eclair.answers.set(p.id, i); return; }
  if (!p.question) return;
  const Q = p.question;
  if (Q.ouvert && typeof txt === 'string') i = norm(txt) === norm(Q.q.choix[Q.q.reponse]) ? Q.answer : -1;
  const ok = i === Q.answer;
  record(p, Q.q, ok);
  if (Q.kind === 'chest' && Q.gold) return answerGold(p, Q, ok);
  const res = (special, extra = {}) => send(p.conn, { t: 'res', kind: 'chest', special, ok, bonne: Q.answer, bonneTxt: Q.ouvert ? Q.q.choix[Q.q.reponse] : undefined, explication: ok ? '' : expl(Q.q), ...extra });
  if (Q.kind === 'rune') {
    p.question = null; p.busy = false; p.protect = 0.8;
    const r = Q.rune; r.by = 0;
    if (ok && runes.includes(r)) {
      runes.splice(runes.indexOf(r), 1); runePts[p.team] = (runePts[p.team] || 0) + 1; p.obj++;
      if ((p.runesT = (p.runesT || 0) + 1) >= 3) badge(p, 'runes');
      res('✨ Rune capturée pour ton équipe !');
      addFeed(`✨ ${p.name} capture une rune pour les ${teamsNow()[p.team].nom} ! (${runePts[p.team]}/${RUNES.win})`);
      fx.push({ k: 'boom', x: r.x, y: r.y, r: 60, t: 0.5, d: 0.5, gold: 1 });
      if (runePts[p.team] >= RUNES.win) endRound('runes');
    } else { p.runeCd = 3; res('❌ Pas tout à fait… La rune t\'échappe pour 3 secondes.'); }
    return;
  }
  if (Q.kind === 'chariot') {
    p.question = null; p.busy = false; p.protect = 0.8;
    if (ok && cart) {
      p.obj++;
      if (p.team === 0) { cart.energie += CART.bonne; res('🛒 Bravo ! Le chariot reçoit de l\'énergie.'); }
      else { cart.energie = Math.max(0, cart.energie - CART.contre); res('🛑 Bravo ! Tu freines le chariot.'); }
    } else res(p.team === 0 ? '❌ Pas tout à fait… Le chariot ne reçoit rien cette fois.' : '❌ Pas tout à fait… Le chariot continue.');
    return;
  }
  if (Q.kind === 'zombie') {
    p.question = null; p.busy = false;
    const z = players.get(Q.par);
    if (ok || p.team !== 0) { p.protect = 3; res('🧄 Bravo ! Tu résistes à la contagion.'); addFeed(`🧄 ${p.name} résiste à la contagion !`); }
    else {
      p.team = 1; p.hp = p.maxHp; p.carry = null; p.protect = 1;
      if (z) { z.kills++; z.obj += 2; }
      res('🧟 Oh non ! Tu deviens un zombie. Attrape les humains !');
      addFeed(`🧟 ${p.name} devient un zombie !`);
    }
    return;
  }
  if (Q.kind === 'releve') {   // un coéquipier répond pour relever un K.O.
    p.question = null; p.busy = false; p.protect = 0.8;
    const a = ames.find(a => a.id === Q.ame), o = players.get(Q.ame);
    send(p.conn, { t: 'res', kind: 'chest', releve: true, ok, bonne: Q.answer, bonneTxt: Q.ouvert ? Q.q.choix[Q.q.reponse] : undefined, explication: ok ? '' : expl(Q.q), nom: o ? o.name : '' });
    if (a) { a.by = 0; a.prog = 0; a.cd = ok ? 0 : 3; }
    if (ok && a && o && !o.alive) {
      respawn(o); o.x = a.x; o.y = a.y; o.question = null; o.busy = false;
      send(o.conn, { t: 'close' }); send(o.conn, { t: 'releve', par: p.name });
      ames = ames.filter(x => x !== a); gainOr(p, 1);
      if ((p.releves = (p.releves || 0) + 1) >= 3) badge(p, 'sauveur');
      addFeed(`💚 ${p.name} relève ${o.name} !`); fx.push({ k: 'heal', x: a.x, y: a.y, t: 0.9, d: 0.9 });
    }
    return;
  }
  if (Q.kind === 'chest') {
    const ch = chests[Q.chest];
    p.question = null; p.busy = false; p.protect = 0.8;
    if (ch) { ch.open = 40; ch.by = 0; }
    if ((p.coffres = (p.coffres || 0) + 1) >= 5) badge(p, 'coffres');
    if (ok && Math.random() < 0.6 && GEAR_KEYS.some(k => p.gear[k] < 3)) {
      send(p.conn, { t: 'res', kind: 'chest', ok, bonne: Q.answer, bonneTxt: Q.ouvert ? Q.q.choix[Q.q.reponse] : undefined, explication: '', gear: true });
      giveGear(p, 'coffre');
      return;
    }
    const k = ok ? pick(BONS_OBJETS) : 'potion';
    send(p.conn, { t: 'res', kind: 'chest', ok, bonne: Q.answer, bonneTxt: Q.ouvert ? Q.q.choix[Q.q.reponse] : undefined, explication: ok ? '' : expl(Q.q), k, nom: ITEMS[k].nom, ico: ITEMS[k].ico });
    giveItem(p, k, 'coffre');
    return;
  }
  if (p.alive) return;
  if (ok) {
    send(p.conn, { t: 'res', ok: true });
    respawn(p);
  } else {
    send(p.conn, { t: 'res', ok: false, bonne: Q.answer, bonneTxt: Q.ouvert ? Q.q.choix[Q.q.reponse] : undefined, explication: expl(Q.q) });
    p.question = null;
    p.waitQ = expl(Q.q) ? WRONG_DELAY + 1.5 : WRONG_DELAY;   // le temps de lire la règle
  }
}

// Coffre doré : 2 questions de suite. 2 bonnes = 2 améliorations d'équipement + 5 pièces d'or.
function answerGold(p, Q, ok) {
  const ch = chests[Q.chest];
  if (Q.step === 1) {
    send(p.conn, { t: 'res', kind: 'chest', ok, bonne: Q.answer, bonneTxt: Q.ouvert ? Q.q.choix[Q.q.reponse] : undefined, suite: true, explication: ok ? '' : expl(Q.q) });
    p.question = null; p.busyT = 25;
    p.goldNext = { t: ok ? 1.3 : 3, chest: Q.chest, nOk: ok ? 1 : 0 };
    return;
  }
  const total = Q.nOk + (ok ? 1 : 0);
  p.question = null; p.busy = false; p.protect = 0.8;
  if (ch) { ch.open = 40; ch.by = 0; ch.gold = false; }
  goldT = 60; goldFrom = Q.chest;
  const base = { t: 'res', kind: 'chest', ok, bonne: Q.answer, bonneTxt: Q.ouvert ? Q.q.choix[Q.q.reponse] : undefined, dore: total, explication: ok ? '' : expl(Q.q) };
  if (total === 2) {
    let n = 0;
    if (giveGear(p, 'dore')) n++;
    if (giveGear(p, 'dore')) n++;
    if (!n) giveItem(p, 'grandepotion', 'dore');
    gainOr(p, OR.dore);
    send(p.conn, { ...base, gear: n });
    addFeed(`🌟 ${p.name} réussit le coffre doré !`);
    fx.push({ k: 'boom', x: p.x, y: p.y, r: 60, t: 0.5, d: 0.5, gold: 1 });
    return;
  }
  const k = total === 1 ? pick(BONS_OBJETS) : 'potion';
  send(p.conn, { ...base, k, nom: ITEMS[k].nom, ico: ITEMS[k].ico });
  giveItem(p, k, 'dore');
}
function pickGold() {
  chests.forEach(c => { c.gold = false; });
  const ok = chests.map((c, i) => i).filter(i => i !== goldFrom || chests.length === 1);
  if (ok.length) chests[pick(ok)].gold = true;
  goldT = 0;
}

const teamMode = () => TEAM_MODES.has(mode);
const canHit = (a, b) => b.alive && a !== b && !coop() && !(teamMode() && a && a.team === b.team) && !(mode === 'entrainement' && a && !a.bot === !b.bot);   // entraînement : les élèves contre les robots seulement
function damage(target, amount, attacker) {
  if (!target.alive || target.protect > 0 || target.busy || (target.dash && target.dash.inv)) return;
  if (mode === 'zombie' && attacker && attacker.team !== target.team) return zombieHit(target, attacker);   // contagion : pas de dégâts
  if (mode === 'entrainement' && attacker && attacker.bot) amount *= 0.6;   // robots d'entraînement moins forts
  if (attacker && attacker.strong > 0) amount *= 1.5;
  if (target.shield > 0) amount *= 0.25;   // le bouclier remplace l'armure (les deux ensemble rendaient presque invincible)
  else amount *= 1 - armorOf(target) / 100;
  target.hp -= amount;
  fx.push({ k: 'hit', x: target.x, y: target.y, t: 0.25, d: 0.25 });
  if (target.hp <= 0) kill(target, attacker);
}
function hitBoss(amount, attacker) {
  if (!boss || boss.hp <= 0) return;
  if (boss.shield) { fx.push({ k: 'crit', x: boss.x, y: boss.y - 40, txt: '🛡️', t: 0.4, d: 0.4 }); return; }   // le Bouclier du savoir bloque les coups
  if (attacker && attacker.strong > 0) amount *= 1.5;
  boss.hp -= amount; boss.flash = 0.15;
  if (attacker) attacker.dmgBoss += amount;
  fx.push({ k: 'hit', x: boss.x + rand(-30, 30), y: boss.y - 20, t: 0.25, d: 0.25 });
  bossCheck(attacker);
}

const sword = p => (1 + GEAR.epee.degats * p.gear.epee / 100) * (raceDe(p).degats || 1);   // l'épée multiplie les dégâts des attaques de base
function shoot(p, angle, a, bonus = 0) {
  projectiles.push({
    x: p.x + Math.cos(angle) * (R + 4), y: p.y + Math.sin(angle) * (R + 4),
    vx: Math.cos(angle) * a.speed, vy: Math.sin(angle) * a.speed,
    r: a.r, dmg: a.dmg + bonus, life: a.life, owner: p.id, cls: p.cls,
  });
}

function attack(p) {
  if (!p.alive || p.cdA > 0 || paused || p.busy || p.stun > 0) return;
  const a = CLASSES[p.cls].atk;
  p.cdA = a.cd; p.atkT = 0.25; p.protect = 0;   // attaquer met fin à la protection du retour en jeu
  p.revealed = 1;                       // attaquer révèle le joueur caché dans un buisson
  const fromShadow = p.stealth > 0;
  p.stealth = 0;
  if (a.type === 'proj') return shoot(p, p.angle, a, a.dmg * (sword(p) - 1));
  fx.push({ k: 'slash', x: p.x, y: p.y, a: p.angle, r: a.range + R, arc: a.arc, t: 0.18, d: 0.18 });
  const base = a.dmg * sword(p);
  if (boss && boss.hp > 0) {
    const dx = boss.x - p.x, dy = boss.y - p.y;
    if (Math.hypot(dx, dy) < a.range + R + boss.r && angDiff(Math.atan2(dy, dx), p.angle) < a.arc / 2 + 0.5) hitBoss(base * (fromShadow ? 1.5 : 1), p);
  }
  if (minions.length) hitMinions(m => Math.hypot(m.x - p.x, m.y - p.y) < a.range + R + SBIRE.r && angDiff(Math.atan2(m.y - p.y, m.x - p.x), p.angle) < a.arc / 2 + 0.4, base, p);
  for (const b of barrels) {
    const dx = b.x - p.x, dy = b.y - p.y;
    if (!b.t && Math.hypot(dx, dy) < a.range + R + BARREL.r && angDiff(Math.atan2(dy, dx), p.angle) < a.arc / 2 + 0.3) lightBarrel(b, p);
  }
  for (const o of players.values()) {
    if (!canHit(p, o)) continue;
    const dx = o.x - p.x, dy = o.y - p.y, dist = Math.hypot(dx, dy);
    if (dist > a.range + R * 2) continue;
    if (angDiff(Math.atan2(dy, dx), p.angle) > a.arc / 2 + 0.3) continue;
    let dmg = base, dos = false;
    // Voleur : dégâts doublés si la cible regarde dans la même direction que l'attaque (elle nous tourne le dos)
    if (a.backstab && angDiff(o.angle, Math.atan2(dy, dx)) < 1.2) {
      dmg *= a.backstab; dos = true;
      fx.push({ k: 'crit', x: o.x, y: o.y - 30, txt: 'Dans le dos !', t: 0.8, d: 0.8 });
    }
    if (fromShadow) dmg *= dos ? 1.25 : 1.5;   // ombre + dans le dos : ×2,5 au lieu de ×3
    damage(o, dmg, p);
  }
}

function power(p) {
  if (!p.alive || p.cdP > 0 || paused || p.busy || p.stun > 0) return;
  if (mode === 'zombie' && p.team === 1) return;   // les zombies n'ont pas de pouvoir
  const pw = CLASSES[p.cls].power;
  p.cdP = pw.cd * (raceDe(p).pouvoir || 1);
  if (p.cls === 'guerrier') {
    p.shield = pw.dur;
  } else if (p.cls === 'mage') {
    fx.push({ k: 'boom', x: p.x, y: p.y, r: pw.radius, t: 0.4, d: 0.4 });
    for (const o of players.values())
      if (canHit(p, o) && Math.hypot(o.x - p.x, o.y - p.y) < pw.radius + R) damage(o, pw.dmg, p);
    if (boss && Math.hypot(boss.x - p.x, boss.y - p.y) < pw.radius + boss.r) hitBoss(pw.dmg, p);
    if (minions.length) hitMinions(m => Math.hypot(m.x - p.x, m.y - p.y) < pw.radius + SBIRE.r, pw.dmg, p);
  } else if (p.cls === 'archer') {
    const a = CLASSES.archer.atk;
    for (let i = 0; i < pw.count; i++) shoot(p, p.angle - pw.spread / 2 + (pw.spread * i) / (pw.count - 1), { ...a, dmg: pw.dmg });
  } else if (p.cls === 'druide') {
    // Cercle de soin : le druide et ses alliés proches (coéquipiers, ou toute la classe contre le boss)
    fx.push({ k: 'cercle', x: p.x, y: p.y, r: pw.radius, t: 0.6, d: 0.6 });
    for (const o of players.values()) {
      if (!o.alive || Math.hypot(o.x - p.x, o.y - p.y) > pw.radius + R) continue;
      if (o !== p && !(coop() || (teamMode() && o.team === p.team))) continue;
      const avant = o.hp; o.hp = Math.min(o.maxHp, o.hp + pw.soin);
      if (o.hp > avant) fx.push({ k: 'heal', x: o.x, y: o.y, t: 0.9, d: 0.9 });
      if (o !== p && o.hp > avant) p.soins = (p.soins || 0) + Math.round(o.hp - avant);
    }
  } else if (p.cls === 'voleur') {
    // Ombre : invisible et plus rapide ; la prochaine attaque fait +50 %
    p.stealth = pw.dur;
    fx.push({ k: 'smoke', x: p.x, y: p.y, t: 0.5, d: 0.5 });
  }
}

// ---------- Super-pouvoir (R) : gagné avec 3 bonnes réponses de suite ----------
const SUPER = { guerrier: 'Tourbillon', voleur: 'Danse des lames', mage: 'Météore', archer: 'Tempête de flèches', druide: 'Forêt guérisseuse' };
function zone(p, x, y, r, dmg) {   // dégâts autour d'un point : joueurs ennemis, boss et sbires
  for (const o of players.values()) if (canHit(p, o) && Math.hypot(o.x - x, o.y - y) < r + R) damage(o, dmg, p);
  if (boss && boss.hp > 0 && Math.hypot(boss.x - x, boss.y - y) < r + boss.r) hitBoss(dmg, p);
  if (minions.length) hitMinions(m => Math.hypot(m.x - x, m.y - y) < r + SBIRE.r, dmg, p);
}
function superPower(p) {
  if (!p.superP || !p.alive || paused || p.busy || p.stun > 0 || (mode === 'zombie' && p.team === 1)) return;
  p.superP = false; p.protect = 0; p.revealed = 1;
  addFeed(`🌟 ${p.name} : ${SUPER[p.cls]} !`);
  if (p.cls === 'guerrier') {
    fx.push({ k: 'slash', x: p.x, y: p.y, a: 0, r: 120, arc: Math.PI * 2, t: 0.35, d: 0.35 });
    zone(p, p.x, p.y, 120, 40);
  } else if (p.cls === 'voleur') {
    for (let i = 0; i < 10; i++) shoot(p, p.angle + i / 10 * Math.PI * 2, { speed: 520, dmg: 18, r: 6, life: 0.7 });
    p.stealth = 2;
  } else if (p.cls === 'mage') {
    let d = 200; while (d > 0 && blocked(p.x + Math.cos(p.angle) * d, p.y + Math.sin(p.angle) * d, 4)) d -= 20;
    const x = p.x + Math.cos(p.angle) * d, y = p.y + Math.sin(p.angle) * d;
    fx.push({ k: 'boom', x, y, r: 160, t: 0.5, d: 0.5 }); fx.push({ k: 'boom', x, y, r: 90, t: 0.35, d: 0.35 });
    zone(p, x, y, 160, 55);
  } else if (p.cls === 'archer') {
    for (let i = 0; i < 16; i++) shoot(p, p.angle + i / 16 * Math.PI * 2, CLASSES.archer.atk, 6);
  } else if (p.cls === 'druide') {
    fx.push({ k: 'cercle', x: p.x, y: p.y, r: 260, t: 0.8, d: 0.8 });
    for (const o of players.values()) if (o.alive && (o === p || coop() || (teamMode() && o.team === p.team))) { o.hp = Math.min(o.maxHp, o.hp + 70); fx.push({ k: 'heal', x: o.x, y: o.y, t: 0.9, d: 0.9 }); }
    puddles.push({ x: Math.round(p.x), y: Math.round(p.y + 14), r: 150, t: 5, owner: p.id, team: p.team, racines: true });
  }
}

// ---------- Pouvoir du familier (E) ----------
function petPower(p) {
  const k = +p.look[5] || 0, pet = PETS[k];
  if (!pet || !p.alive || p.cdF > 0 || paused || p.busy) return;
  p.cdF = PET_CD;
  if (k === 1) {
    p.hp = Math.min(p.maxHp, p.hp + pet.soin);
    fx.push({ k: 'heal', x: p.x, y: p.y, t: 0.9, d: 0.9 });
  } else if (k === 2) {
    fx.push({ k: 'bark', x: p.x, y: p.y, r: pet.radius, t: 0.4, d: 0.4 });
    for (const o of players.values()) {
      if (!canHit(p, o)) continue;
      const dx = o.x - p.x, dy = o.y - p.y, d = Math.hypot(dx, dy);
      if (d > pet.radius + R || d < 1) continue;
      for (let s = pet.push; s > 0; s -= 10) { const nx = o.x + dx / d * s, ny = o.y + dy / d * s; if (!blocked(nx, ny, R)) { o.x = nx; o.y = ny; break; } }
    }
  } else if (k === 3) {
    projectiles.push({ x: p.x + Math.cos(p.angle) * (R + 4), y: p.y + Math.sin(p.angle) * (R + 4) - 20, vx: Math.cos(p.angle) * pet.atk.speed, vy: Math.sin(p.angle) * pet.atk.speed, r: pet.atk.r, dmg: pet.atk.dmg, life: pet.atk.life, owner: p.id, cls: 'pet' });
  } else if (k === 4) {
    fx.push({ k: 'owl', x: p.x, y: p.y, r: pet.radius, t: 0.6, d: 0.6 });
    for (const o of players.values()) if (o !== p && o.alive && Math.hypot(o.x - p.x, o.y - p.y) < pet.radius && (mode !== 'equipes' || o.team !== p.team)) { o.revealed = pet.dur; o.stealth = 0; o.hidden = false; }
  } else if (k === 5) {
    puddles.push({ x: Math.round(p.x), y: Math.round(p.y + 14), r: pet.r, t: pet.dur, owner: p.id, team: p.team });
  }
}
function updateTraps(dt) {
  smokes = smokes.filter(z => (z.t -= dt) > 0);
  traps = traps.filter(tr => {
    if ((tr.t -= dt) <= 0) return false;
    if ((tr.arm -= dt) > 0) return true;
    const owner = players.get(tr.owner);
    for (const o of players.values()) {
      if (!o.alive || o.id === tr.owner || (owner ? !canHit(owner, o) : coop()) || Math.hypot(o.x - tr.x, o.y - 14 - tr.y + 14) > 26) continue;
      o.stun = Math.max(o.stun || 0, 1.5); damage(o, 10, owner || null);
      fx.push({ k: 'piege', x: tr.x, y: tr.y, t: 0.5, d: 0.5 }); return false;
    }
    if (minions.length && owner) { const m = minions.find(m => Math.hypot(m.x - tr.x, m.y - tr.y) < 30); if (m) { hitMinions(x => x === m, 30, owner); fx.push({ k: 'piege', x: tr.x, y: tr.y, t: 0.5, d: 0.5 }); return false; } }
    return true;
  });
}
function updatePuddles(dt) {
  puddles = puddles.filter(z => (z.t -= dt) > 0);
  for (const o of players.values()) {
    if (o.slow > 0) o.slow -= dt;
    if (!o.alive) continue;
    for (const z of puddles) {
      const owner = players.get(z.owner);
      if (o.id === z.owner || (owner && !canHit(owner, o)) || (!owner && mode === 'boss' && !z.boss)) continue;   // encre du Kraken : touche tout le monde
      if (Math.hypot(o.x - z.x, (o.y - z.y) * 1.6) < z.r) o.slow = Math.max(o.slow, 1);   // ralenti tant qu'on y marche, et 1 s après
    }
  }
}

// ---------- Habileté de déplacement (Espace) ----------
function dash(p) {
  if (!p.alive || p.cdD > 0 || paused || p.busy || p.dash || p.stun > 0) return;
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
  if (p.cls === 'druide') puddles.push({ x: Math.round(p.x), y: Math.round(p.y + 14), r: d.racines, t: d.rdur, owner: p.id, team: p.team, racines: true });   // racines qui ralentissent
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

// ---------- Tonneaux explosifs ----------
function lightBarrel(b, by, fuse = 0.05) {
  if (b.t || b.fuse) return;
  b.fuse = fuse; b.by = by ? by.id : null;
}
function explode(b) {
  b.fuse = 0; b.t = BARREL.back;
  const by = players.get(b.by) || null;
  fx.push({ k: 'boom', x: b.x, y: b.y, r: BARREL.radius, t: 0.45, d: 0.45, c: 'feu' });
  for (const o of players.values()) {
    if (!o.alive || Math.hypot(o.x - b.x, o.y - b.y) > BARREL.radius + R) continue;
    if (o === by || (by && !canHit(by, o)) || coop()) continue;   // jamais soi-même, ni les coéquipiers, ni en mode boss
    damage(o, BARREL.dmg, by);
  }
  if (boss && boss.hp > 0 && Math.hypot(boss.x - b.x, boss.y - b.y) < BARREL.radius + boss.r) hitBoss(BARREL.dmg * 2, by);
  if (minions.length) hitMinions(m => Math.hypot(m.x - b.x, m.y - b.y) < BARREL.radius + SBIRE.r, BARREL.dmg * 2, by);
  // réaction en chaîne
  for (const o of barrels) if (o !== b && !o.t && Math.hypot(o.x - b.x, o.y - b.y) < BARREL.radius + 20) lightBarrel(o, by, 0.25);
}
function updateBarrels(dt) {
  for (const b of barrels) {
    if (b.fuse && (b.fuse -= dt) <= 0) explode(b);
    if (b.t && (b.t -= dt) <= 0) {
      // réapparaît seulement si personne n'est dessus
      if ([...players.values()].some(p => p.alive && Math.hypot(p.x - b.x, p.y - b.y) < BARREL.r + R + 4)) b.t = 1;
      else { b.t = 0; fx.push({ k: 'spawn', x: b.x, y: b.y, t: 0.5, d: 0.5 }); }
    }
  }
}
// ---------- Portails ----------
function updatePortals(dt) {
  for (const p of players.values()) {
    if (p.portalCd > 0) p.portalCd -= dt;
    if (!p.alive || p.busy || p.dash) continue;
    // on n'entre dans un portail qu'en y marchant (pas en restant sur celui d'arrivée)
    const near = carte.portals.flat().some(a => Math.hypot(p.x - a.x, p.y - a.y) < 44);
    if (!near) p.onPortal = false;
    if (p.onPortal || p.portalCd > 0) continue;
    for (const pair of carte.portals) for (let k = 0; k < 2; k++) {
      const a = pair[k], b = pair[1 - k];
      if (Math.hypot(p.x - a.x, p.y - a.y) > 26) continue;
      p.onPortal = true;
      fx.push({ k: 'tp', x: p.x, y: p.y, t: 0.4, d: 0.4 });
      p.x = b.x; p.y = b.y + 4; p.portalCd = 3; p.path = null;
      fx.push({ k: 'tp', x: p.x, y: p.y, t: 0.4, d: 0.4 });
      send(p.conn, { t: 'portail' });
      return;
    }
  }
}

// ---------- Coffres et objets cachés ----------
function updateLoot(dt) {
  for (const ch of chests) if (ch.open > 0) ch.open = Math.max(0, ch.open - dt);
  if (goldT > 0 && (goldT -= dt) <= 0) pickGold();
  // un objet caché réapparaît de temps en temps, jusqu'à 6 sur la carte
  if ((itemTimer -= dt) <= 0 && items.length < 6 && carte.spots.length) {
    itemTimer = 8;
    const free = carte.spots.filter(s => !items.some(it => it.x === s.x && it.y === s.y));
    if (free.length) { const s = pick(free); items.push({ x: s.x, y: s.y, k: pick(OBJETS_CACHES) }); }
  }
  for (const p of players.values()) {
    if (!p.alive || p.busy) continue;
    const it = items.find(it => Math.hypot(it.x - p.x, it.y - p.y) < 42);
    if (it) { items.splice(items.indexOf(it), 1); if (it.k !== 'equip' || !giveGear(p, 'cache')) giveItem(p, it.k === 'equip' ? 'potion' : it.k, 'cache'); }
    if (p.bot) continue;
    const i = chests.findIndex(ch => !ch.open && !ch.by && Math.hypot(ch.x - p.x, ch.y - p.y) < 50);
    if (i >= 0 && !eclair) {
      chests[i].by = p.id; p.busy = true; p.busyT = 25;
      askQuestion(p, 'chest', chests[i].gold ? { chest: i, gold: true, step: 1 } : { chest: i });
    }
  }
}
// Relever un coéquipier : rester 2 s près de son âme, puis répondre à une question à sa place
function updateAmes(dt) {
  ames = ames.filter(a => { const o = players.get(a.id); return o && !o.alive && (a.t -= dt) > 0; });
  for (const a of ames) {
    a.cd = Math.max(0, a.cd - dt);
    if (a.by || a.cd > 0 || eclair) continue;
    const r = [...players.values()].find(q => q.alive && !q.bot && !q.busy && q.id !== a.id && (coop() || q.team === a.team) && Math.hypot(q.x - a.x, q.y - a.y) < 60);
    if (!r) { a.prog = Math.max(0, a.prog - dt); continue; }
    if ((a.prog += dt) >= 2) { a.by = r.id; r.busy = true; r.busyT = 25; askQuestion(r, 'releve', { ame: a.id }); }
  }
}
function cancelChest(p) {
  if (!p.busy) return;
  const am = ames.find(a => a.by === p.id); if (am) { am.by = 0; am.prog = 0; }
  for (const r of runes) if (r.by === p.id) r.by = 0;
  const ch = chests[p.question ? p.question.chest : p.goldNext ? p.goldNext.chest : -1];
  if (ch) ch.by = 0;
  p.busy = false; p.question = null; p.goldNext = null;
  send(p.conn, { t: 'close' });
}

// ---------- Boss coopératif : les Boss du mois ----------
// Chaque Boss a deux attaques. À la moitié de sa vie, il s'enrage (plus rapide, attaques plus fréquentes) et appelle
// des sbires. À 75 % et 25 %, il lève le Bouclier du savoir : une question éclair pour toute la classe le brise.
// pv : les points de vie de la carte du Boss (système d'émulation), qui rendent le Boss plus ou moins coriace.
// A : attaque de près, B : attaque de loin. Types : cri, eventail, cercle, souffle, chute, onde, ombre, sablier, rayon, charge, tourbillon, encre.
const BOSSES = {
  gobelin:   { nom: 'Gobelin du Bruit', ico: '🥁', mois: 'Septembre', pv: 40, speed: 90, r: 50, sbire: 'gobelin',
    A: { t: 'cri', portee: 220, r: 230, dmg: 14, stun: 0.8, cd: 4 }, B: { t: 'eventail', portee: 700, n: 5, ecart: 1, vit: 320, dmg: 10, cls: 'note', cd: 1.6 } },
  dragon:    { nom: 'Dragon des Citrouilles', ico: '🎃', mois: 'Octobre', pv: 50, speed: 70, r: 60, sbire: 'citrouille',
    A: { t: 'souffle', portee: 270, r: 290, dmg: 20, cd: 3.5, fx: 'feu' }, B: { t: 'chute', portee: 800, n: 2, r: 90, dmg: 18, delai: 1.3, cd: 2.4, obj: 'citrouille' } },
  ombres:    { nom: 'Seigneur des Ombres', ico: '👻', mois: 'Novembre', pv: 50, speed: 80, r: 50, sbire: 'ombre',
    A: { t: 'ombre', portee: 900, r: 150, dmg: 16, cd: 6 }, B: { t: 'eventail', portee: 700, n: 3, ecart: 0.5, vit: 260, dmg: 12, cls: 'ombre', ralenti: 1.5, cd: 1.8 } },
  givre:     { nom: 'Dragon du Givre', ico: '❄️', mois: 'Décembre', pv: 60, speed: 70, r: 60, sbire: 'glace',
    A: { t: 'souffle', portee: 270, r: 290, dmg: 16, ralenti: 2, cd: 3.5, fx: 'glace' }, B: { t: 'cercle', portee: 600, n: 12, vit: 280, dmg: 10, cls: 'glace', ralenti: 1, cd: 2.6 } },
  cyclope:   { nom: 'Cyclope du Temps perdu', ico: '⏳', mois: 'Janvier', pv: 60, speed: 75, r: 55, sbire: 'sablier',
    A: { t: 'sablier', portee: 280, r: 300, dmg: 6, ralenti: 2.5, cd: 6 }, B: { t: 'rayon', portee: 750, long: 800, l: 34, dmg: 24, delai: 0.8, cd: 3 } },
  minotaure: { nom: 'Minotaure de la Discorde', ico: '🐂', mois: 'Février', pv: 70, speed: 85, r: 55, sbire: 'diablotin',
    A: { t: 'tourbillon', portee: 170, r: 175, dmg: 22, cd: 3 }, B: { t: 'charge', portee: 600, dist: 450, dmg: 26, cd: 5 } },
  kraken:    { nom: 'Kraken du Chaos', ico: '🐙', mois: 'Mars', pv: 80, speed: 65, r: 60, sbire: 'pieuvre',
    A: { t: 'encre', portee: 450, n: 3, r: 90, dur: 5, cd: 5 }, B: { t: 'chute', portee: 800, n: 3, r: 70, dmg: 16, delai: 1.1, cd: 2.2, obj: 'tentacule' } },
  golem:     { nom: 'Golem des Devoirs', ico: '📚', mois: 'Avril', pv: 90, speed: 60, r: 58, sbire: 'livre',
    A: { t: 'onde', portee: 190, r: 200, dmg: 24, stun: 0.5, cd: 3.5 }, B: { t: 'chute', portee: 800, n: 2, r: 100, dmg: 20, delai: 1.4, cd: 2.6, obj: 'livre' } },
  titan:     { nom: 'Titan du Bruit', ico: '💪', mois: 'Mai', pv: 100, speed: 75, r: 60, sbire: 'gobelin', bruit: true,
    A: { t: 'onde', portee: 220, r: 230, dmg: 24, stun: 1, cd: 4 }, B: { t: 'chute', portee: 800, n: 2, r: 100, dmg: 20, delai: 1.3, cd: 2.4, obj: 'rocher' } },
  empereur:  { nom: 'Empereur du Chaos', ico: '😈', mois: 'Juin', pv: 200, speed: 85, r: 60, sbire: 'chevalier', boucliers: [0.75, 0.5, 0.25],
    A: { t: 'tourbillon', portee: 190, r: 195, dmg: 26, cd: 3 }, B: { t: 'chute', portee: 850, n: 3, r: 80, dmg: 20, delai: 1, cd: 2.2, obj: 'eclair' } },
  gluant:    { nom: 'Roi Gluant', ico: '👑', mois: '', pv: 50, speed: 75, r: 56, sbire: 'slime',
    A: { t: 'onde', portee: 170, r: 180, dmg: 22, cd: 3.2 }, B: { t: 'eventail', portee: 750, n: 3, ecart: 0.5, vit: 300, dmg: 13, cls: 'boss', cd: 1.4 } },
};
const SBIRE = { hp: 40, dmg: 8, speed: 115, r: 18, max: 8 };
// un Boss par mois de l'année scolaire (juillet et août : Roi Gluant)
const bossDuMois = () => ['cyclope', 'minotaure', 'kraken', 'golem', 'titan', 'empereur', 'gluant', 'gluant', 'gobelin', 'dragon', 'ombres', 'givre'][new Date().getMonth()];
let bossKind = bossDuMois();
let minions = [], bombs = [], beams = [];
function spawnBoss() {
  const B = BOSSES[bossKind], n = Math.max(1, players.size);
  const spot = freeSpot();
  boss = { k: bossKind, nom: B.nom, ico: B.ico, x: carte.heal ? carte.heal.x + 220 : spot.x, y: carte.heal ? carte.heal.y : spot.y, r: B.r, hp: 0, max: 0,
    cdA: 3, cdB: 2, flash: 0, angle: 0, path: null, pathT: 0, phase: 1, shield: 0, shields: [...(B.boucliers || [0.75, 0.25])], cdSbire: 0, charge: null };
  if (blocked(boss.x, boss.y, 44)) Object.assign(boss, freeSpot());
  boss.max = boss.hp = Math.round((400 + 140 * n) * (0.8 + (B.pv - 40) / 200));
  minions = []; bombs = []; beams = [];
  addFeed(`${B.ico} ${B.nom} arrive ! Unissez vos forces !`);
}
function bossDefeated(by) {
  if (ended) return;
  addFeed(`🎉 ${boss.nom} est vaincu${by ? ' (coup final : ' + by.name + ')' : ''} !`);
  fx.push({ k: 'boom', x: boss.x, y: boss.y, r: 200, t: 0.8, d: 0.8 });
  minions = []; bombs = []; beams = [];
  endRound('boss-gagne');
}
// Après chaque coup : phase 2, Bouclier du savoir, victoire
function bossCheck(by) {
  if (!boss || ended) return;
  if (boss.hp <= 0) return bossDefeated(by);
  if (boss.phase === 1 && boss.hp <= boss.max / 2) {
    boss.phase = 2;
    addFeed(`😡 ${boss.nom} est enragé ! Attention aux sbires !`);
    summon(3 + Math.floor(players.size / 4));
  }
  if (boss.shields.length && !boss.shield && boss.hp <= boss.max * boss.shields[0]) {
    boss.shields.shift();
    boss.shield = Infinity;   // jusqu'à la fin de la question éclair
    addFeed('🛡️ Bouclier du savoir ! Répondez tous pour le briser !');
    startEclair(true);
    if (!eclair) boss.shield = 0;
  }
}
function shieldResult(nbOk, total) {
  if (!boss || !boss.shield) return;
  if (nbOk * 2 > total) {
    boss.shield = 0;
    const d = Math.round(boss.max * 0.08);
    boss.hp -= d; boss.flash = 0.3;
    fx.push({ k: 'boom', x: boss.x, y: boss.y, r: 140, t: 0.6, d: 0.6, gold: 1 });
    addFeed(`💥 Bouclier brisé par la classe ! (${nbOk}/${total}) −${d} PV`);
    bossCheck(null);
  } else {
    boss.shield = 8;   // le bouclier tient encore 8 secondes
    boss.hp = Math.min(boss.max, boss.hp + Math.round(boss.max * 0.05));
    addFeed(`🛡️ Le bouclier tient (${nbOk}/${total})… ${boss.nom} reprend des forces`);
  }
}
function summon(nb) {
  const B = boss;
  for (let i = 0; i < nb && minions.length < SBIRE.max; i++) {
    for (let t = 0; t < 30; t++) {
      const a = rand(0, Math.PI * 2), x = B.x + Math.cos(a) * rand(80, 160), y = B.y + Math.sin(a) * rand(60, 130);
      if (!blocked(x, y, SBIRE.r) && !WATER.has(tileAt(x, y + 20))) { minions.push({ x, y, hp: SBIRE.hp, cd: 1, flash: 0 }); fx.push({ k: 'spawn', x, y, t: 0.6, d: 0.6 }); break; }
    }
  }
}
// Frapper les sbires : test(m) dit si le sbire est touché
function hitMinions(test, dmg, attacker) {
  let n = 0;
  minions = minions.filter(m => {
    if (!test(m)) return true;
    n++;
    m.hp -= dmg * (attacker && attacker.strong > 0 ? 1.5 : 1); m.flash = 0.15;
    fx.push({ k: 'hit', x: m.x, y: m.y, t: 0.25, d: 0.25 });
    if (m.hp > 0) return true;
    fx.push({ k: 'death', x: m.x, y: m.y, t: 0.5, d: 0.5 });
    if (attacker) attacker.dmgBoss += 10;
    return false;
  });
  return n;
}
// Titan du Bruit : « plus c'est bruyant, plus je deviens fort » (+15 % de dégâts par joueur collé à lui)
function bossDmg(d) {
  if (!BOSSES[boss.k].bruit) return d;
  let n = 0;
  for (const p of players.values()) if (p.alive && Math.hypot(p.x - boss.x, p.y - boss.y) < 300) n++;
  return Math.round(d * (1 + 0.15 * Math.max(0, n - 1)));
}
const hurt = (p, d, a) => { damage(p, bossDmg(d), null); if (p.alive && p.protect <= 0) { if (a.stun) p.stun = a.stun; if (a.ralenti) p.slow = Math.max(p.slow || 0, a.ralenti); } };
const playersNear = (x, y, r) => [...players.values()].filter(p => p.alive && Math.hypot(p.x - x, p.y - y) < r + R);
function updateMinions(dt) {
  for (const m of minions) {
    m.cd -= dt; m.flash = Math.max(0, m.flash - dt);
    let best = null, bd = Infinity;
    for (const p of players.values()) { if (!p.alive || p.busy) continue; const d = Math.hypot(p.x - m.x, p.y - m.y); if (d < bd) { bd = d; best = p; } }
    if (!best) continue;
    m.a = Math.atan2(best.y - m.y, best.x - m.x);
    if (bd > R + SBIRE.r) {
      const sp = SBIRE.speed * dt, mx = Math.cos(m.a) * sp, my = Math.sin(m.a) * sp;
      if (!blocked(m.x + mx, m.y, SBIRE.r)) m.x += mx;
      if (!blocked(m.x, m.y + my, SBIRE.r)) m.y += my;
    }
    if (bd < R + SBIRE.r + 8 && m.cd <= 0) { m.cd = 1; damage(best, m.dmg || SBIRE.dmg, null); }
  }
  // objets qui tombent (citrouilles, livres, rochers, tentacules, éclairs) : un cercle rouge prévient
  bombs = bombs.filter(b => {
    if ((b.t -= dt) > 0) return true;
    fx.push({ k: 'boom', x: b.x, y: b.y, r: b.r, t: 0.45, d: 0.45, c: b.obj });
    for (const p of playersNear(b.x, b.y, b.r)) hurt(p, b.dmg, b);
    return false;
  });
  // rayon de l'œil du cyclope : une ligne fine prévient, puis le rayon frappe
  beams = beams.filter(b => {
    if ((b.t -= dt) > 0) return true;
    fx.push({ k: 'rayon', x: b.x, y: b.y, a: b.a, long: b.long, t: 0.35, d: 0.35 });
    const cx = Math.cos(b.a), cy = Math.sin(b.a);
    for (const p of players.values()) {
      if (!p.alive) continue;
      const dx = p.x - b.x, dy = p.y - b.y, u = dx * cx + dy * cy;
      if (u > 0 && u < b.long && Math.abs(dx * cy - dy * cx) < b.l + R) hurt(p, b.dmg, b);
    }
    return false;
  });
}
// Une attaque du Boss, décrite par son type (voir BOSSES)
function bossAttack(a, best, aim) {
  boss.anim = 0.5;
  const bx = Math.round(boss.x), by = Math.round(boss.y);
  const shots = (angles, cls) => { for (const an of angles) projectiles.push({ x: boss.x, y: boss.y - 20, vx: Math.cos(an) * a.vit, vy: Math.sin(an) * a.vit, r: 12, dmg: bossDmg(a.dmg), life: 2.4, owner: -1, cls, slow: a.ralenti || 0 }); };
  const cibles = n => [...players.values()].filter(p => p.alive && !p.busy && Math.hypot(p.x - boss.x, p.y - boss.y) < a.portee).sort(() => Math.random() - 0.5).slice(0, n);
  switch (a.t) {
    case 'cri': case 'onde': case 'sablier': case 'tourbillon':
      fx.push({ k: a.t === 'cri' ? 'cri' : a.t === 'sablier' ? 'sablier' : a.t === 'tourbillon' ? 'tourbillon' : 'slam', x: bx, y: by, r: a.r, t: 0.6, d: 0.6, b: boss.k });
      for (const p of playersNear(boss.x, boss.y, a.r)) hurt(p, a.dmg, a);
      break;
    case 'eventail': shots(Array.from({ length: a.n }, (_, i) => aim - a.ecart / 2 + a.ecart * i / (a.n - 1)), a.cls); break;
    case 'cercle': shots(Array.from({ length: a.n }, (_, i) => aim + i / a.n * Math.PI * 2), a.cls); break;
    case 'souffle':
      fx.push({ k: 'souffle', x: bx, y: by - 20, a: +aim.toFixed(2), r: a.r, t: 0.6, d: 0.6, c: a.fx });
      for (const p of playersNear(boss.x, boss.y, a.r)) if (angDiff(Math.atan2(p.y - boss.y, p.x - boss.x), aim) < 0.5) hurt(p, a.dmg, a);
      break;
    case 'chute':
      for (const p of cibles(boss.phase === 2 ? a.n + 1 : a.n)) {
        const x = Math.round(p.x + rand(-30, 30)), y = Math.round(p.y + rand(-30, 30));
        bombs.push({ x, y, t: a.delai, r: a.r, dmg: a.dmg, obj: a.obj });
        if (a.obj !== 'tentacule' && a.obj !== 'eclair') fx.push({ k: 'lob', x: bx, y: by - 30, x2: x, y2: y, t: a.delai, d: a.delai, c: a.obj });
        fx.push({ k: 'cible', x, y, r: a.r, t: a.delai, d: a.delai });
      }
      break;
    case 'ombre': {   // disparaît et réapparaît à côté d'un joueur, avec une explosion d'ombre
      const p = cibles(1)[0];
      if (!p) break;
      for (let i = 0; i < 20; i++) {
        const an = rand(0, Math.PI * 2), x = p.x + Math.cos(an) * 110, y = p.y + Math.sin(an) * 110;
        if (blocked(x, y, 40) || WATER.has(tileAt(x, y))) continue;
        fx.push({ k: 'smoke', x: bx, y: by, t: 0.5, d: 0.5 });
        boss.x = x; boss.y = y; boss.path = null;
        fx.push({ k: 'slam', x: Math.round(x), y: Math.round(y), r: a.r, t: 0.5, d: 0.5, b: 'ombres' });
        for (const q of playersNear(x, y, a.r)) hurt(q, a.dmg, a);
        break;
      }
      break;
    }
    case 'rayon':
      beams.push({ x: bx, y: by - 30, a: +aim.toFixed(2), long: a.long, l: a.l, dmg: a.dmg, t: a.delai });
      fx.push({ k: 'visee', x: bx, y: by - 30, a: +aim.toFixed(2), long: a.long, t: a.delai, d: a.delai });
      break;
    case 'charge':
      boss.charge = { a: aim, left: a.dist, hit: new Set(), dmg: a.dmg };
      fx.push({ k: 'crit', x: bx, y: by - 70, txt: '❗', t: 0.5, d: 0.5 });
      break;
    case 'encre':
      for (const p of cibles(a.n)) puddles.push({ x: Math.round(p.x), y: Math.round(p.y + 14), r: a.r, t: a.dur, owner: -1, team: -2, boss: true });
      fx.push({ k: 'slam', x: bx, y: by, r: 120, t: 0.4, d: 0.4, b: 'kraken' });
      break;
  }
}
function bossThink(dt) {
  if (!boss || boss.hp <= 0) return;
  const B = BOSSES[boss.k], cm = boss.phase === 2 ? 0.7 : 1;   // enragé : attaques plus fréquentes
  boss.cdA -= dt; boss.cdB -= dt; boss.flash = Math.max(0, boss.flash - dt); boss.pathT -= dt;
  boss.anim = Math.max(0, (boss.anim || 0) - dt); boss.moving = !!boss.charge;   // pour l'animation : attaque, marche
  if (boss.shield > 0 && boss.shield !== Infinity && (boss.shield -= dt) <= 0) { boss.shield = 0; addFeed('🛡️ Le bouclier disparaît !'); }
  if (boss.phase === 2 && (boss.cdSbire -= dt) <= 0) { boss.cdSbire = 18; summon(2); }
  updateMinions(dt);
  // charge du minotaure : fonce en ligne droite
  if (boss.charge) {
    const c = boss.charge, st = Math.min(c.left, 650 * dt), mx = Math.cos(c.a) * st, my = Math.sin(c.a) * st;
    if (blocked(boss.x + mx, boss.y + my, 30)) c.left = 0;
    else { boss.x += mx; boss.y += my; c.left -= st; }
    if (Math.random() < 0.5) fx.push({ k: 'dust', x: Math.round(boss.x), y: Math.round(boss.y + 30), t: 0.3, d: 0.3 });
    for (const p of playersNear(boss.x, boss.y, boss.r)) if (!c.hit.has(p.id)) { c.hit.add(p.id); hurt(p, c.dmg, {}); }
    if (c.left <= 0) boss.charge = null;
    return;
  }
  let best = null, bd = Infinity;
  for (const p of players.values()) {
    if (!p.alive || p.busy) continue;
    const d = Math.hypot(p.x - boss.x, p.y - boss.y);
    if (d < bd) { bd = d; best = p; }
  }
  if (!best) return;
  // se déplace vers le joueur le plus proche
  let tx = best.x, ty = best.y;
  if (!clearLine(boss.x, boss.y, tx, ty)) {
    if (boss.pathT <= 0) { boss.path = pathTo(boss.x, boss.y, tx, ty); boss.pathT = 0.6; }
    if (boss.path && boss.path.length) { while (boss.path.length > 1 && Math.hypot(boss.path[0].x - boss.x, boss.path[0].y - boss.y) < 30) boss.path.shift(); tx = boss.path[0].x; ty = boss.path[0].y; }
  }
  boss.angle = Math.atan2(ty - boss.y, tx - boss.x);
  if (bd > 90) {
    boss.moving = true;
    const sp = B.speed * (boss.phase === 2 ? 1.35 : 1) * dt, mx = Math.cos(boss.angle) * sp, my = Math.sin(boss.angle) * sp;
    if (!blocked(boss.x + mx, boss.y, 30)) boss.x += mx;
    if (!blocked(boss.x, boss.y + my, 30)) boss.y += my;
  }
  const aim = Math.atan2(best.y - boss.y, best.x - boss.x);
  if (bd < B.A.portee && boss.cdA <= 0) { boss.cdA = B.A.cd * cm; bossAttack(B.A, best, aim); }
  else if (bd < B.B.portee && boss.cdB <= 0) { boss.cdB = B.B.cd * cm; bossAttack(B.B, best, aim); }
}

// ---------- Roi de la colline ----------
// un endroit dégagé, pas trop près du bord (test : condition supplémentaire, abandonnée après 600 essais)
function openSpot(test) {
  for (let i = 0; i < 800; i++) {
    const x = rand(W * 0.18, W * 0.82), y = rand(H * 0.18, H * 0.82);
    if (blocked(x, y, 50) || WATER.has(tileAt(x, y)) || WATER.has(tileAt(x, y + 40)) || !walk[Math.floor(y / T) * carte.cols + Math.floor(x / T)]) continue;
    if (!test || test(x, y) || i > 600) return { x: Math.round(x), y: Math.round(y) };
  }
  return { x: Math.round(W / 2), y: Math.round(H / 2) };
}
function placeHill() {
  const old = hill;
  const s = openSpot(old ? (x, y) => Math.hypot(x - old.x, y - old.y) > Math.min(W, H) * 0.35 : null);
  hill = { x: s.x, y: s.y, t: HILL.move, owner: -1, pts: old ? old.pts : Array(nbTeams).fill(0) };
}
function updateHill(dt) {
  if (!hill) return;
  if ((hill.t -= dt) <= 0) { placeHill(); addFeed('⛰️ La colline se déplace !'); }
  const inside = [...players.values()].filter(p => p.alive && !p.busy && p.team >= 0 && Math.hypot(p.x - hill.x, p.y - hill.y) < HILL.r);
  const ts = new Set(inside.map(p => p.team));
  hill.owner = ts.size === 1 ? [...ts][0] : ts.size ? -2 : -1;   // -2 : contestée
  if (hill.owner < 0) return;
  hill.pts[hill.owner] += dt;
  for (const p of inside) p.obj += dt;
  if (hill.pts[hill.owner] >= HILL.win) endRound('colline');
}

// ---------- Capture du drapeau ----------
// base : la case libre la plus proche d'un point (gauche ou droite de la carte)
function baseSpot(tx, ty) {
  let best = null, bd = Infinity;
  for (let j = 1; j < carte.rows - 1; j++) for (let i = 1; i < carte.cols - 1; i++) {
    if (!walk[j * carte.cols + i]) continue;
    const x = (i + 0.5) * T, y = (j + 0.5) * T, d = Math.hypot(x - tx, y - ty);
    if (d < bd && !blocked(x, y, 40) && !WATER.has(tileAt(x, y + 40))) { bd = d; best = { x: Math.round(x), y: Math.round(y) }; }
  }
  return best || { x: Math.round(tx), y: Math.round(ty) };
}
function setupFlags() {
  flags = [W * 0.1, W * 0.9].map((tx, team) => { const s = baseSpot(tx, H / 2); return { team, hx: s.x, hy: s.y, x: s.x, y: s.y, carrier: 0, back: 0 }; });
  caps = [0, 0];
}
const flagHome = f => { f.x = f.hx; f.y = f.hy; f.carrier = 0; f.back = 0; };
function updateFlags(dt) {
  if (!flags) return;
  for (const f of flags) {
    const c = f.carrier && players.get(f.carrier);
    if (f.carrier && (!c || !c.alive)) {   // le porteur tombe : le drapeau reste par terre
      if (c) c.carry = null;
      f.carrier = 0; f.back = FLAG.back;
      addFeed(`🚩 Le drapeau des ${TEAMS[f.team].nom} est tombé !`);
    }
    if (f.carrier) {
      f.x = c.x; f.y = c.y;
      const mine = flags[c.team];
      if (mine && !mine.carrier && mine.x === mine.hx && mine.y === mine.hy && Math.hypot(c.x - mine.hx, c.y - mine.hy) < 70) {
        caps[c.team]++; c.obj += 3; c.carry = null;
        flagHome(f);
        addFeed(`🏁 ${c.name} capture le drapeau des ${TEAMS[f.team].nom} ! (${caps[c.team]}/${FLAG.caps})`);
        fx.push({ k: 'boom', x: mine.hx, y: mine.hy, r: 80, t: 0.6, d: 0.6, gold: 1 });
        if (caps[c.team] >= FLAG.caps) endRound('drapeau');
      }
      continue;
    }
    const home = f.x === f.hx && f.y === f.hy;
    if (!home && (f.back -= dt) <= 0) { flagHome(f); addFeed(`🚩 Le drapeau des ${TEAMS[f.team].nom} revient à sa base`); continue; }
    for (const p of players.values()) {
      if (!p.alive || p.busy || p.team < 0 || Math.hypot(p.x - f.x, p.y - f.y) > 40) continue;
      if (p.team === f.team) {
        if (!home) { flagHome(f); p.obj += 1; addFeed(`🛡️ ${p.name} ramène le drapeau des ${TEAMS[f.team].nom}`); break; }
      } else if (!p.carry) {
        f.carrier = p.id; p.carry = f; p.stealth = 0;
        addFeed(`🚩 ${p.name} prend le drapeau des ${TEAMS[f.team].nom} !`);
        break;
      }
    }
  }
}


// ---------- Course aux runes : toucher une rune ouvre une question ; bonne réponse = la rune pour l'équipe ----------
function placeRune() {
  for (let t = 0; t < 40; t++) { const s = freeSpot(); if (!runes.some(r => Math.hypot(r.x - s.x, r.y - s.y) < 300) || t > 30) { runes.push({ x: Math.round(s.x), y: Math.round(s.y), by: 0 }); return; } }
}
function setupRunes() { runes = []; runePts = Array(nbTeams).fill(0); runeT = 0; for (let i = 0; i < RUNES.max; i++) placeRune(); }
function updateRunes(dt) {
  if (runes.length < RUNES.max && (runeT -= dt) <= 0) { placeRune(); runeT = RUNES.respawn; }
  for (const p of players.values()) {
    p.runeCd = Math.max(0, (p.runeCd || 0) - dt);
    if (!p.alive || p.busy || p.team < 0 || p.runeCd > 0 || eclair) continue;
    const r = runes.find(r => !r.by && Math.hypot(r.x - p.x, r.y - p.y) < 44);
    if (!r) continue;
    r.by = p.id; p.busy = true; p.busyT = 25;
    askQuestion(p, 'rune', { rune: r });
  }
}

// ---------- Escorte du chariot : les Pousseurs l'amènent au bout du chemin, les Défenseurs le freinent ----------
function setupCart() {
  const a = baseSpot(W * 0.08, H / 2), b = baseSpot(W * 0.92, H / 2);
  const pts = [{ x: a.x, y: a.y }, ...(pathTo(a.x, a.y, b.x, b.y) || [b])];
  let total = 0; for (let i = 1; i < pts.length; i++) total += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  cart = { pts, i: 1, x: a.x, y: a.y, prog: 0, total: Math.max(1, total), energie: CART.energie, left: timer.dur ? Infinity : CART.duree, done: false, etat: 0 };
  sendAll({ t: 'route', pts: pts.map(p => [Math.round(p.x), Math.round(p.y)]) });
}
function cartAhead(d) {   // un point du chemin, d pixels devant le chariot
  let x = cart.x, y = cart.y, i = cart.i;
  while (i < cart.pts.length && d > 0) { const p = cart.pts[i], l = Math.hypot(p.x - x, p.y - y); if (l > d) { x += (p.x - x) * d / l; y += (p.y - y) * d / l; d = 0; } else { d -= l; x = p.x; y = p.y; i++; } }
  return { x, y };
}
function updateCart(dt) {
  if (!cart || cart.done) return;
  if ((cart.left -= dt) <= 0) return endRound('chariot-defense');
  let att = 0, def = 0;
  for (const p of players.values()) {
    if (!p.alive || p.team < 0 || Math.hypot(p.x - cart.x, p.y - cart.y) > CART.zone) continue;
    if (p.team === 0) att++; else def++;
    // près du chariot : une question toutes les 8 secondes (pousser ou freiner)
    p.cartQ = (p.cartQ ?? 2) - dt;
    if (!p.busy && !eclair && p.cartQ <= 0) { p.cartQ = CART.every; p.busy = true; p.busyT = 25; askQuestion(p, 'chariot'); }
  }
  cart.etat = att && att > def ? (cart.energie > 0 ? 1 : 3) : att ? 2 : 0;   // 1 avance, 2 bloqué par les défenseurs, 3 plus d'énergie
  if (cart.etat !== 1) return;
  let st = Math.min(cart.energie, CART.vitesse * dt);
  cart.energie -= st;
  while (st > 0 && cart.i < cart.pts.length) {
    const p = cart.pts[cart.i], l = Math.hypot(p.x - cart.x, p.y - cart.y);
    if (l > st) { cart.x += (p.x - cart.x) * st / l; cart.y += (p.y - cart.y) * st / l; cart.prog += st; st = 0; }
    else { cart.x = p.x; cart.y = p.y; cart.prog += l; st -= l; cart.i++; }
  }
  if (cart.i >= cart.pts.length) { cart.done = true; cart.prog = cart.total; endRound('chariot'); }
}

// ---------- Survie coopérative : des vagues de monstres de plus en plus fortes ----------
function setupSurvie() { surv = { vague: 0, repos: 6, kosT: 0 }; }
function spawnVague() {
  surv.vague++;
  const n = 3 + surv.vague * 2, hp = 40 + surv.vague * 10;
  for (let i = 0; i < n; i++) {
    const s = freeSpot();
    minions.push({ x: s.x, y: s.y, hp, max: hp, cd: 1.5, flash: 0, dmg: 6 + surv.vague });
    fx.push({ k: 'spawn', x: s.x, y: s.y, t: 0.6, d: 0.6 });
  }
  addFeed(`🌊 Vague ${surv.vague} sur ${SURVIE.vagues} : ${n} monstres !`);
}
function updateSurvie(dt) {
  if (!surv) return;
  updateMinions(dt);
  const ps = [...players.values()];
  surv.kosT = ps.length && ps.every(p => !p.alive) ? surv.kosT + dt : 0;
  if (surv.kosT > 4) return endRound('survie-perdu');
  if (surv.repos > 0) { if ((surv.repos -= dt) <= 0) spawnVague(); return; }
  if (minions.length) return;
  if (surv.vague >= SURVIE.vagues) return endRound('survie-gagne');
  surv.repos = SURVIE.repos;
  addFeed(`✅ Vague ${surv.vague} repoussée ! Question éclair : bonne réponse = bonus de force.`);
  startEclair();
}

// ---------- Contagion : les zombies transforment les humains, qui peuvent résister en répondant juste ----------
function setupZombie() {
  const ps = [...players.values()].sort(() => Math.random() - 0.5);
  ps.forEach(p => { p.team = 0; });
  ps.slice(0, Math.min(ps.length >= 8 ? 2 : 1, Math.max(0, ps.length - 1))).forEach(p => { p.team = 1; });
  zomb = { left: timer.dur ? Infinity : 240, t: 0 };
}
function zombieHit(target, attacker) {
  if (attacker.team === 1 && target.team === 0) {
    if (target.busy) return;
    target.busy = true; target.busyT = 25;
    askQuestion(target, 'zombie', { par: attacker.id });
    fx.push({ k: 'hit', x: target.x, y: target.y, t: 0.25, d: 0.25 });
  } else if (attacker.team === 0 && target.team === 1) {   // un humain repousse et étourdit un zombie
    target.stun = Math.max(target.stun || 0, 1.2);
    const a = Math.atan2(target.y - attacker.y, target.x - attacker.x);
    for (let k = 50; k > 0; k -= 10) { const nx = target.x + Math.cos(a) * k, ny = target.y + Math.sin(a) * k; if (!blocked(nx, ny, R)) { target.x = nx; target.y = ny; break; } }
    fx.push({ k: 'hit', x: target.x, y: target.y, t: 0.25, d: 0.25 });
  }
}
function updateZombie(dt) {
  if (!zomb) return;
  const ps = [...players.values()];
  if (ps.length < 2) return;
  if ((zomb.left -= dt) <= 0) return endRound('zombie-humains');
  if ((zomb.t += dt) >= 20) { zomb.t = 0; for (const p of ps) if (p.team === 0) p.obj++; }   // survivre rapporte des points
  if (!ps.some(p => p.team === 0)) return endRound('zombie');
  if (!ps.some(p => p.team === 1)) { const h = pick(ps); h.team = 1; addFeed(`🧟 ${h.name} devient un zombie !`); }
}
function addBot() {
  const used = new Set([...players.values()].map(q => q.name));
  const free = BOT_NAMES.filter(n => !used.has(n));
  return createPlayer(free.length ? pick(free) : 'Robot ' + nextId, pick(Object.keys(CLASSES)), true);
}
// Entraînement : au moins un robot par élève (minimum 3)
function ensureBots() {
  const ps = [...players.values()], h = ps.filter(p => !p.bot).length;
  for (let i = ps.filter(p => p.bot).length; i < Math.max(3, h); i++) addBot();
}

// ---------- Manche : modes, minuterie, résultats ----------
function endRound(why) {
  if (ended) return;
  const ps = [...players.values()];
  const top = (key, n = 3) => [...ps].sort((a, b) => b[key] - a[key] || b.good - a.good).slice(0, n).filter(p => p[key] > 0).map(p => ({ n: p.name, c: p.cls, l: p.look, v: Math.round(p[key]), team: p.team }));
  const cle = mode === 'boss' || mode === 'survie' ? 'dmgBoss' : ['colline', 'drapeau', 'runes', 'chariot', 'zombie'].includes(mode) ? 'obj' : 'kills';
  ended = { why, mode, boss: mode === 'boss' && boss ? { k: boss.k, nom: boss.nom } : null, top: top(cle), cerveaux: top('good') };
  if (teamMode()) ended.teams = teamScores().map((s, i) => ({ ...teamsNow()[i], ...s })).sort((a, b) => b.score - a.score);
  // titres des nouveaux modes (le gagnant d'abord)
  if (mode === 'runes') Object.assign(ended, { titre: '✨ Course aux runes terminée !', unite: 'rune', sous: 'Le plus de runes capturées' });
  if (mode === 'chariot' && cart) {
    const pc = Math.round(cart.prog / cart.total * 100), [att, def] = teamScores().map((s, i) => ({ ...teamsNow()[i], ...s }));
    ended.teams = cart.done ? [att, def] : [def, att];
    Object.assign(ended, { titre: cart.done ? '🛒 Le chariot est arrivé : les Pousseurs gagnent !' : `🛡️ Les Défenseurs gagnent : le chariot s'arrête à ${pc} % du chemin.`, unite: '% du chemin', sous: 'Les plus actifs autour du chariot' });
  }
  if (mode === 'survie' && surv) Object.assign(ended, { titre: why === 'survie-gagne' ? `🏆 Les ${SURVIE.vagues} vagues sont repoussées : victoire de toute la classe !` : why === 'survie-perdu' ? `💀 Les monstres l'emportent à la vague ${surv.vague}…` : `⏱ Temps écoulé : la classe a tenu ${Math.max(0, surv.vague - (minions.length ? 1 : 0))} vague(s).`, sous: 'Le plus de monstres vaincus' });
  if (mode === 'zombie') {
    const hum = ps.filter(p => p.team === 0).length;
    if (hum && ended.teams && ended.teams[0].nom !== 'Humains') ended.teams.reverse();
    Object.assign(ended, { titre: hum ? `🧄 ${hum} humain${hum > 1 ? 's ont' : ' a'} survécu : les Humains gagnent !` : '🧟 Les zombies ont contaminé tout le monde !', unite: 'joueur', sous: 'Survie et contagion' });
  }
  if (mode === 'entrainement') Object.assign(ended, { sous: 'Le plus de robots vaincus' });
  // badges de fin de manche
  for (const p of ps) {
    if (why === 'boss-gagne') badge(p, 'boss');
    if (why === 'survie-gagne') badge(p, 'vagues');
    if (mode === 'chariot' && cart && cart.done && p.team === 0) badge(p, 'chariot');
    if (mode === 'zombie' && p.team === 0) badge(p, 'survivant');
  }
  paused = true;
  for (const p of players.values()) cancelChest(p);
  sendAll({ t: 'fin', ...ended });
}
function teamScores() {
  const s = Array.from({ length: nbTeams }, () => ({ score: 0, good: 0, n: 0 }));
  for (const p of players.values()) if (p.team >= 0 && p.team < nbTeams) { s[p.team].score += p.kills; s[p.team].good += p.good; s[p.team].n++; }
  // colline : secondes passées seuls sur la colline ; drapeau : captures
  if (mode === 'colline' && hill) s.forEach((t, i) => { t.score = Math.floor(hill.pts[i] || 0); });
  if (mode === 'drapeau') s.forEach((t, i) => { t.score = caps[i] || 0; });
  if (mode === 'runes') s.forEach((t, i) => { t.score = runePts[i] || 0; });
  if (mode === 'zombie') s.forEach(t => { t.score = t.n; });
  if (mode === 'chariot' && cart) { const pc = Math.round(cart.prog / cart.total * 100); s[0].score = pc; s[1].score = cart.done ? 0 : 100 - pc; }
  return s;
}
function assignTeams() {
  const ps = [...players.values()].sort(() => Math.random() - 0.5);
  ps.forEach((p, i) => { p.team = teamMode() ? i % nbTeams : -1; p.carry = null; });
}
let regles = false;   // l'enseignant affiche les règles du mode sur tous les écrans (jeu en pause)
let countdown = 0;   // compte à rebours 3-2-1 au début d'une manche
function newRound() {
  partis.clear();
  roundT = 0; tempete = null;
  ended = null; paused = false; countdown = 3.5;
  if (eclair) { eclair = null; for (const c of conns) if (c.player) send(c, { t: 'close' }); }
  for (const q of players.values()) {
    q.kills = q.deaths = q.good = q.bad = q.streak = q.dmgBoss = q.obj = q.serieK = 0; q.carry = null; q.superP = false;
    q.fast = q.strong = q.shield = q.stealth = 0; q.pending = null;
    q.gear = { casque: 0, armure: 0, epee: 0, bottes: 0 };
    cancelChest(q);
    if (q.alive) respawn(q); else { q.alive = true; respawn(q); send(q.conn, { t: 'close' }); }
  }
  for (const k in stats) stats[k] = {};
  timer.left = timer.dur;
  boss = null; hill = null; flags = null; minions = []; bombs = []; beams = [];
  runes = []; cart = null; surv = null; zomb = null;
  if (mode === 'boss') spawnBoss();
  if (mode === 'colline') placeHill();
  if (mode === 'drapeau') setupFlags();
  if (mode === 'runes') setupRunes();
  if (mode === 'chariot') setupCart();
  if (mode === 'survie') setupSurvie();
  if (mode === 'zombie') setupZombie();
  if (mode === 'entrainement') ensureBots();
  if (flags || cart) for (const q of players.values()) Object.assign(q, freeSpot(q.team));
  chests.forEach(c => { c.open = 0; c.by = 0; });
  goldFrom = -1; pickGold();
  barrels.forEach(b => { b.t = 0; b.fuse = 0; });
  puddles = []; traps = []; smokes = []; ames = [];
  items = [];
  sendAll({ t: 'debut' });
  addFeed('🔄 Nouvelle manche !');
}

// ---------- Question éclair : la même question pour toute la classe ----------
function startEclair(bouclier = false) {
  if (eclair || ended) return;
  const Q = newQuestion({});
  eclair = { ...Q, left: eclairDur, answers: new Map(), ids: [], bouclier };
  for (const p of players.values()) {
    cancelChest(p);
    eclair.ids.push(p.id);
    p.question = null;
    if (p.bot) p.botT = rand(3, 12);
    else send(p.conn, questionMsg(Q, 'eclair', { temps: eclairDur, bouclier }));
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
    send(p.conn, { t: 'res', kind: 'eclair', ok, bonne: E.answer, explication: ok ? '' : expl(E.q), repondu: i >= 0 });
    if (!p.alive) { p.question = null; p.waitQ = 2.5; }
  }
  const res = { t: 'eclairRes', question: E.q.question, svg: E.q.svg || '', choix: E.order.map(i => E.q.choix[i]), counts, bonne: E.answer, nbOk, total: E.ids.length };
  for (const c of conns) if (c.role === 'prof') send(c, res);
  addFeed(`⚡ ${nbOk} bonne${nbOk > 1 ? 's' : ''} réponse${nbOk > 1 ? 's' : ''} sur ${E.ids.length}`);
  eclair = null;
  shieldResult(nbOk, E.ids.length);
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
  if (p.busy && p.question) {   // question de rune, de chariot ou de contagion
    p.input = { u: 0, d: 0, l: 0, r: 0 }; p.moveAngle = null;
    if ((p.botT -= dt) <= 0) answer(p, Math.random() < 0.7 ? p.question.answer : (p.question.answer + 1) % p.question.order.length);
    return;
  }
  // cible : le boss, ou l'adversaire le plus proche
  let best = null, bd = Infinity;
  if (mode === 'boss' && boss && boss.hp > 0) { best = boss; bd = Math.hypot(boss.x - p.x, boss.y - p.y) - boss.r + R; }
  else if (mode === 'survie') for (const m of minions) { const d = Math.hypot(m.x - p.x, m.y - p.y); if (d < bd) { bd = d; best = m; } }
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
  // colline et drapeau : aller vers l'objectif quand aucun ennemi n'est tout près
  const goal = botGoal(p);
  if (goal && (p.carry || !best || bd > (mode === 'colline' ? 150 : 240))) {
    if (Math.hypot(goal.x - p.x, goal.y - p.y) < (goal.r || 20)) { p.moveAngle = null; return; }
    p.moveAngle = p.angle = goTo(goal.x, goal.y);
    return;
  }
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
  if (p.cls === 'druide' && p.hp < p.maxHp * 0.5 && Math.random() < 0.05) power(p);   // le druide robot se soigne
  if (seen && bd < 260 && Math.random() < 0.006) petPower(p);
  // habileté : foncer (corps à corps) ou s'éloigner (à distance)
  if (seen && Math.random() < 0.02) {
    if (a.type === 'melee' && bd > 110 && bd < 260) { p.moveAngle = p.angle; dash(p); }
    else if (a.type === 'proj' && bd < 110) { p.moveAngle = p.angle + Math.PI; dash(p); }
  }
}

// ---------- Tempête : la zone de jeu rétrécit en fin de manche ----------
const tempeteMode = () => tempeteOn && (mode === 'libre' || mode === 'equipes');
function updateTempete(dt) {
  roundT += dt;
  if (!tempeteMode()) { tempete = null; return; }
  const s = timer.dur ? Math.min(TEMPETE.duree, timer.dur * 0.5) : TEMPETE.duree;
  const u = Math.min(1, timer.dur ? 1 - timer.left / s : (roundT - TEMPETE.debut) / s);
  if (u <= 0) { tempete = null; return; }
  if (!tempete) { tempete = { x: W / 2, y: H / 2, r: 0 }; addFeed('🌀 La tempête arrive : reste dans le cercle !'); }
  const r0 = Math.hypot(W, H) / 2, r1 = Math.min(W, H) * TEMPETE.rMin;
  tempete.r = r0 + (r1 - r0) * u;
  for (const p of players.values()) {
    if (!p.alive || p.busy || p.protect > 0 || Math.hypot(p.x - tempete.x, p.y - tempete.y) <= tempete.r) continue;
    p.hp -= TEMPETE.degats * dt;
    if (p.hp <= 0) { addFeed(`🌀 ${p.name} est emporté par la tempête`); kill(p, null); }
  }
}
function botGoal(p) {
  if (tempete && Math.hypot(p.x - tempete.x, p.y - tempete.y) > tempete.r * 0.75) return { x: tempete.x, y: tempete.y, r: 40 };
  if (mode === 'runes' && runes.length) { const r = runes.filter(r => !r.by).sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y))[0]; return r ? { x: r.x, y: r.y, r: 10 } : null; }
  if (mode === 'chariot' && cart) return { x: cart.x + Math.cos(p.id) * 60, y: cart.y + Math.sin(p.id) * 60, r: 30 };
  if (mode === 'colline' && hill) return { x: hill.x + Math.cos(p.id) * 50, y: hill.y + Math.sin(p.id) * 50, r: 30 };
  if (mode !== 'drapeau' || !flags || p.team < 0) return null;
  const mine = flags[p.team], theirs = flags[1 - p.team];
  if (p.carry) return { x: mine.hx, y: mine.hy };
  if (mine.carrier) { const c = players.get(mine.carrier); if (c) return c; }        // poursuivre le voleur
  if (mine.x !== mine.hx || mine.y !== mine.hy) return mine;                           // ramener notre drapeau
  if (p.id % 3 === 0) return { x: mine.hx + Math.cos(p.id) * 90, y: mine.hy + Math.sin(p.id) * 90, r: 40 };   // un robot sur trois défend
  return theirs.carrier ? players.get(theirs.carrier) || theirs : theirs;
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
  if (countdown > 0 && !paused && !eclair) countdown = Math.max(0, countdown - dt);
  const frozen = paused || !!eclair || countdown > 0;
  if (!frozen && timer.dur && !ended) { if (timer.left > 60 && timer.left - dt <= 60 && timer.dur > 90) addFeed('⏱ Plus qu\'une minute !'); timer.left -= dt; if (timer.left <= 0) { timer.left = 0; endRound(mode === 'boss' ? 'boss-perdu' : 'temps'); } }

  for (const p of players.values()) {
    if (frozen) continue;
    if (p.bot) botThink(p, dt);
    if (!p.alive) {
      if (p.waitQ > 0 && (p.waitQ -= dt) <= 0) askQuestion(p, 'respawn');
      continue;
    }
    if (p.pending) { giveItem(p, p.pending, 'serie'); p.pending = null; }
    p.cdA = Math.max(0, p.cdA - dt); p.cdP = Math.max(0, p.cdP - dt); p.cdD = Math.max(0, p.cdD - dt); p.cdF = Math.max(0, p.cdF - dt);
    p.shield = Math.max(0, p.shield - dt); p.protect = Math.max(0, p.protect - dt);
    p.stealth = Math.max(0, p.stealth - dt); p.revealed = Math.max(0, p.revealed - dt);
    p.fast = Math.max(0, p.fast - dt); p.strong = Math.max(0, p.strong - dt); p.stun = Math.max(0, (p.stun || 0) - dt); p.atkT = Math.max(0, (p.atkT || 0) - dt);
    p.hidden = p.revealed <= 0 && (inBush(p) || smokes.some(z => Math.hypot(z.x - p.x, z.y - p.y) < z.r));
    if (p.busy) {
      if (p.goldNext && (p.goldNext.t -= dt) <= 0) { const g = p.goldNext; p.goldNext = null; askQuestion(p, 'chest', { chest: g.chest, gold: true, step: 2, nOk: g.nOk }); }
      if ((p.busyT -= dt) <= 0) cancelChest(p);
      continue;
    }
    const hl = carte.heal;
    if (hl && Math.hypot(p.x - hl.x, p.y - hl.y) < hl.r) p.hp = Math.min(p.maxHp, p.hp + hl.heal * dt);
    if (p.dash) { dashStep(p, dt); continue; }
    if (p.gele > 0) { p.gele -= dt; if (p.gele <= 0) send(p.conn, { t: 'gele', s: 0 }); continue; }   // pause de comportement
    if (p.stun > 0) continue;   // étourdi par le cri du Gobelin du Bruit
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
    if (mode === 'zombie' && p.team === 1) sp *= 1.1;
    if (p.fast > 0) sp *= 1.35;
    if (p.slow > 0) sp *= 0.5;
    if (p.carry) sp *= FLAG.slow;
    sp *= 1 + GEAR.bottes.vitesse * p.gear.bottes / 100;
    sp *= raceDe(p).vitesse || 1;
    const bx = blocked(p.x + mx * sp, p.y, R), by = blocked(p.x, p.y + my * sp, R);
    if (!bx) p.x += mx * sp;
    if (!by) p.y += my * sp;
    if (p.bot && p.moveAngle != null && bx && by) { p.moveAngle += Math.PI / 2 * (Math.random() < 0.5 ? 1 : -1); p.stuckT = 0.4; p.path = null; }
  }

  if (!frozen) {
    bossThink(dt);
    updateLoot(dt);
    updateBarrels(dt);
    updatePortals(dt);
    updatePuddles(dt); updateTraps(dt); updateAmes(dt);
    updateHill(dt);
    updateFlags(dt);
    if (mode === 'runes') updateRunes(dt);
    if (mode === 'chariot') updateCart(dt);
    if (mode === 'survie') updateSurvie(dt);
    if (mode === 'zombie') updateZombie(dt);
    if (!ended) updateTempete(dt);
    projectiles = projectiles.filter(b => {
      b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
      if (b.life <= 0 || blockedShot(b.x, b.y, b.r)) return false;
      const owner = players.get(b.owner) || null;
      const bar = b.owner !== -1 && barrels.find(o => !o.t && Math.hypot(o.x - b.x, o.y - b.y) < BARREL.r + b.r);
      if (bar) { lightBarrel(bar, owner); return false; }
      if (b.owner !== -1 && boss && boss.hp > 0 && Math.hypot(boss.x - b.x, boss.y - 20 - b.y) < boss.r + b.r) { hitBoss(b.dmg, owner); return false; }
      if (b.owner !== -1 && minions.length && hitMinions(m => Math.hypot(m.x - b.x, m.y - b.y) < SBIRE.r + b.r + 6, b.dmg, owner)) return false;
      for (const o of players.values()) {
        if (o.id === b.owner || !o.alive) continue;
        if (b.owner === -1 ? false : !canHit(owner, o)) continue;
        if (Math.hypot(o.x - b.x, o.y - b.y) < R + b.r) {
          damage(o, b.dmg, owner);
          if (b.slow && o.alive && o.protect <= 0) o.slow = Math.max(o.slow || 0, b.slow);
          return false;
        }
      }
      return true;
    });
  }
  fx = fx.filter(f => (f.t -= dt) > 0);
  feed = feed.filter(f => (f.t -= dt) > 0);
  bulles = bulles.filter(b => (b.t -= dt) > 0);

  if (solo || (tickCount = (tickCount + 1) % 2) === 0) broadcast();   // à la maison, le monde avance à 15 pas/s : un envoi à chaque pas   // 15 envois/s : assez fluide, moins lourd pour le Wi-Fi
}

function publicState() {
  const lead = coop() || mode === 'zombie' ? 0 : leaderId();
  return JSON.stringify({
    // joueurs en tableaux compacts (décodés par unpackWorld dans draw.js) pour alléger le Wi-Fi
    p: [...players.values()].map(p => [
      p.id, p.name, p.cls, p.look, Math.round(p.x), Math.round(p.y), +p.angle.toFixed(2), Math.max(0, Math.round(p.hp)), p.maxHp, p.kills,
      (p.alive ? 1 : 0) | (p.shield > 0 ? 2 : 0) | (p.protect > 0 ? 4 : 0) | (p.hidden ? 8 : 0) | (p.stealth > 0 ? 16 : 0) | (p.strong > 0 ? 32 : 0) | (p.fast > 0 ? 64 : 0) | (p.busy ? 128 : 0) | (p.dash ? 256 : 0) | (p.id === lead ? 512 : 0) | (p.slow > 0 ? 1024 : 0) | (p.stun > 0 ? 2048 : 0) | (p.atkT > 0 ? 4096 : 0),
      p.team, gearCode(p),
    ]),
    b: projectiles.map(b => [Math.round(b.x), Math.round(b.y), b.cls, +Math.atan2(b.vy, b.vx).toFixed(2)]),
    fx: fx.map(f => { const o = {}; for (const k in f) o[k] = typeof f[k] === 'number' ? Math.round(f[k] * 100) / 100 : f[k]; return o; }),
    ch: chests.map(c => (c.open > 0 ? 1 : 0)).join(''),
    tb: barrels.map(b => (b.t ? 0 : b.fuse ? 2 : 1)).join(''),
    pz: puddles.map(z => [z.x, z.y, z.r, +z.t.toFixed(1), z.boss ? 1 : z.racines ? 2 : 0]),
    it: items.map(it => [it.x, it.y, it.k]),
    ru: runes.map(r => [r.x, r.y]),
    ca: cart ? [Math.round(cart.x), Math.round(cart.y), Math.round(cart.prog / cart.total * 100), Math.round(cart.energie), cart.etat] : 0,
    sv: surv ? [surv.vague, Math.ceil(Math.max(0, surv.repos)), minions.length] : 0, mk: surv ? VAGUE_SBIRES[Math.max(0, surv.vague - 1) % 8] : 0,
    tn: mode === 'zombie' || mode === 'chariot' ? teamsNow().map(t => t.nom) : 0,
    am: ames.map(a => [a.x, a.y, a.team, Math.min(1, a.prog / 2).toFixed(2) * 1, a.id]),
    tr: traps.map(tr => [tr.x, tr.y, tr.owner, tr.arm > 0 ? 1 : 0]), sm: smokes.map(z => [z.x, z.y, z.r, +z.t.toFixed(1)]),
    boss: boss && boss.hp > 0 ? [Math.round(boss.x), Math.round(boss.y), Math.round(boss.hp), boss.max, +boss.angle.toFixed(1), boss.flash > 0 ? 1 : 0, boss.k, boss.shield ? 1 : 0, boss.phase, (boss.anim > 0 ? 1 : 0) | (boss.moving ? 2 : 0)] : 0,
    mn: minions.map(m => [Math.round(m.x), Math.round(m.y), Math.round(m.hp / (m.max || SBIRE.hp) * 100), m.flash > 0 ? 1 : 0, +(m.a || 0).toFixed(1)]),
    tm: timer.dur ? Math.ceil(timer.left) : cart && isFinite(cart.left) ? Math.ceil(cart.left) : zomb && isFinite(zomb.left) ? Math.ceil(zomb.left) : -1,
    mode, te: teamMode() ? teamScores().map(s => s.score) : 0,
    hl: hill ? [hill.x, hill.y, HILL.r, hill.owner, Math.ceil(hill.t)] : 0,
    zt: tempete ? [tempete.x, tempete.y, Math.round(tempete.r)] : 0,
    bu: bulles.map(b => [b.id, b.i]),
    fl: flags ? flags.map(f => [Math.round(f.x), Math.round(f.y), f.carrier ? 1 : 0, f.hx, f.hy]) : 0,
    gc: chests.findIndex(c => c.gold),
    pm: lead && players.get(lead) ? prime(players.get(lead)) : 0,
    feed: feed.map(f => f.text), paused, rg: regles ? 1 : 0, ec: eclair ? Math.ceil(eclair.left) : 0, cd: Math.ceil(countdown - 0.5),
  });
}

function broadcast() {
  const common = publicState();
  for (const c of conns) {
    if (c.role === 'prof') c.etat(`{"t":"s","w":${common}}`);
    else if (c.player) {
      const p = c.player;
      const me = { id: p.id, cdA: +p.cdA.toFixed(2), cdP: +p.cdP.toFixed(2), cdD: +p.cdD.toFixed(2), cdF: +p.cdF.toFixed(2), pet: +p.look[5] || 0, alive: p.alive, kills: p.kills, deaths: p.deaths, good: p.good, fa: Math.ceil(p.fast), st: Math.ceil(p.strong), bo: Math.ceil(p.shield), om: Math.ceil(p.stealth), sk: p.streak, su: !!p.superP, team: p.team, ar: armorOf(p), ge: p.gear };
      c.etat(`{"t":"s","me":${JSON.stringify(me)},"w":${common}}`);
    }
  }
}


const infoT = setInterval(() => {
  if (solo) return;
  const info = JSON.stringify({
    t: 'info', subjects: NOTIONS.map(n => ({ ...n, on: subjects.has(n.s) })),
    stats, urls: lanAddresses(), paused,
    carte: carte.id, cartes: CARTES.map(c => ({ id: c.id, nom: c.nom, desc: c.desc })),
    eclairDur, tempete: tempeteOn, mode, modes: MODES, nbTeams, teams: teamsNow(), timer: timer.dur, te: teamMode() ? teamScores().map(s => s.score) : null,
    bossKind, bosses: Object.fromEntries(Object.entries(BOSSES).map(([k, b]) => [k, (b.mois ? b.mois + ' : ' : '') + b.nom])),
    eclair: eclair ? { left: Math.ceil(eclair.left), n: eclair.answers.size, total: eclair.ids.length, question: eclair.q.question } : null,
    players: [...players.values()].map(p => ({ id: p.id, n: p.name, c: p.cls, l: p.look, k: p.kills, d: p.deaths, g: p.good, b: p.bad, bot: p.bot, team: p.team, dm: Math.round(p.dmgBoss), nv: niveaux[p.name] || 'n', bg: p.bot ? [] : badgesDe(p), ge: p.gele > 0 ? 1 : 0, cd: p.code ? 1 : 0 })), ouvert: ouvertTous,
  });
  for (const c of conns) if (c.role === 'prof') c.send(info);
}, 1000);

const welcome = () => ({ t: 'welcome', map: carte, classes: CLASSES, races: RACES, teams: TEAMS, items: ITEMS, gear: GEAR, pets: PETS, petCd: PET_CD });
setCarte(CARTES[0]);
const stepT = setInterval(step, solo ? TICK * 2 : TICK);   // une partie à la maison coûte deux fois moins au serveur

// ---------- Messages ----------
function onMessage(conn, msg) {
  let m;
  try { m = JSON.parse(msg); } catch { return; }
  const p = conn.player;
  switch (m.t) {
    case 'join':
      if (p) return;
    {
      const code = typeof m.code === 'string' ? m.code.trim().toUpperCase() : '';
      let rec = code && CODES.get(code);
      // serveur réveillé qui a oublié les codes : on reprend la fiche gardée par l'appareil de l'élève
      if (code && !rec && m.fiche && String(m.fiche.code).toUpperCase() === code && FORMAT_CODE.test(code)) { rec = ficheCode(m.fiche); CODES.set(code, rec); }
      if (code && !rec) { send(conn, { t: 'codeFaux' }); return; }
      conn.player = createPlayer(rec ? rec.nom : m.name, m.cls, false, String(m.look || ''));
      conn.player.conn = conn;
      if (rec) conn.player.code = rec.code;
      const ancien = partis.get(conn.player.name);
      if (ancien && Date.now() - ancien.t < 120000 && ancien.cls === conn.player.cls) {   // retour après une coupure
        const { t, cls, team, ...garde } = ancien;
        Object.assign(conn.player, garde);
        if (teamMode() && team >= 0 && team < nbTeams && team !== conn.player.team) Object.assign(conn.player, { team }, freeSpot(team));
        partis.delete(conn.player.name);
      }
      send(conn, { ...welcome(), id: conn.player.id, nom: conn.player.name });
      if (rec) send(conn, { t: 'compte', nom: rec.nom, or: rec.or, achats: rec.achats, badges: rec.badges, rec });
      // réglages de l'enseignant : l'appareil en garde une copie ; à la maison, la copie sert si le serveur s'est endormi depuis
      const cp = m.reglages;
      if (solo && !(opts.depuis && opts.depuis.v) && cp && typeof cp === 'object' && +cp.v > 0) {
        setPerso(cp.perso);
        const ok = (Array.isArray(cp.subjects) ? cp.subjects : []).filter(s => NOTIONS.some(n => n.s === s));
        if (ok.length) { subjects.clear(); for (const s of ok) subjects.add(s); }
        ouvertTous = !!cp.ouvert; reglagesV = +cp.v;
      }
      if (reglagesV) send(conn, { t: 'reglages', r: reglagesEleve() });
      if (solo) {   // à la maison : sa révision ciblée revient (séance de classe et pratiques précédentes), et des robots
        const q = conn.player, mem = memoire[q.name] || (memoire[q.name] = {});
        const depuis = opts.depuis && opts.depuis.memoire[q.name];
        for (const src of [depuis, rec && rec.maison && rec.maison.notions]) if (src) for (const [n, v] of Object.entries(src)) { const d = mem[n] || (mem[n] = { ok: 0, ko: 0 }); d.ok += v.ok; d.ko += v.ko; }
        q.debut = Date.now();
        ensureBots();
      }
    }
      if (ended) send(conn, { t: 'fin', ...ended });
      if (cart) send(conn, { t: 'route', pts: cart.pts.map(p => [Math.round(p.x), Math.round(p.y)]) });
      break;
    case 'in':
      if (p) { p.input = { u: +!!m.u, d: +!!m.d, l: +!!m.l, r: +!!m.r }; if (typeof m.a === 'number') p.angle = m.a; }
      break;
    case 'atk': if (p && !(p.gele > 0)) attack(p); break;
    case 'dash': if (p && !(p.gele > 0)) dash(p); break;
    case 'pow': if (p && !(p.gele > 0)) power(p); break;
    case 'super': if (p && !(p.gele > 0)) superPower(p); break;
    case 'pet': if (p && !(p.gele > 0)) petPower(p); break;
    case 'ans': if (p && Number.isInteger(m.i)) answer(p, m.i, typeof m.txt === 'string' ? m.txt.slice(0, 30) : undefined); break;
    case 'look': if (p && cleanLook(m.look)) {
      p.look = cleanLook(m.look);
      p.maxHp = CLASSES[p.cls].hp + (raceDe(p).pv || 0); p.hp = Math.min(p.hp, p.maxHp);
    } break;
    case 'achat': {   // achat à la boutique : l'or est retiré du compte de l'élève (s'il a un code)
      const rec = codeDe(p), prix = Math.max(0, Math.round(+m.prix || 0)), it = String(m.it || '').slice(0, 12);
      if (rec && rec.or >= prix && it && !rec.achats.includes(it)) { rec.or -= prix; rec.achats.push(it); majCode(rec); }
      break;
    }
    case 'msg': {   // message rapide aux coéquipiers
      if (!p || !p.alive || !Number.isInteger(m.i) || !MSGS[m.i] || (p.msgT || 0) > Date.now()) break;
      p.msgT = Date.now() + 2500;
      bulles = bulles.filter(b => b.id !== p.id); bulles.push({ id: p.id, i: m.i, t: 3 });
      for (const q of players.values()) if (q !== p && q.conn && (coop() || (teamMode() && q.team === p.team))) send(q.conn, { t: 'msg', de: p.name, txt: MSGS[m.i] });
      break;
    }
    case 'prof':
      if (solo) return;
      conn.role = 'prof';
      send(conn, welcome());
      if (ended) send(conn, { t: 'fin', ...ended });
      if (cart) send(conn, { t: 'route', pts: cart.pts.map(p => [Math.round(p.x), Math.round(p.y)]) });
      break;
  }
  if (conn.role !== 'prof') return;
  switch (m.t) {
    case 'subject': m.on ? subjects.add(m.s) : subjects.delete(m.s); reglagesV = Date.now(); break;
    case 'subjects':   // notions gardées dans le navigateur de l'enseignant, renvoyées à l'ouverture du tableau de bord
      if (Array.isArray(m.list)) { const ok = m.list.filter(s => NOTIONS.some(n => n.s === s)); if (ok.length) { subjects.clear(); for (const s of ok) subjects.add(s); reglagesV = Date.now(); } }
      break;
    case 'perso': setPerso(m.qs); reglagesV = Date.now(); break;
    case 'codes':   // liste des codes (au chargement du tableau de bord) : on garde la version la plus récente de chaque fiche
      if (Array.isArray(m.list)) for (const r of m.list.slice(0, 60)) {
        if (!r || typeof r.code !== 'string' || typeof r.nom !== 'string') continue;
        const f = ficheCode(r), old = CODES.get(f.code);
        if (old && (old.v || 0) > f.v) { send(conn, { t: 'codeMaj', rec: old }); continue; }
        CODES.set(f.code, f);
      }
      if (m.remplace) for (const c of [...CODES.keys()]) if (!m.list.some(r => r && String(r.code).toUpperCase() === c)) CODES.delete(c);
      break;
    case 'comportement': {   // ⭐ donner de l'or, 🪙 en retirer, ❄️ pause de 30 s
      const q = players.get(m.id);
      if (!q || q.bot) break;
      if (m.k === 'bravo') { gainOr(q, 5); send(q.conn, { t: 'bravo' }); addFeed(`⭐ ${q.name} reçoit 5 pièces pour sa belle attitude !`); }
      else if (m.k === 'moins') { gainOr(q, -5); send(q.conn, { t: 'moins' }); }
      else if (m.k === 'gele') { q.gele = q.gele > 0 ? 0 : 30; q.input = { u: 0, d: 0, l: 0, r: 0 }; send(q.conn, { t: 'gele', s: q.gele }); }
      break;
    }
    case 'niveaux': if (m.v && typeof m.v === 'object') for (const [n, v] of Object.entries(m.v)) if (['f', 'n', 'd'].includes(v)) niveaux[String(n).slice(0, 20)] = v; if (typeof m.ouvert === 'boolean') ouvertTous = m.ouvert; break;
    case 'pause': if (!ended) { paused = !paused; regles = false; addFeed(paused ? '⏸ Partie en pause' : '▶ La partie reprend !'); } break;
    case 'tempete': tempeteOn = !!m.v; if (!tempeteOn) tempete = null; break;
    case 'regles': if (!ended) { regles = !regles; paused = regles; } break;
    case 'addbot': addBot(); break;
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
      if (hill) { const pts = hill.pts; hill = null; placeHill(); hill.pts = pts; }
      if (flags) { const c = caps; for (const q of players.values()) q.carry = null; setupFlags(); caps = c; for (const q of players.values()) if (q.alive) Object.assign(q, freeSpot(q.team)); }
      sendAll({ t: 'carte', map: carte });
      addFeed(`🗺️ Nouvelle carte : ${carte.nom}`);
      break;
    }
    case 'mode':
      if (!MODES[m.mode]) break;
      mode = m.mode;
      if (m.nb >= 2 && m.nb <= 4) nbTeams = m.nb;
      if (mode === 'drapeau' || mode === 'chariot' || mode === 'zombie') nbTeams = 2;
      assignTeams();
      newRound();
      addFeed(`🎮 Mode : ${MODES[mode]}${mode === 'equipes' || mode === 'colline' ? ' (' + nbTeams + ' équipes)' : ''}`);
      break;
    case 'timer':
      timer.dur = [0, 3, 5, 10, 15, 20].includes(m.min) ? m.min * 60 : 0;
      timer.left = timer.dur;
      break;
    case 'finir': endRound(mode === 'boss' ? 'boss-perdu' : 'temps'); break;
    case 'eclair': startEclair(); break;
    case 'eclairdur': if ([10, 20, 30, 45].includes(m.s)) eclairDur = m.s; break;
    case 'boss':
      if (!BOSSES[m.k]) break;
      bossKind = m.k;
      if (mode === 'boss') newRound();
      break;
    case 'bilans': send(conn, { t: 'bilans', memoire, or: orSeance, notions: NOTIONS, silent: !!m.silent }); break;
  }
}

function onClose(conn) {
  conns.delete(conn);
  const q = conn.player;
  if (!solo && q && !q.bot) {
    partis.set(q.name, { t: Date.now(), cls: q.cls, team: q.team, gear: q.gear, ...Object.fromEntries(['kills', 'deaths', 'good', 'bad', 'streak', 'dmgBoss', 'obj'].map(k => [k, q[k]])) });
    for (const [n, a] of partis) if (Date.now() - a.t > 120000) partis.delete(n);
  }
  const fiche = solo && conn.player && codeDe(conn.player);
  if (fiche && fiche.maison && conn.player.debut) { fiche.maison.min += Math.round((Date.now() - conn.player.debut) / 60000); majCode(fiche); }
  if (conn.player) { cancelChest(conn.player); players.delete(conn.player.id); addFeed(`${conn.player.name} a quitté l'arène`); }
}

if (solo) {   // à la maison : entraînement contre des robots, avec les notions et les questions choisies par l'enseignant
  mode = 'entrainement';
  const r = opts.depuis;
  if (r) { setPerso(r.perso); subjects.clear(); for (const n of r.subjects) subjects.add(n); Object.assign(niveaux, r.niveaux); ouvertTous = r.ouvert; reglagesV = r.v; }
}
return {
  conns, onMessage, onClose,
  arreter() { clearInterval(infoT); clearInterval(stepT); },
  reglages: () => ({ perso: PERSO_BRUT, subjects: [...subjects], niveaux: { ...niveaux }, ouvert: ouvertTous, memoire, v: reglagesV }),
};
}   // fin de creerMonde

const classe = creerMonde();
MONDES.add(classe);
const MAX_MAISON = +process.env.MAX_MAISON || 15;   // parties à la maison en même temps (le serveur gratuit a peu de mémoire)

// ---------- Serveur HTTP + WebSocket minimal ----------
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png' };
const server = http.createServer((req, res) => {
  let file = decodeURIComponent(req.url.split('?')[0]);
  if (file === '/') file = '/index.html';
  if (file === '/prof') file = '/prof.html';
  if (file === '/guide') file = '/guide.html';
  if (file === '/ping') { res.writeHead(200, { 'Content-Type': 'text/plain' }); return res.end('ok'); }
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
    // état du jeu : si l'appareil n'arrive pas à suivre (Wi-Fi faible), on saute une image plutôt que d'accumuler du retard
    etat(str) { if (socket.writableLength < 65536) this.send(str); },
    socket,
  };
  // /maison : une partie rien que pour cet élève, fermée quand il part
  let monde = classe;
  if (req.url.startsWith('/maison')) {
    if (MONDES.size > MAX_MAISON) { conn.send(JSON.stringify({ t: 'complet' })); return socket.end(); }
    monde = creerMonde({ solo: true, depuis: classe.reglages() });
    MONDES.add(monde);
  }
  monde.conns.add(conn);
  conn.vu = Date.now();

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
      conn.vu = Date.now();
      if (op === 1) monde.onMessage(conn, payload.toString());
      else if (op === 8) { socket.end(); return; }
      else if (op === 9) socket.write(Buffer.concat([Buffer.from([0x8a, payload.length]), payload]));
    }
  });
  socket.on('close', () => { monde.onClose(conn); if (monde !== classe) { monde.arreter(); MONDES.delete(monde); } });
  socket.on('error', () => socket.destroy());
});

// Garder le serveur éveillé de 8 h à 22 h (heure du Québec) : il ne s'endort plus en soirée, donc il garde
// les réglages de l'enseignant pour la pratique à la maison. Render donne l'adresse publique dans RENDER_EXTERNAL_URL.
if (process.env.RENDER_EXTERNAL_URL) setInterval(() => {
  const h = +new Intl.DateTimeFormat('en-US', { hour: 'numeric', hourCycle: 'h23', timeZone: 'America/Toronto' }).format(new Date());
  if (h >= 8 && h < 22) fetch(process.env.RENDER_EXTERNAL_URL + '/ping').catch(() => {});
}, 10 * 60 * 1000);

// toutes les 5 s : on ferme les connexions d'élèves muettes depuis 20 s (l'appareil envoie un signe de vie)
setInterval(() => {
  for (const m of MONDES) for (const c of m.conns) if (c.player && c.role !== 'prof' && Date.now() - c.vu > 20000) c.socket.destroy();
}, 5000);

server.listen(PORT, () => {
  console.log('\n⚔️  Arène du Savoir est prête !\n');
  console.log(`   Enseignant : http://localhost:${PORT}/prof`);
  const urls = lanAddresses();
  if (urls.length) console.log(`   Élèves     : ${urls.join('  ou  ')}`);
  console.log('\n   (Ctrl+C pour arrêter)\n');
});
