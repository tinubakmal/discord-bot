/**
 * Seed de demonstration : cree un jeu de donnees restreint mais complet
 * (ecoles, mondes/zones/boss, raretes, types d'objets, definitions de
 * statistiques, sets avec bonus, talents et ~25 items) pour pouvoir tester
 * immediatement la recherche, les filtres, le comparateur, le createur de
 * build et l'import. Le script est idempotent (upsert partout) : on peut le
 * relancer sans dupliquer les donnees.
 *
 * Pour charger un vrai jeu de donnees complet, utiliser `npm run import`
 * (voir scripts/import.ts et data/IMPORT_GUIDE.md) plutot que de modifier
 * ce fichier.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Categories de statistiques (String en base, voir src/lib/stats.ts).
type StatCategory =
  | "GENERAL"
  | "COMBAT"
  | "SCHOOL_DAMAGE"
  | "SCHOOL_RESIST"
  | "SCHOOL_ACCURACY"
  | "UTILITY"
  | "OTHER";

const SCHOOLS = [
  { slug: "fire", name: "Feu", color: "#e2572b", icon: "🔥" },
  { slug: "ice", name: "Glace", color: "#3bb9d6", icon: "❄️" },
  { slug: "storm", name: "Tempete", color: "#7a5fd0", icon: "⚡" },
  { slug: "myth", name: "Mythologie", color: "#c9982f", icon: "🐉" },
  { slug: "life", name: "Vie", color: "#5fae3b", icon: "🌿" },
  { slug: "death", name: "Mort", color: "#7a7a86", icon: "💀" },
  { slug: "balance", name: "Equilibre", color: "#d6a83b", icon: "☯️" },
];

const RARITIES = [
  { slug: "common", name: "Commun", color: "#9aa0ab", order: 0 },
  { slug: "uncommon", name: "Peu commun", color: "#4fae5f", order: 1 },
  { slug: "rare", name: "Rare", color: "#3d8fd6", order: 2 },
  { slug: "epic", name: "Epique", color: "#a463d6", order: 3 },
  { slug: "legendary", name: "Legendaire", color: "#e8a53b", order: 4 },
  { slug: "mythic", name: "Mythique", color: "#e0446f", order: 5 },
];

const ITEM_TYPES = [
  { slug: "hat", name: "Chapeau", slot: "hat", icon: "🎩" },
  { slug: "robe", name: "Robe", slot: "robe", icon: "🥋" },
  { slug: "boots", name: "Bottes", slot: "boots", icon: "🥾" },
  { slug: "wand", name: "Baguette", slot: "wand", icon: "🪄" },
  { slug: "athame", name: "Athame", slot: "athame", icon: "🗡️" },
  { slug: "amulet", name: "Amulette", slot: "amulet", icon: "📿" },
  { slug: "ring", name: "Anneau", slot: "ring", icon: "💍" },
  { slug: "deck", name: "Deck", slot: "deck", icon: "🃏" },
  { slug: "pet", name: "Familier", slot: "pet", icon: "🐾" },
  { slug: "mount", name: "Monture", slot: "mount", icon: "🐎" },
];

// Definitions de statistiques : generales/combat/utilitaires + 3 par ecole
// (degats, resistance, precision) pour demontrer l'extensibilite du systeme.
const GENERAL_STATS: {
  key: string;
  name: string;
  shortName?: string;
  unit?: string;
  category: StatCategory;
  icon?: string;
  order: number;
}[] = [
  { key: "health", name: "Sante", shortName: "PV", category: "GENERAL", icon: "❤️", order: 0 },
  { key: "mana", name: "Mana", shortName: "PM", category: "GENERAL", icon: "🔷", order: 1 },
  { key: "power_pip_chance", name: "Chance de Power Pip", shortName: "PP%", unit: "%", category: "GENERAL", icon: "🟡", order: 2 },
  { key: "shadow_pip_rating", name: "Shadow Pip", shortName: "SP", category: "GENERAL", icon: "🟣", order: 3 },
  { key: "archmastery_rating", name: "Archimaîtrise", shortName: "AM", category: "GENERAL", icon: "🌀", order: 4 },
  { key: "damage", name: "Degats", shortName: "DMG", unit: "%", category: "COMBAT", icon: "⚔️", order: 10 },
  { key: "resist", name: "Resistance", shortName: "RES", unit: "%", category: "COMBAT", icon: "🛡️", order: 11 },
  { key: "accuracy", name: "Precision", shortName: "ACC", unit: "%", category: "COMBAT", icon: "🎯", order: 12 },
  { key: "pierce", name: "Perforation", shortName: "PRC", unit: "%", category: "COMBAT", icon: "🗡️", order: 13 },
  { key: "critical_rating", name: "Critique", shortName: "CRIT", category: "COMBAT", icon: "💥", order: 14 },
  { key: "block_rating", name: "Blocage", shortName: "BLK", category: "COMBAT", icon: "🚫", order: 15 },
  { key: "healing_boost", name: "Puissance de soin", shortName: "HEAL", unit: "%", category: "UTILITY", icon: "✨", order: 20 },
  { key: "life_steal", name: "Vol de vie", shortName: "STEAL", unit: "%", category: "UTILITY", icon: "🩸", order: 21 },
  { key: "outgoing_pip_conversion", name: "Conversion de pip", shortName: "PIPC", unit: "%", category: "UTILITY", icon: "🔁", order: 22 },
];

const SCHOOL_STAT_KINDS: { suffix: string; label: string; category: StatCategory; icon: string; orderBase: number }[] = [
  { suffix: "damage", label: "Degats", category: "SCHOOL_DAMAGE", icon: "⚔️", orderBase: 30 },
  { suffix: "resist", label: "Resistance", category: "SCHOOL_RESIST", icon: "🛡️", orderBase: 40 },
  { suffix: "accuracy", label: "Precision", category: "SCHOOL_ACCURACY", icon: "🎯", orderBase: 50 },
];

const WORLDS = [
  {
    slug: "wizard-city",
    name: "Ravenwood",
    order: 0,
    zones: [
      { slug: "ravenwood-commons", name: "Ravenwood - Cour" },
      { slug: "unicorn-way", name: "Chemin de la Licorne" },
    ],
  },
  {
    slug: "krokotopia",
    name: "Krokotopia",
    order: 1,
    zones: [
      { slug: "krokosphinx", name: "Krokosphinx" },
      { slug: "pyramid-of-the-sun", name: "Pyramide du Soleil" },
    ],
  },
  {
    slug: "mooshu",
    name: "Mooshu",
    order: 2,
    zones: [{ slug: "tree-of-life", name: "Arbre de Vie" }],
  },
  {
    slug: "avalon",
    name: "Avalon",
    order: 3,
    zones: [{ slug: "camelot", name: "Camelot" }],
  },
];

const BOSSES = [
  { slug: "malistaire-drake", name: "Malistaire Drake", zoneSlug: "unicorn-way" },
  { slug: "krokopatra", name: "Krokopatra", zoneSlug: "krokosphinx" },
  { slug: "jade-oni", name: "Oni de Jade", zoneSlug: "tree-of-life" },
  { slug: "morgan-le-fay", name: "Morgane la Fee", zoneSlug: "camelot" },
];

const TALENTS = [
  { slug: "efficient", name: "Efficace", description: "Reduit le cout en pips de certains sorts.", icon: "⚙️" },
  { slug: "sharpened", name: "Affute", description: "Augmente la perforation contre les ennemis proteges.", icon: "🗡️" },
  { slug: "pain-giver", name: "Donneur de Douleur", description: "Augmente les degats critiques infliges.", icon: "💥" },
  { slug: "guardian-spirit", name: "Esprit Gardien", description: "Convertit une partie des soins recus en bouclier.", icon: "🛡️" },
];

function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function main() {
  console.log("Seed: referentiels...");

  const schools = new Map<string, { id: string }>();
  for (const s of SCHOOLS) {
    const school = await prisma.school.upsert({
      where: { slug: s.slug },
      update: { name: s.name, color: s.color, icon: s.icon },
      create: s,
    });
    schools.set(s.slug, school);
  }

  const rarities = new Map<string, { id: string }>();
  for (const r of RARITIES) {
    const rarity = await prisma.rarity.upsert({ where: { slug: r.slug }, update: r, create: r });
    rarities.set(r.slug, rarity);
  }

  const itemTypes = new Map<string, { id: string }>();
  for (const t of ITEM_TYPES) {
    const type = await prisma.itemType.upsert({ where: { slug: t.slug }, update: t, create: t });
    itemTypes.set(t.slug, type);
  }

  const statDefs = new Map<string, { id: string }>();
  for (const [i, s] of GENERAL_STATS.entries()) {
    const def = await prisma.statDefinition.upsert({
      where: { key: s.key },
      update: { name: s.name, shortName: s.shortName, unit: s.unit, category: s.category, icon: s.icon, order: s.order },
      create: {
        key: s.key,
        name: s.name,
        shortName: s.shortName,
        unit: s.unit,
        category: s.category,
        icon: s.icon,
        order: s.order,
      },
    });
    statDefs.set(s.key, def);
    void i;
  }
  for (const school of SCHOOLS) {
    for (const kind of SCHOOL_STAT_KINDS) {
      const key = `${school.slug}_${kind.suffix}`;
      const def = await prisma.statDefinition.upsert({
        where: { key },
        update: {
          name: `${kind.label} ${school.name}`,
          shortName: `${school.name.slice(0, 3).toUpperCase()} ${kind.suffix === "damage" ? "DMG" : kind.suffix === "resist" ? "RES" : "ACC"}`,
          unit: "%",
          category: kind.category,
          icon: school.icon,
          order: kind.orderBase + SCHOOLS.indexOf(school),
          schoolId: schools.get(school.slug)!.id,
        },
        create: {
          key,
          name: `${kind.label} ${school.name}`,
          shortName: `${school.name.slice(0, 3).toUpperCase()} ${kind.suffix === "damage" ? "DMG" : kind.suffix === "resist" ? "RES" : "ACC"}`,
          unit: "%",
          category: kind.category,
          icon: school.icon,
          order: kind.orderBase + SCHOOLS.indexOf(school),
          schoolId: schools.get(school.slug)!.id,
        },
      });
      statDefs.set(key, def);
    }
  }

  const worlds = new Map<string, { id: string }>();
  const zones = new Map<string, { id: string }>();
  for (const w of WORLDS) {
    const world = await prisma.world.upsert({
      where: { slug: w.slug },
      update: { name: w.name, order: w.order },
      create: { slug: w.slug, name: w.name, order: w.order },
    });
    worlds.set(w.slug, world);
    for (const z of w.zones) {
      const zone = await prisma.zone.upsert({
        where: { slug: z.slug },
        update: { name: z.name, worldId: world.id },
        create: { slug: z.slug, name: z.name, worldId: world.id },
      });
      zones.set(z.slug, zone);
    }
  }

  const bosses = new Map<string, { id: string }>();
  for (const b of BOSSES) {
    const boss = await prisma.boss.upsert({
      where: { slug: b.slug },
      update: { name: b.name, zoneId: zones.get(b.zoneSlug)?.id },
      create: { slug: b.slug, name: b.name, zoneId: zones.get(b.zoneSlug)?.id },
    });
    bosses.set(b.slug, boss);
  }

  const talents = new Map<string, { id: string }>();
  for (const t of TALENTS) {
    const talent = await prisma.talent.upsert({ where: { slug: t.slug }, update: t, create: t });
    talents.set(t.slug, talent);
  }

  console.log("Seed: sets et bonus...");

  type SetSpec = {
    slug: string;
    name: string;
    description: string;
    bonuses: { pieces: number; description: string; stats: Record<string, number> }[];
  };
  const SETS: SetSpec[] = [
    {
      slug: "storm-caller",
      name: "Ensemble de l'Appel de Tempete",
      description: "Un ensemble redoutable forge pour les invocateurs de foudre.",
      bonuses: [
        { pieces: 3, description: "+8% Degats Tempete", stats: { storm_damage: 8 } },
        { pieces: 4, description: "+40 Sante, +8% Precision Tempete", stats: { health: 40, storm_accuracy: 8 } },
        { pieces: 5, description: "+120 Critique, +6% Blocage", stats: { critical_rating: 120, block_rating: 6 } },
      ],
    },
    {
      slug: "malfaisance",
      name: "Ensemble de Malfaisance",
      description: "Favorise par les necromanciens pour son vol de vie devastateur.",
      bonuses: [
        { pieces: 3, description: "+6% Vol de vie", stats: { life_steal: 6 } },
        { pieces: 4, description: "+10% Degats Mort", stats: { death_damage: 10 } },
        { pieces: 5, description: "+60 Sante, +5% Perforation", stats: { health: 60, pierce: 5 } },
      ],
    },
  ];

  const itemSets = new Map<string, { id: string }>();
  for (const s of SETS) {
    const set = await prisma.itemSet.upsert({
      where: { slug: s.slug },
      update: { name: s.name, description: s.description, popularity: 100 },
      create: { slug: s.slug, name: s.name, description: s.description, popularity: 100 },
    });
    itemSets.set(s.slug, set);

    for (const bonus of s.bonuses) {
      const existing = await prisma.setBonus.findFirst({
        where: { setId: set.id, piecesRequired: bonus.pieces },
      });
      const setBonus = existing
        ? await prisma.setBonus.update({ where: { id: existing.id }, data: { description: bonus.description } })
        : await prisma.setBonus.create({
            data: { setId: set.id, piecesRequired: bonus.pieces, description: bonus.description },
          });
      for (const [key, value] of Object.entries(bonus.stats)) {
        const statDefinitionId = statDefs.get(key)?.id;
        if (!statDefinitionId) continue;
        await prisma.setBonusStat.upsert({
          where: { setBonusId_statDefinitionId: { setBonusId: setBonus.id, statDefinitionId } },
          update: { value },
          create: { setBonusId: setBonus.id, statDefinitionId, value },
        });
      }
    }
  }

  console.log("Seed: items...");

  type ItemSpec = {
    name: string;
    type: string;
    level: number;
    rarity: string;
    schools: string[];
    description: string;
    stats: Record<string, number>;
    talents?: string[];
    set?: string;
    world?: string;
    zone?: string;
    boss?: string;
    sourceText?: string;
    imageUrl?: string;
    popularity?: number;
  };

  const ITEMS: ItemSpec[] = [
    // --- Ensemble Appel de Tempete (5 pieces, niveau 170) ---
    { name: "Couronne de l'Appel de Tempete", type: "hat", level: 170, rarity: "epic", schools: ["storm"], description: "Crepite d'une energie electrique constante.", stats: { health: 320, storm_damage: 22, critical_rating: 180, accuracy: 5 }, talents: ["pain-giver"], set: "storm-caller", world: "avalon", zone: "camelot", boss: "morgan-le-fay", popularity: 88 },
    { name: "Robe de l'Appel de Tempete", type: "robe", level: 170, rarity: "epic", schools: ["storm"], description: "Tissee avec des fils charges de foudre.", stats: { health: 480, storm_damage: 28, resist: 8, block_rating: 90 }, talents: ["efficient"], set: "storm-caller", world: "avalon", zone: "camelot", boss: "morgan-le-fay", popularity: 92 },
    { name: "Bottes de l'Appel de Tempete", type: "boots", level: 170, rarity: "epic", schools: ["storm"], description: "Laissent une trainee d'etincelles a chaque pas.", stats: { health: 200, storm_accuracy: 12, pierce: 6 }, set: "storm-caller", world: "avalon", zone: "camelot", sourceText: "Butin de Morgane la Fee", popularity: 74 },
    { name: "Baguette de l'Appel de Tempete", type: "wand", level: 170, rarity: "epic", schools: ["storm"], description: "Une baguette crepitante taillee dans du bois d'orage.", stats: { damage: 10, storm_damage: 18, critical_rating: 60 }, set: "storm-caller", world: "avalon", zone: "camelot", popularity: 65 },
    { name: "Amulette de l'Appel de Tempete", type: "amulet", level: 170, rarity: "epic", schools: ["storm"], description: "Un pendentif qui bourdonne d'electricite statique.", stats: { health: 150, storm_damage: 10, resist: 4 }, set: "storm-caller", world: "avalon", zone: "camelot", popularity: 55 },

    // --- Ensemble Malfaisance (5 pieces, niveau 160) ---
    { name: "Capuche de Malfaisance", type: "hat", level: 160, rarity: "epic", schools: ["death"], description: "Dissimule un regard glacial.", stats: { health: 300, death_damage: 20, life_steal: 5 }, talents: ["guardian-spirit"], set: "malfaisance", world: "mooshu", zone: "tree-of-life", boss: "jade-oni", popularity: 70 },
    { name: "Robe de Malfaisance", type: "robe", level: 160, rarity: "epic", schools: ["death"], description: "Absorbe une part de la vitalite des ennemis.", stats: { health: 450, death_damage: 24, life_steal: 8 }, set: "malfaisance", world: "mooshu", zone: "tree-of-life", boss: "jade-oni", popularity: 80 },
    { name: "Bottes de Malfaisance", type: "boots", level: 160, rarity: "epic", schools: ["death"], description: "Ne laissent aucune empreinte.", stats: { health: 180, death_accuracy: 10, pierce: 5 }, set: "malfaisance", world: "mooshu", zone: "tree-of-life", popularity: 48 },
    { name: "Athame de Malfaisance", type: "athame", level: 160, rarity: "epic", schools: ["death"], description: "Sa lame semble boire la lumiere environnante.", stats: { damage: 8, death_damage: 15, critical_rating: 40 }, set: "malfaisance", world: "mooshu", zone: "tree-of-life", popularity: 42 },
    { name: "Anneau de Malfaisance", type: "ring", level: 160, rarity: "epic", schools: ["death"], description: "Un anneau froid au toucher, meme au soleil.", stats: { health: 120, life_steal: 6 }, set: "malfaisance", world: "mooshu", zone: "tree-of-life", popularity: 38 },

    // --- Items independants, diverses ecoles / types / niveaux ---
    { name: "Chapeau de l'Etincelle Naissante", type: "hat", level: 25, rarity: "common", schools: ["storm"], description: "Un chapeau simple pour jeunes invocateurs de tempete.", stats: { health: 60, storm_damage: 5 }, world: "wizard-city", zone: "unicorn-way", sourceText: "Vendeur - Ravenwood", popularity: 12 },
    { name: "Robe des Flammes Tranquilles", type: "robe", level: 48, rarity: "uncommon", schools: ["fire"], description: "Chaude sans jamais bruler son porteur.", stats: { health: 140, fire_damage: 9, resist: 3 }, world: "krokotopia", zone: "krokosphinx", boss: "krokopatra", popularity: 34 },
    { name: "Bottes du Pas Glacial", type: "boots", level: 60, rarity: "rare", schools: ["ice"], description: "Chaque pas gele legerement le sol.", stats: { health: 110, ice_resist: 12, block_rating: 30 }, world: "krokotopia", zone: "pyramid-of-the-sun", sourceText: "Coffre de la Pyramide du Soleil", popularity: 29 },
    { name: "Baguette du Sage Mythique", type: "wand", level: 90, rarity: "rare", schools: ["myth"], description: "Gravee de runes anciennes.", stats: { damage: 6, myth_damage: 14, accuracy: 4 }, world: "mooshu", zone: "tree-of-life", popularity: 25 },
    { name: "Amulette de Vie Florissante", type: "amulet", level: 55, rarity: "uncommon", schools: ["life"], description: "Emet une legere lueur verte apaisante.", stats: { health: 90, healing_boost: 12, life_damage: 6 }, world: "mooshu", zone: "tree-of-life", popularity: 22 },
    { name: "Anneau de l'Equilibre Parfait", type: "ring", level: 100, rarity: "rare", schools: ["balance"], description: "Toujours en parfait equilibre, meme au combat.", stats: { health: 80, balance_damage: 10, balance_accuracy: 6 }, world: "avalon", zone: "camelot", popularity: 27 },
    { name: "Athame du Chuchoteur d'Ombres", type: "athame", level: 130, rarity: "rare", schools: ["death"], description: "Murmure des secrets a qui sait ecouter.", stats: { damage: 5, death_damage: 12, pierce: 4 }, world: "avalon", zone: "camelot", boss: "morgan-le-fay", popularity: 31 },
    { name: "Deck de Sorts Elementaires", type: "deck", level: 40, rarity: "common", schools: ["fire", "ice", "storm"], description: "Un jeu de cartes polyvalent pour maitriser les elements.", stats: { mana: 30 }, world: "krokotopia", zone: "krokosphinx", sourceText: "Boutique du Bazar", popularity: 18 },
    { name: "Familier: Dragonnet de Feu", type: "pet", level: 15, rarity: "uncommon", schools: ["fire"], description: "Un jeune dragon fougueux qui adore les combats.", stats: { fire_damage: 8, critical_rating: 20 }, sourceText: "Pack Dragon", popularity: 55 },
    { name: "Monture: Coursier Spectral", type: "mount", level: 15, rarity: "rare", schools: [], description: "Se deplace en silence entre les mondes.", stats: { archmastery_rating: 15 }, sourceText: "Boutique du Bazar", popularity: 44 },
    { name: "Chapeau Legendaire du Grand Archimage", type: "hat", level: 170, rarity: "legendary", schools: ["balance"], description: "Porte autrefois par un archimage de legende.", stats: { health: 400, balance_damage: 26, critical_rating: 200, resist: 6 }, talents: ["pain-giver", "sharpened"], world: "avalon", zone: "camelot", sourceText: "Recompense de raid", popularity: 97 },
    { name: "Robe Mythique du Neant Devorant", type: "robe", level: 170, rarity: "mythic", schools: ["death"], description: "Une robe qui semble aspirer la lumiere autour d'elle.", stats: { health: 520, death_damage: 32, life_steal: 10, resist: 9 }, talents: ["guardian-spirit"], world: "avalon", zone: "camelot", sourceText: "Recompense de raid ultime", popularity: 99 },
    { name: "Deck de Combat Avance", type: "deck", level: 90, rarity: "rare", schools: [], description: "Un deck robuste pour affronter les zones avancees.", stats: { mana: 60 }, world: "mooshu", zone: "tree-of-life", popularity: 20 },
    { name: "Anneau Peu Commun de Precision", type: "ring", level: 70, rarity: "uncommon", schools: [], description: "Aide a mieux viser ses adversaires.", stats: { accuracy: 8 }, world: "krokotopia", zone: "pyramid-of-the-sun", popularity: 15 },
  ];

  for (const spec of ITEMS) {
    const slug = slugify(spec.name);
    const item = await prisma.item.upsert({
      where: { slug },
      update: {
        name: spec.name,
        description: spec.description,
        levelRequired: spec.level,
        itemTypeId: itemTypes.get(spec.type)!.id,
        rarityId: rarities.get(spec.rarity)?.id,
        worldId: spec.world ? worlds.get(spec.world)?.id : null,
        zoneId: spec.zone ? zones.get(spec.zone)?.id : null,
        bossId: spec.boss ? bosses.get(spec.boss)?.id : null,
        setId: spec.set ? itemSets.get(spec.set)?.id : null,
        sourceText: spec.sourceText,
        imageUrl: spec.imageUrl,
        popularity: spec.popularity ?? 0,
      },
      create: {
        slug,
        name: spec.name,
        description: spec.description,
        levelRequired: spec.level,
        itemTypeId: itemTypes.get(spec.type)!.id,
        rarityId: rarities.get(spec.rarity)?.id,
        worldId: spec.world ? worlds.get(spec.world)?.id : null,
        zoneId: spec.zone ? zones.get(spec.zone)?.id : null,
        bossId: spec.boss ? bosses.get(spec.boss)?.id : null,
        setId: spec.set ? itemSets.get(spec.set)?.id : null,
        sourceText: spec.sourceText,
        imageUrl: spec.imageUrl,
        popularity: spec.popularity ?? 0,
      },
    });

    for (const schoolSlug of spec.schools) {
      const school = schools.get(schoolSlug);
      if (!school) continue;
      await prisma.itemSchool.upsert({
        where: { itemId_schoolId: { itemId: item.id, schoolId: school.id } },
        update: {},
        create: { itemId: item.id, schoolId: school.id },
      });
    }

    for (const [key, value] of Object.entries(spec.stats)) {
      const statDefinitionId = statDefs.get(key)?.id;
      if (!statDefinitionId) {
        console.warn(`  ! Stat inconnue "${key}" pour l'item "${spec.name}" (ignoree)`);
        continue;
      }
      await prisma.itemStat.upsert({
        where: { itemId_statDefinitionId: { itemId: item.id, statDefinitionId } },
        update: { value },
        create: { itemId: item.id, statDefinitionId, value },
      });
    }

    for (const talentSlug of spec.talents ?? []) {
      const talent = talents.get(talentSlug);
      if (!talent) continue;
      await prisma.itemTalent.upsert({
        where: { itemId_talentId: { itemId: item.id, talentId: talent.id } },
        update: {},
        create: { itemId: item.id, talentId: talent.id },
      });
    }
  }

  console.log(`Seed termine : ${ITEMS.length} items, ${SETS.length} sets, ${SCHOOLS.length} ecoles.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
