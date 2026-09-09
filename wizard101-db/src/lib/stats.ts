// SQLite (Prisma) ne supporte pas les enums natifs : StatDefinition.category
// est stocke en String, contrainte a l'une de ces valeurs cote application.
// C'est la source de verite pour les categories de statistiques.
export type StatCategory =
  | "GENERAL"
  | "COMBAT"
  | "SCHOOL_DAMAGE"
  | "SCHOOL_RESIST"
  | "SCHOOL_ACCURACY"
  | "UTILITY"
  | "OTHER";

// Libelles humains pour les categories de statistiques (utilises dans les
// fiches d'item, le comparateur et le createur de build).
export const STAT_CATEGORY_LABELS: Record<StatCategory, string> = {
  GENERAL: "General",
  COMBAT: "Combat",
  SCHOOL_DAMAGE: "Degats par ecole",
  SCHOOL_RESIST: "Resistance par ecole",
  SCHOOL_ACCURACY: "Precision par ecole",
  UTILITY: "Utilitaire",
  OTHER: "Autre",
};

export const STAT_CATEGORY_ORDER: StatCategory[] = [
  "GENERAL",
  "COMBAT",
  "SCHOOL_DAMAGE",
  "SCHOOL_RESIST",
  "SCHOOL_ACCURACY",
  "UTILITY",
  "OTHER",
];

// Ordre des emplacements d'equipement pour le createur de build.
export const BUILD_SLOTS: { slot: string; label: string }[] = [
  { slot: "hat", label: "Chapeau" },
  { slot: "robe", label: "Robe" },
  { slot: "boots", label: "Bottes" },
  { slot: "wand", label: "Baguette" },
  { slot: "athame", label: "Athame" },
  { slot: "amulet", label: "Amulette" },
  { slot: "ring", label: "Anneau" },
  { slot: "deck", label: "Deck" },
  { slot: "pet", label: "Familier" },
  { slot: "mount", label: "Monture" },
];

export type StatValue = {
  key: string;
  name: string;
  shortName: string | null;
  unit: string | null;
  category: StatCategory;
  icon: string | null;
  order: number;
  schoolSlug?: string | null;
  value: number;
};

/** Formatte une valeur de statistique pour l'affichage (+15, +20%, -5...). */
export function formatStatValue(value: number, unit: string | null): string {
  const sign = value > 0 ? "+" : "";
  const rounded = Number.isInteger(value) ? value : Math.round(value * 100) / 100;
  const suffix = unit === "%" ? "%" : "";
  return `${sign}${rounded}${suffix}`;
}

/** Regroupe une liste de stats a plat par categorie, dans l'ordre d'affichage. */
export function groupStatsByCategory(stats: StatValue[]) {
  const groups = new Map<StatCategory, StatValue[]>();
  for (const stat of stats) {
    const list = groups.get(stat.category) ?? [];
    list.push(stat);
    groups.set(stat.category, list);
  }
  for (const list of groups.values()) {
    list.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
  }
  return STAT_CATEGORY_ORDER.filter((c) => groups.has(c)).map((category) => ({
    category,
    label: STAT_CATEGORY_LABELS[category],
    stats: groups.get(category)!,
  }));
}

export type CompareRow = {
  key: string;
  name: string;
  shortName: string | null;
  unit: string | null;
  category: StatCategory;
  values: (number | null)[]; // une valeur par item compare, null si absente
};

/**
 * Construit les lignes du tableau de comparaison a partir des stats de
 * plusieurs items : une ligne par statistique presente sur au moins un item,
 * avec une valeur (ou null) par item et le delta calcule automatiquement
 * cote client (voir compareDelta).
 */
export function buildCompareRows(itemsStats: StatValue[][]): CompareRow[] {
  const byKey = new Map<string, CompareRow>();
  itemsStats.forEach((stats, itemIndex) => {
    for (const stat of stats) {
      let row = byKey.get(stat.key);
      if (!row) {
        row = {
          key: stat.key,
          name: stat.name,
          shortName: stat.shortName,
          unit: stat.unit,
          category: stat.category,
          values: itemsStats.map(() => null),
        };
        byKey.set(stat.key, row);
      }
      row.values[itemIndex] = stat.value;
    }
  });
  return Array.from(byKey.values()).sort((a, b) => a.name.localeCompare(b.name));
}

/** Delta entre deux valeurs de stat (null-safe) pour la colonne "difference". */
export function compareDelta(a: number | null, b: number | null): number | null {
  if (a === null || b === null) return null;
  return Math.round((a - b) * 100) / 100;
}
