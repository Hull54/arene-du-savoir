// Générateurs de questions : chaque appel crée une question nouvelle (nombres, dessins, verbes…)
// Les tables viennent d'ici ; toutes les autres notions viennent de notions-donjon.js (communes avec Classe et Donjon).
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
const DONJON = require('./notions-donjon');
const MATIERE = { maths: 'Mathématiques', fr: 'Français' };
function notionDonjon(m, k) {
  return () => {
    const [question, choix, reponse, explication, svg] = DONJON.questionNotion(m, k);
    return { matiere: MATIERE[m], notion: DONJON.NOTIONS[m][k], question, choix, reponse, ...(explication ? { explication } : {}), ...(svg ? { svg } : {}) };
  };
}
const NOTION_DE = (m, k) => DONJON.NOTIONS[m][k];
// les notions de chaque mois de la planification (septembre à juin), par leur nom affiché
const MOIS = Object.entries(DONJON.MOIS_NOTIONS).map(([id, x]) => ({ id, nom: x.nom, notions: [...x.maths.map(k => NOTION_DE('maths', k)), ...x.fr.map(k => NOTION_DE('fr', k))] }));

module.exports = {
  ...Object.fromEntries(Object.keys(DONJON.NOTIONS.maths).map(k => [DONJON.NOTIONS.maths[k], notionDonjon('maths', k)])),
  'Tables d\'addition (0 à 12)': genAddition,
  'Tables de soustraction (0 à 12)': genSoustraction,
  'Tables de multiplication (0 à 12)': genMultiplication,
  'Tables de division (0 à 12)': genDivision,
  ...Object.fromEntries(Object.keys(DONJON.NOTIONS.fr).map(k => [DONJON.NOTIONS.fr[k], notionDonjon('fr', k)])),
};
Object.defineProperty(module.exports, 'MOIS', { value: MOIS, enumerable: false });
