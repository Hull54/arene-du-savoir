// Planification de 5e année : notions de chaque mois (septembre à juin) et leurs questions.
// SOURCE UNIQUE pour les deux jeux : l'Arène du Savoir (serveur, require) et Classe et Donjon (navigateur, <script src="/notions.js">).
// Pour changer la planification ou les questions, on modifie seulement ce fichier.
// Une question = [question, choix, index de la bonne réponse, explication, dessin svg?]
(function (exp) {
let DIFF = 'normal';   // difficulté du Donjon (« expert » : plus de futur simple dans le mélange présent/imparfait)
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const FR = [
  ["Le chevalier ___ une épée.", ["a", "à"], 0],
  ["Le dragon dort ___ fond de la grotte.", ["au", "eau", "haut"], 0],
  ["Le mage ___ l'archer sont amis.", ["et", "est"], 0],
  ["La porte ___ verrouillée.", ["est", "et"], 0],
  ["Les gobelins ___ cachés.", ["sont", "son"], 0],
  ["___ trouve-t-on le trésor?", ["Où", "Ou"], 0],
  ["Les héros ___ gagné la bataille.", ["ont", "on"], 0],
  ["___ entend un bruit dans le couloir.", ["On", "Ont"], 0],
  ["Le guerrier lève ___ bouclier.", ["son", "sont"], 0],
  ["___ chevaliers protègent le roi.", ["Ces", "Ses", "C'est"], 0],
  ["Le pluriel de « cheval » est…", ["chevaux", "chevals", "chevaus"], 0],
  ["Le pluriel de « château » est…", ["châteaux", "châteaus", "château"], 0],
  ["Le pluriel de « bijou » est…", ["bijoux", "bijous", "bijou"], 0],
  ["Le féminin de « sorcier » est…", ["sorcière", "sorcièrre", "sorciée"], 0],
  ["Le féminin de « gentil » est…", ["gentille", "gentile", "gentil"], 0],
  ["Ils (être, présent) courageux.", ["sont", "son", "sommes"], 0],
  ["Tu (avoir, présent) une potion.", ["as", "a", "à"], 0],
  ["Demain, je (partir, futur) à l'aube.", ["partirai", "partirais", "partiré"], 0],
  ["Dans « les grandes tours », le mot « grandes » est un…", ["adjectif", "verbe", "nom"], 0],
  ["Dans « Le loup hurle », le mot « hurle » est un…", ["verbe", "nom", "adjectif"], 0],
  ["Quel mot est bien écrit?", ["beaucoup", "beaucou", "baucoup"], 0],
  ["Quel mot est bien écrit?", ["toujours", "toujour", "tougours"], 0],
  ["Quel mot est bien écrit?", ["maintenant", "maintenent", "mintenant"], 0],
  ["Les potions sont ___.", ["magiques", "magique", "magiquent"], 0],
  ["Les guerrières sont ___.", ["fortes", "forts", "forte"], 0],
  ["Le synonyme de « rapide » est…", ["vite", "lent", "lourd"], 0],
  ["Le contraire de « courageux » est…", ["peureux", "brave", "fort"], 0],
];
// Classes de mots invariables (les mêmes questions que dans l'Arène du savoir)
const INVAR = [
[
"Quelles sont les trois classes de mots invariables ?",
[
"L'adverbe, la préposition et la conjonction",
"Le nom, l'adjectif et le verbe",
"Le déterminant, le pronom et l'adverbe",
"La préposition, le nom et la conjonction"
],
0,
""
],
[
"Un mot invariable, c'est un mot qui…",
[
"ne change jamais d'orthographe",
"change selon le genre",
"change selon le nombre",
"se conjugue"
],
0,
"Il ne prend jamais de marque de genre, de nombre ou de personne."
],
[
"Laquelle est une classe de mots invariable ?",
[
"La préposition",
"L'adjectif",
"Le pronom",
"Le déterminant"
],
0,
""
],
[
"Laquelle est une classe de mots invariable ?",
[
"La conjonction",
"Le nom",
"Le verbe",
"L'adjectif"
],
0,
""
],
[
"Laquelle N'est PAS une classe de mots invariable ?",
[
"Le pronom",
"L'adverbe",
"La préposition",
"La conjonction"
],
0,
""
],
[
"Dans « Le lièvre court rapidement. », le mot « rapidement » est…",
[
"un adverbe",
"une préposition",
"une conjonction",
"un adjectif"
],
0,
""
],
[
"Dans « Nous allons souvent au parc. », le mot « souvent » est…",
[
"un adverbe",
"une préposition",
"une conjonction",
"un adjectif"
],
0,
""
],
[
"Dans « Ce gâteau est très bon. », le mot « très » est…",
[
"un adverbe",
"une préposition",
"une conjonction",
"un adjectif"
],
0,
""
],
[
"Dans « Hier, j'ai vu un renard. », le mot « hier » est…",
[
"un adverbe",
"une préposition",
"une conjonction",
"un adjectif"
],
0,
""
],
[
"Dans « Tu parles trop fort. », le mot « trop » est…",
[
"un adverbe",
"une préposition",
"une conjonction",
"un adjectif"
],
0,
""
],
[
"Dans « Elle sourit toujours. », le mot « toujours » est…",
[
"un adverbe",
"une préposition",
"une conjonction",
"un adjectif"
],
0,
""
],
[
"Dans « Viens ici ! », le mot « ici » est…",
[
"un adverbe",
"une préposition",
"une conjonction",
"un adjectif"
],
0,
""
],
[
"Dans « La tortue avance lentement. », le mot « lentement » est…",
[
"un adverbe",
"une préposition",
"une conjonction",
"un adjectif"
],
0,
""
],
[
"Dans « Il mange beaucoup. », le mot « beaucoup » est…",
[
"un adverbe",
"une préposition",
"une conjonction",
"un adjectif"
],
0,
""
],
[
"Dans « Nous partirons demain. », le mot « demain » est…",
[
"un adverbe",
"une préposition",
"une conjonction",
"un adjectif"
],
0,
""
],
[
"Dans « Tu as bien travaillé. », le mot « bien » est…",
[
"un adverbe",
"une préposition",
"une conjonction",
"un adjectif"
],
0,
""
],
[
"Dans « Il ne ment jamais. », le mot « jamais » est…",
[
"un adverbe",
"une préposition",
"une conjonction",
"un adjectif"
],
0,
""
],
[
"Dans « Le chat dort dans la boîte. », le mot « dans » est…",
[
"une préposition",
"un adverbe",
"une conjonction",
"un déterminant"
],
0,
""
],
[
"Dans « Je joue avec mon frère. », le mot « avec » est…",
[
"une préposition",
"un adverbe",
"une conjonction",
"un déterminant"
],
0,
""
],
[
"Dans « Le ballon roule sous la table. », le mot « sous » est…",
[
"une préposition",
"un adverbe",
"une conjonction",
"un déterminant"
],
0,
""
],
[
"Dans « Ce dessin est pour toi. », le mot « pour » est…",
[
"une préposition",
"un adverbe",
"une conjonction",
"un déterminant"
],
0,
""
],
[
"Dans « Le livre est sur le bureau. », le mot « sur » est…",
[
"une préposition",
"un adverbe",
"une conjonction",
"un déterminant"
],
0,
""
],
[
"Dans « Il est parti sans son manteau. », le mot « sans » est…",
[
"une préposition",
"un adverbe",
"une conjonction",
"un déterminant"
],
0,
""
],
[
"Dans « Nous allons chez Léa. », le mot « chez » est…",
[
"une préposition",
"un adverbe",
"une conjonction",
"un déterminant"
],
0,
""
],
[
"Dans « L'oiseau vole vers le nid. », le mot « vers » est…",
[
"une préposition",
"un adverbe",
"une conjonction",
"un déterminant"
],
0,
""
],
[
"Dans « Après le dîner, on joue dehors. », le mot « après » est…",
[
"une préposition",
"un adverbe",
"une conjonction",
"un déterminant"
],
0,
""
],
[
"Dans « La balle passe entre les arbres. », le mot « entre » est…",
[
"une préposition",
"un adverbe",
"une conjonction",
"un déterminant"
],
0,
""
],
[
"Dans « Léa et Noah jouent au soccer. », « et » est…",
[
"une conjonction",
"une préposition",
"un adverbe",
"un pronom"
],
0,
""
],
[
"Dans « Il pleut, mais nous sortons. », « mais » est…",
[
"une conjonction",
"une préposition",
"un adverbe",
"un pronom"
],
0,
""
],
[
"Dans « Veux-tu du jus ou du lait ? », « ou » est…",
[
"une conjonction",
"une préposition",
"un adverbe",
"un pronom"
],
0,
""
],
[
"Dans « Je mets mon manteau, car il fait froid. », « car » est…",
[
"une conjonction",
"une préposition",
"un adverbe",
"un pronom"
],
0,
""
],
[
"Dans « Il est malade, donc il reste au lit. », « donc » est…",
[
"une conjonction",
"une préposition",
"un adverbe",
"un pronom"
],
0,
""
],
[
"Dans « Je souris quand il fait beau. », « quand » est…",
[
"une conjonction",
"une préposition",
"un adverbe",
"un pronom"
],
0,
""
],
[
"Dans « Elle rit parce que le clown est drôle. », « parce que » est…",
[
"une conjonction",
"une préposition",
"un adverbe",
"un pronom"
],
0,
""
],
[
"Dans « Il n'aime ni les épinards ni le brocoli. », « ni » est…",
[
"une conjonction",
"une préposition",
"un adverbe",
"un pronom"
],
0,
""
],
[
"Quel mot est un adverbe ?",
[
"joyeusement",
"joyeux",
"joie",
"jouer"
],
0,
"Beaucoup d'adverbes se terminent par -ment."
],
[
"Quel mot est un adverbe ?",
[
"vite",
"vitesse",
"rapide",
"courir"
],
0,
""
],
[
"Quel mot est une préposition ?",
[
"devant",
"devenir",
"dent",
"doux"
],
0,
""
],
[
"Quel mot est une préposition ?",
[
"contre",
"conte",
"content",
"compter"
],
0,
""
],
[
"Quel mot est une conjonction ?",
[
"mais",
"mai",
"mauve",
"maison"
],
0,
""
],
[
"Quel mot est une conjonction ?",
[
"or",
"orange",
"oreille",
"oser"
],
0,
""
],
[
"Lequel de ces mots est invariable ?",
[
"dehors",
"chevaux",
"gentille",
"mangent"
],
0,
""
],
[
"Lequel de ces mots est invariable ?",
[
"parfois",
"petites",
"nos",
"ils"
],
0,
""
],
[
"Lequel de ces mots est invariable ?",
[
"avant",
"amis",
"belles",
"chantez"
],
0,
""
],
[
"Dans « Les enfants jouent calmement dans la cour. », combien y a-t-il de mots invariables ?",
[
"2",
"1",
"3",
"4"
],
0,
"« calmement » (adverbe) et « dans » (préposition)."
],
[
"Dans « Mon chien et mon chat dorment souvent ensemble. », quels mots sont invariables ?",
[
"et, souvent, ensemble",
"mon, chien, chat",
"dorment, souvent",
"et, mon, ensemble"
],
0,
""
],
[
"À quoi sert une conjonction ?",
[
"À joindre des mots ou des phrases",
"À remplacer un nom",
"À décrire un nom",
"À exprimer une action"
],
0,
""
],
[
"Une préposition est souvent suivie…",
[
"d'un groupe du nom ou d'un pronom",
"d'un point",
"d'un verbe conjugué",
"de rien du tout"
],
0,
"Ex. : sur la table, avec lui."
],
[
"Un adverbe peut modifier…",
[
"un verbe, un adjectif ou un autre adverbe",
"seulement un nom",
"seulement un déterminant",
"seulement un pronom"
],
0,
"Ex. : courir vite, très beau, trop lentement."
],
[
"Quel adverbe complète bien : « Le chien aboie ___. » ?",
[
"fort",
"forte",
"fortes",
"force"
],
0,
""
],
[
"Choisis la bonne orthographe : « Elles marchent ___. »",
[
"lentement",
"lentements",
"lentementes",
"lentes"
],
0,
"L'adverbe est invariable : il ne prend jamais de s."
],
[
"Choisis la bonne orthographe : « Les filles sont ___ contentes. »",
[
"très",
"trés",
"trèss",
"trèses"
],
0,
""
],
[
"Quelle conjonction complète bien : « J'ai faim, ___ je n'ai pas le temps de manger. » ?",
[
"mais",
"et",
"ou",
"car"
],
0,
""
],
[
"Quelle conjonction complète bien : « Prends ton parapluie, ___ il va pleuvoir. » ?",
[
"car",
"mais",
"ou",
"ni"
],
0,
""
],
[
"Quelle préposition complète bien : « Le poisson nage ___ l'eau. » ?",
[
"dans",
"sur",
"et",
"très"
],
0,
""
],
[
"Quelle préposition complète bien : « Je vais à l'école ___ autobus. » ?",
[
"en",
"et",
"très",
"mais"
],
0,
""
],
[
"Dans « Le chat saute sur le lit. », quel mot est une préposition ?",
[
"sur",
"saute",
"le",
"lit"
],
0,
""
],
[
"Dans « Tu es vraiment gentil. », quel mot est un adverbe ?",
[
"vraiment",
"gentil",
"es",
"tu"
],
0,
""
],
[
"Dans « Je lis ou je dessine. », quel mot est une conjonction ?",
[
"ou",
"je",
"lis",
"dessine"
],
0,
""
],
[
"Les mots « dans, avec, pour, sans » sont des…",
[
"prépositions",
"adverbes",
"conjonctions",
"déterminants"
],
0,
""
],
[
"Les mots « et, ou, mais, car » sont des…",
[
"conjonctions",
"prépositions",
"adverbes",
"pronoms"
],
0,
""
],
[
"Les mots « vite, souvent, très, hier » sont des…",
[
"adverbes",
"adjectifs",
"prépositions",
"conjonctions"
],
0,
""
]
];

// Questions reprises de l'Arène du savoir
const ARENE = {"variables": [["Laquelle est une classe de mots variable ?", ["L'adjectif", "L'adverbe", "La préposition", "La conjonction"], 0, ""], ["Laquelle est une classe de mots invariable ?", ["L'adverbe", "Le nom", "Le déterminant", "Le verbe"], 0, ""], ["Combien y a-t-il de classes de mots variables ?", ["5", "3", "4", "8"], 0, "Le nom, le déterminant, l'adjectif, le pronom et le verbe."], ["Dans « Les petits chiens jouent. », le mot « petits » est…", ["un adjectif", "un nom", "un déterminant", "un verbe"], 0, ""], ["Dans « Les petits chiens jouent. », le mot « Les » est…", ["un déterminant", "un pronom", "un nom", "un adjectif"], 0, ""], ["Dans « Elle mange une poire. », le mot « Elle » est…", ["un pronom", "un déterminant", "un nom", "un verbe"], 0, ""], ["Dans « Nous finissons le casse-tête. », le mot « finissons » est…", ["un verbe", "un nom", "un adjectif", "un adverbe"], 0, ""], ["Quel mot est un nom ?", ["bonheur", "heureux", "heureusement", "très"], 0, ""], ["Quel mot est un déterminant ?", ["ces", "rapide", "courir", "jamais"], 0, ""], ["Dans « Mon vélo rouge roule vite. », quel mot est invariable ?", ["vite", "vélo", "rouge", "Mon"], 0, ""], ["Quel mot peut varier en genre et en nombre ?", ["beau", "hier", "sous", "et"], 0, ""], ["Dans « Ils mangent des pommes juteuses. », quel mot est un adjectif ?", ["juteuses", "Ils", "mangent", "des"], 0, ""], ["Dans « Notre enseignante explique la leçon. », quel mot est un nom ?", ["enseignante", "Notre", "explique", "la"], 0, ""], ["Dans « La neige recouvre le jardin. », le mot « neige » est…", ["un nom", "un verbe", "un adjectif", "un pronom"], 0, ""], ["Dans « Ces souliers sont trop petits. », le mot « Ces » est…", ["un déterminant", "un pronom", "un adjectif", "un nom"], 0, ""], ["Dans « Nous visitons le musée. », le mot « Nous » est…", ["un pronom", "un déterminant", "un nom", "un verbe"], 0, ""], ["Dans « Le chien boit de l'eau fraîche. », le mot « fraîche » est…", ["un adjectif", "un nom", "un verbe", "un adverbe"], 0, ""], ["Dans « Les oiseaux construisent leur nid. », le mot « construisent » est…", ["un verbe", "un nom", "un adjectif", "un déterminant"], 0, ""], ["Dans « Mon cousin habite à Sherbrooke. », le mot « Mon » est…", ["un déterminant", "un pronom", "un nom", "un adjectif"], 0, ""], ["Dans « Tu cours souvent le matin. », le mot « souvent » est…", ["un adverbe (invariable)", "un adjectif", "un verbe", "un nom"], 0, ""], ["Dans « Elles regardent un film drôle. », le mot « drôle » est…", ["un adjectif", "un nom", "un verbe", "un déterminant"], 0, ""], ["Dans « Le facteur apporte les lettres. », le mot « facteur » est…", ["un nom", "un verbe", "un adjectif", "un pronom"], 0, ""], ["Dans « Ils jouent dehors avec leurs amis. », le mot « Ils » est…", ["un pronom", "un déterminant", "un nom", "un adverbe"], 0, ""], ["Dans « Plusieurs élèves lèvent la main. », le mot « Plusieurs » est…", ["un déterminant", "un adjectif", "un pronom", "un adverbe"], 0, ""], ["Dans « Le gâteau sent bon. », le mot « sent » est…", ["un verbe", "un nom", "un adjectif", "un adverbe"], 0, ""], ["Quel mot est un verbe ?", ["grandir", "grand", "grandeur", "grandement"], 0, ""], ["Quel mot est un adjectif ?", ["courageux", "courage", "courageusement", "encourager"], 0, ""], ["Quel mot est un pronom ?", ["vous", "votre", "vos", "voisin"], 0, ""], ["Quel mot est un déterminant ?", ["quelques", "quelqu'un", "quelquefois", "quelconque"], 0, "« quelques » s'emploie devant un nom : quelques amis."], ["Quel mot est un nom commun ?", ["patinoire", "patiner", "patiné", "Patricia"], 0, ""], ["Quel mot est invariable ?", ["aujourd'hui", "joyeux", "maison", "chanter"], 0, ""], ["Quel truc aide à reconnaître un nom commun ?", ["On peut mettre « un » ou « une » devant.", "On peut le conjuguer.", "On peut mettre « très » devant.", "On peut le remplacer par « là »."], 0, ""], ["Quel truc aide à reconnaître un verbe ?", ["On peut le conjuguer (je…, nous…).", "On peut mettre « le » devant.", "On peut mettre « très » devant.", "Il ne change jamais."], 0, ""], ["Quel truc aide à reconnaître un adjectif ?", ["On peut souvent mettre « très » devant.", "On peut le conjuguer.", "On peut mettre « un » devant.", "Il remplace un GN."], 0, ""], ["Le pronom sert à…", ["remplacer un mot ou un groupe de mots", "décrire un nom", "exprimer une action", "relier deux phrases"], 0, ""], ["Quelles classes de mots sont toutes variables ?", ["nom, déterminant, adjectif, pronom, verbe", "nom, adverbe, préposition", "verbe, conjonction, adverbe", "préposition, conjonction, adverbe"], 0, ""], ["Dans « La petite fille rit. », combien y a-t-il de mots variables ?", ["4", "2", "3", "1"], 0, "La (dét.), petite (adj.), fille (nom), rit (verbe)."], ["Le verbe varie selon…", ["la personne, le nombre et le temps", "le genre seulement", "rien : il est invariable", "la longueur de la phrase"], 0, ""], ["Quel mot est une préposition (invariable) ?", ["avec", "avocat", "avant-bras", "aveugle"], 0, ""], ["Dans « Elle range ses crayons dans sa trousse. », quel mot est un pronom ?", ["Elle", "ses", "sa", "trousse"], 0, ""], ["Dans « Ce gros camion transporte du bois. », quel mot est un verbe ?", ["transporte", "Ce", "gros", "bois"], 0, ""], ["Dans « Nos parents sont fiers. », quel mot est un déterminant ?", ["Nos", "parents", "sont", "fiers"], 0, ""], ["Quel mot change au féminin ?", ["sportif → sportive", "vite → vite", "hier → hier", "sous → sous"], 0, ""]], "phrase": [["Quels sont les deux constituants obligatoires de la phrase de base ?", ["Le sujet et le prédicat", "Le sujet et le complément de phrase", "Le prédicat et le complément de phrase", "Le nom et l'adjectif"], 0, ""], ["Dans « Le chat dort sur le divan. », quel est le sujet ?", ["Le chat", "dort", "dort sur le divan", "le divan"], 0, ""], ["Dans « Mes amis jouent au soccer. », quel est le prédicat ?", ["jouent au soccer", "Mes amis", "au soccer", "Mes"], 0, ""], ["Dans « Ce matin, Léa mange une pomme. », quel groupe est le complément de phrase ?", ["Ce matin", "Léa", "mange une pomme", "une pomme"], 0, ""], ["Quel constituant de la phrase peut être déplacé ou effacé ?", ["Le complément de phrase", "Le sujet", "Le prédicat", "Le verbe"], 0, ""], ["Le prédicat contient toujours…", ["un verbe conjugué", "un nom propre", "un adjectif", "un complément de phrase"], 0, ""], ["Quelle manipulation aide à trouver le sujet ?", ["L'encadrer par « C'est… qui »", "Le déplacer au début de la phrase", "L'effacer", "Le remplacer par « là »"], 0, ""], ["Dans « Pendant la récréation, les élèves courent. », quel est le sujet ?", ["les élèves", "Pendant la récréation", "courent", "la récréation"], 0, ""], ["Quelle phrase contient un complément de phrase ?", ["Samedi, nous irons au parc.", "Le chien aboie.", "Julie chante.", "Mon frère est grand."], 0, ""], ["Dans « Les oiseaux chantent dans la forêt. », le groupe « dans la forêt » est…", ["un complément de phrase", "le sujet", "le prédicat", "un adjectif"], 0, "On peut le déplacer : « Dans la forêt, les oiseaux chantent. »"], ["Dans quel ordre sont placés les constituants de la phrase de base ?", ["Sujet + prédicat + complément de phrase", "Prédicat + sujet + complément de phrase", "Complément de phrase + prédicat + sujet", "Prédicat + complément de phrase + sujet"], 0, ""], ["Dans « Il neige beaucoup en hiver. », quel est le sujet ?", ["Il", "neige", "en hiver", "beaucoup"], 0, ""], ["Dans « Après l'école, Samuel fait ses devoirs. », quel est le prédicat ?", ["fait ses devoirs", "Après l'école", "Samuel", "ses devoirs"], 0, ""], ["Dans « La pluie tombe depuis ce matin. », quel est le sujet ?", ["La pluie", "tombe", "depuis ce matin", "ce matin"], 0, "Truc : « C'est… qui » encadre le sujet."], ["Dans « Mon grand-père répare la clôture. », quel est le sujet ?", ["Mon grand-père", "répare la clôture", "la clôture", "répare"], 0, "Truc : « C'est… qui » encadre le sujet."], ["Dans « Les joueurs de hockey patinent vite. », quel est le sujet ?", ["Les joueurs de hockey", "patinent vite", "de hockey", "vite"], 0, "Truc : « C'est… qui » encadre le sujet."], ["Dans « Demain, ma tante arrivera de Québec. », quel est le sujet ?", ["ma tante", "Demain", "arrivera de Québec", "de Québec"], 0, "Truc : « C'est… qui » encadre le sujet."], ["Dans « Vous lisez un roman d'aventures. », quel est le sujet ?", ["Vous", "lisez", "un roman d'aventures", "lisez un roman"], 0, "Truc : « C'est… qui » encadre le sujet."], ["Dans « Sur la table, le chat de Léo dort. », quel est le sujet ?", ["le chat de Léo", "Sur la table", "dort", "Léo"], 0, "Truc : « C'est… qui » encadre le sujet."], ["Dans « Nos voisins construisent une cabane. », quel est le sujet ?", ["Nos voisins", "construisent une cabane", "une cabane", "construisent"], 0, "Truc : « C'est… qui » encadre le sujet."], ["Dans « Le hibou chasse la nuit. », quel est le prédicat ?", ["chasse", "Le hibou", "la nuit", "Le hibou chasse"], 0, "Le prédicat dit ce qu'on dit du sujet ; il contient le verbe conjugué."], ["Dans « Ma sœur prépare des crêpes. », quel est le prédicat ?", ["prépare des crêpes", "Ma sœur", "des crêpes", "Ma sœur prépare"], 0, "Le prédicat dit ce qu'on dit du sujet ; il contient le verbe conjugué."], ["Dans « En été, les enfants se baignent au lac. », quel est le prédicat ?", ["se baignent au lac", "En été", "les enfants", "au lac"], 0, "Le prédicat dit ce qu'on dit du sujet ; il contient le verbe conjugué."], ["Dans « Thomas offre des fleurs à sa mère. », quel est le prédicat ?", ["offre des fleurs à sa mère", "Thomas", "des fleurs", "à sa mère"], 0, "Le prédicat dit ce qu'on dit du sujet ; il contient le verbe conjugué."], ["Dans « Le vent souffle fort. », quel est le prédicat ?", ["souffle fort", "Le vent", "fort", "Le vent souffle"], 0, "Le prédicat dit ce qu'on dit du sujet ; il contient le verbe conjugué."], ["Dans « Chaque soir, Amir promène son chien. », quel est le prédicat ?", ["promène son chien", "Chaque soir", "Amir", "son chien"], 0, "Le prédicat dit ce qu'on dit du sujet ; il contient le verbe conjugué."], ["Dans « Au printemps, les arbres fleurissent. », quel est le complément de phrase ?", ["Au printemps", "les arbres", "fleurissent", "les arbres fleurissent"], 0, "Le complément de phrase peut être déplacé ou effacé."], ["Dans « Julien joue du piano depuis deux ans. », quel est le complément de phrase ?", ["depuis deux ans", "Julien", "joue du piano", "du piano"], 0, "Le complément de phrase peut être déplacé ou effacé."], ["Dans « Les élèves dînent à midi. », quel est le complément de phrase ?", ["à midi", "Les élèves", "dînent", "dînent à midi"], 0, "Le complément de phrase peut être déplacé ou effacé."], ["Dans « Parce qu'il pleut, nous restons à l'intérieur. », quel est le complément de phrase ?", ["Parce qu'il pleut", "nous", "restons à l'intérieur", "à l'intérieur"], 0, "Le complément de phrase peut être déplacé ou effacé."], ["Quelle phrase n'a PAS de complément de phrase ?", ["Les chats aiment le lait.", "Le soir, je lis.", "Je lis le soir.", "À l'école, Zoé chante."], 0, ""], ["Quelle phrase respecte l'ordre de la phrase de base ?", ["Les fourmis travaillent fort cet été.", "Cet été travaillent fort les fourmis.", "Travaillent les fourmis fort.", "Fort travaillent les fourmis."], 0, ""], ["Quelle manipulation montre qu'un groupe est un complément de phrase ?", ["On peut le déplacer en début de phrase.", "On peut l'encadrer par « C'est… qui ».", "On peut le remplacer par « il ».", "On ne peut jamais l'effacer."], 0, ""], ["Quand le complément de phrase est au début de la phrase, on met…", ["une virgule après lui", "un point après lui", "un point d'exclamation", "rien du tout"], 0, ""], ["Par quel pronom peut-on remplacer le sujet « Mon frère et moi » ?", ["Nous", "Ils", "Vous", "Je"], 0, ""], ["Dans « Elles adorent la musique. », le sujet est…", ["un pronom", "un nom commun", "un adjectif", "un verbe"], 0, ""], ["Quelle phrase a un sujet formé d'un nom propre ?", ["Gabriel court vite.", "Le garçon court vite.", "Il court vite.", "Ce sportif court vite."], 0, ""], ["Le sujet répond à la question…", ["Qui est-ce qui ? ou Qu'est-ce qui ?", "Quand ?", "Où ?", "Pourquoi ?"], 0, ""], ["Dans une phrase, quels constituants peut-on effacer ?", ["Le complément de phrase seulement", "Le sujet seulement", "Le prédicat seulement", "Tous les constituants"], 0, ""], ["Laquelle est une phrase complète ?", ["Le soleil brille.", "Le soleil.", "Brille dans le ciel.", "Dans le ciel bleu."], 0, "Il faut un sujet ET un prédicat."]], "gn": [["Quel groupe de mots est un groupe du nom (GN) ?", ["la grande maison", "mange vite", "très gentil", "dans le parc"], 0, ""], ["Le noyau d'un GN est…", ["un nom ou un pronom", "un verbe", "un adjectif", "un adverbe"], 0, ""], ["Dans le GN « le petit chat gris », quel est le noyau ?", ["chat", "petit", "gris", "le"], 0, ""], ["Quel GN est formé d'un nom propre seul ?", ["Montréal", "la ville", "une rue", "ce quartier"], 0, ""], ["Quel GN est formé d'un pronom ?", ["Elle", "Sa sœur", "Une fille", "Cette amie"], 0, ""], ["Quelle est la construction du GN « un chien noir » ?", ["Dét. + Nom + Adj.", "Dét. + Adj. + Nom", "Adj. + Nom + Dét.", "Nom + Dét. + Adj."], 0, ""], ["Quelle est la construction du GN « une belle journée » ?", ["Dét. + Adj. + Nom", "Dét. + Nom + Adj.", "Nom + Adj. + Dét.", "Adj. + Dét. + Nom"], 0, ""], ["Dans le GN « une robe bleue », quel mot est l'expansion du nom ?", ["bleue", "une", "robe", "Il n'y en a pas."], 0, ""], ["Un nom commun est habituellement précédé…", ["d'un déterminant", "d'un pronom", "d'un verbe", "d'un adverbe"], 0, ""], ["Quel mot est un nom propre ?", ["Gatineau", "gâteau", "garçon", "grand"], 0, ""], ["Par quel pronom peut-on remplacer le GN « Les enfants » ?", ["Ils", "Elle", "Nous", "Lui"], 0, ""], ["Dans « Ma meilleure amie arrive. », quel est le GN sujet ?", ["Ma meilleure amie", "arrive", "meilleure", "amie arrive"], 0, ""], ["Quel groupe de mots n'est PAS un GN ?", ["courent vite", "Simon", "mes livres", "nous"], 0, ""], ["Par quel pronom peut-on remplacer le GN « Marie et Zoé » ?", ["Elles", "Ils", "Elle", "Vous"], 0, ""], ["Dans le GN « une tarte aux pommes », quel est le noyau ?", ["tarte", "une", "pommes", "aux"], 0, "Le noyau du GN est le nom (ou le pronom)."], ["Dans le GN « mes nouvelles bottes », quel est le noyau ?", ["bottes", "mes", "nouvelles", "nouvelles bottes"], 0, "Le noyau du GN est le nom (ou le pronom)."], ["Dans le GN « le vieux château abandonné », quel est le noyau ?", ["château", "vieux", "abandonné", "le"], 0, "Le noyau du GN est le nom (ou le pronom)."], ["Dans le GN « cette jolie chanson », quel est le noyau ?", ["chanson", "jolie", "cette", "jolie chanson"], 0, "Le noyau du GN est le nom (ou le pronom)."], ["Dans le GN « trois chats affamés », quel est le noyau ?", ["chats", "trois", "affamés", "trois chats"], 0, "Le noyau du GN est le nom (ou le pronom)."], ["Quelle est la construction du GN « le ciel » ?", ["Dét. + Nom", "Nom + Adj.", "Dét. + Adj.", "Nom seul"], 0, ""], ["Quelle est la construction du GN « Frédéric » ?", ["Nom propre seul", "Dét. + Nom", "Pronom", "Dét. + Nom + Adj."], 0, ""], ["Quelle est la construction du GN « un énorme dragon vert » ?", ["Dét. + Adj. + Nom + Adj.", "Dét. + Nom + Adj.", "Dét. + Adj. + Nom", "Adj. + Nom + Adj."], 0, ""], ["Quelle est la construction du GN « des pantalons courts » ?", ["Dét. + Nom + Adj.", "Dét. + Adj. + Nom", "Nom + Adj.", "Dét. + Nom"], 0, ""], ["Quelle est la construction du GN « le livre de Maya » ?", ["Dét. + Nom + Prép. + Nom", "Dét. + Nom + Adj.", "Dét. + Nom", "Nom + Prép. + Dét."], 0, ""], ["Quelle est la construction du GN « un petit chien » ?", ["Dét. + Adj. + Nom", "Dét. + Nom + Adj.", "Adj. + Dét. + Nom", "Dét. + Nom"], 0, ""], ["Dans le GN « une voiture rapide », quelle est l'expansion du nom ?", ["rapide", "une", "voiture", "Il n'y en a pas."], 0, "L'expansion complète le nom : un adjectif, ou un groupe qui commence par une préposition."], ["Dans le GN « un verre de lait », quelle est l'expansion du nom ?", ["de lait", "un", "verre", "lait seulement"], 0, "L'expansion complète le nom : un adjectif, ou un groupe qui commence par une préposition."], ["Dans le GN « la maison de mes grands-parents », quelle est l'expansion du nom ?", ["de mes grands-parents", "la", "maison", "mes"], 0, "L'expansion complète le nom : un adjectif, ou un groupe qui commence par une préposition."], ["Dans le GN « une grande cour », quelle est l'expansion du nom ?", ["grande", "une", "cour", "Il n'y en a pas."], 0, "L'expansion complète le nom : un adjectif, ou un groupe qui commence par une préposition."], ["Quel GN contient une expansion ?", ["un ballon rouge", "un ballon", "le ballon", "Simon"], 0, ""], ["Quel GN est formé de Dét. + Nom + Adj. ?", ["une tuque chaude", "une chaude tuque", "ma tuque", "Charlotte"], 0, ""], ["Quel GN est formé de Dét. + Adj. + Nom ?", ["une longue route", "une route longue", "la route", "Gaspé"], 0, ""], ["Quel GN est formé d'un pronom ?", ["Nous", "Notre classe", "Nos amis", "Une classe"], 0, ""], ["Par quel pronom peut-on remplacer le GN « la piscine municipale » ?", ["Elle", "Il", "Elles", "Ils"], 0, ""], ["Par quel pronom peut-on remplacer le GN « mon père et ma mère » ?", ["Ils", "Elles", "Il", "Nous"], 0, "Un masculin et un féminin ensemble : on utilise le masculin pluriel."], ["Par quel pronom peut-on remplacer le GN « Antoine et toi » ?", ["Vous", "Ils", "Nous", "Tu"], 0, ""], ["Dans « Le vieux pêcheur lance sa ligne. », quel est le GN sujet ?", ["Le vieux pêcheur", "lance sa ligne", "sa ligne", "vieux pêcheur"], 0, ""], ["Dans « Ma petite sœur dessine un arc-en-ciel. », combien y a-t-il de GN ?", ["2", "1", "3", "4"], 0, "« Ma petite sœur » et « un arc-en-ciel »."], ["Quel groupe de mots n'est PAS un GN ?", ["très rapidement", "un écureuil", "Laval", "ils"], 0, ""], ["Quel groupe de mots est un GN ?", ["les feuilles mortes", "tombent doucement", "sous l'arbre", "très mortes"], 0, "« sous l'arbre » commence par une préposition : c'est un groupe prépositionnel."], ["Dans un GN, le déterminant se place…", ["avant le nom", "toujours à la fin", "après l'adjectif qui suit le nom", "n'importe où"], 0, ""], ["Un nom propre commence par…", ["une majuscule", "une minuscule", "un déterminant obligatoire", "un chiffre"], 0, ""], ["Dans « Le chandail de Nadia est bleu. », le GN « de Nadia » complète…", ["le nom « chandail »", "le verbe « est »", "l'adjectif « bleu »", "le déterminant « Le »"], 0, ""], ["Dans un GN, quel mot donne son genre et son nombre aux autres mots ?", ["Le nom", "L'adjectif", "Le déterminant", "Le verbe"], 0, ""], ["Complète : « des fleurs ___ »", ["blanches", "blanc", "blanche", "blancs"], 0, ""], ["Complète : « une ___ idée »", ["bonne", "bon", "bons", "bonnes"], 0, ""], ["Complète : « les chevaux ___ »", ["noirs", "noir", "noires", "noire"], 0, ""], ["Quel GN est bien accordé ?", ["les grandes tours", "la grandes tour", "les grande tours", "le grandes tour"], 0, ""], ["Complète : « mes amies ___ »", ["gentilles", "gentils", "gentille", "gentil"], 0, ""], ["Quel est le pluriel de « un travail difficile » ?", ["des travaux difficiles", "des travails difficiles", "des travaux difficile", "des travail difficiles"], 0, ""], ["Complète : « ces garçons ___ »", ["heureux", "heureuxs", "heureuse", "heureuses"], 0, ""], ["Complète : « une chemise ___ »", ["neuve", "neuf", "neufs", "neuves"], 0, ""], ["Dans « les jolies maisons », l'adjectif « jolies » est au…", ["féminin pluriel", "masculin pluriel", "féminin singulier", "masculin singulier"], 0, ""], ["Complète : « de ___ cadeaux »", ["beaux", "belles", "beau", "bels"], 0, ""], ["Dans un GN, quels mots reçoivent le genre et le nombre du nom ?", ["Le déterminant et l'adjectif", "Le verbe et l'adverbe", "Le pronom et la préposition", "Le sujet et le prédicat"], 0, ""], ["Quel GN est bien accordé ?", ["des journaux intéressants", "des journals intéressants", "des journaux intéressant", "un journaux intéressant"], 0, ""], ["Complète : « des chiens ___ »", ["méchants", "méchant", "méchante", "méchantes"], 0, "L'adjectif prend le genre et le nombre du nom qu'il accompagne."], ["Complète : « une ___ montagne »", ["haute", "haut", "hauts", "hautes"], 0, "L'adjectif prend le genre et le nombre du nom qu'il accompagne."], ["Complète : « les filles ___ »", ["sportives", "sportif", "sportifs", "sportive"], 0, "L'adjectif prend le genre et le nombre du nom qu'il accompagne."], ["Complète : « un ___ arbre »", ["vieil", "vieux", "vieille", "vieilles"], 0, "L'adjectif prend le genre et le nombre du nom qu'il accompagne."], ["Complète : « des histoires ___ »", ["drôles", "drôle", "drôlent", "drôls"], 0, "L'adjectif prend le genre et le nombre du nom qu'il accompagne."], ["Complète : « une soupe ___ »", ["chaude", "chaud", "chauds", "chaudes"], 0, "L'adjectif prend le genre et le nombre du nom qu'il accompagne."], ["Complète : « des oiseaux ___ »", ["bleus", "bleu", "bleue", "bleues"], 0, "L'adjectif prend le genre et le nombre du nom qu'il accompagne."], ["Complète : « les ___ vacances »", ["longues", "longs", "long", "longue"], 0, "L'adjectif prend le genre et le nombre du nom qu'il accompagne."], ["Complète : « une ___ nouvelle »", ["bonne", "bon", "bons", "bonnes"], 0, "L'adjectif prend le genre et le nombre du nom qu'il accompagne."], ["Complète : « des bateaux ___ »", ["rapides", "rapide", "rapidement", "rapids"], 0, "L'adjectif prend le genre et le nombre du nom qu'il accompagne."], ["Complète : « une fille ___ »", ["créative", "créatif", "créatifs", "créatives"], 0, "L'adjectif prend le genre et le nombre du nom qu'il accompagne."], ["Complète : « des yeux ___ »", ["verts", "vert", "verte", "vertes"], 0, "L'adjectif prend le genre et le nombre du nom qu'il accompagne."], ["Quel est le pluriel de « un animal sauvage » ?", ["des animaux sauvages", "des animals sauvages", "des animaux sauvage", "des animal sauvages"], 0, ""], ["Quel est le pluriel de « un cheveu blond » ?", ["des cheveux blonds", "des cheveus blonds", "des cheveux blond", "des cheveu blonds"], 0, ""], ["Quel est le pluriel de « un bijou précieux » ?", ["des bijoux précieux", "des bijous précieux", "des bijoux précieuxs", "des bijou précieux"], 0, ""], ["Quel est le pluriel de « un ami fidèle » ?", ["des amis fidèles", "des amis fidèle", "des ami fidèles", "des amies fidèle"], 0, ""], ["Quel est le pluriel de « une souris grise » ?", ["des souris grises", "des souriss grises", "des souris grise", "des souris gris"], 0, ""], ["Quel est le féminin de « un acteur célèbre » ?", ["une actrice célèbre", "une acteure célèbre", "une actrice célèbres", "un actrice célèbre"], 0, ""], ["Quel est le féminin de « un chanteur joyeux » ?", ["une chanteuse joyeuse", "une chanteure joyeuse", "une chanteuse joyeux", "un chanteuse joyeuse"], 0, ""], ["Quel est le féminin de « un lion courageux » ?", ["une lionne courageuse", "une lione courageuse", "une lionne courageux", "un lionne courageuse"], 0, ""], ["Quel GN est bien accordé ?", ["des chandails chauds", "des chandail chauds", "des chandails chaud", "un chandails chauds"], 0, ""], ["Quel GN est bien accordé ?", ["une tempête terrible", "une tempêtes terrible", "un tempête terrible", "une tempête terribles"], 0, ""], ["Quel GN est mal accordé ?", ["les belle étoiles", "les belles étoiles", "une belle étoile", "la belle étoile"], 0, ""], ["Quel GN est mal accordé ?", ["des crayon neufs", "des crayons neufs", "un crayon neuf", "ce crayon neuf"], 0, ""], ["Dans « des tulipes jaunes », le nom « tulipes » est…", ["féminin pluriel", "masculin pluriel", "féminin singulier", "masculin singulier"], 0, ""], ["Dans « un hiver froid », l'adjectif « froid » est au…", ["masculin singulier", "féminin singulier", "masculin pluriel", "féminin pluriel"], 0, ""], ["Dans un GN, le déterminant et l'adjectif s'accordent avec…", ["le nom noyau", "le verbe", "le premier mot de la phrase", "le sujet de la phrase"], 0, ""], ["Complète : « ___ grands arbres » (beaucoup d'arbres)", ["Ces", "Cet", "Cette", "Ce"], 0, ""], ["Complète : « ___ ordinateur » (un seul)", ["Cet", "Ces", "Cette", "Ce"], 0, "Devant un nom masculin qui commence par une voyelle, on écrit « cet »."], ["Complète : « des souliers et des bottes ___ »", ["noirs", "noires", "noir", "noire"], 0, "Plusieurs noms de genres différents : l'adjectif se met au masculin pluriel."]], "accverbe": [["À quel groupe appartient le verbe « choisir » ?", ["2e groupe", "1er groupe", "3e groupe", "Il n'a pas de groupe."], 0, "On dit « nous choisissons » : c'est un verbe du 2e groupe."], ["Quel verbe est du 1er groupe ?", ["chanter", "finir", "prendre", "venir"], 0, ""], ["Avec quel mot le verbe s'accorde-t-il ?", ["Avec le noyau du sujet", "Avec le complément de phrase", "Avec l'adjectif", "Avec le déterminant"], 0, ""], ["À l'imparfait, quelle est la terminaison avec « nous » ?", ["-ions", "-ons", "-ez", "-aient"], 0, ""], ["Au présent, les verbes du 1er groupe se terminent par quoi avec « ils » ?", ["-ent", "-ont", "-es", "-ez"], 0, ""], ["Complète : « Mes cousins ___ (jouer) dehors. » (présent)", ["jouent", "joue", "joues", "jouez"], 0, ""], ["Complète : « Ma sœur et moi ___ (finir) nos devoirs. » (présent)", ["finissons", "finissent", "finit", "finissez"], 0, "« Ma sœur et moi » = nous."]]};
// ===== Notions de la planification de 5e année (une quête par mois) =====
// Chaque notion a un générateur qui renvoie [question, choix (bonne réponse en premier), 0, explication, dessin SVG?]
const NOTIONS = {
  maths: {
    calcul: "Calcul (+ − × ÷)",
    numeration: "Numération (position, premiers, carrés, exposants)",
    temps: "Mesure du temps et durée",
    fracsens: "Sens des fractions et fractions sur la droite numérique",
    multpos: "Multiplication posée (3 chiffres × 2 chiffres)",
    solides: "Solides (prismes, pyramides, développements)",
    aire: "Aire et volume",
    entiers: "Nombres entiers (négatifs) sur la droite numérique",
    transfo: "Translation, frise et dallage",
    arrondi: "Arrondir (approximation)",
    divis: "Divisibilité, division avec reste, facteurs",
    pemdas: "Priorité des opérations et terme manquant",
    moyenne: "Moyenne arithmétique",
    equiv: "Fractions équivalentes",
    reduc: "Réduction de fractions",
    compfrac: "Comparer et ordonner des fractions",
    addfrac: "Additionner et soustraire des fractions",
    pourcent: "Fractions, décimaux et pourcentages",
    droites: "Droites parallèles et perpendiculaires",
    angles: "Angles",
    triangles: "Triangles",
    cartesien: "Plan cartésien",
    decimaux: "Nombres décimaux (lire, comparer, arrondir)",
    decrep: "Nombres décimaux : représentation, comparaison et ordre",
    cercle: "Le cercle (centre, rayon, diamètre, circonférence)",
    longueur: "Mesures de longueur (mm, cm, dm, m, km)",
    opdec: "Opérations sur les nombres décimaux",
    multfrac: "Multiplication de fractions",
    stats: "Diagrammes (bandes, ligne brisée, circulaire)",
    mesures: "Mesures (temps, température, longueur, masse, capacité)",
    proba: "Probabilités",
  },
  fr: {
    vocab: "Homophones et vocabulaire",
    variables: "Classes de mots variables",
    manip: "Manipulations syntaxiques",
    phrase: "Phrase de base et constituants",
    enrichie: "Phrase de base enrichie",
    gn: "Groupe du nom et accords dans le GN",
    inv: "Classes de mots invariables",
    accverbe: "Accord du verbe avec le sujet",
    ponct: "Phrase complexe et ponctuation (virgule, dialogue)",
    sens: "Formation et sens des mots",
    types: "Types et formes de phrases",
    pp: "Participe passé (seul ou avec être)",
    compl: "Compléments du verbe (CD, CI) et attribut",
    ppa: "Accord du participe passé avec avoir",
    conj: "Conjugaison : présent et imparfait (mélange)",
    c_pres: "Conjugaison : présent",
    c_imp: "Conjugaison : imparfait",
    c_fut: "Conjugaison : futur simple",
    c_ps: "Conjugaison : passé simple",
    c_cond: "Conjugaison : conditionnel présent",
    c_impe: "Conjugaison : impératif et participe présent",
    c_pc: "Conjugaison : passé composé",
    c_pqp: "Conjugaison : plus-que-parfait",
    c_comp: "Conjugaison : futur antérieur et conditionnel passé",
  },
};
const NOTIONS_DEFAUT = { maths: ["calcul"], fr: ["vocab", "conj"] };
// La planification de l'année : les notions de chaque mois
const MOIS_NOTIONS = {
  // Maths : suite des sections des Irréductibles 5e (Superplanification A et B), au rythme de la classe (novembre = sections 7 à 10)
  septembre: { nom: "Septembre", maths: ["numeration", "angles", "temps"], fr: ["manip", "phrase", "variables", "c_pres", "vocab"] },
  octobre: { nom: "Octobre", maths: ["droites", "triangles", "fracsens", "arrondi", "multpos"], fr: ["gn", "c_imp", "vocab"] },
  novembre: { nom: "Novembre", maths: ["equiv", "reduc", "decrep", "cercle", "longueur"], fr: ["inv", "enrichie", "accverbe", "c_fut"] },
  decembre: { nom: "Décembre", maths: ["compfrac", "numeration", "divis"], fr: ["ponct", "c_ps"] },
  janvier: { nom: "Janvier", maths: ["decimaux", "opdec", "solides", "stats"], fr: ["sens", "c_cond"] },
  fevrier: { nom: "Février", maths: ["numeration", "pourcent", "aire", "solides", "entiers"], fr: ["types", "c_impe"] },
  mars: { nom: "Mars", maths: ["moyenne", "stats", "pemdas", "opdec", "addfrac"], fr: ["pp", "c_pc"] },
  avril: { nom: "Avril", maths: ["mesures", "cartesien", "addfrac", "proba"], fr: ["compl", "c_pqp"] },
  mai: { nom: "Mai", maths: ["pemdas", "divis", "multfrac", "opdec", "transfo", "proba"], fr: ["pp", "ppa", "c_comp"] },
  juin: { nom: "Juin (révision)", maths: ["multpos", "equiv", "decimaux", "opdec", "aire", "stats", "mesures", "proba"], fr: ["gn", "accverbe", "compl", "ppa", "c_pc", "c_fut"] },
};
const QUETE_MOIS = { "rentree-academie": "septembre", "octobre-ferme": "octobre", "halloween-vladislav": "octobre", "novembre-lugubre": "novembre", "decembre-noel": "decembre",
  "janvier-yeti": "janvier", "fevrier-valentin": "fevrier", "mars-sorciers": "mars", "avril-paques": "avril", "mai-cite": "mai", "juin-depart": "juin" };
const notionsMois = id => { const m = MOIS_NOTIONS[QUETE_MOIS[id]]; return m ? { maths: m.maths, fr: m.fr } : undefined; };
// Priorité : notions cochées dans la quête, puis celles de son mois, puis Réglages, puis le défaut
function notionsActives(m) {
  const mois = QUETE && MOIS_NOTIONS[QUETE_MOIS[QUETE.id]];
  const src = (QUETE && QUETE.notions && QUETE.notions[m]) || (mois && mois[m]) || (PREF.notions && PREF.notions[m]) || NOTIONS_DEFAUT[m];
  const l = src.filter(k => NOTIONS[m][k]); return l.length ? l : NOTIONS_DEFAUT[m];
}

// ---------- outils ----------
const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pk = a => a[Math.floor(Math.random() * a.length)];
const mel = a => [...a].sort(() => Math.random() - .5);
const nb = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
const dec = (n, k) => { const s = (Math.round(n * 10 ** k) / 10 ** k).toFixed(k).replace(".", ","); const [e, d] = s.split(","); return nb(e) + (d !== undefined ? "," + d : ""); };
const decC = n => dec(n, 2).replace(/,?0+$/, "") || "0"; // sans zéros inutiles
// 4 choix : la bonne réponse, puis 3 leurres différents
const qc = (q, bon, leurres, expl, svg) => { bon = String(bon); const l = []; for (const x of leurres.map(String)) if (x !== bon && !l.includes(x) && !/NaN|undefined/.test(x)) l.push(x); return [q, [bon, ...l.slice(0, 3)], 0, expl || "", svg]; };
const pgcd = (a, b) => b ? pgcd(b, a % b) : a;
function fracSimple() { for (;;) { const b = ri(2, 12), a = ri(1, b - 1); if (pgcd(a, b) === 1) return [a, b]; } }
const qcm = (q, bon, leurres, expl) => qc(q, bon, mel(leurres.map(String).filter(x => !/(^|\/)0$|^0\//.test(x))), expl);
const svgBox = (w, h, c) => `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" style="max-width:100%;height:auto">${c}</svg>`;

// ---------- Septembre : numération ----------
const POS = ["unités", "dizaines", "centaines", "unités de mille", "dizaines de mille", "centaines de mille"];
const PREMIERS = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97];
const COMPOSES = [9, 15, 21, 25, 27, 33, 35, 39, 45, 49, 51, 55, 57, 63, 65, 69, 77, 81, 85, 87, 91, 93, 95];
function genNumeration() {
  const t = ri(0, 7);
  if (t === 0) {
    const n = ri(10000, 999999), s = String(n), p = ri(0, s.length - 1), c = s[s.length - 1 - p];
    return qc(`Dans le nombre ${nb(n)}, quel chiffre est à la position des ${POS[p]}?`, c, mel([...new Set(s.split(""))]).concat(["0", "9", "1"]), `En partant de la droite : unités, dizaines, centaines, unités de mille…`);
  }
  if (t === 1) {
    const n = ri(10000, 999999), s = String(n); let p = ri(1, s.length - 1); while (s[s.length - 1 - p] === "0") p = ri(1, s.length - 1);
    const c = +s[s.length - 1 - p], v = c * 10 ** p;
    return qc(`Quelle est la valeur du chiffre ${c} dans ${nb(n)}?`, nb(v), [nb(v * 10), nb(v / 10), String(c), nb(v * 100)], `Le ${c} est à la position des ${POS[p]} : il vaut ${nb(v)}.`);
  }
  if (t === 2) {
    const n = ri(10000, 99999), s = String(n), parts = s.split("").map((c, i) => +c * 10 ** (s.length - 1 - i)).filter(x => x);
    return qc(`Quel nombre correspond à ${parts.map(nb).join(" + ")}?`, nb(n), [nb(n + 1000), nb(n - 100), nb(n + 10), nb(+s.split("").reverse().join(""))], "On additionne la valeur de chaque position.");
  }
  if (t === 3) { const p = pk(PREMIERS.slice(4)); return qc("Lequel de ces nombres est un nombre premier?", p, mel(COMPOSES), `${p} n'a que deux diviseurs : 1 et ${p}. C'est un nombre premier.`); }
  if (t === 4) { const c = pk(COMPOSES); const d = [3, 5, 7].find(x => c % x === 0); return qc("Lequel de ces nombres est un nombre composé?", c, mel(PREMIERS.slice(3)), `${c} se divise par ${d} (${c} = ${d} × ${c / d}) : il a plus de deux diviseurs.`); }
  if (t === 5) { const r = ri(2, 12), n = r * r; return qc("Lequel de ces nombres est un nombre carré?", n, mel([n + 1, n - 2, r * (r + 1), 2 * r, n + 3, r * 10]), `${n} = ${r} × ${r}. On peut le dessiner en carré de ${r} sur ${r}.`); }
  if (t === 6) { const b = ri(2, 10), e = b > 5 ? 2 : ri(2, 3), v = b ** e; return qc(`Combien vaut ${b}${e === 2 ? "²" : "³"}?`, v, [b * e, b + e, Number(String(b) + e), v + b, e ** b], `${b}${e === 2 ? "²" : "³"} = ${Array(e).fill(b).join(" × ")} = ${v}. L'exposant dit combien de fois on multiplie le nombre par lui-même.`); }
  const b = ri(2, 9), e = ri(3, 5), sup = { 3: "³", 4: "⁴", 5: "⁵" };
  return qc(`Comment écrit-on ${Array(e).fill(b).join(" × ")} avec un exposant?`, b + sup[e], [e + ({ 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹" }[b]), `${b} × ${e}`, String(b * e)], `Le nombre ${b} est multiplié ${e} fois par lui-même : ${b}${sup[e]}.`);
}
// ---------- Octobre ----------
function genArrondi() {
  const n = ri(1000, 99999), [f, nom] = pk([[10, "à la dizaine près"], [100, "à la centaine près"], [1000, "à l'unité de mille près"]]), r = Math.round(n / f) * f;
  const autre = Math.floor(n / f) * f === r ? r + f : r - f;
  return qc(`Arrondis ${nb(n)} ${nom}.`, nb(r), [nb(autre), nb(r + 2 * f), nb(Math.round(n / (f * 10)) * f * 10), nb(n)], `On regarde le chiffre à droite de la position voulue : 5 ou plus, on monte; 4 ou moins, on garde. ${nb(n)} → ${nb(r)}.`);
}
const CRIT = { 2: "il se termine par 0, 2, 4, 6 ou 8", 3: "la somme de ses chiffres est dans la table de 3", 5: "il se termine par 0 ou 5", 9: "la somme de ses chiffres est dans la table de 9", 10: "il se termine par 0" };
function facteursPremiers(n) { const f = []; for (let p = 2; n > 1; p++) while (n % p === 0) { f.push(p); n /= p; } return f; }
function genDivis() {
  const t = ri(0, 3);
  if (t === 0) {
    const d = pk([2, 3, 5, 9, 10]), bon = d * ri(12, 111);
    const faux = []; while (faux.length < 6) { const x = ri(100, 999); if (x % d && !faux.includes(x)) faux.push(x); }
    return qc(`Lequel de ces nombres est divisible par ${d}?`, bon, faux, `${bon} est divisible par ${d} parce que ${CRIT[d]}.`);
  }
  if (t === 1 || t === 2) {
    const b = ri(3, 9), q = ri(4, 12), r = ri(1, b - 1), a = b * q + r;
    if (t === 2) return qc(`Quel est le reste de ${a} ÷ ${b}?`, r, [r + 1, r - 1, b - r, q, 0], `${b} × ${q} = ${b * q}, et ${a} − ${b * q} = ${r}. Le reste est toujours plus petit que ${b}.`);
    return qc(`${a} ÷ ${b} = ?`, `${q} reste ${r}`, [`${q} reste ${r + 1}`, `${q - 1} reste ${r + b}`, `${q + 1} reste ${r}`, `${q}`], `${b} × ${q} = ${b * q}; il reste ${a} − ${b * q} = ${r}.`);
  }
  const n = pk([12, 18, 20, 24, 28, 30, 36, 40, 42, 45, 48, 50, 54, 60, 63, 72, 75, 80, 84, 90, 96, 100]), f = facteursPremiers(n), j = l => l.join(" × ");
  const autre = j(f.includes(2) ? [...f.slice(1), 3].sort((x, y) => x - y) : [2, ...f.slice(1)]);
  const pasPremier = [f[0] * f[1], ...f.slice(2)];
  return qc(`Quelle est la factorisation première de ${n} (arbre des facteurs)?`, j(f), [j(pasPremier), autre, j([2, ...f]), j(f.slice(1))], `On divise jusqu'à n'avoir que des nombres premiers : ${n} = ${j(f)}.`);
}
function genPemdas() {
  const t = ri(0, 5), a = ri(2, 12), b = ri(2, 9), c = ri(2, 9);
  if (t === 0) return qc(`Combien vaut ${a} + ${b} × ${c}?`, a + b * c, [(a + b) * c, a * b + c, a + b + c, a + b * c + 1, a + b * c - 1], `On fait la multiplication d'abord : ${b} × ${c} = ${b * c}, puis ${a} + ${b * c} = ${a + b * c}.`);
  if (t === 1) return qc(`Combien vaut (${a} + ${b}) × ${c}?`, (a + b) * c, [a + b * c, a * b + c, a + b + c], `Les parenthèses d'abord : ${a} + ${b} = ${a + b}, puis × ${c} = ${(a + b) * c}.`);
  if (t === 2) { const x = b * c + ri(1, 9); return qc(`Combien vaut ${x} − ${b} × ${c}?`, x - b * c, [(x - b) * c, x - b - c, x - b * c + 2], `La multiplication d'abord : ${b} × ${c} = ${b * c}, puis ${x} − ${b * c} = ${x - b * c}.`); }
  if (t === 3) { const q = ri(2, 9), d = b * q; return qc(`Combien vaut ${a} + ${d} ÷ ${b}?`, a + q, [(a + d) % b ? a + q + 2 : (a + d) / b, a + d + b, a + q - 1, a * q], `La division d'abord : ${d} ÷ ${b} = ${q}, puis ${a} + ${q} = ${a + q}.`); }
  const [txt, rep, expl] = pk([
    [`? × ${b} = ${b * c}`, c, `${b * c} ÷ ${b} = ${c}`],
    [`? + ${a * 7} = ${a * 7 + b * 11}`, b * 11, `${a * 7 + b * 11} − ${a * 7} = ${b * 11}`],
    [`${a * 10 + b} − ? = ${a * 10 + b - c * 3}`, c * 3, `${a * 10 + b} − ${a * 10 + b - c * 3} = ${c * 3}`],
    [`? ÷ ${b} = ${c}`, b * c, `${b} × ${c} = ${b * c}`]]);
  return qc(`Trouve le terme manquant : ${txt}`, rep, [rep + 1, rep - 1, rep + 10, rep * 2, rep + 2], `On fait l'opération inverse : ${expl}.`);
}
function genMoyenne() {
  const n = ri(3, 5), m = ri(4, 15); let l = Array.from({ length: n }, () => m + ri(-4, 4)); l[n - 1] = m * n - l.slice(0, -1).reduce((a, b) => a + b, 0);
  if (l[n - 1] < 1) l = Array(n).fill(m).map((x, i) => x + (i === 0 ? 1 : i === 1 ? -1 : 0));
  const s = l.reduce((a, b) => a + b, 0), tri = [...l].sort((a, b) => a - b);
  const ctx = pk(["Voici les points marqués par une équipe", "Voici les buts comptés à chaque match", "Voici le nombre de livres lus par des élèves", "Voici les pièces d'or trouvées dans chaque coffre"]);
  return qc(`${ctx} : ${l.join(", ")}. Quelle est la moyenne?`, m, [s, m + 1, m - 1, tri[tri.length - 1], tri[0] + tri[tri.length - 1]], `On additionne : ${l.join(" + ")} = ${s}. On divise par le nombre de données (${n}) : ${s} ÷ ${n} = ${m}.`);
}
// ---------- Novembre : fractions ----------
function questionEquivalentes() {
  const [a, b] = fracSimple(), k = ri(2, 6), n = a * k, d = b * k, t = ri(0, 3);
  const pourquoi = `On multiplie le numérateur et le dénominateur par le même nombre (× ${k}) : ${a}/${b} = ${n}/${d}.`;
  if (t === 0) return qcm(`Quelle fraction est équivalente à ${a}/${b}?`, `${n}/${d}`, [`${n}/${d + 1}`, `${a + k}/${b + k}`, `${n}/${b}`, `${a}/${d}`, `${n + 1}/${d}`, `${d}/${n}`], pourquoi);
  if (t === 1) return qcm(`Complète : ${a}/${b} = ?/${d}`, n, [n + 1, n - 1, a + k, a + d - b, a * (k + 1), d - b, n + 2, n * 2], pourquoi);
  if (t === 2) return qcm(`Complète : ${a}/${b} = ${n}/?`, d, [d + 1, d - 1, b + k, b + n - a, b * (k + 1), n + b, d + 2, d * 2], pourquoi);
  const ks = mel([2, 3, 4, 5, 6]).slice(0, 3), faux = `${a * ks[0] + 1}/${b * ks[0]}`;
  return qcm(`Laquelle n'est PAS équivalente à ${a}/${b}?`, faux, ks.map(m => `${a * m}/${b * m}`), `Pour ${b * ks[0]} au dénominateur, il faudrait ${a * ks[0]} au numérateur.`);
}
function questionReduction() {
  const [a, b] = fracSimple(), k = ri(2, 8), n = a * k, d = b * k, t = ri(0, 2);
  const pourquoi = `${n} et ${d} se divisent tous les deux par ${k} : ${n}/${d} = ${a}/${b}.`;
  const div = [2, 3, 4].find(m => k % m === 0 && m < k), partiel = div ? `${n / div}/${d / div}` : `${n}/${d}`;
  if (t === 0) return qcm(`Réduis ${n}/${d} à sa plus simple expression.`, `${a}/${b}`, [partiel, `${a}/${b + 1}`, `${a + 1}/${b}`, `${b}/${a}`, `${n - 1}/${d - 1}`, `${a}/${d}`], pourquoi);
  if (t === 1) { const autres = []; for (let m = 2; m <= 12; m++) if (m !== k && (n % m || d % m || m > k)) autres.push(m); return qcm(`Par quel plus grand nombre peut-on diviser ${n} ET ${d}?`, k, autres, pourquoi); }
  const red = [1, 2, 3, 4, 5, 6].map(() => { const [x, y] = fracSimple(), m = ri(2, 5); return `${x * m}/${y * m}`; });
  return qcm("Laquelle de ces fractions est déjà irréductible (on ne peut plus la réduire)?", `${a}/${b}`, red, `${a} et ${b} n'ont aucun diviseur commun à part 1.`);
}
const valF = s => { const [a, b] = s.split("/").map(Number); return a / b; };
function genCompFrac() {
  const t = ri(0, 3);
  if (t === 0) { const d = ri(5, 12), l = mel([...Array(d - 1).keys()].map(x => x + 1)).slice(0, 4), m = Math.max(...l); return qc("Quelle fraction est la plus grande?", `${m}/${d}`, l.filter(x => x !== m).map(x => `${x}/${d}`), `Même dénominateur : on compare les numérateurs. ${m} est le plus grand.`); }
  if (t === 1) { const a = ri(1, 3), l = mel([3, 4, 5, 6, 8, 10, 12].filter(x => x > a)).slice(0, 4), m = Math.min(...l); return qc("Quelle fraction est la plus grande?", `${a}/${m}`, l.filter(x => x !== m).map(x => `${a}/${x}`), `Même numérateur : plus le tout est partagé en petits morceaux, plus chaque morceau est petit. ${a}/${m} est la plus grande.`); }
  if (t === 2) {
    const [a, b] = fracSimple(), k = pk([2, 3, 4]), c = a * k + pk([-1, 0, 1]), d = b * k;
    if (c < 1) return genCompFrac();
    const s = c > a * k ? "<" : c < a * k ? ">" : "=";
    return qc(`Quel signe va entre ${a}/${b} et ${c}/${d}?`, s, ["<", ">", "="], `${a}/${b} = ${a * k}/${d}. On compare ${a * k}/${d} et ${c}/${d}.`);
  }
  const d = pk([6, 8, 10, 12]), l = mel([...Array(d - 1).keys()].map(x => x + 1)).slice(0, 3).sort((x, y) => x - y), f = x => `${x}/${d}`;
  const ok = l.map(f).join(" ; "), inv = [...l].reverse().map(f).join(" ; "), m1 = [l[1], l[0], l[2]].map(f).join(" ; "), m2 = [l[0], l[2], l[1]].map(f).join(" ; ");
  return qc("Quel est l'ordre croissant (du plus petit au plus grand)?", ok, [inv, m1, m2], "Même dénominateur : on place les numérateurs du plus petit au plus grand.");
}
function genAddFrac() {
  const t = ri(0, 3);
  if (t <= 1) {
    const d = ri(5, 12), a = ri(1, d - 2), b = ri(1, d - 1 - a), plus = t === 0, x = plus ? a + b : Math.max(a, b), y = plus ? b : Math.min(a, b), r = plus ? a + b : x - y;
    if (!plus && r === 0) return genAddFrac();
    const q = `${plus ? a : x}/${d} ${plus ? "+" : "−"} ${y}/${d} = ?`;
    return qcm(q, `${r}/${d}`, [`${r}/${d * 2}`, `${r + 1}/${d}`, `${plus ? a + b : x + y}/${d}`, `${r}/${d - 1}`, `${r - 1}/${d}`].filter(f => valF(f) !== r / d), `Même dénominateur : on ${plus ? "additionne" : "soustrait"} seulement les numérateurs. Le dénominateur reste ${d}.`);
  }
  const b = pk([2, 3, 4, 5]), k = pk([2, 3]), d = b * k, plus = t === 2, c = plus ? ri(1, d - k - 1) : ri(1, k - 1), res = plus ? k + c : k - c;
  return qcm(`1/${b} ${plus ? "+" : "−"} ${c}/${d} = ?`, `${res}/${d}`, [`${plus ? 1 + c : Math.abs(1 - c) || 2}/${plus ? b + d : d - b}`, `${plus ? 1 + c : c}/${d}`, `${res}/${b}`, `${res + 1}/${d}`, `${res}/${d + b}`].filter(f => valF(f) !== res / d), `On met le même dénominateur : 1/${b} = ${k}/${d}. Puis ${k}/${d} ${plus ? "+" : "−"} ${c}/${d} = ${res}/${d}.`);
}
const EQ = [["1/2", "0,5", 50], ["1/4", "0,25", 25], ["3/4", "0,75", 75], ["1/10", "0,1", 10], ["3/10", "0,3", 30], ["7/10", "0,7", 70], ["9/10", "0,9", 90], ["1/5", "0,2", 20], ["2/5", "0,4", 40], ["3/5", "0,6", 60], ["1/100", "0,01", 1], ["1/1", "1", 100]];
function genPourcent() {
  const t = ri(0, 3), e = pk(EQ), autres = mel(EQ.filter(x => x !== e));
  if (t === 0) return qc(`Quel pourcentage est égal à ${e[0]}?`, e[2] + " %", autres.map(x => x[2] + " %").concat([e[0].split("/")[0] + " %"]), `${e[0]} = ${e[1]} = ${e[2]} %. « Pour cent » veut dire « sur 100 ».`);
  if (t === 1) return qc(`Quel nombre décimal est égal à ${e[2]} %?`, e[1], [dec(e[2], 0), "0," + String(e[2]).padStart(3, "0"), ...autres.map(x => x[1])].filter(x => x !== e[1]), `${e[2]} % = ${e[2]}/100 = ${e[1]}.`);
  if (t === 2) return qc(`Quelle fraction est égale à ${e[1]}?`, e[0], autres.map(x => x[0]).concat([`${e[1].replace("0,", "")}/10`]).filter(f => valF(f) !== valF(e[0])), `${e[1]} = ${e[2]}/100 = ${e[0]}.`);
  const [p, f] = pk([[50, 2], [25, 4], [10, 10], [20, 5]]), n = f * ri(2, 12);
  return qc(`Combien font ${p} % de ${n}?`, n / f, [n / f + 1, n - n / f, n * 2, p, n / 2 === n / f ? n / 4 : n / 2], `${p} % = 1/${f}. ${n} ÷ ${f} = ${n / f}.`);
}
// ---------- Décembre : géométrie ----------
function svgDroites(t) {
  const a = ri(-30, 30) * Math.PI / 180, L = 110, c = [130, 80], u = [Math.cos(a), Math.sin(a)], n = [-u[1], u[0]];
  const ln = (p, v, col) => `<line x1="${(p[0] - v[0] * L).toFixed(1)}" y1="${(p[1] - v[1] * L).toFixed(1)}" x2="${(p[0] + v[0] * L).toFixed(1)}" y2="${(p[1] + v[1] * L).toFixed(1)}" stroke="${col}" stroke-width="4" stroke-linecap="round"/>`;
  let s;
  if (t === 0) s = ln([c[0] + n[0] * 30, c[1] + n[1] * 30], u, "#2563eb") + ln([c[0] - n[0] * 30, c[1] - n[1] * 30], u, "#d33");
  else if (t === 1) { const m = 14; s = ln(c, u, "#2563eb") + ln(c, n.map(x => x * .6), "#d33").replace(/x1="[^"]*" y1="[^"]*"/, `x1="${(c[0] - n[0] * 66).toFixed(1)}" y1="${(c[1] - n[1] * 66).toFixed(1)}"`) + `<path d="M${c[0] + u[0] * m},${c[1] + u[1] * m} L${c[0] + (u[0] + n[0]) * m},${c[1] + (u[1] + n[1]) * m} L${c[0] + n[0] * m},${c[1] + n[1] * m}" fill="none" stroke="#222" stroke-width="2"/>`; }
  else { const b = a + pk([40, 55, 125, 140]) * Math.PI / 180; s = ln(c, u, "#2563eb") + ln(c, [Math.cos(b), Math.sin(b)], "#d33"); }
  return svgBox(260, 160, s);
}
function genDroites() {
  const t = ri(0, 2), noms = ["Parallèles", "Perpendiculaires", "Sécantes (mais pas perpendiculaires)"];
  const ex = ["Elles ne se croisent jamais : elles gardent toujours le même écart.", "Elles se croisent en formant un angle droit (le petit carré).", "Elles se croisent, mais pas à angle droit."];
  if (Math.random() < .7) return qc("Comment sont ces deux droites?", noms[t], noms, ex[t], svgDroites(t));
  return pk([
    qc("Deux droites qui ne se croisent jamais sont…", "parallèles", ["perpendiculaires", "sécantes", "obliques"], ex[0]),
    qc("Deux droites qui se croisent à angle droit sont…", "perpendiculaires", ["parallèles", "courbes", "égales"], ex[1]),
    qc("Sur un cahier ligné, les lignes sont…", "parallèles", ["perpendiculaires", "sécantes", "courbes"], ex[0]),
    qc("Le coin d'une feuille est formé de deux côtés…", "perpendiculaires", ["parallèles", "courbes", "égaux"], ex[1])]);
}
function svgAngle(deg) {
  const rot = ri(0, 30), a1 = -rot * Math.PI / 180, a2 = -(rot + deg) * Math.PI / 180, cx = 100, cy = 110, L = 85;
  const p1 = [cx + L * Math.cos(a1), cy + L * Math.sin(a1)], p2 = [cx + L * Math.cos(a2), cy + L * Math.sin(a2)];
  let mark;
  if (deg === 90) { const s = 16, u = [Math.cos(a1), Math.sin(a1)], v = [Math.cos(a2), Math.sin(a2)]; mark = `<path d="M${cx + u[0] * s},${cy + u[1] * s} L${cx + (u[0] + v[0]) * s},${cy + (u[1] + v[1]) * s} L${cx + v[0] * s},${cy + v[1] * s}" fill="none" stroke="#d33" stroke-width="2.5"/>`; }
  else { const r = 26, q1 = [cx + r * Math.cos(a1), cy + r * Math.sin(a1)], q2 = [cx + r * Math.cos(a2), cy + r * Math.sin(a2)]; mark = `<path d="M${q1[0].toFixed(1)},${q1[1].toFixed(1)} A${r},${r} 0 ${deg > 180 ? 1 : 0} 0 ${q2[0].toFixed(1)},${q2[1].toFixed(1)}" fill="none" stroke="#d33" stroke-width="2.5"/>`; }
  return svgBox(200, 140, `<line x1="${cx}" y1="${cy}" x2="${p1[0].toFixed(1)}" y2="${p1[1].toFixed(1)}" stroke="#222" stroke-width="4" stroke-linecap="round"/><line x1="${cx}" y1="${cy}" x2="${p2[0].toFixed(1)}" y2="${p2[1].toFixed(1)}" stroke="#222" stroke-width="4" stroke-linecap="round"/>${mark}<circle cx="${cx}" cy="${cy}" r="4" fill="#222"/>`);
}
const TYPES_ANGLE = ["Angle aigu", "Angle droit", "Angle obtus", "Angle plat"];
function genAngles() {
  const d = pk([25, 35, 45, 60, 70, 80, 90, 90, 110, 120, 135, 150, 160, 180]), t = d < 90 ? 0 : d === 90 ? 1 : d < 180 ? 2 : 3;
  const ex = ["Plus petit qu'un angle droit : aigu.", "Il forme un coin carré (90°) : droit.", "Plus grand qu'un angle droit, plus petit qu'un angle plat : obtus.", "Ses deux côtés forment une ligne droite (180°) : plat."][t];
  if (Math.random() < .6) return qc("Quel type d'angle est dessiné?", TYPES_ANGLE[t], TYPES_ANGLE, ex, svgAngle(d));
  return qc(`Un angle de ${d}° est…`, TYPES_ANGLE[t].replace("Angle", "un angle"), TYPES_ANGLE.map(s => s.replace("Angle", "un angle")), ex);
}
function tick(p, q, n) {
  const mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2, dx = q[0] - p[0], dy = q[1] - p[1], L = Math.hypot(dx, dy), nx = -dy / L * 8, ny = dx / L * 8, tx = dx / L * 5, ty = dy / L * 5;
  let s = ""; for (let i = 0; i < n; i++) { const o = i - (n - 1) / 2; s += `<line x1="${(mx - nx + tx * o).toFixed(1)}" y1="${(my - ny + ty * o).toFixed(1)}" x2="${(mx + nx + tx * o).toFixed(1)}" y2="${(my + ny + ty * o).toFixed(1)}" stroke="#d33" stroke-width="2.5"/>`; }
  return s;
}
function svgTriangle(type) {
  let P, marks = "";
  if (type === "equi") { P = [[40, 140], [180, 140], [110, 19]]; marks = tick(P[0], P[1], 1) + tick(P[1], P[2], 1) + tick(P[2], P[0], 1); }
  else if (type === "iso") { const h = pk([60, 140]); P = [[45, 145], [175, 145], [110, 145 - h]]; marks = tick(P[1], P[2], 2) + tick(P[2], P[0], 2); }
  else if (type === "scal") P = pk([[[25, 140], [190, 140], [70, 40]], [[30, 130], [180, 145], [140, 30]], [[20, 145], [150, 120], [60, 30]]]);
  else { P = [[40, 145], [40, 30], [185, 145]]; marks = `<path d="M40,129 L56,129 L56,145" fill="none" stroke="#d33" stroke-width="2.5"/>`; }
  return svgBox(220, 165, `<polygon points="${P.map(p => p.join(",")).join(" ")}" fill="#cfe8ff" stroke="#222" stroke-width="3" stroke-linejoin="round"/>${marks}`);
}
function genTriangles() {
  const type = pk(["equi", "iso", "scal", "rect"]);
  if (type === "rect") return qc("Ce triangle a un angle droit. Comment l'appelle-t-on?", "Triangle rectangle", ["Triangle équilatéral", "Triangle isocèle", "Triangle carré"], "Un triangle qui a un angle droit est un triangle rectangle.", svgTriangle(type));
  const noms = { equi: "Équilatéral", iso: "Isocèle", scal: "Scalène" }, ex = { equi: "3 côtés de même longueur : équilatéral.", iso: "2 côtés de même longueur : isocèle.", scal: "Aucun côté de même longueur : scalène." };
  return qc("Selon ses côtés, comment s'appelle ce triangle? (Les petits traits rouges montrent les côtés de même longueur.)", noms[type], ["Équilatéral", "Isocèle", "Scalène", "Rectangle"], ex[type], svgTriangle(type));
}
function svgPlan(points) {
  const o = 26, u = 30, N = 7; let s = "";
  for (let i = 0; i <= N; i++) s += `<line x1="${o + i * u}" y1="${o}" x2="${o + i * u}" y2="${o + N * u}" stroke="#cbd5e1"/><line x1="${o}" y1="${o + i * u}" x2="${o + N * u}" y2="${o + i * u}" stroke="#cbd5e1"/><text x="${o + i * u}" y="${o + N * u + 17}" font-size="12" text-anchor="middle" fill="#334">${i}</text><text x="${o - 10}" y="${o + (N - i) * u + 4}" font-size="12" text-anchor="middle" fill="#334">${i}</text>`;
  s += `<line x1="${o}" y1="${o + N * u}" x2="${o + N * u + 8}" y2="${o + N * u}" stroke="#222" stroke-width="2"/><line x1="${o}" y1="${o + N * u}" x2="${o}" y2="${o - 8}" stroke="#222" stroke-width="2"/>`;
  for (const [x, y, nom] of points) s += `<circle cx="${o + x * u}" cy="${o + (N - y) * u}" r="6" fill="#d33"/><text x="${o + x * u + 9}" y="${o + (N - y) * u - 7}" font-size="15" font-weight="bold" fill="#d33">${nom}</text>`;
  return svgBox(o * 2 + N * u, o * 2 + N * u, s);
}
function genCartesien() {
  const pts = []; while (pts.length < 4) { const x = ri(1, 6), y = ri(1, 6); if (x !== y && !pts.some(p => (p[0] === x && p[1] === y) || (p[0] === y && p[1] === x))) pts.push([x, y, "ABCD"[pts.length]]); }
  const [x, y] = pts[0], c = (a, b) => `(${a}, ${b})`;
  if (Math.random() < .5) return qc("Quelles sont les coordonnées du point A?", c(x, y), [c(y, x), c(x + 1, y), c(x, y - 1), c(x - 1, y + 1)], `On lit d'abord l'axe horizontal (${x}), puis l'axe vertical (${y}) : ${c(x, y)}.`, svgPlan([pts[0]]));
  const i = ri(0, 3), [px, py, nom] = pts[i];
  return qc(`Quel point se trouve à ${c(px, py)}?`, `Le point ${nom}`, pts.filter((_, j) => j !== i).map(p => `Le point ${p[2]}`), `On avance de ${px} vers la droite, puis on monte de ${py}.`, svgPlan(pts));
}
// ---------- Janvier et février : nombres décimaux ----------
const PDEC = ["dixièmes", "centièmes", "millièmes"];
function genDecimaux(t) {
  if (t === undefined) t = ri(0, 4);
  if (t === 0) {
    const e = ri(1, 99), d = String(ri(100, 999)), p = ri(0, 2), n = `${e},${d}`, c = d[p];
    return qc(`Dans ${n}, quel chiffre est à la position des ${PDEC[p]}?`, c, mel([...new Set((String(e) + d).split(""))]).concat(["0", "5", "9"]), "Après la virgule : dixièmes, centièmes, millièmes.");
  }
  if (t === 1) {
    const a = ri(1, 8), b = ri(1, 9), l = [`0,${a}`, `0,${a - 1 || 9}${b}`, `0,${a}0${b}`, `0,${a - 1 || 1}${b}${b}`].map(x => x.replace(/^0,0/, "0,1"));
    const max = l.reduce((m, x) => parseFloat(x.replace(",", ".")) > parseFloat(m.replace(",", ".")) ? x : m);
    return qc("Quel nombre est le plus grand?", max, l.filter(x => x !== max), "On compare position par position : d'abord les dixièmes, puis les centièmes. Le nombre de chiffres ne compte pas!");
  }
  if (t === 2) {
    const n = ri(100, 9999) / 100, unite = Math.random() < .5, r = unite ? Math.round(n) : Math.round(n * 10) / 10;
    const autre = unite ? (Math.floor(n) === r ? r + 1 : r - 1) : (Math.floor(n * 10) / 10 === r ? r + .1 : r - .1);
    return qc(`Arrondis ${dec(n, 2)} ${unite ? "à l'unité près" : "au dixième près"}.`, unite ? dec(r, 0) : dec(r, 1), unite ? [dec(autre, 0), dec(n, 1), dec(r + 10, 0)] : [dec(autre, 1), dec(Math.round(n), 0), dec(n, 2).slice(0, -1).replace(/,$/, "")], `On regarde le chiffre juste à droite : 5 ou plus, on monte; 4 ou moins, on garde.`);
  }
  if (t === 3) {
    const u = ri(1, 9), [p, nom] = pk([[1, "dixièmes"], [2, "centièmes"]]), c = ri(2, 9), bon = p === 1 ? `${u},${c}` : `${u},0${c}`;
    return qc(`Quel nombre correspond à ${u} unités et ${c} ${nom}?`, bon, [p === 1 ? `${u},0${c}` : `${u},${c}`, `${u},00${c}`, `${u}${c}`, `${c},${u}`], `Les ${nom} sont à la ${p === 1 ? "1re" : "2e"} position après la virgule : ${bon}.`);
  }
  const n = ri(1, 99), d = pk([10, 100]), bon = d === 10 && n < 10 ? `0,${n}` : d === 10 ? `${Math.floor(n / 10)},${n % 10}` : `0,${String(n).padStart(2, "0")}`;
  return qc(`Quel nombre décimal est égal à ${n}/${d}?`, bon, [`${n},0`, d === 10 ? `0,${String(n).padStart(2, "0")}` : (n < 10 ? `0,${n}` : `${Math.floor(n / 10)},${n % 10}`), `0,00${n}`.replace(/^0,00(\d\d)$/, "0,0$1"), `${n}${d}`].filter(x => x !== bon), `${n}/${d} se lit « ${n} ${d === 10 ? "dixième" : "centième"}${n > 1 ? "s" : ""} » : ${bon}.`);
}
function genOpDec() {
  const t = ri(0, 2);
  if (t <= 1) {
    const a = ri(11, 99) / 10, b = ri(101, 999) / 100, plus = t === 0, [x, y] = plus ? [a, b] : [Math.max(a, b) + 1, Math.min(a, b)];
    const r = plus ? x + y : x - y;
    const mal = plus ? Math.floor(x) + Math.floor(y) + (Math.round(x * 10) % 10 + Math.round(y * 100) % 100) / 100 : r + .09;
    return qc(`${decC(x)} ${plus ? "+" : "−"} ${decC(y)} = ?`, decC(r), [decC(mal), decC(r + 1), decC(r - .1), decC(r + .01)], `On aligne les virgules (on peut ajouter des zéros : ${dec(x, 2)}), puis on calcule chaque position.`);
  }
  let a = ri(11, 49); if (a % 10 === 0) a++; a /= 10; const b = ri(2, 9), r = a * b;
  return qc(`${decC(a)} × ${b} = ?`, decC(r), [String(Math.round(r * 10)), decC(r / 10), decC(Math.floor(a) * b + (Math.round(a * 10) % 10) * b / 100), decC(r + 1)], `On calcule ${Math.round(a * 10)} × ${b} = ${Math.round(a * 10 * b)}, puis on remet 1 chiffre après la virgule : ${decC(r)}.`);
}
function genMultFrac() {
  const t = ri(0, 2);
  if (t === 0) { const n = ri(2, 4), b = ri(5, 12), a = ri(1, Math.floor((b - 1) / n)); return qcm(`${n} × ${a}/${b} = ?`, `${n * a}/${b}`, [`${n * a}/${n * b}`, `${a}/${n * b}`, `${n + a}/${b}`, `${a}/${b}`], `On multiplie seulement le numérateur : ${n} × ${a} = ${n * a}. Le dénominateur reste ${b}.`); }
  if (t === 1) { const [a, b] = fracSimple(), [c, d] = fracSimple(); return qcm(`${a}/${b} × ${c}/${d} = ?`, `${a * c}/${b * d}`, [`${a + c}/${b + d}`, `${a * c}/${b + d}`, `${a * d}/${b * c}`, `${a * c}/${b}`].filter(f => valF(f) !== a * c / b / d), `On multiplie les numérateurs (${a} × ${c}) et les dénominateurs (${b} × ${d}).`); }
  const b = pk([2, 3, 4, 5]), n = b * ri(2, 8), a = ri(1, b - 1);
  return qc(`Combien font ${a}/${b} de ${n}?`, a * n / b, [n / b, n * a, n - a, a * n / b + 1], `${n} ÷ ${b} = ${n / b}, puis × ${a} = ${a * n / b}.`);
}
// ---------- Mars : diagrammes ----------
const COUL = ["#6c4cf5", "#ff9a2e", "#3fbf5f", "#2b9fd9", "#e0457b"];
function svgBandes(cats, vals) {
  const max = Math.ceil(Math.max(...vals) / 2) * 2 + 2, h = 170, o = 34, w = 52; let s = "";
  for (let v = 0; v <= max; v += 2) { const y = 20 + h - v / max * h; s += `<line x1="${o}" y1="${y}" x2="${o + cats.length * (w + 16) + 6}" y2="${y}" stroke="#e2e8f0"/><text x="${o - 6}" y="${y + 4}" font-size="11" text-anchor="end" fill="#334">${v}</text>`; }
  cats.forEach((c, i) => { const x = o + 12 + i * (w + 16), bh = vals[i] / max * h; s += `<rect x="${x}" y="${20 + h - bh}" width="${w}" height="${bh}" fill="${COUL[i]}" rx="3"/><text x="${x + w / 2}" y="${20 + h + 16}" font-size="12" text-anchor="middle" fill="#334">${c}</text>`; });
  return svgBox(o + cats.length * (w + 16) + 20, h + 46, s + `<line x1="${o}" y1="20" x2="${o}" y2="${20 + h}" stroke="#222" stroke-width="2"/><line x1="${o}" y1="${20 + h}" x2="${o + cats.length * (w + 16) + 6}" y2="${20 + h}" stroke="#222" stroke-width="2"/>`);
}
function svgLigne(cats, vals) {
  const max = 20, h = 160, o = 34, w = 52; let s = "";
  for (let v = 0; v <= max; v += 4) { const y = 20 + h - v / max * h; s += `<line x1="${o}" y1="${y}" x2="${o + cats.length * w}" y2="${y}" stroke="#e2e8f0"/><text x="${o - 6}" y="${y + 4}" font-size="11" text-anchor="end" fill="#334">${v}</text>`; }
  const P = vals.map((v, i) => [o + 26 + i * w, 20 + h - v / max * h]);
  s += `<polyline points="${P.map(p => p.join(",")).join(" ")}" fill="none" stroke="#d33" stroke-width="3"/>` + P.map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="5" fill="#d33"/><text x="${x}" y="${20 + h + 16}" font-size="12" text-anchor="middle" fill="#334">${cats[i]}</text>`).join("");
  return svgBox(o + cats.length * w + 10, h + 46, s + `<line x1="${o}" y1="20" x2="${o}" y2="${20 + h}" stroke="#222" stroke-width="2"/><line x1="${o}" y1="${20 + h}" x2="${o + cats.length * w}" y2="${20 + h}" stroke="#222" stroke-width="2"/>`);
}
function svgCercle(parts, cats) {
  let a = -Math.PI / 2, s = ""; const c = 90, r = 80;
  parts.forEach((p, i) => { const b = a + p * Math.PI * 2, l = p > .5 ? 1 : 0; s += `<path d="M${c},${c} L${(c + r * Math.cos(a)).toFixed(1)},${(c + r * Math.sin(a)).toFixed(1)} A${r},${r} 0 ${l} 1 ${(c + r * Math.cos(b)).toFixed(1)},${(c + r * Math.sin(b)).toFixed(1)} Z" fill="${COUL[i]}" stroke="#fff" stroke-width="2"/>`; a = b; });
  s += cats.map((n, i) => `<rect x="196" y="${30 + i * 26}" width="16" height="16" fill="${COUL[i]}"/><text x="218" y="${43 + i * 26}" font-size="14" fill="#334">${n}</text>`).join("");
  return svgBox(320, 180, s);
}
const SUJETS_STATS = [["Fruit préféré", ["Pomme", "Banane", "Fraise", "Raisin"]], ["Animal préféré", ["Chien", "Chat", "Lapin", "Cheval"]], ["Sport préféré", ["Hockey", "Soccer", "Natation", "Ski"]], ["Classe de héros", ["Archer", "Mage", "Guerrier", "Voleur"]]];
function genStats() {
  const t = ri(0, 2);
  if (t === 0) {
    const [sujet, cats] = pk(SUJETS_STATS); let vals; do vals = cats.map(() => ri(1, 10)); while (new Set(vals).size < 4);
    const svg = svgBandes(cats, vals), tot = vals.reduce((a, b) => a + b, 0), iM = vals.indexOf(Math.max(...vals)), im = vals.indexOf(Math.min(...vals)), k = ri(0, 3), j = (k + 1 + ri(0, 2)) % 4;
    return pk([
      qc(`Enquête « ${sujet} ». Quel choix a reçu le plus de votes?`, cats[iM], cats.filter((_, i) => i !== iM), "C'est la bande la plus haute.", svg),
      qc(`Enquête « ${sujet} ». Quel choix a reçu le moins de votes?`, cats[im], cats.filter((_, i) => i !== im), "C'est la bande la plus basse.", svg),
      qc(`Enquête « ${sujet} ». Combien d'élèves ont choisi « ${cats[k]} »?`, vals[k], [vals[k] + 1, vals[k] - 1, ...vals.filter((_, i) => i !== k)].filter(v => v > 0), "On suit le haut de la bande jusqu'à l'axe des nombres.", svg),
      qc(`Enquête « ${sujet} ». Combien d'élèves ont répondu en tout?`, tot, [tot + 1, tot - 2, Math.max(...vals), tot + 10], `On additionne toutes les bandes : ${vals.join(" + ")} = ${tot}.`, svg),
      qc(`Enquête « ${sujet} ». Combien de votes de plus pour « ${cats[vals[k] > vals[j] ? k : j]} » que pour « ${cats[vals[k] > vals[j] ? j : k]} »?`, Math.abs(vals[k] - vals[j]), [vals[k] + vals[j], Math.abs(vals[k] - vals[j]) + 1, Math.max(vals[k], vals[j])].filter(v => v > 0), `On soustrait : ${Math.max(vals[k], vals[j])} − ${Math.min(vals[k], vals[j])} = ${Math.abs(vals[k] - vals[j])}.`, svg)]);
  }
  if (t === 1) {
    const jours = ["Lun", "Mar", "Mer", "Jeu", "Ven"]; let vals; do vals = jours.map(() => ri(1, 10) * 2); while (new Set(vals).size < 5);
    const svg = svgLigne(jours, vals), iM = vals.indexOf(Math.max(...vals)), d = vals.slice(1).map((v, i) => v - vals[i]), ih = d.indexOf(Math.max(...d)), noms = ["lundi", "mardi", "mercredi", "jeudi", "vendredi"];
    const per = i => `De ${noms[i]} à ${noms[i + 1]}`;
    if (Math.max(...d) > 0 && Math.random() < .5) return qc("Ce diagramme à ligne brisée montre la température (°C). Quand la température a-t-elle le plus augmenté?", per(ih), [0, 1, 2, 3].filter(i => i !== ih).map(per), "C'est là où la ligne monte le plus.", svg);
    return qc("Ce diagramme à ligne brisée montre la température (°C). Quel jour a-t-il fait le plus chaud?", noms[iM], noms.filter((_, i) => i !== iM), "C'est le point le plus haut de la ligne.", svg);
  }
  const [sujet, cats] = pk(SUJETS_STATS), parts = pk([[.5, .25, .25], [.5, .5], [.25, .25, .25, .25], [.75, .25]]), cs = cats.slice(0, parts.length), fr = p => ({ .5: "1/2", .25: "1/4", .75: "3/4" }[p]);
  const i = ri(0, parts.length - 1), n = 4 * ri(2, 7);
  if (Math.random() < .5) return qc(`Diagramme circulaire « ${sujet} ». Quelle fraction des élèves a choisi « ${cs[i]} »?`, fr(parts[i]), ["1/2", "1/4", "3/4", "1/3"].filter(x => x !== fr(parts[i])), "On regarde quelle partie du cercle est colorée : la moitié = 1/2, le quart = 1/4.", svgCercle(parts, cs));
  return qc(`Diagramme circulaire « ${sujet} ». ${n} élèves ont répondu. Combien ont choisi « ${cs[i]} »?`, n * parts[i], [n * parts[i] + 1, n, n / 3 | 0, n * parts[i] * 2].filter(v => v !== n * parts[i]), `La partie vaut ${fr(parts[i])} du cercle : ${fr(parts[i])} de ${n} = ${n * parts[i]}.`, svgCercle(parts, cs));
}
// ---------- Avril : mesures ----------
function genMesures() {
  const t = ri(0, 6);
  if (t === 0) { const [u1, u2, f] = pk([["m", "cm", 100], ["km", "m", 1000], ["cm", "mm", 10], ["m", "dm", 10], ["dm", "cm", 10]]), n = ri(2, 9); return qc(`${n} ${u1} = ? ${u2}`, nb(n * f), [nb(n * f * 10), decC(n * f / 10), nb(n * f + n), String(n)], `1 ${u1} = ${nb(f)} ${u2}, donc ${n} ${u1} = ${nb(n * f)} ${u2}.`); }
  if (t === 1) { const n = ri(11, 99) * 10, [u1, u2, f] = pk([["cm", "m", 100], ["g", "kg", 1000], ["mL", "L", 1000], ["m", "km", 1000]]), v = n * (f === 100 ? 1 : 10); return qc(`${nb(v)} ${u1} = ? ${u2}`, decC(v / f), [decC(v / f * 10), decC(v / f / 10), nb(v * f), decC(v / f + 1)], `1 ${u2} = ${nb(f)} ${u1}. On divise ${nb(v)} par ${nb(f)} : ${decC(v / f)} ${u2}.`); }
  if (t === 2) { const [u1, u2, f, quoi] = pk([["kg", "g", 1000, "masse"], ["L", "mL", 1000, "capacité"]]), n = ri(2, 9); return qc(`Mesure de ${quoi} : ${n} ${u1} = ? ${u2}`, nb(n * f), [nb(n * 100), nb(n * 10), nb(n * f * 10), String(n)], `1 ${u1} = 1 000 ${u2}.`); }
  if (t === 3) { const h = ri(1, 4), m = pk([10, 15, 20, 30, 45]), tot = h * 60 + m; return qc(`${h} h ${m} min = ? minutes`, tot, [h * 100 + m, h * 60, tot + 60, h + m], `1 h = 60 min. ${h} × 60 = ${h * 60}, plus ${m} = ${tot} minutes.`); }
  if (t === 4) {
    const h = ri(8, 15), m = pk([0, 15, 30, 45]), dh = ri(0, 2), dm = pk([15, 30, 45]), fin = h * 60 + m + dh * 60 + dm, hh = x => `${Math.floor(x / 60)} h ${String(x % 60).padStart(2, "0")}`;
    return qc(`L'aventure commence à ${hh(h * 60 + m)} et dure ${dh ? dh + " h " : ""}${dm} min. À quelle heure finit-elle?`, hh(fin), [hh(fin + 60), hh(fin - 30), `${h + dh} h ${String((m + dm) % 100).padStart(2, "0")}`, hh(fin + 15)], `On ajoute les heures, puis les minutes. 60 minutes font 1 heure.`);
  }
  if (t === 5) { const a = ri(2, 12), b = ri(a + 1, a + 12), r = a - b, f = x => (x < 0 ? "−" + -x : x) + " °C"; return qc(`Il fait ${a} °C. La température baisse de ${b} degrés. Quelle température fait-il?`, f(r), [f(-r), f(a + b), f(r - 1), "0 °C"], `${a} − ${b} : on descend sous zéro de ${b - a} degrés, donc ${f(r)}.`); }
  return pk([qc("Quelle unité est la meilleure pour mesurer la masse d'un chat?", "kilogramme (kg)", ["gramme (g)", "litre (L)", "mètre (m)"], "Un chat pèse quelques kilogrammes."),
    qc("Quelle unité est la meilleure pour mesurer la capacité d'une cuillère?", "millilitre (mL)", ["litre (L)", "kilogramme (kg)", "kilomètre (km)"], "Une cuillère contient environ 5 mL."),
    qc("Quelle unité est la meilleure pour mesurer la distance entre deux villes?", "kilomètre (km)", ["centimètre (cm)", "mètre (m)", "millimètre (mm)"], "Les grandes distances se mesurent en kilomètres."),
    qc("Combien y a-t-il de minutes dans une heure?", "60", ["100", "24", "30"], "1 h = 60 min."),
    qc("Combien y a-t-il d'heures dans une journée?", "24", ["12", "60", "48"], "1 jour = 24 h."),
    qc("L'eau gèle à quelle température?", "0 °C", ["10 °C", "100 °C", "−10 °C"], "L'eau gèle à 0 °C et bout à 100 °C."),
    qc("Quel objet mesure environ 1 mètre?", "La largeur d'une porte", ["Un crayon", "Un ongle", "Un terrain de soccer"], "Une porte fait à peu près 1 m de large.")]);
}
// ---------- Mai : probabilités ----------
function genProba() {
  const t = ri(0, 3), C3 = ["rouges", "bleues", "vertes", "jaunes"], noms = mel(C3).slice(0, 3), n = [ri(5, 8), ri(2, 3), ri(2, 3)];
  const sac = `Dans un sac, il y a ${n[0]} billes ${noms[0]}, ${n[1]} ${noms[1]} et ${n[2]} ${noms[2]}. On pige une bille sans regarder.`, absente = C3.find(c => !noms.includes(c));
  const sg = c => c.slice(0, -1);
  if (t === 0) return qc(`${sac} Quelle couleur a le plus de chances de sortir?`, sg(noms[0]), [sg(noms[1]), sg(noms[2]), sg(absente)], `Il y a plus de billes ${noms[0]} (${n[0]}) : c'est le plus probable.`);
  if (t === 1) {
    const [q, bon, ex] = pk([[`Piger une bille ${sg(absente)}, c'est…`, "impossible", `Il n'y a aucune bille ${sg(absente)} dans le sac.`], [`Piger une bille ${sg(noms[1])}, c'est…`, "possible", `Il y a des billes ${noms[1]}, mais pas seulement.`], [`Piger une bille ${noms.map(sg).join(", ").replace(/, ([^,]*)$/, " ou $1")}, c'est…`, "certain", "Toutes les billes du sac sont de ces couleurs."]]);
    return qc(`${sac} ${q}`, bon, ["impossible", "possible", "certain", "obligatoire"], ex);
  }
  if (t === 2) return pk([qc("On lance un dé à 6 faces. Obtenir un 7, c'est…", "impossible", ["possible", "certain", "très probable"], "Un dé à 6 faces va de 1 à 6."),
    qc("On lance un dé à 6 faces. Obtenir un nombre plus petit que 7, c'est…", "certain", ["impossible", "possible", "peu probable"], "Tous les nombres du dé sont plus petits que 7."),
    qc("On lance un dé à 6 faces. Obtenir un 4, c'est…", "possible", ["impossible", "certain", "obligatoire"], "Le 4 est une des 6 faces."),
    qc("On lance un dé à 6 faces. Qu'est-ce qui est le plus probable?", "Obtenir un nombre pair", ["Obtenir un 6", "Obtenir un 1", "Obtenir un 7"], "Il y a 3 nombres pairs (2, 4, 6), mais un seul 6."),
    qc("On lance une pièce de monnaie. Obtenir pile est… qu'obtenir face.", "aussi probable", ["plus probable", "moins probable", "impossible"], "La pièce a deux côtés : chacun a autant de chances."),
    qc("Demain, le soleil va se lever. C'est…", "certain", ["impossible", "possible", "peu probable"], "Ça arrive tous les jours!")]);
  const roue = ri(4, 8), k = ri(1, roue - 1);
  return qc(`Une roulette a ${roue} parties égales. ${k} sont rouges, les autres sont bleues. On fait tourner la roulette. Quelle est la probabilité de tomber sur le rouge?`, `${k}/${roue}`, [`${roue - k}/${roue}`, `${k}/${roue - k}`, `1/${roue}`, `${roue}/${k}`].filter(f => f !== `${k}/${roue}`), `${k} parties rouges sur ${roue} parties en tout : ${k}/${roue}.`);
}

// ---------- Conjugaison : tous les temps de l'année ----------
const VB1 = ["parler", "chanter", "jouer", "danser", "regarder", "marcher", "écouter", "sauter", "gagner", "trouver", "chercher", "explorer", "aider", "dessiner"];
const VB2 = ["finir", "choisir", "grandir", "réussir", "remplir", "bâtir", "obéir", "réfléchir", "agir", "applaudir", "nourrir"];
const SUJ = [["Je"], ["Tu"], ["Le chevalier", "La magicienne", "Il", "Elle", "Mon ami"], ["Nous", "Mon frère et moi"], ["Vous", "Ton amie et toi"], ["Les gobelins", "Ils", "Elles", "Les archères"]];
// Verbes par bloc du document d'étude (5e) : Bloc 1 avoir, être, aimer, aller; Bloc 2 partir, venir, tenir, devoir;
// Bloc 3 pouvoir, vouloir, savoir, voir; Bloc 4 faire, mettre, prendre, rendre, dire. (aimer suit le 1er groupe)
// pres = présent; fut = radical du futur et du conditionnel; ps = passé simple; impe = impératif (tu, nous, vous); ppr = participe présent; pp = participe passé
const BLOCS = {
  avoir: { bloc: 1, pres: "ai as a avons avez ont", fut: "aur", ps: "eus eus eut eûmes eûtes eurent", impe: "aie ayons ayez", ppr: "ayant", pp: "eu" },
  être: { bloc: 1, pres: "suis es est sommes êtes sont", imp: "ét", fut: "ser", ps: "fus fus fut fûmes fûtes furent", impe: "sois soyons soyez", ppr: "étant", pp: "été" },
  aller: { bloc: 1, pres: "vais vas va allons allez vont", fut: "ir", ps: "allai allas alla allâmes allâtes allèrent", impe: "va allons allez", ppr: "allant", pp: "allé", etre: true },
  partir: { bloc: 2, pres: "pars pars part partons partez partent", fut: "partir", ps: "partis partis partit partîmes partîtes partirent", impe: "pars partons partez", ppr: "partant", pp: "parti", etre: true },
  venir: { bloc: 2, pres: "viens viens vient venons venez viennent", fut: "viendr", ps: "vins vins vint vînmes vîntes vinrent", impe: "viens venons venez", ppr: "venant", pp: "venu", etre: true },
  tenir: { bloc: 2, pres: "tiens tiens tient tenons tenez tiennent", fut: "tiendr", ps: "tins tins tint tînmes tîntes tinrent", impe: "tiens tenons tenez", ppr: "tenant", pp: "tenu" },
  devoir: { bloc: 2, pres: "dois dois doit devons devez doivent", fut: "devr", ps: "dus dus dut dûmes dûtes durent", impe: "dois devons devez", ppr: "devant", pp: "dû" },
  pouvoir: { bloc: 3, pres: "peux peux peut pouvons pouvez peuvent", fut: "pourr", ps: "pus pus put pûmes pûtes purent", impe: null, ppr: "pouvant", pp: "pu" },
  vouloir: { bloc: 3, pres: "veux veux veut voulons voulez veulent", fut: "voudr", ps: "voulus voulus voulut voulûmes voulûtes voulurent", impe: "veuille veuillons veuillez", ppr: "voulant", pp: "voulu" },
  savoir: { bloc: 3, pres: "sais sais sait savons savez savent", fut: "saur", ps: "sus sus sut sûmes sûtes surent", impe: "sache sachons sachez", ppr: "sachant", pp: "su" },
  voir: { bloc: 3, pres: "vois vois voit voyons voyez voient", fut: "verr", ps: "vis vis vit vîmes vîtes virent", impe: "vois voyons voyez", ppr: "voyant", pp: "vu" },
  faire: { bloc: 4, pres: "fais fais fait faisons faites font", fut: "fer", ps: "fis fis fit fîmes fîtes firent", impe: "fais faisons faites", ppr: "faisant", pp: "fait" },
  mettre: { bloc: 4, pres: "mets mets met mettons mettez mettent", fut: "mettr", ps: "mis mis mit mîmes mîtes mirent", impe: "mets mettons mettez", ppr: "mettant", pp: "mis" },
  prendre: { bloc: 4, pres: "prends prends prend prenons prenez prennent", fut: "prendr", ps: "pris pris prit prîmes prîtes prirent", impe: "prends prenons prenez", ppr: "prenant", pp: "pris" },
  rendre: { bloc: 4, pres: "rends rends rend rendons rendez rendent", fut: "rendr", ps: "rendis rendis rendit rendîmes rendîtes rendirent", impe: "rends rendons rendez", ppr: "rendant", pp: "rendu" },
  dire: { bloc: 4, pres: "dis dis dit disons dites disent", fut: "dir", ps: "dis dis dit dîmes dîtes dirent", impe: "dis disons dites", ppr: "disant", pp: "dit" },
};
const TERMS = {
  1: { present: "e es e ons ez ent", imparfait: "ais ais ait ions iez aient", ps: "ai as a âmes âtes èrent" },
  2: { present: "is is it issons issez issent", imparfait: "issais issais issait issions issiez issaient", ps: "is is it îmes îtes irent" },
};
const AUX = { pc: "present", pqp: "imparfait", fa: "futur", cp: "cond" };
const NOM_TEMPS = { present: "au présent", imparfait: "à l'imparfait", futur: "au futur simple", ps: "au passé simple", cond: "au conditionnel présent", pc: "au passé composé", pqp: "au plus-que-parfait", fa: "au futur antérieur", cp: "au conditionnel passé" };
const AIDE_TEMPS = {
  present: "Au présent : -e, -es, -e, -ons, -ez, -ent (1er groupe) et -s, -s, -t, -ons, -ez, -ent (2e groupe : fini-s, finiss-ons).",
  imparfait: "À l'imparfait : -ais, -ais, -ait, -ions, -iez, -aient (le 2e groupe double le s : finissais).",
  futur: "Au futur simple : -rai, -ras, -ra, -rons, -rez, -ront.",
  cond: "Au conditionnel présent : -rais, -rais, -rait, -rions, -riez, -raient.",
  ps: "Au passé simple : -a / -èrent (1er groupe) et -it / -irent (2e groupe). Le 3e groupe : -it, -ut ou -int.",
  pc: "Passé composé = auxiliaire avoir ou être au présent + participe passé.",
  pqp: "Plus-que-parfait = auxiliaire avoir ou être à l'imparfait + participe passé.",
  fa: "Futur antérieur = auxiliaire avoir ou être au futur simple + participe passé.",
  cp: "Conditionnel passé = auxiliaire avoir ou être au conditionnel présent + participe passé.",
};
const L6 = s => s.split(" ");
function formeSimple(inf, g, t, p) {
  const b = BLOCS[inf];
  if (b) {
    if (t === "present") return L6(b.pres)[p];
    if (t === "imparfait") return (b.imp || L6(b.pres)[3].slice(0, -3)) + L6("ais ais ait ions iez aient")[p];
    if (t === "futur") return b.fut + L6("ai as a ons ez ont")[p];
    if (t === "cond") return b.fut + L6("ais ais ait ions iez aient")[p];
    if (t === "ps") return L6(b.ps)[p];
  }
  if (t === "futur") return inf + L6("ai as a ons ez ont")[p];
  if (t === "cond") return inf + L6("ais ais ait ions iez aient")[p];
  return inf.slice(0, -2) + L6(TERMS[g][t])[p];
}
const ppDe = (inf, g) => BLOCS[inf] ? BLOCS[inf].pp : inf.slice(0, -2) + (g === 1 ? "é" : "i");
const avecEtre = inf => !!(BLOCS[inf] && BLOCS[inf].etre);
// gn : genre et nombre du sujet (ex. « fp »), pour accorder le participe passé avec être
function forme(inf, g, t, p, gn) {
  if (!AUX[t]) return formeSimple(inf, g, t, p);
  const aux = avecEtre(inf) ? "être" : "avoir", pp = ppDe(inf, g);
  return formeSimple(aux, 0, AUX[t], p) + " " + (aux === "être" && gn ? pp + (gn[0] === "f" ? "e" : "") + (gn[1] === "p" ? "s" : "") : pp);
}
const VOIS = { present: ["imparfait", "ps"], imparfait: ["cond", "present"], futur: ["cond", "present"], cond: ["futur", "imparfait"], ps: ["present", "imparfait"], pc: ["pqp", "fa"], pqp: ["pc", "cp"], fa: ["cp", "pc"], cp: ["fa", "pqp"] };
// Sujets à la 3e personne, avec leur genre et leur nombre
const SUJ3 = { 2: [["Le chevalier", "ms"], ["La magicienne", "fs"], ["Il", "ms"], ["Elle", "fs"], ["On", "ms"]], 5: [["Les gobelins", "mp"], ["Les archères", "fp"], ["Ils", "mp"], ["Elles", "fp"]] };
function questionTemps(temps) {
  if (temps === "impe") return questionImperatif();
  const bloc = Math.random() < .6, inf = bloc ? pk(Object.keys(BLOCS)) : Math.random() < .6 ? pk(VB1.concat(["aimer"])) : pk(VB2), g = BLOCS[inf] ? 0 : VB2.includes(inf) ? 2 : 1;
  // Passé simple et temps composés (sauf le passé composé) : 3e personne seulement, comme au programme de 5e
  const troisieme = temps === "ps" || temps === "pqp" || temps === "fa" || temps === "cp" || (AUX[temps] && avecEtre(inf));
  const p = troisieme ? pk([2, 5]) : ri(0, 5);
  let sujet, gn = null;
  if (p === 2 || p === 5) [sujet, gn] = pk(SUJ3[p]); else sujet = pk(SUJ[p]);
  const bon = forme(inf, g, temps, p, gn);
  const leurres = VOIS[temps].map(t => forme(inf, g, t, p, gn));
  if (AUX[temps]) {
    const aux = formeSimple(avecEtre(inf) ? "être" : "avoir", 0, AUX[temps], p), pp = ppDe(inf, g);
    if (avecEtre(inf)) leurres.unshift(aux + " " + pk([pp, pp + "e", pp + "s", pp + "es"].filter(x => aux + " " + x !== bon)), formeSimple("avoir", 0, AUX[temps], p) + " " + pp);
    else leurres.unshift(aux + " " + (BLOCS[inf] ? L6(BLOCS[inf].ps)[2] : g === 1 ? inf : pp + "t"));
  }
  leurres.push(...mel([0, 1, 2, 3, 4, 5].filter(q => q !== p)).map(q => forme(inf, g, temps, q, gn)));
  const s = sujet === "Je" && /^[aeéèêiouh]/i.test(bon) ? "J'" : sujet + " ";
  let expl = AIDE_TEMPS[temps];
  if (BLOCS[inf] && !AUX[temps]) expl = `« ${inf} » (bloc ${BLOCS[inf].bloc}) ${NOM_TEMPS[temps]} : ` + (temps === "ps" ? `il ${formeSimple(inf, 0, "ps", 2)}, ils ${formeSimple(inf, 0, "ps", 5)}` : [0, 1, 2, 3, 4, 5].map(q => ["je", "tu", "il", "nous", "vous", "ils"][q] + " " + formeSimple(inf, 0, temps, q)).join(", ").replace(/^je ([aeéi])/, "j'$1")) + ".";
  else if (AUX[temps]) expl += avecEtre(inf) ? ` « ${inf} » se conjugue avec être : le participe passé s'accorde avec le sujet (${bon.split(" ")[1]}).` : ` Participe passé de « ${inf} » : ${ppDe(inf, g)}.`;
  return qc(`Conjugue « ${inf} » ${NOM_TEMPS[temps]} : ${s}___`, bon, leurres, expl);
}
function questionImperatif() {
  const bloc = Math.random() < .6;
  if (bloc) {
    const inf = pk(Object.keys(BLOCS).filter(v => BLOCS[v].impe)), b = BLOCS[inf];
    if (Math.random() < .35) return qc(`Quel est le participe présent de « ${inf} »?`, b.ppr, [b.pp, L6(b.pres)[5], L6(b.pres)[3].replace(/ons$/, "ant") === b.ppr ? inf.replace(/(er|ir|re|oir)$/, "ant") : L6(b.pres)[3].replace(/ons$/, "ant"), formeSimple(inf, 0, "imparfait", 2)], "Le participe présent se termine par -ant. Il ne change jamais.");
    const k = ri(0, 2), f = L6(b.impe), bon = f[k], qui = ["2e personne du singulier (tu)", "1re personne du pluriel (nous)", "2e personne du pluriel (vous)"][k];
    return qc(`Impératif présent de « ${inf} », ${qui} : ___!`, bon, [L6(b.pres)[[1, 3, 4][k]], ...f.filter(x => x !== bon), formeSimple(inf, 0, "futur", [1, 3, 4][k])], `Impératif de « ${inf} » : ${f.join(", ")}. Pas de sujet à l'impératif.`);
  }
  const inf = Math.random() < .6 ? pk(VB1) : pk(VB2), g = VB1.includes(inf) ? 1 : 2, r = inf.slice(0, -2);
  if (Math.random() < .35) { const bon = r + (g === 1 ? "ant" : "issant"); return qc(`Quel est le participe présent de « ${inf} »?`, bon, [r + (g === 1 ? "é" : "i"), g === 1 ? r + "ent" : r + "ant", r + (g === 1 ? "er" : "issent"), r + (g === 1 ? "ont" : "isant")], "Le participe présent se termine par -ant (en chantant, en finissant). Il ne change jamais."); }
  const k = ri(0, 2), f = (g === 1 ? ["e", "ons", "ez"] : ["is", "issons", "issez"]), bon = r + f[k], qui = ["2e personne du singulier (tu)", "1re personne du pluriel (nous)", "2e personne du pluriel (vous)"][k];
  return qc(`Impératif présent de « ${inf} », ${qui} : ___!`, bon, [k === 0 && g === 1 ? r + "es" : r + f[(k + 1) % 3], r + f[(k + 2) % 3], k === 0 ? (g === 1 ? r + "ent" : r + "it") : r + f[(k + 1) % 3]], "À l'impératif, il n'y a pas de sujet. Au 1er groupe, « tu » s'écrit sans s : chante! regarde!");
}
const CONJ_NOTION = { c_pres: ["present"], c_imp: ["imparfait"], c_fut: ["futur"], c_ps: ["ps"], c_cond: ["cond"], c_impe: ["impe"], c_pc: ["pc"], c_pqp: ["pqp"], c_comp: ["fa", "cp"] };
function questionVerbe() { return questionTemps(DIFF === "expert" && Math.random() < .4 ? "futur" : pk(["present", "imparfait"])); }

// ---------- Accords générés ----------
const NOMS_F = ["porte", "fenêtre", "lettre", "potion", "carte", "clé", "couronne", "lanterne"], NOMS_M = ["livre", "coffre", "bouclier", "trésor", "sac", "parchemin", "casque", "panier"];
const PPT = [["fermer", "fermé"], ["cacher", "caché"], ["oublier", "oublié"], ["briser", "brisé"], ["choisir", "choisi"], ["remplir", "rempli"], ["perdre", "perdu"], ["écrire", "écrit"], ["peindre", "peint"], ["ouvrir", "ouvert"], ["construire", "construit"]];
const SUJ_GN = [["Les princesses", "fp"], ["Mon frère", "ms"], ["Ma tante", "fs"], ["Les chevaliers", "mp"], ["La sorcière", "fs"], ["Le dragon", "ms"], ["Mes cousines", "fp"], ["Les gobelins", "mp"], ["Les archères", "fp"], ["Le magicien", "ms"]];
const PPE = [["arriver", "arrivé"], ["tomber", "tombé"], ["partir", "parti"], ["sortir", "sorti"], ["rester", "resté"], ["entrer", "entré"], ["monter", "monté"], ["descendre", "descendu"], ["venir", "venu"], ["revenir", "revenu"]];
const accorde = (pp, gn) => pp + (gn[0] === "f" ? "e" : "") + (gn[1] === "p" ? "s" : "");
const formesPP = pp => [pp, pp + "e", pp + "s", pp + "es"];
const NOM_GN = { ms: "masculin singulier", fs: "féminin singulier", mp: "masculin pluriel", fp: "féminin pluriel" };
function genNomGN() { const f = Math.random() < .5, n = pk(f ? NOMS_F : NOMS_M), pl = Math.random() < .5; return { n: pl ? n + "s" : n, gn: (f ? "f" : "m") + (pl ? "p" : "s"), det: pl ? "les" : f ? "la" : "le", un: pl ? "des" : f ? "une" : "un" }; }
function questionPP() {
  if (Math.random() < .5) {
    const [s, gn] = pk(SUJ_GN), [inf, pp] = pk(PPE), aux = gn[1] === "p" ? "sont" : "est", bon = accorde(pp, gn);
    return qc(`${s} ${aux} ___ (${inf}) ${pk(["hier soir", "au château", "très tôt", "dans la forêt"])}.`, bon, formesPP(pp), `Avec l'auxiliaire être, le participe passé s'accorde avec le sujet « ${s} » (${NOM_GN[gn]}) : ${bon}.`);
  }
  const g = genNomGN(), [inf, pp] = pk(PPT), bon = accorde(pp, g.gn);
  return qc(`Le héros trouve ${g.un} ${g.n} ___ (${inf}).`, bon, formesPP(pp), `Employé seul, le participe passé s'accorde comme un adjectif avec le nom « ${g.n} » (${NOM_GN[g.gn]}) : ${bon}.`);
}
function questionPPA() {
  const g = genNomGN(), [inf, pp] = pk(PPT), s = pk(["le chevalier", "la magicienne", "mon ami", "l'archère"]), t = ri(0, 2);
  if (t === 0) return qc(`Voici ${g.det} ${g.n} que ${s} a ___ (${inf}).`, accorde(pp, g.gn), formesPP(pp), `Avec avoir, le participe passé s'accorde avec le complément direct placé AVANT le verbe : « que » remplace « ${g.det} ${g.n} » (${NOM_GN[g.gn]}).`);
  if (t === 1) { const S = s[0].toUpperCase() + s.slice(1), pron = g.gn[1] === "p" ? "les " : "l'"; return qc(`${g.det[0].toUpperCase() + g.det.slice(1)} ${g.n}? ${S} ${pron}a ___ (${inf}).`, accorde(pp, g.gn), formesPP(pp), `« ${pron.trim()} » remplace « ${g.det} ${g.n} » : le complément direct est placé avant le verbe, donc on accorde (${NOM_GN[g.gn]}).`); }
  const S = s[0].toUpperCase() + s.slice(1);
  return qc(`${S} a ___ (${inf}) ${g.un} ${g.n}.`, pp, formesPP(pp), `Le complément direct « ${g.un} ${g.n} » est placé APRÈS le verbe : le participe passé avec avoir ne s'accorde pas.`);
}
const ACC_REGLES = [
  ["Avec le sujet « on », le verbe se met à…", ["la 3e personne du singulier", "la 1re personne du pluriel", "la 3e personne du pluriel", "l'infinitif"], 0, "« On est beaucoup à parler d'environnement. »"],
  ["Complète : « On ___ (aller) au château ce soir. »", ["va", "allons", "vont", "vas"], 0, "Avec « on », le verbe est à la 3e personne du singulier."],
  ["Complète : « Le groupe se ___ (réunir) le samedi. »", ["réunit", "réunissent", "réunis", "réunissons"], 0, "« groupe » est un nom collectif : 3e personne du singulier."],
  ["Complète : « La foule ___ (applaudir) les chevaliers. »", ["applaudit", "applaudissent", "applaudis", "applaudissons"], 0, "« foule » est un nom collectif : le verbe est au singulier."],
  ["Complète : « L'équipe ___ (gagner) souvent. »", ["gagne", "gagnent", "gagnes", "gagnons"], 0, "« équipe » est un nom collectif : 3e personne du singulier."],
  ["Complète : « Tu nous ___ (téléphoner) demain. » (futur)", ["téléphoneras", "téléphonerons", "téléphonera", "téléphonerez"], 0, "« nous » est un pronom complément (écran). Le sujet est « tu » : C'est tu qui…"],
  ["Complète : « Les dragons le ___ (regarder). »", ["regardent", "regarde", "regardes", "regardez"], 0, "« le » est un pronom écran. Le sujet est « Les dragons »."],
  ["Complète : « Il doit savoir ___ ce verbe. »", ["conjuguer", "conjugué", "conjugue", "conjuguez"], 0, "Quand deux verbes se suivent, le 2e se met à l'infinitif."],
  ["Complète : « Nous allons ___ le trésor. »", ["chercher", "cherché", "cherchons", "cherchez"], 0, "Deux verbes qui se suivent : le 2e est à l'infinitif."],
  ["Complète : « Il a ___ le trésor. »", ["trouvé", "trouver", "trouve", "trouvez"], 0, "Attention : après « avoir » ou « être », la règle de l'infinitif ne s'applique pas. C'est un participe passé."],
  ["Comment trouve-t-on le sujet pour accorder le verbe?", ["On l'encadre par « C'est… qui »", "On l'encadre par « ne… pas »", "On cherche le premier mot", "On cherche le mot avant le verbe"], 0, "C'est… qui encadre le sujet."],
];
function questionAccVerbe() {
  const t = ri(0, 4), trans = ["regarder", "écouter", "aider", "chercher", "dessiner", "choisir", "nourrir", "applaudir", "remplir"];
  const inf = t === 4 ? pk(trans) : Math.random() < .6 ? pk(VB1) : pk(VB2), g = VB1.includes(inf) ? 1 : 2, f = p => formeSimple(inf, g, "present", p);
  const choix = (q, p, ex) => qc(q, f(p), [f(2), f(5), f(1), f(3), f(0)], ex);
  if (t === 0) { const [a, b] = pk([["Les enfants", "ma voisine"], ["Les amis", "mon frère"], ["Les chevaux", "la ferme"], ["Les élèves", "la classe"]]); return choix(`${a} de ${b} ___ (${inf}) ensemble. (présent)`, 5, `Le noyau du sujet est « ${a.split(" ")[1]} » (pluriel), pas « ${b} ». Le verbe s'accorde avec le noyau.`); }
  if (t === 1) { const [a, b] = pk([["Le chat", "mes voisins"], ["La maîtresse", "mes amis"], ["Le chef", "les gobelins"], ["La reine", "ces royaumes"]]); return choix(`${a} de ${b} ___ (${inf}) souvent. (présent)`, 2, `Le noyau du sujet est « ${a.split(" ")[1]} » (singulier), pas « ${b} ».`); }
  if (t === 2) { const [a, b] = pk([["Le chevalier", "la magicienne"], ["Mon père", "ma mère"], ["Léa", "Samuel"]]); return choix(`${a} et ${b} ___ (${inf}) vers le château. (présent)`, 5, "Deux sujets réunis par « et » = « ils » : 3e personne du pluriel."); }
  if (t === 3) { const s = pk(["Mon ami et moi", "Toi et moi", "Ma sœur et moi"]); return choix(`${s}, nous ___ (${inf}) dans la cour. (présent)`, 3, `« ${s} » = « nous » : terminaison -ons.`); }
  const s = pk(["Le chevalier", "La magicienne", "Mon frère"]);
  return choix(`${s} les ___ (${inf}) en silence. (présent)`, 2, `« les » n'est pas le sujet : c'est un pronom complément. Le sujet est « ${s} » (singulier).`);
}

// Pluriel et féminin dans le GN (règles du document d'étude)
const PLUR = [["un radis", "des radis", ["des radiss", "des radix"], "Les noms en -s, -x, -z ne changent pas au pluriel."], ["une noix", "des noix", ["des noixs", "des noixes"], "Les noms en -s, -x, -z ne changent pas au pluriel."], ["un nez", "des nez", ["des nezs", "des nezes"], "Les noms en -s, -x, -z ne changent pas au pluriel."],
  ["un bateau", "des bateaux", ["des bateaus", "des bateau"], "Les noms en -au et -eu prennent un x."], ["un cheveu", "des cheveux", ["des cheveus", "des cheveu"], "Les noms en -au et -eu prennent un x."], ["un pneu", "des pneus", ["des pneux", "des pneu"], "Exception : pneus, bleus, landaus et sarraus prennent un s."],
  ["un cristal", "des cristaux", ["des cristals", "des cristaus"], "Les noms en -al font -aux."], ["un cheval", "des chevaux", ["des chevals", "des chevaus"], "Les noms en -al font -aux."], ["un festival", "des festivals", ["des festivaux", "des festivaus"], "Exception : bals, carnavals, festivals, chacals, récitals prennent un s."], ["un carnaval", "des carnavals", ["des carnavaux", "des carnavaus"], "Exception : bals, carnavals, festivals… prennent un s."],
  ["un chandail", "des chandails", ["des chandaux", "des chandailx"], "Les noms en -ail prennent un s."], ["un travail", "des travaux", ["des travails", "des travailx"], "Exceptions : bail → baux, corail → coraux, travail → travaux, vitrail → vitraux."], ["un vitrail", "des vitraux", ["des vitrails", "des vitrailx"], "Exceptions : travail → travaux, vitrail → vitraux…"],
  ["un bambou", "des bambous", ["des bamboux", "des bambou"], "Les noms en -ou prennent un s."], ["un caillou", "des cailloux", ["des caillous", "des caillou"], "Exceptions en -oux : bijoux, cailloux, choux, genoux, hiboux, joujoux, poux."], ["un hibou", "des hiboux", ["des hibous", "des hibou"], "Exceptions en -oux : bijoux, cailloux, choux, genoux, hiboux, joujoux, poux."], ["un genou", "des genoux", ["des genous", "des genou"], "Exceptions en -oux : bijoux, cailloux, choux, genoux…"], ["un trou", "des trous", ["des troux", "des trou"], "Les noms en -ou prennent un s (sauf les 7 exceptions en -oux)."]];
const FEM = [["un boulanger", "une boulangère", ["une boulangerre", "une boulangeuse"], "Les noms en -er font -ère ou -ière."], ["un droitier", "une droitière", ["une droitiere", "une droitièrre"], "Les noms en -er font -ère ou -ière."], ["un comédien", "une comédienne", ["une comédiene", "une comédientte"], "Les noms en -en et -on doublent la consonne finale : -enne, -onne."],
  ["un baron", "une baronne", ["une barone", "une baronnesse"], "Les noms en -on doublent la consonne : -onne."], ["un acteur", "une actrice", ["une acteuse", "une acteure"], "Les noms en -teur font souvent -trice."], ["un nageur", "une nageuse", ["une nagetrice", "une nageure"], "Les noms en -eur font -euse."], ["un enseignant", "une enseignante", ["une enseignent", "une enseignantte"], "En général, on ajoute un e."],
  ["dernier", "dernière", ["derniere", "dernièrre"], "Les adjectifs en -ier font -ière."], ["ancien", "ancienne", ["anciene", "ancienn"], "Les adjectifs en -en, -on, -et, -ot doublent la consonne finale."], ["créateur", "créatrice", ["créateuse", "créatrisse"], "Les adjectifs en -teur font -trice (ou -euse)."], ["craintif", "craintive", ["craintife", "craintiffe"], "Les adjectifs en -if font -ive."], ["heureux", "heureuse", ["heureuxe", "heureusse"], "Les adjectifs en -eux font -euse."], ["vieil", "vieille", ["vieile", "vieil"], "Les adjectifs en -eil doublent la consonne et prennent un e."], ["muet", "muette", ["muete", "muètte"], "Les adjectifs en -et doublent la consonne : -ette."], ["rapide", "rapide", ["rapidee", "rapidte"], "Un adjectif qui finit déjà par un e muet ne change pas au féminin."]];
function questionAccordGN() {
  const t = ri(0, 3);
  if (t === 0) { const [a, b, l, e] = pk(PLUR); return qc(`Quel est le pluriel de « ${a} »?`, b, l.concat([b.replace(/x$/, "s").replace(/aux$/, "als")]), e); }
  if (t === 1) { const [a, b, l, e] = pk(FEM); return qc(`Quel est le féminin de « ${a} »?`, b, l.concat([a.replace(/^un /, "une ")]), e); }
  if (t === 2) return pk([qc("Complète : « Des robes ___ »", "jaunes", ["jaune", "jaunent", "jaunies"], "L'adjectif de couleur en un seul mot s'accorde."), qc("Complète : « Des robes jaune ___ »", "clair", ["claires", "clairs", "claire"], "Une couleur exprimée par deux mots (jaune clair) ne s'accorde pas."), qc("Complète : « Des chandails ___ »", "orange", ["oranges", "orangés", "orangent"], "« orange » est aussi un fruit : la couleur qui représente un objet ne s'accorde pas."), qc("Complète : « Des yeux ___ »", "marron", ["marrons", "marronnes", "marronne"], "« marron » est un objet (le fruit) : il ne s'accorde pas.")]);
  return pk([qc("Comment écrit-on 80?", "quatre-vingts", ["quatre-vingt", "quatres-vingts", "quatre vingt"], "Vingt prend un s quand il est multiplié et termine le nombre."), qc("Comment écrit-on 300?", "trois-cents", ["trois-cent", "troi-cents", "trois cent"], "Cent prend un s quand il est multiplié et termine le nombre."), qc("Comment écrit-on 82?", "quatre-vingt-deux", ["quatre-vingts-deux", "quatres-vingt-deux", "quatre-vingt-deuxs"], "Vingt ne prend pas de s s'il ne termine pas le nombre."), qc("Comment écrit-on 230?", "deux-cent-trente", ["deux-cents-trente", "deux-cent-trentes", "deuxs-cent-trente"], "Cent ne prend pas de s s'il ne termine pas le nombre.")]);
}

// ---------- Banques de questions écrites ----------
const BANQUE_FR = {
  manip: [
    ["Quelle manipulation consiste à supprimer un mot pour voir s'il est obligatoire?", ["L'effacement", "Le déplacement", "Le remplacement", "L'encadrement"], 0, "L'effacement : on enlève un mot ou un groupe pour voir s'il est obligatoire ou facultatif."],
    ["Quelle manipulation consiste à changer la place d'un groupe dans la phrase?", ["Le déplacement", "L'effacement", "L'ajout", "Le remplacement"], 0, "Le déplacement : on change la place d'un élément pour voir s'il est obligatoire ou facultatif."],
    ["Remplacer « Gérard » par « Il », c'est quelle manipulation?", ["Le remplacement", "L'ajout", "L'encadrement", "Le déplacement"], 0, "Le remplacement : on change un mot par un autre ou par un équivalent (nom → pronom)."],
    ["Ajouter « très » devant un mot pour voir si c'est un adjectif, c'est…", ["l'ajout (l'addition)", "l'effacement", "le déplacement", "l'encadrement"], 0, "L'ajout sert à identifier la classe d'un mot : on peut ajouter « très » devant un adjectif."],
    ["Avec quelle manipulation trouve-t-on le sujet?", ["L'encadrement par « C'est… qui »", "L'effacement", "Le déplacement", "L'ajout de « très »"], 0, "« C'est Gérard qui marche » : l'encadrement par C'est… qui montre le sujet."],
    ["Avec quelle manipulation trouve-t-on le verbe conjugué?", ["L'encadrement par « ne… pas »", "L'encadrement par « C'est… qui »", "Le déplacement", "L'ajout de « très »"], 0, "« Gérard ne marche pas » : le verbe se laisse encadrer par ne… pas."],
    ["Quel constituant peut être effacé ET déplacé?", ["Le complément de phrase", "Le sujet", "Le prédicat", "Le verbe"], 0, "Le complément de phrase est facultatif et mobile. Le sujet et le prédicat ne s'effacent pas et ne se déplacent pas."],
    ["Le sujet peut-il être effacé?", ["Non", "Oui", "Seulement s'il est court", "Seulement au début"], 0, "Le sujet est obligatoire : on ne peut pas l'effacer ni le déplacer."],
    ["Dans « Gérard marche au parc », quel groupe peut-on déplacer?", ["au parc", "Gérard", "marche", "Gérard marche"], 0, "« Au parc, Gérard marche. » : c'est le complément de phrase."],
    ["Quelle manipulation ne fonctionne PAS avec le complément de phrase?", ["L'encadrement", "L'effacement", "Le déplacement", "Le remplacement"], 0, "Le complément de phrase s'efface, se déplace, se remplace et accepte l'ajout, mais ne s'encadre pas."],
    ["Quelle phrase montre l'encadrement du sujet?", ["C'est le dragon qui garde le trésor.", "Le dragon ne garde pas le trésor.", "Il garde le trésor.", "Le trésor, le dragon le garde."], 0, "C'est… qui encadre le sujet « le dragon »."],
    ["Quel mot ne peut pas être effacé dans un GN?", ["Le nom (noyau)", "L'adjectif", "Le complément du nom", "Aucun"], 0, "Le nom est le noyau du GN : on ne peut pas l'effacer."],
    ["Quelle classe de mots peut être encadrée par « ne… pas »?", ["Le verbe", "Le nom", "L'adjectif", "Le déterminant"], 0, "Seul le verbe conjugué se laisse encadrer par ne… pas."],
    ["Quel mot peut être précédé de « très »?", ["Un adjectif", "Un nom", "Un verbe", "Un déterminant"], 0, "On peut ajouter « très » devant un adjectif : très gros."],
  ],
  enrichie: [
    ["Une phrase de base enrichie est toujours…", ["déclarative et affirmative", "interrogative et négative", "impérative", "exclamative"], 0, "Comme la phrase de base, elle est déclarative et affirmative, mais elle contient plus de détails."],
    ["Quelle est la différence entre une phrase de base et une phrase de base enrichie?", ["L'enrichie contient des mots qui précisent et donnent plus d'informations.", "L'enrichie n'a pas de sujet.", "L'enrichie est toujours une question.", "Il n'y a aucune différence."], 0, "On ajoute des adjectifs, des adverbes, des compléments du nom…"],
    ["Quelle phrase est une phrase de base enrichie de « La maison est lugubre. »?", ["La petite maison très abîmée est excessivement lugubre.", "La maison est-elle lugubre?", "La maison n'est pas lugubre.", "Quelle maison lugubre!"], 0, "Elle reste déclarative et affirmative, avec plus de détails."],
    ["Dans « La petite maison très abîmée aux fenêtres brisées est lugubre. », quel est le sujet?", ["La petite maison très abîmée aux fenêtres brisées", "La petite maison", "aux fenêtres brisées", "est lugubre"], 0, "Le sujet est tout le GN enrichi : C'est… qui le prouve."],
    ["Dans « Au bout de la clairière lointaine, la maison est lugubre. », quel est le complément de phrase?", ["Au bout de la clairière lointaine", "la maison", "est lugubre", "lointaine"], 0, "Il peut être déplacé ou effacé."],
    ["Dans « Le vieux dragon dort profondément dans sa grotte humide. », quel est le prédicat?", ["dort profondément", "Le vieux dragon", "dans sa grotte humide", "humide"], 0, "Le prédicat contient le verbe et ce qui le complète. « dans sa grotte humide » est un complément de phrase."],
    ["Quel mot enrichit le GN « le chevalier »?", ["courageux", "court", "rapidement", "et"], 0, "Un adjectif comme « courageux » ajoute une précision au nom."],
    ["Quel mot enrichit le verbe dans « Le loup hurle. »?", ["fort", "le", "loup", "et"], 0, "« Le loup hurle fort » : l'adverbe précise le verbe."],
    ["Laquelle n'est PAS une phrase de base enrichie?", ["Le grand dragon ne dort pas.", "Le grand dragon dort paisiblement.", "Le grand dragon rouge dort.", "Ce soir, le grand dragon dort."], 0, "Elle est négative : une phrase de base (enrichie ou non) est affirmative."],
    ["Quelle phrase contient un complément du nom?", ["Les fenêtres de la tour sont brisées.", "Les fenêtres sont brisées.", "Hier, les fenêtres ont été brisées.", "Les fenêtres sont très brisées."], 0, "« de la tour » complète le nom « fenêtres »."],
  ],
  ponct: [
    ["Quelle phrase est une phrase complexe?", ["Le dragon dort et le chevalier attend.", "Le dragon dort dans sa grotte.", "Le petit dragon vert.", "Demain matin, le dragon dormira."], 0, "Une phrase complexe contient deux verbes conjugués (deux phrases réunies)."],
    ["Quel mot peut servir de coordonnant pour former une phrase complexe?", ["parce que", "très", "dans", "rapidement"], 0, "Phrase de base + coordonnant (mais, et, car, parce que…) + phrase de base = phrase complexe."],
    ["Où va la virgule? « La potion est amère mais elle te guérira. »", ["Avant « mais »", "Après « mais »", "Après « potion »", "Il n'en faut pas"], 0, "On met une virgule avant les conjonctions « mais » et « car »."],
    ["Où va la virgule? « Tout d'abord j'aimerais vous parler des dragons. »", ["Après « Tout d'abord »", "Après « j'aimerais »", "Après « parler »", "Il n'en faut pas"], 0, "On met une virgule après un marqueur de relation (tout d'abord, cependant, en effet, premièrement…)."],
    ["Quelle phrase est bien ponctuée?", ["Le chevalier boit tous les matins une potion.", "Le chevalier boit une potion, tous les matins.", "Le chevalier, boit une potion tous les matins.", "Le chevalier boit, une potion tous les matins."], 0, "Un complément de phrase à la fin de la phrase ne prend pas de virgule."],
    ["Quelle phrase est bien ponctuée?", ["Le mage prépare, chaque soir, une potion magique.", "Le mage prépare chaque soir, une potion magique.", "Le mage, prépare chaque soir une potion magique.", "Le mage prépare, chaque soir une potion magique."], 0, "Un complément de phrase au milieu de la phrase est encadré par deux virgules."],
    ["« Allons manger, Grand-maman! » Que change la virgule?", ["On invite Grand-maman à manger avec nous.", "On va manger Grand-maman.", "Rien du tout.", "On pose une question."], 0, "La virgule marque une petite pause et change le sens de la phrase!"],
    ["En lecture, que signifie une virgule?", ["Une demi-pause", "Une longue pause", "La fin de la phrase", "Une question"], 0, "La virgule sépare des mots ou des groupes de mots et signifie une demi-pause."],
    ["Combien de verbes conjugués y a-t-il dans une phrase complexe?", ["Au moins deux", "Un seul", "Aucun", "Toujours trois"], 0, "Chaque verbe conjugué forme une phrase à l'intérieur de la phrase complexe."],
    ["Dans « Le loup hurle, la lune brille. », qu'est-ce qui relie les deux phrases?", ["Une virgule", "Le mot « et »", "Un point", "Le mot « mais »"], 0, "Ici, les deux phrases sont juxtaposées : elles sont séparées par une virgule."],
    ["Quel mot peut relier deux phrases pour former une phrase complexe?", ["mais", "très", "le", "rapide"], 0, "« mais » est une conjonction : elle peut relier deux phrases."],
    ["Où faut-il une virgule? « Après le souper nous jouerons dehors. »", ["Après « souper »", "Après « nous »", "Après « jouerons »", "Il n'en faut pas"], 0, "Un complément de phrase placé au début est suivi d'une virgule : « Après le souper, nous jouerons dehors. »"],
    ["Quelle phrase est bien ponctuée?", ["J'ai acheté des pommes, des poires et des bananes.", "J'ai acheté des pommes des poires, et des bananes.", "J'ai acheté, des pommes, des poires, et des bananes.", "J'ai acheté des pommes des poires et des bananes."], 0, "Dans une énumération, on met une virgule entre les éléments, sauf devant le dernier « et »."],
    ["Dans une énumération, on ne met habituellement pas de virgule…", ["devant « et »", "après le premier mot", "entre deux noms", "entre deux adjectifs"], 0, "« des pommes, des poires et des bananes » : pas de virgule devant « et »."],
    ["Quel signe annonce les paroles d'un personnage?", ["Le deux-points (:)", "Le point (.)", "La virgule (,)", "Le point d'exclamation (!)"], 0, "Le deux-points annonce qu'un personnage va parler."],
    ["Dans un dialogue, quel signe indique qu'un nouveau personnage parle?", ["Le tiret (-)", "La virgule (,)", "Le point-virgule (;)", "Le point (.)"], 0, "Chaque changement d'interlocuteur commence par un tiret, sur une nouvelle ligne."],
    ["Quels signes ouvrent et ferment un dialogue?", ["Les guillemets « »", "Les parenthèses ( )", "Les crochets [ ]", "Les points de suspension …"], 0, "Le dialogue s'ouvre avec « et se ferme avec »."],
    ["Quelle phrase est bien ponctuée?", ["Le roi demanda : « Qui a pris ma couronne? »", "Le roi demanda « Qui a pris ma couronne? »", "Le roi demanda, qui a pris ma couronne.", "Le roi demanda : qui a pris ma couronne »"], 0, "Deux-points, puis guillemets autour des paroles."],
    ["Où faut-il une virgule? « Léa range sa chambre et son frère lave la vaisselle. »", ["Il n'en faut pas", "Après « Léa »", "Après « chambre »", "Après « frère »"], 0, "Deux phrases reliées par « et » n'ont habituellement pas besoin de virgule."],
    ["Quel mot ne peut PAS relier deux phrases?", ["avec", "et", "mais", "car"], 0, "« avec » est une préposition : elle introduit un groupe de mots, pas une phrase."],
    ["Quelle phrase contient une virgule bien placée?", ["Pendant l'hiver, les ours dorment.", "Pendant, l'hiver les ours dorment.", "Pendant l'hiver les ours, dorment.", "Les ours, dorment pendant l'hiver."], 0, "On ne sépare jamais le sujet de son verbe par une virgule."],
    ["Laquelle est une phrase complexe?", ["Quand la cloche sonne, les élèves rentrent.", "Les élèves rentrent à l'école.", "Dans la cour, les élèves jouent.", "Les élèves de 5e année."], 0, "Deux verbes conjugués : « sonne » et « rentrent »."],
  ],
  sens: [
    ["Quel mot fait partie de la même famille que « terre »?", ["terrain", "tard", "tirer", "tête"], 0, "« terrain », « terrasse », « enterrer » viennent tous de « terre »."],
    ["Quel mot fait partie de la même famille que « dent »?", ["dentiste", "dans", "danse", "dindon"], 0, "Le radical « dent » se retrouve dans « dentiste », « dentier »."],
    ["Quel mot fait partie de la même famille que « fleur »?", ["fleuriste", "flèche", "fleuve", "flûte"], 0, "Fleur, fleurir, fleuriste, floral…"],
    ["Quel mot fait partie de la même famille que « lait »?", ["laitier", "laid", "laisser", "lacet"], 0, "Lait, laitier, laitage, allaiter : le radical « lait » se retrouve dans chacun."],
    ["Dans « impossible », que veut dire le préfixe « im- »?", ["Le contraire (pas)", "Encore une fois", "Avant", "Très"], 0, "Im-possible = pas possible."],
    ["Dans « refaire », que veut dire le préfixe « re- »?", ["Encore une fois", "Le contraire", "Petit", "Avant"], 0, "Refaire = faire encore une fois."],
    ["Quel suffixe veut dire « petit » (diminutif)?", ["-ette (comme dans « fillette »)", "-logie", "-able", "-mètre"], 0, "-ette est un diminutif : une fillette, c'est une petite fille."],
    ["Que veut dire le préfixe « multi- »?", ["Plusieurs", "Deux", "Contre", "Petit"], 0, "Multicolore = de plusieurs couleurs."],
    ["Que veut dire le préfixe « bi- »?", ["Deux", "Plusieurs", "Petit", "Répétition"], 0, "Une bicyclette a deux roues."],
    ["Que veut dire le préfixe « micro- »?", ["Petit", "Grand", "Contre", "Deux"], 0, "Un microbe est un tout petit être vivant."],
    ["Que veut dire le préfixe « anti- »?", ["Contre", "Avant", "Plusieurs", "Petit"], 0, "Un antivol protège contre le vol."],
    ["Que veut dire le préfixe « para- »?", ["Protection", "Répétition", "Deux", "Petit"], 0, "Un parapluie protège de la pluie."],
    ["Que veut dire le suffixe « -logie »?", ["Science", "Mesure", "Angle", "Qui écrit"], 0, "La biologie est la science du vivant."],
    ["Que veut dire le suffixe « -mètre »?", ["Mesure de…", "Science", "Petit", "Qui écrit"], 0, "Un thermomètre mesure la température."],
    ["Que veut dire le suffixe « -gone »?", ["Angle", "Mesure", "Science", "Petit"], 0, "Un hexagone a six angles."],
    ["Que veut dire le suffixe « -able »?", ["Que l'on peut", "Contraire", "Petit", "Science"], 0, "Lavable = que l'on peut laver."],
    ["Que veut dire le suffixe « -graphe »?", ["Qui écrit", "Mesure", "Angle", "Contre"], 0, "Un photographe « écrit » avec la lumière."],
    ["Comment est formé le mot « imprécision »?", ["Préfixe + mot de base + suffixe", "Seulement un préfixe", "Seulement un suffixe", "C'est un mot composé"], 0, "Im + précis + ion : préfixe ET suffixe."],
    ["Lequel est un mot composé?", ["arc-en-ciel", "jardinage", "refaire", "antivol"], 0, "Un mot composé réunit plusieurs mots. Les autres sont des mots dérivés."],
    ["Lequel est un mot dérivé?", ["jardinage", "grand-père", "arc-en-ciel", "tout à coup"], 0, "Jardin + -age : on a ajouté un suffixe à un mot existant."],
    ["« Légumes » est un mot…", ["générique", "spécifique", "composé", "figuré"], 0, "Un mot générique a un sens général. Carotte, chou et oignon sont des mots spécifiques."],
    ["Quel mot est spécifique dans l'ensemble « fruits »?", ["fraise", "fruits", "nourriture", "dessert"], 0, "Un mot spécifique est précis dans un ensemble."],
    ["Quel mot est générique pour « marteau, tournevis, scie »?", ["outils", "clou", "bois", "atelier"], 0, "Le mot générique englobe tous les mots spécifiques."],
    ["Quel mot fait partie de la même famille que « art »?", ["artistique", "arbre", "arrêt", "armure"], 0, "Art, artiste, artistique : même mot de base."],
    ["Quel est le radical de « chanteuse »?", ["chant", "chanteu", "euse", "anteu"], 0, "Chant-eur, chant-er, chant-euse : le radical est « chant »."],
    ["Quel est un synonyme de « content »?", ["heureux", "triste", "fâché", "fatigué"], 0, "Des synonymes ont presque le même sens."],
    ["Quel est un synonyme de « débuter »?", ["commencer", "terminer", "arrêter", "oublier"], 0, "Débuter = commencer."],
    ["Quel est un synonyme de « énorme »?", ["gigantesque", "minuscule", "léger", "rapide"], 0, "Énorme = gigantesque, immense."],
    ["Quel est un antonyme (contraire) de « ouvrir »?", ["fermer", "pousser", "entrer", "tourner"], 0, "Des antonymes ont des sens contraires."],
    ["Quel est un antonyme de « lourd »?", ["léger", "gros", "pesant", "grand"], 0, "Lourd ↔ léger."],
    ["Quel est un antonyme de « courageux »?", ["peureux", "brave", "fort", "fier"], 0, "Courageux ↔ peureux."],
    ["Quel est l'antonyme de « visible » formé avec un préfixe?", ["invisible", "dévisible", "revisible", "malvisible"], 0, "In- + visible = invisible."],
    ["Dans « Il a un cœur de pierre », le mot « pierre » est employé au sens…", ["figuré", "propre", "contraire", "ancien"], 0, "Son cœur n'est pas vraiment en pierre : il est dur, insensible. C'est le sens figuré."],
    ["Dans « Le chevalier lance une pierre », le mot « pierre » est employé au sens…", ["propre", "figuré", "imaginaire", "contraire"], 0, "C'est une vraie pierre : sens propre."],
    ["Que veut dire « avoir la tête dans les nuages »?", ["Être distrait, rêveur", "Être très grand", "Avoir froid", "Voler en avion"], 0, "C'est une expression au sens figuré."],
    ["Que veut dire « tomber dans les pommes »?", ["S'évanouir", "Tomber d'un arbre", "Manger des pommes", "Faire une tarte"], 0, "Expression au sens figuré."],
    ["Quelle phrase utilise « froid » au sens figuré?", ["Elle m'a lancé un regard froid.", "L'eau du lac est froide.", "Il fait froid dehors.", "Mon chocolat est devenu froid."], 0, "Un regard ne peut pas être vraiment froid : il est distant, pas gentil."],
    ["Quel mot n'est PAS de la même famille que les autres?", ["chanceux", "chanter", "chanson", "chanteur"], 0, "« chanceux » vient de « chance », pas de « chant »."],
    ["Quel mot est formé avec un suffixe?", ["gentiment", "refaire", "défaire", "impoli"], 0, "Gentil + -ment = gentiment. Les autres ont un préfixe."],
  ],
  types: [
    ["Quel est le type de la phrase « Range ta chambre. »?", ["Impérative", "Déclarative", "Interrogative", "Exclamative"], 0, "Elle donne un ordre et n'a pas de sujet : phrase impérative."],
    ["Quel est le type de la phrase « Où se cache le trésor? »?", ["Interrogative", "Déclarative", "Impérative", "Exclamative"], 0, "Elle pose une question et se termine par « ? »."],
    ["Quel est le type de la phrase « Le chevalier traverse le pont. »?", ["Déclarative", "Interrogative", "Impérative", "Exclamative"], 0, "Elle donne une information et se termine par un point."],
    ["Quel est le type de la phrase « Quel magnifique château! »?", ["Exclamative", "Déclarative", "Interrogative", "Impérative"], 0, "Elle exprime une émotion forte et se termine par « ! »."],
    ["Par quel signe se termine une phrase interrogative?", ["?", ".", "!", ":"], 0, "Le point d'interrogation."],
    ["Quelle phrase est impérative?", ["Fermez la porte, s'il vous plaît.", "Vous fermez la porte.", "Fermez-vous la porte?", "Vous avez fermé la porte!"], 0, "Le verbe est à l'impératif, sans sujet."],
    ["Quelle phrase est interrogative?", ["Est-ce que tu viens avec nous?", "Tu viens avec nous.", "Viens avec nous.", "Comme tu es gentil de venir!"], 0, "« Est-ce que » sert à poser une question."],
    ["Quelle est la forme de la phrase « Le dragon ne dort pas. »?", ["Négative", "Affirmative", "Interrogative", "Impérative"], 0, "« ne… pas » : forme négative."],
    ["Mets à la forme négative : « Je mange des légumes. »", ["Je ne mange pas de légumes.", "Je mange pas des légumes.", "Je ne mange des légumes.", "Je mange ne pas de légumes."], 0, "Le marqueur de négation a deux mots (deux adverbes) : « ne » avant le verbe et « pas » après."],
    ["Quelle phrase est à la forme affirmative?", ["Le magicien a trouvé sa baguette.", "Le magicien n'a rien trouvé.", "Le magicien ne trouve jamais sa baguette.", "Le magicien n'a plus sa baguette."], 0, "Elle ne contient pas de mots de négation."],
    ["Quel groupe de mots marque une négation?", ["ne… jamais", "est-ce que", "s'il vous plaît", "très"], 0, "ne… pas, ne… jamais, ne… plus, ne… rien sont des négations."],
    ["Quelle phrase négative est bien écrite?", ["On n'a pas fini.", "On a pas fini.", "On n'a fini pas.", "On ne a pas fini."], 0, "Devant une voyelle, « ne » devient « n' ». Il ne faut pas l'oublier!"],
    ["Transforme en phrase interrogative : « Tu aimes la musique. »", ["Aimes-tu la musique?", "Aime la musique.", "Comme tu aimes la musique!", "Tu n'aimes pas la musique."], 0, "On peut inverser le sujet et le verbe, avec un trait d'union."],
    ["« Ne touche pas à ça! » est une phrase…", ["impérative et négative", "déclarative et affirmative", "interrogative et négative", "exclamative et affirmative"], 0, "Un ordre (impératif) avec « ne… pas » (négative)."],
    ["Une phrase déclarative se termine habituellement par…", ["un point", "un point d'interrogation", "un deux-points", "une virgule"], 0, "Elle donne une information : point."],
    ["Laquelle est une phrase exclamative?", ["Que cette potion est puissante!", "Cette potion est puissante.", "Bois cette potion.", "Est-ce que cette potion est puissante?"], 0, "« Que… ! » exprime une émotion."],
    ["Quelle phrase n'a pas de sujet?", ["Écoute bien.", "Tu écoutes bien.", "Écoutes-tu bien?", "Il écoute bien!"], 0, "À l'impératif, il n'y a pas de sujet exprimé."],
    ["Quel signe de ponctuation termine une phrase impérative?", ["Un point ou un point d'exclamation", "Toujours un point d'interrogation", "Une virgule", "Un deux-points"], 0, "« Range ta chambre. » ou « Range ta chambre! »"],
  ],
  pp: [
    ["Quelle est la terminaison du participe passé d'un verbe en -er?", ["-é", "-i", "-u", "-er"], 0, "Verbes en -er : -é (aimé, chanté)."],
    ["Quelles sont les terminaisons du participe passé des verbes en -ir, -oir et -re (la plupart du temps)?", ["-i ou -u", "-é", "-er", "-ant"], 0, "Fini, venu, vu, rendu…"],
    ["Dans « Les enfants motivés travaillent fort », « motivés » est…", ["un participe passé employé seul (PPS)", "un participe passé avec être (PPE)", "un participe passé avec avoir (PPA)", "un verbe à l'infinitif"], 0, "Sans auxiliaire, le PP joue le rôle d'un adjectif."],
    ["Dans « Henri est allé au tableau », « allé » est…", ["un participe passé employé avec être (PPE)", "un participe passé employé seul (PPS)", "un participe présent", "un infinitif"], 0, "« est » est l'auxiliaire être."],
    ["Quelle est la 1re étape pour accorder un participe passé?", ["Repérer le PP et dire s'il est PPS, PPE ou PPA", "Ajouter un s", "Trouver le complément de phrase", "Le mettre à l'infinitif"], 0, "#1 Repérer le PP, #2 repérer son sujet (genre et nombre), #3 ajouter e et s."],
    ["Dans « La porte est fermée », quel mot est un participe passé?", ["fermée", "est", "porte", "La"], 0, "« fermée » vient du verbe « fermer » : c'est un participe passé."],
    ["Quel est le participe passé du verbe « finir »?", ["fini", "finit", "finir", "finis"], 0, "Pour trouver la finale, on met au féminin : finie → fini."],
    ["Quel est le participe passé du verbe « prendre »?", ["pris", "prit", "prendu", "prend"], 0, "Au féminin : prise → on entend le s, donc « pris »."],
    ["Quel est le participe passé du verbe « mettre »?", ["mis", "mit", "mettu", "met"], 0, "Au féminin : mise → « mis »."],
    ["Quel est le participe passé du verbe « faire »?", ["fait", "fai", "fais", "faite"], 0, "Au féminin : faite → on entend le t, donc « fait »."],
    ["Quel est le participe passé du verbe « voir »?", ["vu", "vus", "voi", "vit"], 0, "J'ai vu."],
    ["Quel est le participe passé du verbe « écrire »?", ["écrit", "écri", "écris", "écrivu"], 0, "Au féminin : écrite → « écrit »."],
    ["Comment trouver la lettre muette à la fin d'un participe passé?", ["On le met au féminin.", "On le met au pluriel.", "On le conjugue au futur.", "On cherche son sujet."], 0, "Pris → prise, fait → faite : le féminin fait entendre la lettre muette."],
    ["Dans « Les élèves sont partis », avec quel auxiliaire est le participe passé?", ["être", "avoir", "aller", "faire"], 0, "« sont » est le verbe être : on accorde avec le sujet."],
    ["Avec l'auxiliaire être, le participe passé s'accorde avec…", ["le sujet", "le complément direct", "le verbe", "rien du tout"], 0, "Les filles sont parties : « parties » s'accorde avec « Les filles »."],
    ["Un participe passé employé seul s'accorde comme…", ["un adjectif, avec le nom qu'il complète", "un verbe, avec son sujet", "un adverbe, il ne change pas", "un déterminant"], 0, "« des feuilles tombées » : comme un adjectif, il prend le genre et le nombre du nom."],
    ["Quelle phrase contient un participe passé employé seul?", ["Les vitres brisées brillent au soleil.", "Le chevalier a brisé la vitre.", "La vitre est brisée.", "Le chevalier brise la vitre."], 0, "« brisées » n'a pas d'auxiliaire : il est employé seul."],
    ["Quel participe passé est bien accordé?", ["Les lettres écrites", "Les lettres écrit", "Les lettres écrits", "Les lettres écrite"], 0, "« lettres » est féminin pluriel : écrites."],
    ["Quelle forme termine « Mes cousines sont arrivé__ hier »?", ["-es", "-s", "-e", "rien"], 0, "Avec être, accord avec « Mes cousines » (féminin pluriel) : arrivées."],
  ],
  compl: [
    ["Quelle question pose-t-on après le verbe pour trouver le CD?", ["Qui? ou Quoi?", "À qui? ou À quoi?", "Où? ou Quand?", "Pourquoi?"], 0, "L'homme mange quoi? une pomme → CD."],
    ["Quelle question pose-t-on après le verbe pour trouver le CI?", ["À qui? De quoi? (avec une préposition)", "Qui? Quoi?", "Quand?", "Comment?"], 0, "Il parle de quoi? de ses vacances → CI."],
    ["Par quel pronom remplace-t-on le CI « à son ami » dans « Elle parle à son ami »?", ["lui", "le", "la", "les"], 0, "Elle lui parle. Les pronoms CI : lui, leur."],
    ["Dans « Il les mange », le mot « les » est…", ["un CD (pronom)", "un CI", "un sujet", "un déterminant"], 0, "Le CD peut être un pronom (le, la, les, l') placé devant le verbe."],
    ["L'attribut du sujet peut-il être effacé?", ["Non", "Oui", "Seulement s'il est un GN", "Seulement au pluriel"], 0, "L'attribut du sujet ne peut pas être effacé."],
    ["Dans « Cette femme est une grande artiste », l'attribut du sujet est…", ["un groupe du nom", "un adverbe", "un verbe", "une préposition"], 0, "L'attribut peut être un adjectif, adverbe + adjectif, ou un GN."],
    ["Dans « Le chevalier mange une pomme », quel est le complément direct (CD)?", ["une pomme", "Le chevalier", "mange", "pomme mange"], 0, "Le chevalier mange quoi? Une pomme. On peut le remplacer par « la » : il la mange."],
    ["Dans « Léa parle à son frère », quel est le complément indirect (CI)?", ["à son frère", "Léa", "parle", "son"], 0, "Léa parle à qui? À son frère. Le CI commence par une préposition (à, de…)."],
    ["Un complément direct (CD) se construit…", ["sans préposition", "toujours avec « à »", "toujours avec « de »", "avec une virgule"], 0, "Le CD suit directement le verbe, sans préposition."],
    ["Par quel pronom peut-on remplacer le CD « les cadeaux » dans « Il ouvre les cadeaux »?", ["les", "leur", "lui", "y"], 0, "Il les ouvre."],
    ["Par quel pronom peut-on remplacer le CI « à ses amis » dans « Il écrit à ses amis »?", ["leur", "les", "la", "en"], 0, "Il leur écrit."],
    ["Dans « Nous rêvons de vacances », le groupe « de vacances » est…", ["un complément indirect", "un complément direct", "un sujet", "un attribut du sujet"], 0, "Rêver DE quelque chose : la préposition « de » montre que c'est un CI."],
    ["Dans « Le dragon semble fatigué », quel mot est l'attribut du sujet?", ["fatigué", "dragon", "semble", "Le"], 0, "Après un verbe attributif (être, sembler, paraître, devenir, rester…), le mot qui décrit le sujet est l'attribut."],
    ["Quel verbe est un verbe attributif?", ["devenir", "manger", "courir", "lancer"], 0, "être, paraître, sembler, devenir, demeurer, rester… sont attributifs."],
    ["L'attribut du sujet s'accorde avec…", ["le sujet", "le verbe", "le complément direct", "rien du tout"], 0, "« Les princesses sont courageuses » : accord avec « Les princesses »."],
    ["Complète : « Les sorcières paraissent ___ »", ["fâchées", "fâché", "fâchés", "fâchée"], 0, "L'attribut s'accorde avec le sujet « Les sorcières » (féminin pluriel)."],
    ["Dans « La reine est généreuse », « généreuse » est…", ["un attribut du sujet", "un complément direct", "un complément indirect", "un complément de phrase"], 0, "Après le verbe « être », il décrit le sujet : attribut."],
    ["Dans « Le mage donne une potion à l'archer », quels sont les compléments du verbe?", ["« une potion » (CD) et « à l'archer » (CI)", "« Le mage » (CD) et « une potion » (CI)", "« à l'archer » (CD) et « une potion » (CI)", "Il n'y en a pas."], 0, "Donner quoi? une potion (CD). À qui? à l'archer (CI)."],
    ["Le complément du verbe peut-il être déplacé au début de la phrase?", ["Non, il reste dans le groupe du verbe", "Oui, toujours", "Oui, s'il y a une virgule", "Seulement s'il est court"], 0, "C'est le complément de PHRASE qui se déplace. Le complément du verbe, lui, reste après le verbe."],
    ["Dans « Mon chien obéit à mon père », « à mon père » est…", ["un complément indirect", "un complément direct", "un attribut", "un sujet"], 0, "Obéir À quelqu'un : CI."],
    ["Dans « Ce gâteau est délicieux », quel est le verbe attributif?", ["est", "gâteau", "délicieux", "Ce"], 0, "« être » est le verbe attributif le plus fréquent."],
    ["Quelle phrase contient un attribut du sujet?", ["Mon frère devient grand.", "Mon frère mange un gâteau.", "Mon frère parle à sa mère.", "Mon frère court vite."], 0, "« devenir » est attributif : « grand » décrit le sujet."],
  ],
};
// Novembre : représentation, comparaison et ordre des décimaux (sans l'arrondi)
function genDecRep() {
  if (Math.random() < .25) {
    const e = ri(0, 9), base = [ri(1, 9), ri(1, 9)], l = [`${e},${base[0]}`, `${e},${base[0]}${base[1]}`, `${e},0${base[1]}`, `${e},${base[1]}`].filter((x, i, a) => a.indexOf(x) === i);
    if (l.length < 3) return genDecRep();
    const v = x => parseFloat(x.replace(",", ".")), ok = [...l].sort((a, b) => v(a) - v(b)), j = x => x.join(" ; ");
    if (new Set(l.map(v)).size < l.length) return genDecRep();
    return qc("Quel est l'ordre croissant (du plus petit au plus grand)?", j(ok), [j([...ok].reverse()), j([...ok].sort((a, b) => a.length - b.length || v(a) - v(b))), j([ok[1], ok[0], ...ok.slice(2)])], "On compare d'abord les unités, puis les dixièmes, puis les centièmes. Un nombre plus long n'est pas toujours plus grand!");
  }
  return genDecimaux(pk([0, 1, 1, 3, 4]));
}
function svgCercle2(t) {
  const c = 90, r = 70, a = ri(0, 359) * Math.PI / 180, P = (ang, rr = r) => [c + rr * Math.cos(ang), c + rr * Math.sin(ang)].map(x => x.toFixed(1));
  let seg = "";
  if (t === 0) { const p = P(a); seg = `<line x1="${c}" y1="${c}" x2="${p[0]}" y2="${p[1]}" stroke="#d33" stroke-width="4"/>`; }
  else if (t === 1) { const p = P(a), q = P(a + Math.PI); seg = `<line x1="${q[0]}" y1="${q[1]}" x2="${p[0]}" y2="${p[1]}" stroke="#d33" stroke-width="4"/>`; }
  else if (t === 2) { const p = P(a), q = P(a + 1.6); seg = `<line x1="${q[0]}" y1="${q[1]}" x2="${p[0]}" y2="${p[1]}" stroke="#d33" stroke-width="4"/>`; }
  return svgBox(180, 180, `<circle cx="${c}" cy="${c}" r="${r}" fill="#eef6ff" stroke="${t === 3 ? "#d33" : "#222"}" stroke-width="${t === 3 ? 5 : 3}"/>${seg}<circle cx="${c}" cy="${c}" r="4" fill="#222"/><text x="${c + 7}" y="${c - 7}" font-size="14" font-weight="bold" fill="#222">O</text>`);
}
function genCercle() {
  const t = ri(0, 3), noms = ["Un rayon", "Un diamètre", "Une corde", "La circonférence"];
  const ex = ["Le rayon va du centre jusqu'au cercle.", "Le diamètre traverse le cercle en passant par le centre : il vaut 2 rayons.", "Une corde relie deux points du cercle sans passer par le centre.", "La circonférence est la ligne courbe qui fait le tour du cercle."];
  if (t === 0) { const k = ri(0, 3); return qc(k === 3 ? "Comment s'appelle la ligne rouge?" : "Comment s'appelle le segment rouge? (O est le centre)", noms[k], noms, ex[k], svgCercle2(k)); }
  if (t === 1) { const r = ri(2, 15); return qc(`Le rayon d'un cercle mesure ${r} cm. Combien mesure son diamètre?`, `${r * 2} cm`, [`${r} cm`, `${r % 2 ? r + 1 : r / 2} cm`, `${r * 4} cm`, `${r + 2} cm`], `Le diamètre vaut 2 rayons : 2 × ${r} = ${r * 2} cm.`); }
  if (t === 2) { const r = ri(2, 15); return qc(`Le diamètre d'un cercle mesure ${r * 2} cm. Combien mesure son rayon?`, `${r} cm`, [`${r * 2} cm`, `${r * 4} cm`, `${r + 2} cm`, `${r - 1} cm`], `Le rayon est la moitié du diamètre : ${r * 2} ÷ 2 = ${r} cm.`); }
  return pk([
    qc("Le point au milieu du cercle s'appelle…", "le centre", ["le rayon", "le diamètre", "la corde"], "Tous les points du cercle sont à la même distance du centre."),
    qc("Le diamètre passe toujours par…", "le centre du cercle", ["le bord seulement", "un seul point du cercle", "l'extérieur du cercle"], "Le diamètre traverse le cercle en passant par le centre."),
    qc("Combien de rayons faut-il pour faire un diamètre?", "2", ["1", "3", "4"], "Diamètre = 2 × rayon."),
    qc("Dans un même cercle, tous les rayons…", "ont la même longueur", ["sont de longueurs différentes", "sont plus longs que le diamètre", "passent par deux points du cercle"], "Chaque point du cercle est à la même distance du centre."),
    qc("Quel est le plus long segment qu'on peut tracer dans un cercle?", "le diamètre", ["le rayon", "une petite corde", "le centre"], "Le diamètre est la plus longue corde du cercle."),
    qc("La ligne qui fait le tour du cercle s'appelle…", "la circonférence", ["le diamètre", "le rayon", "la surface"], "C'est le contour du cercle.")]);
}
const UL = [["mm", 1], ["cm", 10], ["dm", 100], ["m", 1000], ["km", 1000000]];
function genLongueur() {
  const t = ri(0, 4);
  if (t <= 1) {
    let i = ri(0, 3), j = t === 0 ? i + 1 + (i < 2 && Math.random() < .4 ? 1 : 0) : i; if (t === 1) { j = ri(0, 2); i = j + 1 + (j < 2 && Math.random() < .4 ? 1 : 0); }
    if (j > 4 || i > 4) return genLongueur();
    const [u1, f1] = UL[t === 0 ? j : i], [u2, f2] = UL[t === 0 ? i : j], n = ri(2, 9), f = f1 / f2, v = n * f;
    return qc(`${n} ${u1} = ? ${u2}`, nb(v), [nb(v * 10), decC(v / 10), nb(v * 100), String(n)], `1 ${u1} = ${nb(f)} ${u2}, donc ${n} ${u1} = ${nb(v)} ${u2}.`);
  }
  if (t === 2) { const n = ri(11, 99), [u1, u2] = pk([["mm", "cm"], ["cm", "dm"], ["dm", "m"]]); return qc(`${n} ${u1} = ? ${u2}`, decC(n / 10), [String(n * 10), decC(n / 100), String(n)], `10 ${u1} = 1 ${u2}. On divise par 10 : ${decC(n / 10)} ${u2}.`); }
  if (t === 3) {
    const vals = mel([[2, "m"], [150, "cm"], [1800, "mm"], [25, "dm"], [3, "m"], [270, "cm"], [9, "dm"], [1200, "mm"]]).slice(0, 4), mm = ([n, u]) => n * UL.find(x => x[0] === u)[1];
    if (new Set(vals.map(mm)).size < 4) return genLongueur();
    const m = vals.reduce((a, b) => mm(b) > mm(a) ? b : a), f = ([n, u]) => `${nb(n)} ${u}`;
    return qc("Quelle longueur est la plus grande?", f(m), vals.filter(x => x !== m).map(f), `On met tout dans la même unité : ${vals.map(x => `${f(x)} = ${nb(mm(x) / 10)} cm`).join(", ")}.`);
  }
  return pk([
    qc("Combien de centimètres y a-t-il dans 1 mètre?", "100", ["10", "1 000", "50"], "1 m = 100 cm."),
    qc("Combien de millimètres y a-t-il dans 1 centimètre?", "10", ["100", "1", "1 000"], "1 cm = 10 mm."),
    qc("Combien de mètres y a-t-il dans 1 kilomètre?", "1 000", ["100", "10", "10 000"], "1 km = 1 000 m."),
    qc("Quelle unité est 10 fois plus grande que le centimètre?", "le décimètre (dm)", ["le millimètre (mm)", "le mètre (m)", "le kilomètre (km)"], "mm → cm → dm → m : chaque unité vaut 10 fois la précédente."),
    qc("Quelle unité utiliser pour mesurer l'épaisseur d'un crayon?", "le millimètre (mm)", ["le kilomètre (km)", "le mètre (m)", "le décimètre (dm)"], "C'est très petit : on mesure en millimètres."),
    qc("Quelle unité utiliser pour mesurer la longueur de la cour d'école?", "le mètre (m)", ["le millimètre (mm)", "le centimètre (cm)", "le kilomètre (km)"], "Une cour fait quelques dizaines de mètres.")]);
}
// ---------- Planification des Irréductibles : notions ajoutées ----------
const hm = x => `${Math.floor(x / 60)} h ${String(x % 60).padStart(2, "0")}`;
function genTemps() {
  const t = ri(0, 4);
  if (t === 0) { const h = ri(1, 4), m = pk([10, 15, 20, 30, 45]), tot = h * 60 + m; return qc(`${h} h ${m} min = ? minutes`, tot, [h * 100 + m, h * 60, tot + 60, h + m], `1 h = 60 min. ${h} × 60 = ${h * 60}, plus ${m} = ${tot} minutes.`); }
  if (t === 1) { const d = ri(8, 14) * 60 + pk([0, 15, 30, 45]), du = ri(1, 3) * 60 + pk([15, 20, 40, 50]), f = d + du; return qc(`Le film commence à ${hm(d)} et finit à ${hm(f)}. Combien de temps dure-t-il?`, `${Math.floor(du / 60)} h ${du % 60} min`, [`${Math.floor(du / 60) + 1} h ${du % 60} min`, `${Math.floor(du / 60)} h ${(du % 60 + 30) % 60 || 10} min`, `${Math.floor(f / 60) - Math.floor(d / 60)} h ${Math.abs(f % 60 - d % 60) + 10} min`], `De ${hm(d)} à ${hm(f)} : on compte les heures entières, puis les minutes qui restent.`); }
  if (t === 2) { const m = ri(2, 9); return qc(`${m} minutes = ? secondes`, m * 60, [m * 100, m * 10, m * 60 + 60, m * 30], `1 min = 60 s, donc ${m} × 60 = ${m * 60} s.`); }
  if (t === 3) { const j = ri(2, 5); return qc(`${j} jours = ? heures`, j * 24, [j * 12, j * 60, j * 24 + 24, j * 10], `1 jour = 24 h, donc ${j} × 24 = ${j * 24} h.`); }
  return pk([qc("Combien y a-t-il de jours dans une semaine?", "7", ["5", "10", "12"], "1 semaine = 7 jours."),
    qc("Combien y a-t-il de mois dans une année?", "12", ["10", "52", "365"], "1 an = 12 mois."),
    qc("Combien y a-t-il de semaines dans une année (environ)?", "52", ["12", "48", "365"], "1 an ≈ 52 semaines."),
    qc("Un siècle, c'est combien d'années?", "100", ["10", "1 000", "50"], "Une décennie = 10 ans, un siècle = 100 ans, un millénaire = 1 000 ans."),
    qc("Une demi-heure, c'est combien de minutes?", "30", ["50", "15", "45"], "La moitié de 60 minutes = 30 minutes."),
    qc("Un quart d'heure, c'est combien de minutes?", "15", ["25", "4", "45"], "60 ÷ 4 = 15 minutes.")]);
}
function svgBarreFrac(a, b) { const w = 300 / b; return svgBox(320, 60, Array.from({ length: b }, (_, i) => `<rect x="${10 + i * w}" y="10" width="${w}" height="40" fill="${i < a ? "#6c4cf5" : "#fff"}" stroke="#222" stroke-width="2"/>`).join("")); }
function svgDroiteFrac(a, b) {
  const x0 = 20, L = 280, X = i => x0 + i * L / b;
  return svgBox(320, 70, `<line x1="${x0}" y1="30" x2="${x0 + L}" y2="30" stroke="#222" stroke-width="2"/>` + Array.from({ length: b + 1 }, (_, i) => `<line x1="${X(i)}" y1="${i % b ? 22 : 16}" x2="${X(i)}" y2="${i % b ? 38 : 44}" stroke="#222" stroke-width="2"/>`).join("")
    + `<text x="${x0}" y="62" font-size="14" text-anchor="middle">0</text><text x="${x0 + L}" y="62" font-size="14" text-anchor="middle">1</text><circle cx="${X(a)}" cy="30" r="7" fill="#d33"/>`);
}
function genFracSens() {
  const t = ri(0, 2), b = ri(3, 10), a = ri(1, b - 1);
  if (t === 0) return qcm("Quelle fraction de la bande est coloriée?", `${a}/${b}`, [`${b - a}/${b}`, `${a}/${b - a}`, `${b}/${a}`, `${a}/${b + 1}`], `La bande a ${b} parts égales (dénominateur) et ${a} ${a > 1 ? "sont coloriées" : "est coloriée"} (numérateur).`).slice(0, 4).concat([svgBarreFrac(a, b)]);
  if (t === 1) return qcm("Quelle fraction indique le point rouge?", `${a}/${b}`, [`${a + 1}/${b}`, `${a}/${b + 1}`, `${b - a}/${b}`, `${a - 1 || a + 2}/${b}`], `Entre 0 et 1, il y a ${b} bonds égaux : chaque bond vaut 1/${b}. Le point est au bond ${a}.`).slice(0, 4).concat([svgDroiteFrac(a, b)]);
  return pk([qc(`Dans la fraction ${a}/${b}, que nous dit le dénominateur (${b})?`, "En combien de parts égales le tout est partagé", ["Combien de parts on prend", "La grandeur du tout", "Le nombre de touts"], "Le dénominateur (en bas) dit en combien de parts égales on partage le tout."),
    qc(`Dans la fraction ${a}/${b}, que nous dit le numérateur (${a})?`, "Combien de parts on considère", ["En combien de parts on partage", "La grandeur d'une part", "Combien il reste de parts"], "Le numérateur (en haut) compte les parts qu'on considère."),
    qc(`Quelle fraction est égale à 1 entier?`, `${b}/${b}`, [`1/${b}`, `${b}/1`, `${a}/${b}`], "Quand on prend toutes les parts, on a le tout : numérateur = dénominateur."),
    qc(`Pour qu'une fraction soit juste, les parts doivent être…`, "égales", ["de couleurs différentes", "toutes coloriées", "plus nombreuses que 10"], "Une fraction partage un tout en parts égales.")]);
}
function genMultPos() {
  const a = ri(102, 489), b = ri(12, 49), u = b % 10 || 1, B = u === b % 10 ? b : b + 1, d = Math.floor(B / 10), p1 = a * u, p2 = a * d * 10;
  if (Math.random() < .3) { const ea = Math.round(a / 100) * 100, eb = Math.round(B / 10) * 10; return qc(`Environ combien font ${a} × ${B}? (arrondis d'abord)`, nb(ea * eb), [nb(ea * eb * 10), nb(ea * eb / 10), nb(ea + eb), nb((ea + 100) * eb)], `${a} ≈ ${ea} et ${B} ≈ ${eb}. ${ea} × ${eb} = ${nb(ea * eb)}.`); }
  return qc(`${a} × ${B} = ? (calcul posé)`, nb(p1 + p2), [nb(p1 + a * d), nb(p1 + p2 + 100), nb(p2 + a * d), nb(p1 + p2 - 10)], `${a} × ${u} = ${nb(p1)} ; ${a} × ${d * 10} = ${nb(p2)} (n'oublie pas le zéro!) ; ${nb(p1)} + ${nb(p2)} = ${nb(p1 + p2)}.`);
}
const SOLIDES = [["un cube", 6, 8, 12], ["un prisme à base rectangulaire", 6, 8, 12], ["un prisme à base triangulaire", 5, 6, 9], ["un prisme à base pentagonale", 7, 10, 15], ["un prisme à base hexagonale", 8, 12, 18],
  ["une pyramide à base carrée", 5, 5, 8], ["une pyramide à base triangulaire", 4, 4, 6], ["une pyramide à base pentagonale", 6, 6, 10], ["une pyramide à base hexagonale", 7, 7, 12]];
function genSolides() {
  if (Math.random() < .65) { const [n, f, s, a] = pk(SOLIDES), k = ri(0, 2), quoi = ["faces", "sommets", "arêtes"][k], v = [f, s, a][k]; return qc(`Combien ${quoi === "arêtes" ? "d'" : "de "}${quoi} a ${n}?`, v, [f, s, a, v + 1, v - 1, v + 2], `${n[0].toUpperCase() + n.slice(1)} : ${f} faces, ${s} sommets et ${a} arêtes.`); }
  return pk([qc("Quel solide a deux bases identiques et parallèles reliées par des rectangles?", "un prisme", ["une pyramide", "un cône", "une sphère"], "Un prisme a 2 bases pareilles ; ses autres faces sont des rectangles."),
    qc("Quel solide a une seule base et des faces triangulaires qui se rejoignent en un sommet?", "une pyramide", ["un prisme", "un cube", "un cylindre"], "Les faces latérales d'une pyramide sont des triangles qui se touchent au sommet."),
    qc("Un développement de cube est formé de combien de carrés?", "6", ["4", "8", "12"], "Le cube a 6 faces carrées : son développement a 6 carrés."),
    qc("Une arête, c'est…", "le segment où deux faces se rencontrent", ["un coin du solide", "une face plane", "le dessous du solide"], "Arête = rencontre de 2 faces. Sommet = point où les arêtes se rencontrent."),
    qc("Lequel de ces solides n'est PAS un polyèdre?", "le cylindre", ["le cube", "la pyramide", "le prisme"], "Un polyèdre n'a que des faces planes. Le cylindre a une surface courbe."),
    qc("Quel est le nom du développement qui forme une pyramide à base carrée?", "1 carré et 4 triangles", ["2 carrés et 4 rectangles", "6 carrés", "1 triangle et 3 carrés"], "La base est un carré, les 4 faces latérales sont des triangles.")]);
}
function svgGrilleRect(L, l) { const c = 22; return svgBox(L * c + 20, l * c + 20, Array.from({ length: L * l }, (_, i) => `<rect x="${10 + (i % L) * c}" y="${10 + Math.floor(i / L) * c}" width="${c}" height="${c}" fill="#cfe8ff" stroke="#3a6ea5"/>`).join("")); }
function genAire() {
  const t = ri(0, 3), L = ri(3, 9), l = ri(2, 6);
  if (t === 0) return qc("Quelle est l'aire de ce rectangle? (1 carré = 1 cm²)", `${L * l} cm²`, [`${2 * (L + l)} cm²`, `${L + l} cm²`, `${L * l + L} cm²`, `${L * l - l} cm²`], `${l} rangées de ${L} carrés : ${l} × ${L} = ${L * l} cm².`).slice(0, 4).concat([svgGrilleRect(L, l)]);
  if (t === 1) return qc(`Un rectangle mesure ${L} m sur ${l} m. Quelle est son aire?`, `${L * l} m²`, [`${2 * (L + l)} m²`, `${L + l} m²`, `${L * l} m`, `${L * l + l} m²`], `Aire = longueur × largeur = ${L} × ${l} = ${L * l} m². Attention : ${2 * (L + l)} m serait le périmètre.`);
  if (t === 2) { const h = ri(2, 5); return qc(`Une boîte est remplie de cubes de 1 cm³ : ${L} cubes de long, ${l} de large et ${h} de haut. Quel est son volume?`, `${L * l * h} cm³`, [`${L * l} cm³`, `${L + l + h} cm³`, `${L * l * h + L * l} cm³`], `${L} × ${l} = ${L * l} cubes par étage, × ${h} étages = ${L * l * h} cm³.`); }
  return pk([qc("Quelle unité sert à mesurer une aire?", "le centimètre carré (cm²)", ["le centimètre (cm)", "le centimètre cube (cm³)", "le litre (L)"], "L'aire couvre une surface : on la mesure en unités carrées."),
    qc("Quelle unité sert à mesurer un volume?", "le centimètre cube (cm³)", ["le centimètre carré (cm²)", "le mètre (m)", "le kilogramme (kg)"], "Le volume, c'est la place occupée : on le mesure en unités cubes."),
    qc("L'aire d'une surface, c'est…", "la grandeur de la surface", ["le tour de la figure", "la place dans une boîte", "la masse d'un objet"], "Le tour de la figure, c'est le périmètre."),
    qc("Quelle unité choisir pour l'aire du plancher de la classe?", "le mètre carré (m²)", ["le centimètre carré (cm²)", "le kilomètre carré (km²)", "le mètre (m)"], "Un plancher de classe fait quelques dizaines de mètres carrés.")]);
}
function svgDroiteEntiers(v) { const X = i => 160 + i * 14; return svgBox(320, 60, `<line x1="10" y1="25" x2="310" y2="25" stroke="#222" stroke-width="2"/>` + Array.from({ length: 21 }, (_, i) => i - 10).map(i => `<line x1="${X(i)}" y1="${i % 5 ? 20 : 15}" x2="${X(i)}" y2="${i % 5 ? 30 : 35}" stroke="#222" stroke-width="2"/>${i % 5 ? "" : `<text x="${X(i)}" y="52" font-size="13" text-anchor="middle">${i < 0 ? "−" + -i : i}</text>`}`).join("") + `<circle cx="${X(v)}" cy="25" r="6" fill="#d33"/>`); }
function genEntiers() {
  const t = ri(0, 3), f = x => x < 0 ? "−" + -x : String(x);
  if (t === 0) { const v = pk([-9, -8, -7, -6, -4, -3, -2, -1, 1, 2, 3, 4, 6, 7, 8, 9]); return qc("Quel nombre indique le point rouge?", f(v), [f(-v), f(v + 1), f(v - 1)], "À gauche de 0, les nombres sont négatifs ; plus on va à gauche, plus le nombre est petit.").slice(0, 4).concat([svgDroiteEntiers(v)]); }
  if (t === 1) { const l = mel([-ri(1, 9), -ri(10, 20), ri(0, 9), ri(10, 20)]); const m = Math.min(...l); return qc(`Quel est le plus petit nombre? ${l.map(f).join(" ; ")}`, f(m), l.filter(x => x !== m).map(f), "Les nombres négatifs sont plus petits que 0. −20 est plus petit que −3 : il est plus loin à gauche."); }
  if (t === 2) { const a = -ri(2, 9), b = ri(2, 9); return qc(`Il fait ${f(a)} °C le matin et ${b} °C l'après-midi. De combien de degrés la température a-t-elle monté?`, `${b - a} °C`, [f(b + a) + " °C", `${b} °C`, `${b - a + 1} °C`, `${-a} °C`], `De ${f(a)} à 0 : ${-a} degrés, puis de 0 à ${b} : ${b} degrés. ${-a} + ${b} = ${b - a}.`); }
  const l = [-ri(5, 9), -ri(1, 4), 0, ri(1, 9)], ok = [...l].sort((x, y) => x - y), j = x => x.map(f).join(" ; ");
  return qc("Quel est l'ordre croissant?", j(ok), [j([ok[1], ok[0], ok[2], ok[3]]), j([...ok].reverse()), j([ok[2], ok[1], ok[0], ok[3]])], "Ordre croissant : du plus petit au plus grand. Le plus petit est le négatif le plus loin de 0.");
}
function genTransfo() {
  if (Math.random() < .35) { const x = ri(1, 5), y = ri(1, 5), dx = ri(1, 4), dy = ri(1, 4), dr = Math.random() < .5; return qc(`Le point A est à (${x}, ${y}). On fait une translation de ${dx} case${dx > 1 ? "s" : ""} vers la droite et ${dy} vers le haut. Où arrive A?`, `(${x + dx}, ${y + dy})`, [`(${x + dy}, ${y + dx})`, `(${x + dx - 1}, ${y + dy})`, `(${x + dx}, ${y + dy + 1})`, `(${x + dx + dy}, ${y})`], `Vers la droite : on ajoute au 1er nombre (${x} + ${dx}). Vers le haut : on ajoute au 2e (${y} + ${dy}).`); }
  return pk([qc("Une translation, c'est…", "faire glisser une figure sans la tourner ni la retourner", ["faire tourner une figure", "retourner une figure comme dans un miroir", "agrandir une figure"], "La flèche de translation dit dans quelle direction et de combien on glisse."),
    qc("Après une translation, la figure…", "garde la même forme et la même grandeur", ["devient plus grande", "est à l'envers", "change de forme"], "Une translation déplace seulement la figure."),
    qc("Une frise, c'est…", "un motif qui se répète en bande", ["un dessin qui couvre toute une surface", "une figure à 4 côtés", "un motif qui ne se répète pas"], "Dans une frise, le motif se répète par translation, en ligne."),
    qc("Un dallage, c'est…", "des figures qui couvrent une surface sans trou ni chevauchement", ["un motif en une seule ligne", "des figures qui se chevauchent", "un seul grand carré"], "Comme les tuiles d'un plancher."),
    qc("Quelle figure ne peut PAS former un dallage toute seule?", "le cercle", ["le carré", "le triangle équilatéral", "l'hexagone régulier"], "Des cercles laissent toujours des trous entre eux."),
    qc("Laquelle de ces figures peut former un dallage toute seule?", "l'hexagone régulier", ["le cercle", "le pentagone régulier", "l'octogone régulier"], "Comme les alvéoles d'une ruche!")]);
}
const GEN_MATHS = { temps: genTemps, fracsens: genFracSens, multpos: genMultPos, solides: genSolides, aire: genAire, entiers: genEntiers, transfo: genTransfo, decrep: genDecRep, cercle: genCercle, longueur: genLongueur, numeration: genNumeration, arrondi: genArrondi, divis: genDivis, pemdas: genPemdas, moyenne: genMoyenne, equiv: questionEquivalentes, reduc: questionReduction,
  compfrac: genCompFrac, addfrac: genAddFrac, pourcent: genPourcent, droites: genDroites, angles: genAngles, triangles: genTriangles, cartesien: genCartesien,
  decimaux: genDecimaux, opdec: genOpDec, multfrac: genMultFrac, stats: genStats, mesures: genMesures, proba: genProba };
// Une question pour la notion choisie : [question, choix, bonne réponse, explication, dessin?]
function questionNotion(m, n) {
  if (m === "maths") return (GEN_MATHS[n] || genNumeration)();
  if (CONJ_NOTION[n]) return questionTemps(pk(CONJ_NOTION[n]));
  if (n === "conj") return questionVerbe();
  if (n === "inv") return pk(INVAR);
  if (n === "pp") return Math.random() < .6 ? questionPP() : pk(BANQUE_FR.pp);
  if (n === "ppa") return Math.random() < .3 ? pk(BANQUE_FR.pp.slice(1, 8)) : questionPPA();
  if (n === "accverbe") { const r = Math.random(); return r < .55 ? questionAccVerbe() : r < .85 ? pk(ACC_REGLES) : pk(ARENE.accverbe); }
  if (n === "gn") return Math.random() < .45 ? questionAccordGN() : pk(ARENE.gn);
  if (ARENE[n]) return pk(ARENE[n]);
  if (BANQUE_FR[n]) return pk(BANQUE_FR[n]);
  return pk(FR);
}

// Une fraction « a/b » s'affiche empilée
const fracHtml = t => esc(String(t)).replace(/(\d+)\/(\d+)/g, '<span class="frac"><sup>$1</sup><sub>$2</sub></span>');
const pick = a => a[Math.floor(Math.random() * a.length)];
// La planification de base (ci-dessus) peut être modifiée par l'enseignant dans la page /planif.
// Elle est gardée dans ce navigateur (clé « planification ») : l'Arène et le Donjon, ouverts sur le même site, la lisent tous les deux.
const BASE = JSON.parse(JSON.stringify(MOIS_NOTIONS));
function appliquer(p) {
  for (const [id, x] of Object.entries(BASE)) {
    const m = p && p[id] && typeof p[id] === 'object' ? p[id] : null;
    const garde = (mat, l) => Array.isArray(l) ? l.filter(k => NOTIONS[mat][k]) : x[mat];
    MOIS_NOTIONS[id] = { nom: x.nom, maths: m ? garde('maths', m.maths) : x.maths.slice(), fr: m ? garde('fr', m.fr) : x.fr.slice() };
  }
}
if (typeof localStorage !== 'undefined') try { appliquer(JSON.parse(localStorage.getItem('planification') || 'null')); } catch {}
Object.assign(exp, { NOTIONS, NOTIONS_DEFAUT, MOIS_NOTIONS, BASE, appliquer, questionNotion, fracHtml, difficulte: d => { DIFF = d; } });
})(typeof module !== 'undefined' ? module.exports : (window.Planification = {}));
