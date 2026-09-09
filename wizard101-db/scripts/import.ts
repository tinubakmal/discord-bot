/**
 * Importeur generique de donnees Wizard101 - JSON ou CSV.
 *
 * Usage :
 *   npm run import -- --file data/mes-items.json
 *   npm run import -- --file data/mes-items.csv
 *   npm run import -- --file data/mes-items.json --dry-run
 *
 * Principe : chaque item importe reference ses entites liees (type, ecole,
 * rarete, monde, zone, boss, set, talents, statistiques) par un slug/cle
 * lisible plutot que par un id de base de donnees. Si l'entite referencee
 * n'existe pas encore, elle est creee automatiquement (upsert) : on peut
 * donc importer un fichier de plusieurs milliers d'items sans avoir a
 * pre-remplir manuellement les referentiels ni a modifier le code.
 *
 * Format JSON attendu : un tableau d'objets avec les champs decrits par
 * ImportItemRow ci-dessous (voir data/sample-items.json).
 *
 * Format CSV attendu : une ligne d'en-tete avec les colonnes name, type,
 * level, rarity, schools (separees par "|"), description, world, zone,
 * boss, set, sourceText, imageUrl, popularity, talents (separes par "|"),
 * et une colonne "stat_<cle>" par statistique a renseigner (voir
 * data/sample-items.csv).
 */
import { readFileSync } from "node:fs";
import { parse as parseCsv } from "csv-parse/sync";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type ImportItemRow = {
  name: string;
  type: string; // slug ou nom du type d'objet (ex: "hat", "Chapeau")
  level?: number;
  rarity?: string;
  schools?: string[];
  description?: string;
  world?: string;
  zone?: string;
  boss?: string;
  set?: string;
  sourceText?: string;
  imageUrl?: string;
  popularity?: number;
  talents?: string[];
  stats?: Record<string, number>;
  extra?: Record<string, unknown>;
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function parseArgs(argv: string[]) {
  const args: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith("--")) {
        args[key] = next;
        i++;
      } else {
        args[key] = true;
      }
    }
  }
  return args;
}

function loadRows(filePath: string): ImportItemRow[] {
  const raw = readFileSync(filePath, "utf-8");
  if (filePath.endsWith(".json")) {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      throw new Error("Le fichier JSON doit contenir un tableau d'items.");
    }
    return parsed as ImportItemRow[];
  }
  if (filePath.endsWith(".csv")) {
    const records: Record<string, string>[] = parseCsv(raw, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
    return records.map((r) => {
      const stats: Record<string, number> = {};
      for (const [col, value] of Object.entries(r)) {
        if (col.startsWith("stat_") && value !== "") {
          stats[col.slice("stat_".length)] = Number(value);
        }
      }
      return {
        name: r.name,
        type: r.type,
        level: r.level ? Number(r.level) : undefined,
        rarity: r.rarity || undefined,
        schools: r.schools ? r.schools.split("|").map((s) => s.trim()).filter(Boolean) : [],
        description: r.description || undefined,
        world: r.world || undefined,
        zone: r.zone || undefined,
        boss: r.boss || undefined,
        set: r.set || undefined,
        sourceText: r.sourceText || undefined,
        imageUrl: r.imageUrl || undefined,
        popularity: r.popularity ? Number(r.popularity) : undefined,
        talents: r.talents ? r.talents.split("|").map((s) => s.trim()).filter(Boolean) : [],
        stats,
      };
    });
  }
  throw new Error(`Extension non supportee pour ${filePath} (attendu: .json ou .csv)`);
}

/** Devine categorie + ecole d'une statistique inconnue a partir de sa cle. */
async function inferAndUpsertStatDefinition(key: string) {
  const existing = await prisma.statDefinition.findUnique({ where: { key } });
  if (existing) return existing;

  const suffixMap: Record<string, "SCHOOL_DAMAGE" | "SCHOOL_RESIST" | "SCHOOL_ACCURACY"> = {
    damage: "SCHOOL_DAMAGE",
    resist: "SCHOOL_RESIST",
    accuracy: "SCHOOL_ACCURACY",
  };
  const parts = key.split("_");
  const suffix = parts[parts.length - 1];
  const schoolSlug = parts.slice(0, -1).join("_");

  let category = "OTHER";
  let schoolId: string | undefined;
  let name = key;
  if (suffixMap[suffix]) {
    const school = await prisma.school.findUnique({ where: { slug: schoolSlug } });
    if (school) {
      category = suffixMap[suffix];
      schoolId = school.id;
      name = `${suffix === "damage" ? "Degats" : suffix === "resist" ? "Resistance" : "Precision"} ${school.name}`;
    }
  }
  if (category === "OTHER") {
    name = key.replace(/_/g, " ");
  }

  console.warn(`  ! Statistique inconnue "${key}" -> creation automatique (categorie: ${category})`);
  return prisma.statDefinition.create({
    data: { key, name, category, schoolId, order: 999 },
  });
}

async function upsertBySlug<T extends { slug: string }>(
  model: { findUnique: (a: any) => Promise<any>; create: (a: any) => Promise<any> },
  slug: string,
  data: Record<string, unknown>
) {
  const existing = await model.findUnique({ where: { slug } });
  if (existing) return existing;
  return model.create({ data: { slug, ...data } });
}

async function importRow(row: ImportItemRow, dryRun: boolean) {
  if (!row.name || !row.type) {
    throw new Error(`Ligne invalide (name/type requis): ${JSON.stringify(row)}`);
  }

  const typeSlug = slugify(row.type);
  const itemType = await upsertBySlug(prisma.itemType, typeSlug, { name: row.type });

  const rarity = row.rarity
    ? await upsertBySlug(prisma.rarity, slugify(row.rarity), { name: row.rarity })
    : null;

  const world = row.world
    ? await upsertBySlug(prisma.world, slugify(row.world), { name: row.world })
    : null;

  const zone = row.zone
    ? await upsertBySlug(prisma.zone, slugify(row.zone), {
        name: row.zone,
        worldId: world?.id,
      })
    : null;

  const boss = row.boss
    ? await upsertBySlug(prisma.boss, slugify(row.boss), { name: row.boss, zoneId: zone?.id })
    : null;

  const set = row.set
    ? await upsertBySlug(prisma.itemSet, slugify(row.set), { name: row.set })
    : null;

  const slug = slugify(row.name);

  if (dryRun) {
    console.log(`[dry-run] ${row.name} -> slug=${slug}, type=${typeSlug}, stats=${Object.keys(row.stats ?? {}).length}`);
    return { created: false, dryRun: true };
  }

  const existingItem = await prisma.item.findUnique({ where: { slug } });

  const item = await prisma.item.upsert({
    where: { slug },
    update: {
      name: row.name,
      description: row.description,
      levelRequired: row.level ?? 1,
      itemTypeId: itemType.id,
      rarityId: rarity?.id,
      worldId: world?.id,
      zoneId: zone?.id,
      bossId: boss?.id,
      setId: set?.id,
      sourceText: row.sourceText,
      imageUrl: row.imageUrl,
      popularity: row.popularity ?? 0,
      extra: row.extra ? JSON.stringify(row.extra) : undefined,
    },
    create: {
      slug,
      name: row.name,
      description: row.description,
      levelRequired: row.level ?? 1,
      itemTypeId: itemType.id,
      rarityId: rarity?.id,
      worldId: world?.id,
      zoneId: zone?.id,
      bossId: boss?.id,
      setId: set?.id,
      sourceText: row.sourceText,
      imageUrl: row.imageUrl,
      popularity: row.popularity ?? 0,
      extra: row.extra ? JSON.stringify(row.extra) : undefined,
    },
  });

  for (const schoolName of row.schools ?? []) {
    const school = await upsertBySlug(prisma.school, slugify(schoolName), { name: schoolName });
    await prisma.itemSchool.upsert({
      where: { itemId_schoolId: { itemId: item.id, schoolId: school.id } },
      update: {},
      create: { itemId: item.id, schoolId: school.id },
    });
  }

  for (const [key, value] of Object.entries(row.stats ?? {})) {
    const statDefinition = await inferAndUpsertStatDefinition(key);
    await prisma.itemStat.upsert({
      where: { itemId_statDefinitionId: { itemId: item.id, statDefinitionId: statDefinition.id } },
      update: { value },
      create: { itemId: item.id, statDefinitionId: statDefinition.id, value },
    });
  }

  for (const talentName of row.talents ?? []) {
    const talent = await upsertBySlug(prisma.talent, slugify(talentName), { name: talentName });
    await prisma.itemTalent.upsert({
      where: { itemId_talentId: { itemId: item.id, talentId: talent.id } },
      update: {},
      create: { itemId: item.id, talentId: talent.id },
    });
  }

  return { created: !existingItem, dryRun: false };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const filePath = args.file as string;
  const dryRun = Boolean(args["dry-run"]);

  if (!filePath) {
    console.error("Usage: npm run import -- --file <chemin.json|chemin.csv> [--dry-run]");
    process.exit(1);
  }

  const rows = loadRows(filePath);
  console.log(`Import de ${rows.length} ligne(s) depuis ${filePath}${dryRun ? " (dry-run)" : ""}...`);

  let created = 0;
  let updated = 0;
  let failed = 0;

  for (const [i, row] of rows.entries()) {
    try {
      const result = await importRow(row, dryRun);
      if (!result.dryRun) {
        if (result.created) created++;
        else updated++;
      }
    } catch (err) {
      failed++;
      console.error(`  ✗ Ligne ${i + 1} (${row?.name ?? "?"}) : ${(err as Error).message}`);
    }
  }

  console.log(
    dryRun
      ? `Dry-run termine : ${rows.length - failed} ligne(s) valide(s), ${failed} erreur(s).`
      : `Import termine : ${created} item(s) cree(s), ${updated} mis a jour, ${failed} erreur(s).`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
