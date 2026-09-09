import type { StatValue } from "./stats";

export type ItemSummary = {
  id: string;
  slug: string;
  name: string;
  imageUrl: string | null;
  levelRequired: number;
  itemType: { slug: string; name: string; icon: string | null };
  rarity: { slug: string; name: string; color: string | null } | null;
  schools: { slug: string; name: string; color: string | null; icon: string | null }[];
  set: { slug: string; name: string } | null;
  popularity: number;
  createdAt: string;
  // Un petit apercu (2-3 stats) pour les cartes de la liste de recherche.
  highlightStats: StatValue[];
  // Toutes les stats de l'item, utilisees par le comparateur et le builder.
  stats: StatValue[];
};

export type ItemDetail = ItemSummary & {
  description: string | null;
  world: { slug: string; name: string } | null;
  zone: { slug: string; name: string } | null;
  boss: { slug: string; name: string } | null;
  sourceText: string | null;
  stats: StatValue[];
  talents: { slug: string; name: string; description: string | null; icon: string | null }[];
  set:
    | {
        slug: string;
        name: string;
        description: string | null;
        bonuses: {
          piecesRequired: number;
          description: string | null;
          stats: StatValue[];
        }[];
        pieces: ItemSummary[];
      }
    | null;
  similar: ItemSummary[];
};

export type MetaResponse = {
  schools: { slug: string; name: string; color: string | null; icon: string | null }[];
  worlds: {
    slug: string;
    name: string;
    zones: { slug: string; name: string }[];
  }[];
  bosses: { slug: string; name: string; zoneSlug: string | null }[];
  rarities: { slug: string; name: string; color: string | null; order: number }[];
  itemTypes: { slug: string; name: string; slot: string | null; icon: string | null }[];
  sets: { slug: string; name: string }[];
  statDefinitions: {
    key: string;
    name: string;
    shortName: string | null;
    unit: string | null;
    category: string;
    schoolSlug: string | null;
  }[];
};

export type ItemsListResponse = {
  items: ItemSummary[];
  total: number;
  page: number;
  pageSize: number;
};
