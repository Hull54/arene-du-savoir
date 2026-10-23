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
| Attaque | Espace ou clic gauche | Bouton ⚔️ |
| Pouvoir spécial | E, Maj ou clic droit | Bouton ✨ |
| Répondre à une question | Clic ou touches 1 à 4 | Toucher la réponse |

## Les héros

| Classe | Vie | Vitesse | Attaque | Pouvoir |
|---|---|---|---|---|
| ⚔️ Guerrier | 170 | lente | Épée, corps à corps, large arc | 🛡️ Bouclier : −75 % de dégâts pendant 3 s |
| 🗡️ Voleur | 105 | très rapide | Dague, corps à corps. **Dégâts ×2 dans le dos** | 👤 Ombre : invisible 4 s, plus rapide, prochaine attaque +50 % |
| 🔮 Mage | 90 | moyenne | Boule de feu à distance | 💥 Explosion autour de lui |
| 🏹 Archer | 100 | rapide | Flèche longue portée | 🌧️ Pluie de 7 flèches |

## L'arène (prévue pour environ 20 joueurs)

Une grande carte en pixel art, vue de dessus, traversée par une rivière. L'eau bloque les joueurs mais pas les flèches ni les boules de feu : on traverse par l'un des 5 ponts.

| Région | Particularité |
|---|---|
| ❄️ Toundra glacée | Sapins enneigés, bonshommes de neige et un **lac gelé** sur lequel on glisse plus vite |
| 🌲 Forêt des Murmures | Arbres et buissons : un joueur dans un buisson est invisible tant qu'il n'attaque pas |
| 🟤 Marais Gluant | Arbres morts, mares, et **boue qui ralentit** |
| 🌵 Désert Brûlant | Cactus, rochers et une oasis entourée de palmiers |
| 🏘️ Village de Mirabel | Maisons, étals du marché et **fontaine de soin** sur la place : la zone que tout le monde se dispute |
| 🏰 Donjon Oublié | Forteresse aux couloirs étroits et piliers éclairés de torches, idéale pour les embuscades du Voleur |

Une mini-carte en haut à droite et le nom de la zone actuelle aident les élèves à s'orienter.

## Tableau de bord enseignant (`/prof`)

- Vue de toute l'arène pour le projecteur.
- **Pause** (pour reprendre l'attention du groupe), **Nouvelle manche** (remise à zéro des scores).
- Choix des **notions** posées (par matière, avec « tout » et « aucune »).
- **Robots** pour tester seul ou compléter un petit groupe.
- **Classement** et bouton ✕ pour retirer un joueur.
- **Réussite du groupe par notion** et, pour chaque élève, son taux de réussite et la **notion à revoir** (vert ≥ 75 %, jaune ≥ 50 %, rouge en dessous).

## Les questions

Les questions portent sur 10 notions, que l'enseignant coche ou décoche pendant la partie :

- **Français** : phrase de base, classes de mots variables, construction du GN, accords dans le GN, accord des verbes (1er et 2e groupe, présent et imparfait).
- **Mathématiques** : tables de 1 à 12, angles, fractions, triangles, numération.

Il y a deux sortes de questions :

- **Questions fixes**, dans `questions.json` (82 questions).
- **Questions générées** à l'infini par `generateurs.js` : conjugaisons, multiplications et divisions, valeur de position, arrondis, fractions illustrées, angles et triangles dessinés. Chaque partie propose donc des questions différentes.

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

Chaque élève choisit une version **fille ou garçon** de sa classe (Guerrière/Guerrier, Voleuse/Voleur, Mage, Archère/Archer), une teinte de peau et une couleur de cheveux. Tous les dessins sont en pixel art rétro, créés dans le code du jeu (aucune image empruntée).

## Fichiers

- `server.js` : le serveur de jeu (règles, combats, questions, robots).
- `public/index.html` : l'écran de l'élève.
- `public/prof.html` : le tableau de bord de l'enseignant.
- `public/monde.js` : la carte (régions, rivière, étangs, boue), partagée par le serveur et les écrans.
- `public/draw.js` : le dessin en pixel art de l'arène et des héros (partagé par les deux écrans).
- `questions.json` : les questions fixes.
- `generateurs.js` : les questions générées (verbes, tables, numération, fractions, angles, triangles).
