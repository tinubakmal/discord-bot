# Guide d'import de donnees

Le script `scripts/import.ts` (`npm run import -- --file <chemin>`) permet
d'ajouter ou de mettre a jour des items en masse, depuis un fichier **JSON**
ou **CSV**, sans toucher au code de l'application.

## Principe

Chaque ligne/objet importe reference ses entites liees (type d'objet, ecole,
rarete, monde, zone, boss, set, talents, statistiques) **par leur nom**. Si
l'entite n'existe pas encore en base, elle est **creee automatiquement**. Cela
permet d'importer un fichier de plusieurs milliers d'items sans devoir
pre-remplir les referentiels a la main.

Les items sont identifies par un slug derive de leur nom : importer deux fois
le meme fichier **met a jour** les items existants au lieu de les dupliquer
(operation idempotente).

## Format JSON

Voir `data/sample-items.json`. Un tableau d'objets :

```json
[
  {
    "name": "Chapeau de l'Appel de Tempete",
    "type": "hat",
    "level": 170,
    "rarity": "epic",
    "schools": ["storm"],
    "description": "...",
    "world": "avalon",
    "zone": "camelot",
    "boss": "morgan-le-fay",
    "set": "storm-caller",
    "sourceText": "Butin de Morgane la Fee",
    "imageUrl": "https://...",
    "popularity": 80,
    "talents": ["pain-giver"],
    "stats": {
      "health": 320,
      "storm_damage": 22,
      "critical_rating": 180
    }
  }
]
```

Seuls `name` et `type` sont obligatoires. Tous les autres champs sont
optionnels.

## Format CSV

Voir `data/sample-items.csv`. Colonnes attendues :

```
name,type,level,rarity,schools,description,world,zone,boss,set,sourceText,imageUrl,popularity,talents,stat_health,stat_fire_damage,...
```

- `schools` et `talents` : plusieurs valeurs separees par `|` (ex: `fire|ice`).
- Toute colonne prefixee par `stat_` est traitee comme une statistique : le
  nom apres `stat_` doit correspondre a la cle d'une `StatDefinition` (voir
  ci-dessous). Ajoutez simplement une colonne `stat_ma_nouvelle_stat` pour
  introduire une nouvelle statistique sans toucher au code.

## Statistiques inconnues

Si une cle de statistique n'existe pas encore, elle est creee
automatiquement. Le script essaie de deviner sa categorie a partir de son nom
(ex: `storm_damage` -> categorie "Degats par ecole", liee a l'ecole
Tempete) ; sinon elle est classee "Autre" et peut etre reclassee plus tard
directement en base (ou via `prisma studio`).

## Commandes utiles

```bash
# Verifier un fichier sans rien ecrire en base
npm run import -- --file data/mes-items.json --dry-run

# Importer pour de vrai
npm run import -- --file data/mes-items.json
npm run import -- --file data/mes-items.csv

# Explorer / editer la base a la main
npm run prisma:studio
```

## Aller plus loin (import depuis une autre base de donnees)

Pour importer depuis une base de donnees externe (ex: un dump communautaire),
le plus simple est d'ecrire un petit script qui exporte cette source vers le
format JSON ci-dessus, puis de reutiliser `scripts/import.ts` tel quel. La
logique de creation/mise a jour est deja geree.
