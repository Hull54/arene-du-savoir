// Générateurs de questions : chaque appel crée une question nouvelle (nombres, dessins, verbes…)
// Les tables viennent d'ici ; toutes les autres notions viennent de public/notions.js (source unique, commune avec Classe et Donjon).
// Format retourné : { matiere, notion, question, choix, reponse, svg?, explication? }

const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const fmt = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');   // espace insécable : le nombre ne se coupe pas

// Construit 4 choix distincts : la bonne réponse en premier, puis des leurres
function choices(good, leurres) {
  const out = [good];
  for (const l of leurres) if (out.length < 4 && !out.includes(l)) out.push(l);
  return out;
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

// ---------- Notions de la planification (les mêmes que dans Classe et Donjon) ----------
const PLANIF = require('./public/notions');
const MATIERE = { maths: 'Mathématiques', fr: 'Français' };
function notionDonjon(m, k) {
  return () => {
    const [question, choix, reponse, explication, svg] = PLANIF.questionNotion(m, k);
    return { matiere: MATIERE[m], notion: PLANIF.NOTIONS[m][k], question, choix, reponse, ...(explication ? { explication } : {}), ...(svg ? { svg } : {}) };
  };
}
const NOTION_DE = (m, k) => PLANIF.NOTIONS[m][k];
// les notions de chaque mois de la planification (septembre à juin), par leur nom affiché
const MOIS = Object.entries(PLANIF.MOIS_NOTIONS).map(([id, x]) => ({ id, nom: x.nom, notions: [...x.maths.map(k => NOTION_DE('maths', k)), ...x.fr.map(k => NOTION_DE('fr', k))] }));

module.exports = {
  ...Object.fromEntries(Object.keys(PLANIF.NOTIONS.maths).map(k => [PLANIF.NOTIONS.maths[k], notionDonjon('maths', k)])),
  'Tables d\'addition (0 à 12)': genAddition,
  'Tables de soustraction (0 à 12)': genSoustraction,
  'Tables de multiplication (0 à 12)': genMultiplication,
  'Tables de division (0 à 12)': genDivision,
  ...Object.fromEntries(Object.keys(PLANIF.NOTIONS.fr).map(k => [PLANIF.NOTIONS.fr[k], notionDonjon('fr', k)])),
};
Object.defineProperty(module.exports, 'MOIS', { value: MOIS, enumerable: false });

// ---------- Questions rapides (pour l'arène) ----------
// Les générateurs sont les mêmes que dans Classe et Donjon. Dans l'arène, on en tire plusieurs et on garde
// une des plus rapides à lire et à résoudre : texte court, petits nombres, peu d'étapes. Le niveau complet reste au Donjon.
function effort(q) {
  const txt = [q.question, ...q.choix].join(' ').replace(/(\d)[\s\u00a0](?=\d{3})/g, '$1');
  const nombres = txt.match(/\d+(?:,\d+)?/g) || [], dansQuestion = (q.question.replace(/(\d)[\s\u00a0](?=\d{3})/g, '$1').match(/\d+/g) || []).length;
  let e = q.question.length + 0.6 * q.choix.reduce((a, c) => a + String(c).length, 0);
  for (const n of nombres) e += 6 * Math.max(0, n.replace(',', '').length - 2);   // les grands nombres prennent du temps
  e += 8 * Math.max(0, dansQuestion - 2);                                         // plusieurs nombres = plusieurs étapes
  if (q.svg) e += 10;
  if (/factorisation|dure |durée|moyenne|probabilité/i.test(q.question)) e += 25;
  return e;
}
// recent : les questions déjà posées à cet élève (on ne les redonne pas tout de suite)
function rapide(gen, recent = [], essais = 10) {
  const vus = new Set(), l = [];
  for (let i = 0; i < essais * 2 && l.length < essais; i++) {
    const q = gen(), cle = q.question + '|' + q.choix[q.reponse];
    if (vus.has(cle)) continue;
    vus.add(cle);
    l.push([effort(q) + (recent.includes(cle) ? 1000 : 0), q, cle]);
  }
  l.sort((a, b) => a[0] - b[0]);
  const choisi = l[Math.floor(Math.random() * Math.min(3, l.length))];
  recent.push(choisi[2]); if (recent.length > 20) recent.shift();
  return choisi[1];
}
Object.defineProperty(module.exports, 'rapide', { value: rapide, enumerable: false });
