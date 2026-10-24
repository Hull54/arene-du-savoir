# ⚔️ Arène du Savoir

Jeu de combat en arène pour toute la classe. Quand un élève tombe, il doit répondre à une question de français ou de mathématiques pour revenir au combat.

## Jouer en ligne (aucune installation)

Le jeu est hébergé gratuitement sur **Render** à partir de ce dépôt GitHub.

1. Ouvrir la page enseignant : `https://<votre-adresse>.onrender.com/prof` sur l'ordinateur relié au projecteur.
2. L'adresse à donner aux élèves s'affiche en haut à droite. Ils l'ouvrent dans le navigateur de leur Chromebook, tablette ou ordinateur, écrivent leur prénom et choisissent leur héros.

> Le service gratuit se met en veille après 15 minutes sans joueurs. La première visite peut alors prendre environ une minute : ouvrez la page enseignant quelques minutes avant la période.

### Mise en ligne initiale (une seule fois)

1. Sur render.com : **New +** → **Blueprint** → choisir le dépôt `arene-du-savoir` → **Apply**. Render lit le fichier `render.yaml` et crée le service tout seul.
2. Chaque modification poussée sur GitHub est remise en ligne automatiquement.

### Option : sur un ordinateur où l'on peut installer Node.js

`node server.js`, puis ouvrir `http://localhost:3000/prof`. Les élèves doivent alors être sur le même réseau.

## Commandes des élèves

| Action | Clavier / souris | Tablette |
|---|---|---|
| Bouger | WASD ou flèches | Glisser le doigt sur l'écran |
| Viser | Souris (sinon : direction du déplacement) | Direction du déplacement |
| Attaque | J ou clic gauche | Bouton ⚔️ |
| Pouvoir spécial | K, Maj ou clic droit | Bouton ✨ |
| Habileté de déplacement | Espace | Bouton 💨 |
| Pouvoir du familier | E | Bouton du familier |
| Répondre à une question | Clic ou touches 1 à 4 | Toucher la réponse |

## Les héros

| Classe | Vie | Vitesse | Attaque | Pouvoir | Habileté (Espace) |
|---|---|---|---|---|---|
| ⚔️ Guerrier | 170 | lente | Épée, corps à corps, large arc | 🛡️ Bouclier : −75 % de dégâts pendant 3 s | 💨 Charge : fonce 3 cases, bouscule et blesse un peu (3 s) |
| 🗡️ Voleur | 105 | très rapide | Dague, corps à corps. **Dégâts ×2 dans le dos** | 👤 Ombre : invisible 4 s, plus rapide, prochaine attaque +50 % | 🌀 Roulade : esquive, invincible pendant la roulade (2 s) |
| 🔮 Mage | 90 | moyenne | Boule de feu à distance | 💥 Explosion autour de lui | ✨ Téléportation : 3 cases plus loin, même par-dessus l'eau (3 s) |
| 🏹 Archer | 100 | rapide | Flèche longue portée | 🌧️ Pluie de 7 flèches | 🦘 Saut arrière : recule en tirant une flèche (3 s) |

Sans souris, on vise dans la direction où l'on marche : une petite flèche jaune sous son héros montre la visée.

## Les cartes (au choix de l'enseignant)

Chaque carte est prévue pour environ 20 joueurs. L'enseignant change de carte à tout moment depuis son tableau de bord.

| Carte | Particularités |
|---|---|
| 🏘️ Village de Mirabel | Maisons où l'on peut entrer, rivière avec ponts et gué, grand lac avec une île au trésor, fontaine de soin |
| 🏙️ Cité de Pierrefort | Ville médiévale : rues pavées et ruelles, 12 maisons à visiter, marché avec fontaine de soin, canal avec 3 ponts, cathédrale, réverbères |
| 🌵 Désert Brûlant | Oasis, temple en ruine, plateaux rocheux, sables mouvants qui ralentissent |
| 🏰 Donjon Oublié | Salles et couloirs, torches, fosses et lave (on peut tirer par-dessus), coffres dans les coins |
| ❄️ Toundra Glacée | Immense lac gelé où l'on glisse plus vite, cabanes, feu de camp qui soigne |
| 🏟️ Grand Colisée | Grande arène ouverte de gladiateurs, cellules dans les coins |
| 🟤 Marais Gluant | Boue qui ralentit, passerelles, cabane de la sorcière |

- **L'eau** bloque les joueurs mais pas les flèches ni les boules de feu. On traverse par les ponts ou par les **gués** (eau peu profonde, on y avance plus lentement).
- **Les buissons et les hautes herbes** cachent un joueur tant qu'il n'attaque pas (hautes herbes : Village, Marais).
- **Les tonneaux explosifs** (rouges, avec une flamme) explosent quand on les frappe ou qu'on tire dessus : 30 dégâts autour, jamais à celui qui l'a fait exploser ni à ses coéquipiers. Un tonneau peut en faire exploser un autre. Ils reviennent après 30 secondes. En mode boss, ils ne blessent que le Roi Gluant.
- **Les portails** (un cercle de pierres violet, une paire par carte) envoient à l'autre bout de la carte. Il faut en ressortir avant de pouvoir y rentrer.
- **Le lieu de soin** (fontaine, source, autel ou feu de camp) redonne de la vie.

## Coffres et objets cachés

- **Coffres-questions** : en touchant un coffre, l'élève reçoit une question (il est protégé pendant qu'il répond). Bonne réponse : une pièce d'équipement (6 fois sur 10) ou un objet puissant. Mauvaise réponse : une petite potion quand même. Le coffre se referme et se remplit après 40 secondes.
- **Objets cachés** : des objets apparaissent dans les buissons, les maisons et les coins secrets. On ne les voit que de près (une petite étincelle de loin).
- **🌟 Coffre doré** : un seul à la fois sur la carte (il brille). C'est un défi de **2 questions de suite**. Deux bonnes réponses : l'équipement s'améliore deux fois et 🪙 +5 pièces d'or. Une bonne réponse : un objet puissant. Aucune : une petite potion. Une minute après son ouverture, un autre coffre devient doré.
- **Séries** : 3 bonnes réponses de suite donnent un objet bonus.

### Pièces d'or et boutique

Chaque bonne réponse rapporte 🪙 1 pièce d'or, chaque série de 3 en rapporte 2 de plus, et le coffre doré en donne 5. Les pièces sont gardées dans le navigateur de l'élève, pour son prénom. Sur l'écran de fin de manche, la **boutique** débloque des looks rares, sans aucun effet sur le combat :

| Article | Prix |
|---|---|
| Tenue noire | 🪙 20 |
| Tenue blanche | 🪙 25 |
| Tenue dorée | 🪙 30 |
| Familier doré | 🪙 30 |
| Familier spectral | 🪙 35 |
| 👑 Couronne | 🪙 40 |
| 🪽 Ailes | 🪙 60 |

| Objet | Effet |
|---|---|
| 🧪 Potion de vie | +50 points de vie |
| ❤️ Grande potion | Vie au maximum |
| 👢 Bottes de vitesse | Plus rapide pendant 10 s |
| 💪 Potion de force | +50 % de dégâts pendant 10 s |
| 🛡️ Bouclier magique | −75 % de dégâts pendant 4 s |
| 🌑 Cape d'ombre | Invisible pendant 5 s |

### Équipement (toujours un bonus)

On le trouve surtout dans les coffres, parfois caché sur la carte. Chaque pièce existe en **bronze, argent et or** : retrouver une pièce qu'on a déjà l'améliore. L'équipement se voit sur le héros et dans les 4 cases en bas à gauche de l'écran. On le garde même après un K.O., jusqu'à la fin de la manche.

| Pièce | Bronze | Argent | Or |
|---|---|---|---|
| 🪖 Casque | +5 armure | +10 armure | +15 armure |
| 🥋 Armure | +10 armure | +20 armure | +30 armure |
| 🗡️ Épée | +5 dégâts | +10 dégâts | +15 dégâts |
| 🥾 Bottes | +5 % vitesse | +10 % vitesse | +15 % vitesse |

Chaque point d'armure retire 1 % des dégâts reçus, jusqu'à 40 % au maximum. L'épée ajoute ses dégâts aux attaques de base (épée, dague, boule de feu, flèche).

## Modes de jeu

- **Chacun pour soi** : le mode classique. Le meneur (seul en tête, au moins 3 victoires) porte une couronne 👑 : le vaincre rapporte 2 points.
- **Équipes** (2, 3 ou 4) : couleurs d'équipe, pas de dégâts entre coéquipiers, score commun.
- **⛰️ Roi de la colline** (en équipes) : une zone en cercle apparaît sur la carte. Une équipe seule dans la zone gagne 1 point par seconde. Si deux équipes y sont, la zone est contestée (elle clignote) et personne ne marque. La zone se déplace toutes les 75 secondes. **120 points** pour gagner.
- **🚩 Capture du drapeau** (2 équipes) : chaque équipe a un drapeau dans sa base, d'un côté de la carte. On prend le drapeau adverse en le touchant (on avance un peu moins vite en le portant) et on le ramène dans sa base, mais seulement si notre propre drapeau y est. Un porteur K.O. laisse tomber le drapeau : un coéquipier le ramène en le touchant, sinon il revient seul après 20 secondes. **3 captures** pour gagner.
- **👑 Boss coopératif** : toute la classe affronte le **Boss du mois**, choisi dans la liste à côté du bouton Boss (le jeu propose celui du mois en cours). Les coups l'abîment, et **chaque bonne réponse lui enlève 3 % de sa vie** : les élèves moins à l'aise au combat sont aussi utiles. Les joueurs ne peuvent pas se blesser entre eux.
  - **À 75 % et 25 % de sa vie**, il lève le **🛡️ Bouclier du savoir** : plus aucun coup ne passe et toute la classe reçoit une question éclair. Si la majorité répond juste, le bouclier se brise et le boss perd 8 % de sa vie. Sinon, il reprend un peu de vie et le bouclier tient encore 8 secondes.
  - **À la moitié de sa vie, il s'enrage** : plus rapide, attaques plus fréquentes, et il appelle des sbires (puis de nouveaux toutes les 18 secondes).
  - Une grande barre de vie s'affiche en haut de l'écran des élèves et en bas du projecteur. Le podium de fin classe les plus gros dégâts au boss.

Les Boss viennent des cartes du système d'émulation de la classe (un par mois). Plus la carte a de PV, plus le Boss est coriace.

| Mois | Boss | Attaques | Sbires |
|---|---|---|---|
| Septembre | 🥁 Gobelin du Bruit (40 PV) | Cri assourdissant (étourdit un instant), notes de musique en éventail | Gobelins tapageurs |
| Octobre | 🎃 Dragon des Citrouilles (50 PV) | Souffle de feu, citrouilles explosives (un cercle rouge montre où elles tombent) | Citrouilles-monstres |
| Novembre | 👻 Seigneur des Ombres (50 PV) | Disparaît et réapparaît à côté d'un élève, boules d'ombre qui ralentissent | Ombres |
| Décembre | ❄️ Dragon du Givre (60 PV) | Souffle de glace qui ralentit, éclats de glace tout autour | Élémentaires de glace |
| Janvier | ⏳ Cyclope du Temps perdu (60 PV) | Sablier qui ralentit le temps autour de lui, rayon de l'œil (une ligne rouge prévient) | Sabliers vivants |
| Février | 🐂 Minotaure de la Discorde (70 PV) | Tourbillon de hache et d'épée, charge en ligne droite | Diablotins |
| Mars | 🐙 Kraken du Chaos (80 PV) | Flaques d'encre qui ralentissent, tentacules qui jaillissent du sol | Petites pieuvres |
| Avril | 📚 Golem des Devoirs (90 PV) | Onde de choc qui étourdit, piles de livres lancées | Livres volants |
| Mai | 💪 Titan du Bruit (100 PV) | Onde de tonnerre, rochers lancés. « Plus c'est bruyant, plus je deviens fort » : ses coups font plus mal quand beaucoup d'élèves sont collés à lui | Gobelins tapageurs |
| Juin | 😈 Empereur du Chaos (200 PV) | Tourbillon d'épée, éclairs du chaos. Il a **3** Boucliers du savoir (75 %, 50 %, 25 %) | Chevaliers noirs |
| Juillet, août | 👑 Roi Gluant | Onde de choc, boules de slime | Petits slimes |

## Tableau de bord enseignant (`/prof`)

- Vue de toute la carte pour le projecteur.
- **Carte**, **mode** et **minuterie** de manche (3 à 20 minutes, ou sans limite).
- **Pause**, **Nouvelle manche** (avec compte à rebours 3-2-1), **Finir la manche**, **Plein écran** pour le projecteur (Échap pour revenir). À la fin, un **podium** s'affiche chez tout le monde (et les meilleurs cerveaux).
- **⚡ Question éclair** : le jeu s'arrête et toute la classe reçoit la même question (20 secondes). Le projecteur montre ensuite le nombre de bonnes réponses et la répartition des choix. Les bonnes réponses gagnent un bonus de force.
- Choix des **notions** posées (par matière, avec « tout » et « aucune »).
- **Robots** pour tester seul ou compléter un petit groupe.
- **Classement** et bouton ✕ pour retirer un joueur.
- **Réussite du groupe par notion** et, pour chaque élève, son taux de réussite et la **notion à revoir**.
- **🖨️ Bilans à imprimer** : une fiche par élève sur toute la séance (pas seulement la manche) : nombre de questions, réussite par notion, points forts, notions à revoir, pièces d'or gagnées et une ligne pour un commentaire.
- **Révision ciblée** (automatique) : pendant la séance, le jeu note les notions que chaque élève rate. Ces notions reviennent plus souvent dans ses questions (jusqu'à 4 fois plus), et moins souvent celles qu'il réussit bien.
- **📥 Exporter les résultats** : un fichier qui s'ouvre dans Excel (une ligne par élève, une colonne par notion).

## Sons

Sons rétro 8 bits fabriqués par le jeu. Chaque élève peut couper le son avec le bouton 🔊 en haut à gauche.

## Les questions

Les questions portent sur 13 notions, que l'enseignant coche ou décoche pendant la partie :

- **Français** : phrase de base, classes de mots variables, construction du GN, accords dans le GN, accord des verbes (1er et 2e groupe, présent et imparfait).
- **Mathématiques** : tables d'addition, de soustraction, de multiplication et de division de 0 à 12 (4 notions séparées), angles, fractions, triangles, numération.

Il y a deux sortes de questions :

- **Questions fixes**, dans `questions.json` (82 questions).
- **Questions générées** à l'infini par `generateurs.js` : conjugaisons, additions, soustractions, multiplications et divisions, valeur de position, arrondis, fractions illustrées, angles et triangles dessinés. Chaque partie propose donc des questions différentes.

### Ajouter ou modifier une question fixe

Dans `questions.json`, chaque question suit ce modèle :

```json
{"matiere":"Mathématiques","notion":"Angles","question":"Combien de degrés mesure un angle droit ?","choix":["90°","180°","45°","100°"],"reponse":0}
```

- `reponse` est la position de la bonne réponse dans `choix`, en commençant à **0**. Les choix sont mélangés à l'écran.
- Une nouvelle `notion` apparaît toute seule dans le tableau de bord.
- Optionnel : `"explication":"..."` s'affiche quand l'élève se trompe.
- Sur GitHub, modifier le fichier (icône crayon) puis « Commit changes » : Render remet le jeu à jour en 1 à 2 minutes.

## Les personnages

Si deux élèves choisissent le même prénom, le second devient « Léa 2 » pour que leurs résultats ne se mélangent pas.

Chaque élève choisit une version **fille ou garçon** de sa classe (Guerrière/Guerrier, Voleuse/Voleur, Mage, Archère/Archer), une teinte de peau, une couleur de cheveux, une **couleur de tenue** (7 choix, plus 3 rares à la boutique), un **accessoire** (cape, lunettes ou écharpe, plus couronne et ailes à la boutique) et un **familier** qui le suit partout (4 couleurs au choix pour chaque familier). Le look se change dans le menu et aussi sur l'écran de fin de manche, entre deux manches. Tous les dessins sont en pixel art rétro, créés dans le code du jeu (aucune image empruntée).

## Les familiers

Chaque familier a un mini pouvoir sur la touche **E**, rechargé en 15 secondes.

| Familier | Pouvoir |
|---|---|
| 🐱 Chat | Ronron : +25 points de vie |
| 🐺 Loup | Hurlement : repousse les ennemis proches, sans dégâts |
| 🐲 Bébé dragon | Crache une petite boule de feu (8 dégâts) |
| 🦉 Hibou | Œil perçant : révèle pendant 4 s les joueurs cachés (buissons, herbes, ombre) |
| 🟢 Slime | Flaque gluante : ralentit les ennemis qui marchent dedans |

## Fichiers

- `server.js` : le serveur de jeu (règles, combats, questions, coffres, modes, robots).
- `cartes.js` : les 7 cartes, tracées en tuiles.
- `public/index.html` : l'écran de l'élève.
- `public/prof.html` : le tableau de bord de l'enseignant.
- `public/draw.js` : le dessin en pixel art des cartes et des héros (partagé par les deux écrans).
- `public/sons.js` : les sons 8 bits.
- `questions.json` : les questions fixes.
- `generateurs.js` : les questions générées (verbes, tables, numération, fractions, angles, triangles).
