// Banques de questions thématiques prêtes à ajouter depuis /prof (format : question ; bonne réponse ; mauvaises réponses)
const BANQUES = {
  halloween: { nom: '🎃 Halloween', matiere: 'Thèmes', lignes: [
    'Une sorcière partage 48 bonbons également entre 6 enfants. Combien chacun en reçoit-il ? ; 8 ; 6 ; 9 ; 7',
    'Quel mot est un adjectif dans : « Le fantôme effrayant flotte. » ? ; effrayant ; fantôme ; flotte ; Le',
    'Un chaudron contient 3 L de potion. On en verse 750 mL. Combien en reste-t-il ? ; 2,25 L ; 2,75 L ; 2,5 L ; 2 L | 3 L = 3 000 mL. 3 000 − 750 = 2 250 mL, donc 2,25 L.',
    'Max ramasse 27 bonbons et Léa 35. Combien en ont-ils ensemble ? ; 62 ; 52 ; 63 ; 61',
    'Quel est le féminin de « sorcier » ? ; sorcière ; sorcieuse ; sorcieresse ; sorcièrette',
    'Accorde : « Les chauves-souris (noir) volent. » ; noires ; noir ; noirs ; noire | Chauves-souris est féminin pluriel : noires.',
    'La fête de l\'Halloween a lieu le… ; 31 octobre ; 1er novembre ; 30 octobre ; 31 novembre',
    'Un squelette humain adulte compte environ combien d\'os ? ; 206 ; 106 ; 306 ; 52',
    'Dans « Le vampire boit sa potion », quel est le groupe sujet ? ; Le vampire ; boit sa potion ; sa potion ; boit',
    '8 citrouilles coûtent 4 $ chacune. Combien coûtent-elles en tout ? ; 32 $ ; 12 $ ; 36 $ ; 28 $',
    'Sur 12 bonbons, 3 sont rouges. Quelle fraction est rouge ? ; 3/12 ; 12/3 ; 3/9 ; 9/12 | 3 parties sur 12 : 3/12 (c\'est aussi 1/4).',
    'Conjugue au présent : « Nous (choisir) nos costumes. » ; choisissons ; choisons ; choisissez ; choisirons',
  ] },
  noel: { nom: '🎄 Noël', matiere: 'Thèmes', lignes: [
    'Le père Noël a 9 rennes. Chaque renne porte 7 cadeaux. Combien de cadeaux en tout ? ; 63 ; 56 ; 72 ; 16',
    'Quel est le pluriel de « cadeau » ? ; cadeaux ; cadeaus ; cadeaues ; cadeau | Les noms en -eau prennent un x au pluriel.',
    'Une guirlande mesure 2 m. Combien de centimètres est-ce ? ; 200 cm ; 20 cm ; 2 000 cm ; 2 cm | 1 m = 100 cm.',
    'Accorde : « Des boules (doré) décorent le sapin. » ; dorées ; doré ; dorés ; dorée',
    'La journée la plus courte de l\'année (le solstice d\'hiver) arrive vers le… ; 21 décembre ; 25 décembre ; 1er janvier ; 21 novembre',
    'Il reste 18 jours avant Noël. Combien de semaines est-ce ? ; 2 semaines et 4 jours ; 3 semaines ; 2 semaines et 2 jours ; 1 semaine et 11 jours | 18 = 2 × 7 + 4.',
    'Quel est le noyau du GN « le gros bonhomme de neige » ? ; bonhomme ; gros ; le ; neige',
    'Conjugue à l\'imparfait : « Les enfants (chanter) des chants de Noël. » ; chantaient ; chantait ; chantent ; chantions',
    'Un lutin emballe 6 cadeaux par heure. Combien en emballe-t-il en 8 heures ? ; 48 ; 42 ; 54 ; 14',
    'Quelle est la classe du mot « brillante » dans « une étoile brillante » ? ; adjectif ; nom ; verbe ; déterminant',
    '56 biscuits sont partagés également dans 8 assiettes. Combien par assiette ? ; 7 ; 6 ; 8 ; 9',
    'Quel est le féminin de « lutin » ? ; lutine ; lutinesse ; lutinne ; lutière',
  ] },
  hiver: { nom: '❄️ Hiver', matiere: 'Thèmes', lignes: [
    'Il fait −5 °C le matin et 3 °C l\'après-midi. De combien de degrés la température a-t-elle monté ? ; 8 °C ; 2 °C ; 3 °C ; 5 °C | De −5 à 0 : 5 degrés, puis de 0 à 3 : 3 degrés. 5 + 3 = 8.',
    'Quel est le pluriel de « flocon » ? ; flocons ; flocones ; flocon ; flocoux',
    'Accorde : « Des mitaines (chaud) » ; chaudes ; chauds ; chaud ; chaude',
    'Un bonhomme de neige a 3 boules. Combien de boules faut-il pour 9 bonshommes ? ; 27 ; 12 ; 18 ; 30',
    'À quelle température l\'eau gèle-t-elle ? ; 0 °C ; 10 °C ; −10 °C ; 100 °C',
    'Quel est le pluriel de « bonhomme » ? ; bonshommes ; bonhommes ; bonhommeaux ; bonshomme | On écrit des bonshommes : bon et homme prennent tous les deux un s.',
    'Conjugue au présent : « Nous (glisser) sur la patinoire. » ; glissons ; glissont ; glissez ; glisserons',
    'Une patinoire rectangulaire mesure 20 m sur 10 m. Quel est son périmètre ? ; 60 m ; 30 m ; 200 m ; 40 m | 20 + 10 + 20 + 10 = 60 m.',
    'Quel animal du Québec hiberne pendant l\'hiver ? ; L\'ours noir ; L\'orignal ; Le renard roux ; Le geai bleu',
    'Dans « Pendant l\'hiver, les oiseaux migrent », quel est le complément de phrase ? ; Pendant l\'hiver ; les oiseaux ; migrent ; les oiseaux migrent',
    'Dans le nombre 4 728, quel chiffre est à la position des centaines ? ; 7 ; 4 ; 2 ; 8',
  ] },
  valentin: { nom: '❤️ Saint-Valentin', matiere: 'Thèmes', lignes: [
    'Une boîte contient 24 chocolats. On en mange le quart (1/4). Combien en mange-t-on ? ; 6 ; 4 ; 8 ; 20 | 24 ÷ 4 = 6.',
    'Accorde : « Mes amies sont (gentil). » ; gentilles ; gentils ; gentil ; gentille',
    'Quel mot est un déterminant dans « Ma meilleure amie rit » ? ; Ma ; meilleure ; amie ; rit',
    '12 élèves donnent chacun 5 cartes. Combien de cartes en tout ? ; 60 ; 17 ; 50 ; 65',
    'La Saint-Valentin a lieu le… ; 14 février ; 14 mars ; 1er février ; 24 février',
    'Conjugue au présent : « Tu (donner) une carte. » ; donnes ; donne ; donnent ; donnez',
    'Quel angle forment les aiguilles d\'une horloge à 3 h ? ; un angle droit ; un angle aigu ; un angle obtus ; un angle plat',
    'Un cœur en chocolat coûte 0,75 $. Combien coûtent 4 cœurs ? ; 3,00 $ ; 2,75 $ ; 3,75 $ ; 4,75 $ | 0,75 × 4 = 3,00.',
    'Quel mot veut dire presque la même chose que « amitié » ? ; camaraderie ; dispute ; colère ; solitude',
    'Dans « Les amis partagent un gâteau », quel est le groupe du verbe ? ; partagent un gâteau ; Les amis ; un gâteau ; partagent',
  ] },
};
// Transforme du texte collé en questions. Une question par ligne : question ; bonne réponse ; mauvaises réponses (| explication).
// Des colonnes copiées d'Excel (séparées par des tabulations) fonctionnent aussi.
function lireQuestions(texte, notion, matiere) {
  const out = [], erreurs = [];
  texte.split(/\r?\n/).forEach((ligne, n) => {
    if (!ligne.trim()) return;
    let [corps, explication = ''] = ligne.split('|');
    const parts = corps.split(corps.includes('\t') ? '\t' : ';').map(s => s.trim()).filter(Boolean);
    if (parts.length < 3) { erreurs.push(n + 1); return; }
    out.push({ matiere, notion, question: parts[0].slice(0, 300), choix: parts.slice(1, 5).map(c => c.slice(0, 120)), reponse: 0, explication: explication.trim().slice(0, 300) });
  });
  return { out, erreurs };
}
