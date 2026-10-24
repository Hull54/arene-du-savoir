// Générateurs de questions : chaque appel crée une question nouvelle (nombres, dessins, verbes…)
// Format retourné : { matiere, notion, question, choix, reponse, svg?, explication? }

const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const fmt = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');   // espace insécable : le nombre ne se coupe pas

// Construit 4 choix distincts : la bonne réponse en premier, puis des leurres
function choices(good, leurres) {
  const out = [good];
  for (const l of leurres) if (out.length < 4 && !out.includes(l)) out.push(l);
  return out;
}

// ---------- Français : accord des verbes du 1er et du 2e groupe ----------
const V1 = ['parler', 'chanter', 'jouer', 'danser', 'regarder', 'aimer', 'marcher', 'écouter', 'dessiner', 'sauter', 'arriver', 'gagner', 'aider', 'habiter', 'trouver'];
const V2 = ['finir', 'choisir', 'grandir', 'réussir', 'remplir', 'rougir', 'bâtir', 'obéir', 'réfléchir', 'applaudir', 'nourrir', 'agir'];
const PERS = [
  { p: 0, sujets: ['je'] },
  { p: 1, sujets: ['tu'] },
  { p: 2, sujets: ['il', 'elle', 'Mon ami', 'La maîtresse', 'Le chat', 'Maxime'] },
  { p: 3, sujets: ['nous', 'Mon frère et moi', 'Toi et moi'] },
  { p: 4, sujets: ['vous', 'Ton ami et toi'] },
  { p: 5, sujets: ['ils', 'elles', 'Les élèves', 'Mes parents', 'Les oiseaux'] },
];
const TERM = {
  1: { present: ['e', 'es', 'e', 'ons', 'ez', 'ent'], imparfait: ['ais', 'ais', 'ait', 'ions', 'iez', 'aient'] },
  2: { present: ['is', 'is', 'it', 'issons', 'issez', 'issent'], imparfait: ['issais', 'issais', 'issait', 'issions', 'issiez', 'issaient'] },
};
function conj(inf, grp, temps, p) { return inf.slice(0, -2) + TERM[grp][temps][p]; }
function genVerbe() {
  const grp = Math.random() < 0.5 ? 1 : 2;
  const inf = pick(grp === 1 ? V1 : V2);
  const temps = Math.random() < 0.5 ? 'present' : 'imparfait';
  const pers = pick(PERS);
  let sujet = pick(pers.sujets);
  const forme = conj(inf, grp, temps, pers.p);
  if (sujet === 'je' && /^[aeéèiouyh]/i.test(forme)) sujet = "j'";
  const autres = [0, 1, 2, 3, 4, 5].filter(p => conj(inf, grp, temps, p) !== forme).map(p => conj(inf, grp, temps, p));
  const autreTemps = conj(inf, grp, temps === 'present' ? 'imparfait' : 'present', pers.p);
  const leurres = [autreTemps, ...autres.sort(() => Math.random() - 0.5)];
  const nomTemps = temps === 'present' ? 'au présent' : "à l'imparfait";
  const debut = sujet === "j'" ? "J'" : sujet[0].toUpperCase() + sujet.slice(1) + ' ';
  return {
    matiere: 'Français', notion: 'Accord des verbes',
    question: `Conjugue « ${inf} » ${nomTemps} : « ${debut}___ »`,
    choix: choices(forme, leurres), reponse: 0,
    explication: `${debut}${forme} (${inf}, ${grp === 1 ? '1er' : '2e'} groupe, ${nomTemps}).`,
  };
}

// ---------- Mathématiques : tables de 1 à 12 ----------
// Tables de 0 à 12 : une notion par opération, pour les cocher séparément
const melange = arr => arr.sort(() => Math.random() - 0.5);
const QM = (notion, question, bon, leurres, explication) => ({ matiere: 'Mathématiques', notion, question, choix: choices(String(bon), melange([...new Set(leurres.filter(x => x >= 0 && x !== bon))]).map(String)), reponse: 0, explication });
function genAddition() {
  const a = ri(0, 12), b = ri(0, 12), s = a + b;
  return QM('Tables d\'addition (0 à 12)', `Combien font ${a} + ${b} ?`, s, [s + 1, s - 1, s + 2, s - 2, s + 10, a * b, s + 3], `${a} + ${b} = ${s}`);
}
function genSoustraction() {
  const a = ri(0, 12), b = ri(0, 12), s = a + b;
  return QM('Tables de soustraction (0 à 12)', `Combien font ${s} − ${a} ?`, b, [b + 1, b - 1, b + 2, b - 2, s, a, b + 3], `${a} + ${b} = ${s}, donc ${s} − ${a} = ${b}`);
}
function genMultiplication() {
  const a = ri(0, 12), b = ri(0, 12), p = a * b;
  return QM('Tables de multiplication (0 à 12)', `Combien font ${a} × ${b} ?`, p, [a * (b + 1), a * (b - 1), (a + 1) * b, (a - 1) * b, p + 1, p - 2, p + 10, a + b, p + 3],
    a === 0 || b === 0 ? `Un nombre multiplié par 0 donne toujours 0 : ${a} × ${b} = 0` : `${a} × ${b} = ${p}`);
}
function genDivision() {
  const a = ri(1, 12), b = ri(0, 12), p = a * b;   // on ne divise jamais par 0
  return QM('Tables de division (0 à 12)', `Combien font ${fmt(p)} ÷ ${a} ?`, b, [b + 1, b - 1, b + 2, a, b * 2, b + 3, p], `${a} × ${b} = ${p}, donc ${p} ÷ ${a} = ${b}`);
}

// ---------- Mathématiques : numération ----------
const POSITIONS = ['unités', 'dizaines', 'centaines', 'unités de mille', 'dizaines de mille'];
function genNumeration() {
  const n = ri(10000, 99999), s = String(n);
  const t = ri(0, 4);
  if (t === 0) {
    const pos = ri(0, 4), chiffre = s[4 - pos];
    const autres = [...s].filter(c => c !== chiffre);
    return { matiere: 'Mathématiques', notion: 'Numération', question: `Dans le nombre ${fmt(n)}, quel chiffre est à la position des ${POSITIONS[pos]} ?`, choix: choices(chiffre, [...new Set(autres)].concat(['0', '9', '1', '5', '7'])), reponse: 0 };
  }
  if (t === 1) {
    let pos = ri(1, 4); while (s[4 - pos] === '0') pos = ri(1, 4);
    const c = +s[4 - pos], v = c * 10 ** pos;
    return { matiere: 'Mathématiques', notion: 'Numération', question: `Quelle est la valeur du chiffre ${c} dans ${fmt(n)} ?`, choix: choices(fmt(v), [fmt(v * 10), fmt(v / 10), String(c), fmt(v * 100)]), reponse: 0 };
  }
  if (t === 2) {
    const parts = [...s].map((c, i) => +c * 10 ** (4 - i)).filter(x => x);
    const swap = s.slice(0, 2) + s[3] + s[2] + s[4];
    return { matiere: 'Mathématiques', notion: 'Numération', question: `Quel nombre correspond à ${parts.map(fmt).join(' + ')} ?`, choix: choices(fmt(n), [fmt(+swap), fmt(n + 1000), fmt(n - 100), fmt(n + 10)]), reponse: 0 };
  }
  if (t === 3) {
    const [nom, f] = pick([['à la dizaine près', 10], ['à la centaine près', 100], ['au millier près', 1000]]);
    const r = Math.round(n / f) * f;
    return { matiere: 'Mathématiques', notion: 'Numération', question: `Arrondis ${fmt(n)} ${nom}.`, choix: choices(fmt(r), [fmt(Math.floor(n / f) * f === r ? r + f : r - f), fmt(Math.round(n / (f * 10)) * f * 10), fmt(r + 2 * f), fmt(n), fmt(r - 2 * f), fmt(r + 3 * f)]), reponse: 0 };
  }
  const a = n, b = +(s[0] + s[2] + s[1] + s[3] + s[4]), c = n + ri(1, 9) * 10, d = n - ri(1, 9) * 100;
  const all = [...new Set([a, b, c, d])];
  const max = Math.max(...all);
  return { matiere: 'Mathématiques', notion: 'Numération', question: 'Quel est le plus grand nombre ?', choix: choices(fmt(max), all.filter(x => x !== max).map(fmt).concat([fmt(max - 1000)])), reponse: 0 };
}

// ---------- Mathématiques : fractions (avec dessin) ----------
function svgPie(n, k) {
  let paths = '';
  for (let i = 0; i < n; i++) {
    const a1 = (i / n) * Math.PI * 2 - Math.PI / 2, a2 = ((i + 1) / n) * Math.PI * 2 - Math.PI / 2;
    const x1 = 80 + 70 * Math.cos(a1), y1 = 80 + 70 * Math.sin(a1), x2 = 80 + 70 * Math.cos(a2), y2 = 80 + 70 * Math.sin(a2);
    const large = a2 - a1 > Math.PI ? 1 : 0;
    paths += `<path d="M80,80 L${x1.toFixed(1)},${y1.toFixed(1)} A70,70 0 ${large} 1 ${x2.toFixed(1)},${y2.toFixed(1)} Z" fill="${i < k ? '#6c4cf5' : '#fff'}" stroke="#333" stroke-width="2"/>`;
  }
  return `<svg viewBox="0 0 160 160" width="150" height="150">${n === 1 ? `<circle cx="80" cy="80" r="70" fill="#6c4cf5" stroke="#333" stroke-width="2"/>` : paths}</svg>`;
}
function svgBar(n, k) {
  const w = 280 / n;
  let r = '';
  for (let i = 0; i < n; i++) r += `<rect x="${10 + i * w}" y="20" width="${w}" height="60" fill="${i < k ? '#ff9a2e' : '#fff'}" stroke="#333" stroke-width="2"/>`;
  return `<svg viewBox="0 0 300 100" width="280" height="95">${r}</svg>`;
}
function svgSet(n, k) {
  const cols = Math.min(n, 6), rows = Math.ceil(n / cols);
  let r = '';
  const order = [...Array(n).keys()].sort(() => Math.random() - 0.5).slice(0, k);
  for (let i = 0; i < n; i++) r += `<circle cx="${30 + (i % cols) * 45}" cy="${30 + Math.floor(i / cols) * 45}" r="17" fill="${order.includes(i) ? '#3fbf5f' : '#fff'}" stroke="#333" stroke-width="2"/>`;
  return `<svg viewBox="0 0 ${cols * 45 + 15} ${rows * 45 + 15}" width="${Math.min(280, cols * 45 + 15)}">${r}</svg>`;
}
function genFractions() {
  const n = pick([2, 3, 4, 5, 6, 8, 10, 12]);
  let k = ri(1, n - 1);
  if (k * 2 === n && Math.random() < 0.5) k = Math.max(1, k - 1);
  const t = ri(0, 2);
  const svg = t === 0 ? svgPie(n, k) : t === 1 ? svgBar(n, k) : svgSet(n, k);
  const quoi = t === 2 ? 'Quelle fraction des cercles est coloriée ?' : 'Quelle fraction de la figure est coloriée ?';
  const leurres = [`${n - k}/${n}`, `${k}/${n - k}`, `${n}/${k}`, `${k}/${n + 1}`, `${k + 1}/${n}`];
  return { matiere: 'Mathématiques', notion: 'Fractions', question: quoi, svg, choix: choices(`${k}/${n}`, leurres), reponse: 0, explication: `${k} partie${k > 1 ? 's' : ''} coloriée${k > 1 ? 's' : ''} sur ${n} parties égales : ${k}/${n}.` };
}

// ---------- Mathématiques : angles (avec dessin) ----------
function svgAngle(deg) {
  const rot = ri(0, 30), a1 = -rot * Math.PI / 180, a2 = -(rot + deg) * Math.PI / 180;
  const cx = 100, cy = 110, L = 85;
  const p1 = [cx + L * Math.cos(a1), cy + L * Math.sin(a1)], p2 = [cx + L * Math.cos(a2), cy + L * Math.sin(a2)];
  let mark;
  if (deg === 90) {
    const s = 16, u = [Math.cos(a1), Math.sin(a1)], v = [Math.cos(a2), Math.sin(a2)];
    mark = `<path d="M${cx + u[0] * s},${cy + u[1] * s} L${cx + (u[0] + v[0]) * s},${cy + (u[1] + v[1]) * s} L${cx + v[0] * s},${cy + v[1] * s}" fill="none" stroke="#d33" stroke-width="2.5"/>`;
  } else {
    const r = 26, q1 = [cx + r * Math.cos(a1), cy + r * Math.sin(a1)], q2 = [cx + r * Math.cos(a2), cy + r * Math.sin(a2)];
    mark = `<path d="M${q1[0].toFixed(1)},${q1[1].toFixed(1)} A${r},${r} 0 ${deg > 180 ? 1 : 0} 0 ${q2[0].toFixed(1)},${q2[1].toFixed(1)}" fill="none" stroke="#d33" stroke-width="2.5"/>`;
  }
  return `<svg viewBox="0 0 200 140" width="200" height="140"><line x1="${cx}" y1="${cy}" x2="${p1[0].toFixed(1)}" y2="${p1[1].toFixed(1)}" stroke="#222" stroke-width="4" stroke-linecap="round"/><line x1="${cx}" y1="${cy}" x2="${p2[0].toFixed(1)}" y2="${p2[1].toFixed(1)}" stroke="#222" stroke-width="4" stroke-linecap="round"/>${mark}<circle cx="${cx}" cy="${cy}" r="4" fill="#222"/></svg>`;
}
const TYPES_ANGLE = ['Angle aigu', 'Angle droit', 'Angle obtus', 'Angle plat'];
function typeAngle(d) { return d < 90 ? 0 : d === 90 ? 1 : d < 180 ? 2 : 3; }
function genAngles() {
  const d = pick([25, 35, 45, 60, 70, 80, 90, 90, 90, 110, 120, 135, 150, 160, 180]);
  const t = typeAngle(d);
  if (Math.random() < 0.6) {
    return { matiere: 'Mathématiques', notion: 'Angles', question: 'Quel type d\'angle est dessiné ?', svg: svgAngle(d), choix: choices(TYPES_ANGLE[t], TYPES_ANGLE), reponse: 0,
      explication: ['Plus petit qu\'un angle droit : aigu.', 'Il forme un coin carré (90°) : droit.', 'Plus grand qu\'un angle droit, plus petit qu\'un angle plat : obtus.', 'Ses deux côtés forment une ligne droite (180°) : plat.'][t] };
  }
  return { matiere: 'Mathématiques', notion: 'Angles', question: `Un angle de ${d}° est…`, choix: choices(TYPES_ANGLE[t].replace('Angle', 'un angle'), TYPES_ANGLE.map(s => s.replace('Angle', 'un angle'))), reponse: 0 };
}

// ---------- Mathématiques : classification des triangles (avec dessin) ----------
function tick(p, q, n) {
  const mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2, dx = q[0] - p[0], dy = q[1] - p[1], L = Math.hypot(dx, dy);
  const nx = -dy / L * 8, ny = dx / L * 8, tx = dx / L * 5, ty = dy / L * 5;
  let s = '';
  for (let i = 0; i < n; i++) { const o = (i - (n - 1) / 2); s += `<line x1="${(mx - nx + tx * o).toFixed(1)}" y1="${(my - ny + ty * o).toFixed(1)}" x2="${(mx + nx + tx * o).toFixed(1)}" y2="${(my + ny + ty * o).toFixed(1)}" stroke="#d33" stroke-width="2.5"/>`; }
  return s;
}
function svgTriangle(type) {
  let P, marks = '';
  if (type === 'equi') { P = [[40, 140], [180, 140], [110, 19]]; marks = tick(P[0], P[1], 1) + tick(P[1], P[2], 1) + tick(P[2], P[0], 1); }
  else if (type === 'iso') { const h = pick([60, 140]); P = [[45, 145], [175, 145], [110, 145 - h]]; marks = tick(P[1], P[2], 2) + tick(P[2], P[0], 2); }
  else if (type === 'scal') { P = pick([[[25, 140], [190, 140], [70, 40]], [[30, 130], [180, 145], [140, 30]], [[20, 145], [150, 120], [60, 30]]]); }
  else { P = [[40, 145], [40, 30], [185, 145]]; marks = `<path d="M40,129 L56,129 L56,145" fill="none" stroke="#d33" stroke-width="2.5"/>`; }
  return `<svg viewBox="0 0 220 165" width="210" height="160"><polygon points="${P.map(p => p.join(',')).join(' ')}" fill="#cfe8ff" stroke="#222" stroke-width="3" stroke-linejoin="round"/>${marks}</svg>`;
}
function genTriangles() {
  const type = pick(['equi', 'iso', 'scal', 'rect']);
  if (type === 'rect') {
    return { matiere: 'Mathématiques', notion: 'Triangles', question: 'Ce triangle a un angle droit. Comment l\'appelle-t-on ?', svg: svgTriangle(type),
      choix: ['Triangle rectangle', 'Triangle équilatéral', 'Triangle isocèle', 'Triangle carré'], reponse: 0, explication: 'Un triangle qui a un angle droit est un triangle rectangle.' };
  }
  const noms = { equi: 'Équilatéral', iso: 'Isocèle', scal: 'Scalène' };
  const expl = { equi: '3 côtés de même longueur : équilatéral.', iso: '2 côtés de même longueur : isocèle.', scal: 'Aucun côté de même longueur : scalène.' };
  return { matiere: 'Mathématiques', notion: 'Triangles', question: 'Selon ses côtés, comment s\'appelle ce triangle ? (Les petits traits rouges montrent les côtés de même longueur.)', svg: svgTriangle(type),
    choix: choices(noms[type], ['Équilatéral', 'Isocèle', 'Scalène', 'Rectangle']), reponse: 0, explication: expl[type] };
}

module.exports = {
  'Accord des verbes': genVerbe,
  'Tables d\'addition (0 à 12)': genAddition,
  'Tables de soustraction (0 à 12)': genSoustraction,
  'Tables de multiplication (0 à 12)': genMultiplication,
  'Tables de division (0 à 12)': genDivision,
  'Numération': genNumeration,
  'Fractions': genFractions,
  'Angles': genAngles,
  'Triangles': genTriangles,
};
