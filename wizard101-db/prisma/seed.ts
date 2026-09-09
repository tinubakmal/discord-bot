/**
 * Seed de reference : cree uniquement les referentiels necessaires au
 * fonctionnement de l'app (ecoles, mondes/zones/boss reels de Wizard101,
 * raretes, types d'objets, definitions de statistiques, talents) - de quoi
 * remplir les filtres et les formulaires du back-office. Le script est
 * idempotent (upsert partout) : on peut le relancer sans dupliquer les
 * donnees.
 *
 * Volontairement AUCUN item ni set fictif n'est cree ici : ajoutez de vrais
 * items via le back-office (/admin) ou en important un fichier JSON/CSV
 * avec `npm run import` (voir scripts/import.ts et data/IMPORT_GUIDE.md).
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
  { key: "incoming_healing_boost", name: "Soins recus", shortName: "HEAL RECU", unit: "%", category: "UTILITY", icon: "💚", order: 23 },
];

const SCHOOL_STAT_KINDS: { suffix: string; label: string; category: StatCategory; icon: string; orderBase: number }[] = [
  { suffix: "damage", label: "Degats", category: "SCHOOL_DAMAGE", icon: "⚔️", orderBase: 30 },
  { suffix: "resist", label: "Resistance", category: "SCHOOL_RESIST", icon: "🛡️", orderBase: 40 },
  { suffix: "accuracy", label: "Precision", category: "SCHOOL_ACCURACY", icon: "🎯", orderBase: 50 },
];

const WORLDS = [
  {
    slug: "wizard-city",
    name: "Wizard City",
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

  console.log(`Seed termine : referentiels uniquement (${SCHOOLS.length} ecoles, ${WORLDS.length} mondes, ${ITEM_TYPES.length} types d'objets, ${TALENTS.length} talents). Aucun item ni set fictif n'est cree - utilisez le back-office (/admin) ou "npm run import" pour ajouter de vrais items.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

