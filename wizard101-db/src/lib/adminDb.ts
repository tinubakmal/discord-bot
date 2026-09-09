import { prisma } from "./db";
import { REFERENCE_CONFIGS, type ReferenceModelKey } from "./adminReference";

// Chaque delegate Prisma expose la meme forme (findMany/create/update/delete)
// mais avec des types d'entree differents ; ce fichier est le seul endroit
// ou l'on traite ca generiquement (any assume), pour que le reste de
// l'application garde des types stricts.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DELEGATES: Record<ReferenceModelKey, any> = {
  schools: prisma.school,
  rarities: prisma.rarity,
  itemTypes: prisma.itemType,
  worlds: prisma.world,
  zones: prisma.zone,
  bosses: prisma.boss,
  talents: prisma.talent,
  statDefinitions: prisma.statDefinition,
};

export function isReferenceModel(value: string): value is ReferenceModelKey {
  return value in REFERENCE_CONFIGS;
}

export function getDelegate(model: ReferenceModelKey) {
  return DELEGATES[model];
}

/**
 * Ne garde que les champs declares dans la config du referentiel, convertit
 * les nombres, et transforme les chaines vides en null pour les champs
 * optionnels (selects de FK notamment) afin que Prisma accepte l'update.
 */
export function sanitizeReferenceInput(
  model: ReferenceModelKey,
  body: Record<string, unknown>
): Record<string, unknown> {
  const config = REFERENCE_CONFIGS[model];
  const data: Record<string, unknown> = {};
  for (const field of config.fields) {
    if (!(field.key in body)) continue;
    let value = body[field.key];
    if (field.type === "number") {
      value = value === "" || value === null || value === undefined ? null : Number(value);
    } else if (typeof value === "string") {
      value = value.trim();
      if (value === "" && field.key !== "name" && field.key !== "slug" && field.key !== "key") {
        value = null;
      }
    }
    data[field.key] = value;
  }
  return data;
}

export function validateRequiredFields(model: ReferenceModelKey, data: Record<string, unknown>): string | null {
  const config = REFERENCE_CONFIGS[model];
  for (const field of config.fields) {
    if (field.required && !data[field.key]) {
      return `${field.label} requis`;
    }
  }
  return null;
}
