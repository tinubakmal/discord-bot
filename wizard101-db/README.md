# Spiral Codex — Base de données & comparateur d'items Wizard101 (prototype local)

Base de données interactive non-officielle pour les items de Wizard101 :
recherche/filtres avancés, fiche détaillée par item, comparateur de
statistiques (2 à 4 items, même de catégories différentes), créateur de
build avec calcul automatique des totaux et des bonus de set, et un système
d'import JSON/CSV pour charger des milliers d'items sans toucher au code.

**Ce projet n'est volontairement pas déployé.** Il est conçu pour tourner en
local (`localhost:3000`) pendant la phase de développement/test, avec une
architecture qui permettra une mise en ligne ultérieure sans réécriture (voir
[Vers une mise en ligne](#vers-une-mise-en-ligne-plus-tard)).

## Stack technique

- **Next.js 14** (App Router, TypeScript) — un seul projet full-stack : pages
  React (Server Components pour les pages qui lisent directement la base,
  Client Components pour les vues interactives) + routes API (`/api/*`).
- **Prisma** + **SQLite** — ORM et base de données fichier, zéro
  configuration en local. Le schéma (`prisma/schema.prisma`) est la source
  de vérité du modèle de données.
- **Tailwind CSS** — thème sombre "arcane" personnalisé (voir
  `tailwind.config.ts`), sans dépendance à des assets protégés du jeu.

## Démarrage rapide

Prérequis : Node.js 20+.

```bash
cd wizard101-db
npm install
cp .env.example .env          # DATABASE_URL="file:./dev.db" par défaut
npx prisma migrate dev         # crée dev.db et applique le schéma
npm run db:seed                # (fait automatiquement par migrate dev) données de démo
npm run dev
```

Ouvrez <http://localhost:3000>.

Commandes utiles :

| Commande | Effet |
|---|---|
| `npm run dev` | Lance le serveur local |
| `npm run build && npm start` | Build de production, servi en local |
| `npm run prisma:studio` | Explorateur de base de données graphique |
| `npm run db:reset` | Réinitialise la base et rejoue le seed |
| `npm run import -- --file data/mes-items.json` | Importe des items (voir plus bas) |

## Architecture des données

Voir `prisma/schema.prisma` (commenté) pour le détail. Points clés :

- **`Item`** est l'entité centrale, reliée à `ItemType` (chapeau, robe,
  baguette, deck, pet, monture...), `Rarity`, `World`/`Zone`/`Boss`,
  `ItemSet`, plusieurs `School` (table de jointure `ItemSchool`, un item peut
  concerner plusieurs écoles), des `Talent`s (table de jointure
  `ItemTalent`), et surtout ses statistiques via `ItemStat`.
- **`StatDefinition`** modélise une statistique comme une donnée (clé, nom,
  unité, catégorie, école associée si pertinent) et non comme du texte.
  `ItemStat` relie un `Item` à une `StatDefinition` avec une valeur
  numérique. Cela permet de filtrer/comparer/additionner les statistiques
  sans jamais parser du texte libre.
- **Rien n'est codé en dur** : les types d'objets, écoles, mondes, zones,
  boss, raretés, sets et définitions de statistiques sont des **lignes de
  base de données**, pas des enums figés dans le code. Ajouter un nouveau
  type d'objet (« Bijou », « Cape »...) ou une nouvelle statistique ne
  nécessite aucune modification de code, juste une nouvelle ligne (via le
  seed, l'import, ou `prisma studio`).
- **Bonus de set** (`SetBonus` / `SetBonusStat`) : chaque set peut définir
  plusieurs paliers (ex: 3/4/5 pièces), chacun ajoutant des statistiques.
  Le créateur de build applique automatiquement tous les paliers atteints,
  comme dans le jeu.
- Note SQLite : Prisma ne supporte pas nativement les enums ni le type
  `Json` sur SQLite. `StatDefinition.category` est donc une `String`
  contrainte côté application (voir `src/lib/stats.ts`, type
  `StatCategory`), et `Item.extra` est une `String` JSON-encodée pour tout
  champ non modélisé. Sans impact fonctionnel ; à garder en tête si vous
  migrez vers PostgreSQL (où vous pourriez réintroduire un vrai enum/Json).

## Fonctionnalités

- **Recherche & filtres combinables** (`/items`) : texte libre, type
  d'objet, école(s), monde, zone, boss, rareté, set, plage de niveau, et
  filtres de statistiques avec valeur minimale (ex: *toutes les robes niveau
  170+ Tempête avec au moins 20% de dégâts* = `type=robe&school=storm&
  levelMin=170&stat=storm_damage:20`, testable directement sur
  `/api/items`). Les filtres sont reflétés dans l'URL (partageable).
- **Fiche d'item** (`/items/[slug]`) : image, statistiques groupées par
  catégorie, source d'obtention (monde/zone/boss), talents, set associé
  (avec bonus et autres pièces du set), items similaires.
- **Comparateur** (`/compare?ids=...`) : 2 à 4 items sélectionnés depuis la
  recherche, une fiche d'item, ou directement dans cette page. Tableau des
  statistiques avec, pour 2 items, une colonne "Différence" calculée
  automatiquement ; au-delà, la meilleure valeur de chaque ligne est mise en
  évidence. Fonctionne entre catégories différentes (chapeau + robe +
  bottes) pour réfléchir à une combinaison d'équipement.
- **Créateur de build** (`/builder`) : sélection d'une pièce par
  emplacement (chapeau, robe, bottes, baguette, athame, amulette, anneau,
  deck, pet, monture), calcul automatique des statistiques totales et des
  bonus de set actifs. L'état du build est reflété dans l'URL.
- **Import** (`scripts/import.ts`, voir `data/IMPORT_GUIDE.md`) : charge des
  items depuis un fichier JSON ou CSV, en créant automatiquement au passage
  les entités référencées qui n'existent pas encore (école, type, monde,
  statistique...). Idempotent : réimporter un fichier met à jour au lieu de
  dupliquer.
- **Back-office admin** (`/admin`) : créer/modifier/supprimer des items, des
  sets (avec leurs paliers de bonus), et tous les référentiels (écoles,
  raretés, types d'objets, mondes, zones, boss, talents, définitions de
  statistiques) directement depuis l'interface, sans passer par Prisma
  Studio ni par un fichier d'import. Les référentiels simples partagent un
  seul composant générique (`ReferenceManager`) piloté par une config
  déclarative (`src/lib/adminReference.ts`) : ajouter un nouveau référentiel
  ne demande qu'une entrée de config + un delegate Prisma, aucune nouvelle
  page. Pas de système de compte pour l'instant (cohérent avec le
  prototype local mono-utilisateur) — à protéger par une authentification
  avant toute mise en ligne.
- **Favoris & builds sauvegardés** : bouton favori (★) sur chaque item, page
  `/favorites`, et sauvegarde de builds nommés depuis `/builder`. Stockés
  dans le `localStorage` du navigateur (pas de compte requis) — voir
  `src/lib/localStore.ts`. C'est le point d'extension naturel vers un vrai
  compte utilisateur plus tard : même forme de données, déplacée côté
  serveur et rattachée à un `User`.

## Aller à l'échelle (milliers d'items)

- Toutes les listes (recherche, fiche, comparateur) sont paginées côté API.
- Les colonnes filtrées/jointes fréquemment (`itemTypeId`, `levelRequired`,
  `setId`, `worldId`, `zoneId`, `bossId`, `rarityId`, et `(statDefinitionId,
  value)` sur `ItemStat`) sont indexées dans le schéma Prisma.
- Le format d'import supporte le traitement en masse sans étape manuelle.

## Vers une mise en ligne plus tard

Le projet est structuré pour limiter le travail au moment du déploiement :

1. **Base de données** : remplacer `provider = "sqlite"` par `"postgresql"`
   dans `prisma/schema.prisma`, pointer `DATABASE_URL` vers une base
   Postgres, relancer `prisma migrate deploy`. Le reste du code (requêtes
   Prisma) ne change pas. Ce serait aussi le moment de réintroduire de vrais
   enums Postgres pour `StatCategory` si souhaité.
2. **Recherche à grande échelle** : au-delà de quelques dizaines de milliers
   d'items, envisager une recherche texte dédiée (Postgres full-text /
   `pg_trgm`, ou un moteur externe type Meilisearch/Typesense) derrière la
   même route `/api/items`.
3. **Images** : `next.config.mjs` autorise actuellement toutes les images
   distantes (`remotePatterns: "**"`) pour faciliter le prototypage ; à
   restreindre à un domaine précis avant mise en ligne.
4. **Fonctionnalités encore absentes** : comptes utilisateurs (donc pas
   d'authentification sur le back-office admin ni de synchronisation des
   favoris/builds entre appareils), partage de builds par lien dédié,
   commentaires, mise à jour automatique de la base. Favoris et builds
   sauvegardés existent déjà mais uniquement en local (`localStorage`) ; le
   back-office admin existe déjà mais est ouvert à quiconque accède au
   site. L'architecture (Prisma + routes API séparées des pages) est pensée
   pour accueillir un vrai compte sans refonte : un modèle `User` +
   `SavedBuild`/`Favorite` référençant les `Item` existants remplacerait le
   `localStorage`, et une session/middleware protégerait `/admin`.
5. **Hébergement** : Next.js se déploie tel quel sur Vercel, ou via
   `next start` derrière un reverse proxy sur n'importe quel serveur/VPS.

## Structure du projet

```
wizard101-db/
  prisma/
    schema.prisma      modèle de données (commenté)
    seed.ts             jeu de données de démonstration (idempotent)
  scripts/
    import.ts           import JSON/CSV en masse
  data/
    sample-items.json   sample-items.csv   IMPORT_GUIDE.md
  src/
    app/                pages (App Router) + routes API
    components/          composants React réutilisables
    lib/                 accès base de données, logique métier partagée
                          (queries.ts, stats.ts, serialize.ts, types.ts)
```

---

*Projet fan-made non affilié à KingsIsle Entertainment.*
