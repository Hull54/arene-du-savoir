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

## Les cartes (au choix de l'enseignant)

Chaque carte est prévue pour environ 20 joueurs. L'enseignant change de carte à tout moment depuis son tableau de bord.

| Carte | Particularités |
|---|---|
| 🏘️ Village de Mirabel | Maisons où l'on peut entrer, rivière avec ponts et gué, grand lac avec une île au trésor, fontaine de soin |
| 🌲 Forêt des Murmures | Beaucoup de buissons pour se cacher, ruisseau avec gués, cabane du bûcheron, source de soin |
| 🌵 Désert Brûlant | Oasis, temple en ruine, plateaux rocheux, sables mouvants qui ralentissent |
| 🏰 Donjon Oublié | Salles et couloirs, torches, fosses et lave (on peut tirer par-dessus), coffres dans les coins |
| ❄️ Toundra Glacée | Immense lac gelé où l'on glisse plus vite, cabanes, feu de camp qui soigne |
| 🏟️ Grand Colisée | Grande arène ouverte de gladiateurs, cellules dans les coins |
| 🟤 Marais Gluant | Boue qui ralentit, passerelles, cabane de la sorcière |

- **L'eau** bloque les joueurs mais pas les flèches ni les boules de feu. On traverse par les ponts ou par les **gués** (eau peu profonde, on y avance plus lentement).
- **Les buissons** cachent un joueur tant qu'il n'attaque pas.
- **Le lieu de soin** (fontaine, source, autel ou feu de camp) redonne de la vie.

## Coffres et objets cachés

- **Coffres-questions** : en touchant un coffre, l'élève reçoit une question (il est protégé pendant qu'il répond). Bonne réponse : un objet puissant. Mauvaise réponse : une petite potion quand même. Le coffre se referme et se remplit après 40 secondes.
- **Objets cachés** : des objets apparaissent dans les buissons, les maisons et les coins secrets. On ne les voit que de près (une petite étincelle de loin).
- **Séries** : 3 bonnes réponses de suite donnent un objet bonus.

| Objet | Effet |
|---|---|
| 🧪 Potion de vie | +50 points de vie |
| ❤️ Grande potion | Vie au maximum |
| 👢 Bottes de vitesse | Plus rapide pendant 10 s |
| 💪 Potion de force | +50 % de dégâts pendant 10 s |
| 🛡️ Bouclier magique | −75 % de dégâts pendant 4 s |
| 🌑 Cape d'ombre | Invisible pendant 5 s |

## Modes de jeu

- **Chacun pour soi** : le mode classique.
- **Équipes** (2, 3 ou 4) : couleurs d'équipe, pas de dégâts entre coéquipiers, score commun.
- **👑 Boss coopératif** : toute la classe affronte le Roi Gluant. Les coups l'abîment, et **chaque bonne réponse lui enlève 3 % de sa vie** : les élèves moins à l'aise au combat sont aussi utiles. Les joueurs ne peuvent pas se blesser entre eux.

## Tableau de bord enseignant (`/prof`)

- Vue de toute la carte pour le projecteur.
- **Carte**, **mode** et **minuterie** de manche (3 à 20 minutes, ou sans limite).
- **Pause**, **Nouvelle manche**, **Finir la manche**. À la fin, un **podium** s'affiche chez tout le monde (et les meilleurs cerveaux).
- **⚡ Question éclair** : le jeu s'arrête et toute la classe reçoit la même question (20 secondes). Le projecteur montre ensuite le nombre de bonnes réponses et la répartition des choix. Les bonnes réponses gagnent un bonus de force.
- Choix des **notions** posées (par matière, avec « tout » et « aucune »).
- **Robots** pour tester seul ou compléter un petit groupe.
- **Classement** et bouton ✕ pour retirer un joueur.
- **Réussite du groupe par notion** et, pour chaque élève, son taux de réussite et la **notion à revoir**.
- **📥 Exporter les résultats** : un fichier qui s'ouvre dans Excel (une ligne par élève, une colonne par notion).

## Sons

Sons rétro 8 bits fabriqués par le jeu. Chaque élève peut couper le son avec le bouton 🔊 en haut à gauche.

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

- `server.js` : le serveur de jeu (règles, combats, questions, coffres, modes, robots).
- `cartes.js` : les 7 cartes, tracées en tuiles.
- `public/index.html` : l'écran de l'élève.
- `public/prof.html` : le tableau de bord de l'enseignant.
- `public/draw.js` : le dessin en pixel art des cartes et des héros (partagé par les deux écrans).
- `public/sons.js` : les sons 8 bits.
- `questions.json` : les questions fixes.
- `generateurs.js` : les questions générées (verbes, tables, numération, fractions, angles, triangles).
