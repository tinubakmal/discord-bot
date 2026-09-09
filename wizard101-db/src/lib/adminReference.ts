// Configuration partagee (client + serveur) du back-office pour les
// "referentiels simples" : ecoles, raretes, types d'objets, mondes, zones,
// boss, talents, definitions de statistiques. Une seule table generique
// (ReferenceManager) + une seule route API generique savent lire cette
// config pour afficher/editer n'importe lequel de ces referentiels, ce qui
// evite de dupliquer une page + une route par entite. Ajouter un nouveau
// referentiel simple plus tard = une entree ici + un delegate Prisma dans
// src/lib/adminDb.ts, rien d'autre.
import { STAT_CATEGORY_LABELS, STAT_CATEGORY_ORDER } from "./stats";

export type FieldType = "text" | "textarea" | "number" | "color" | "select";

export type FieldConfig = {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  helpText?: string;
  staticOptions?: { value: string; label: string }[];
  /** Pour un select dont les options viennent d'un autre referentiel (FK). */
  refModel?: ReferenceModelKey;
};

export type ReferenceModelKey =
  | "schools"
  | "rarities"
  | "itemTypes"
  | "worlds"
  | "zones"
  | "bosses"
  | "talents"
  | "statDefinitions";

export type ReferenceConfig = {
  key: ReferenceModelKey;
  label: string;
  singular: string;
  fields: FieldConfig[];
};

export const REFERENCE_CONFIGS: Record<ReferenceModelKey, ReferenceConfig> = {
  schools: {
    key: "schools",
    label: "Ecoles",
    singular: "une ecole",
    fields: [
      { key: "slug", label: "Slug", type: "text", required: true, placeholder: "storm" },
      { key: "name", label: "Nom", type: "text", required: true, placeholder: "Tempete" },
      { key: "color", label: "Couleur", type: "color" },
      { key: "icon", label: "Icone (emoji)", type: "text", placeholder: "⚡" },
    ],
  },
  rarities: {
    key: "rarities",
    label: "Raretes",
    singular: "une rarete",
    fields: [
      { key: "slug", label: "Slug", type: "text", required: true, placeholder: "epic" },
      { key: "name", label: "Nom", type: "text", required: true, placeholder: "Epique" },
      { key: "color", label: "Couleur", type: "color" },
      { key: "order", label: "Ordre d'affichage", type: "number", placeholder: "0 = plus commun" },
    ],
  },
  itemTypes: {
    key: "itemTypes",
    label: "Types d'objets",
    singular: "un type d'objet",
    fields: [
      { key: "slug", label: "Slug", type: "text", required: true, placeholder: "hat" },
      { key: "name", label: "Nom", type: "text", required: true, placeholder: "Chapeau" },
      {
        key: "slot",
        label: "Emplacement de build (slot)",
        type: "text",
        placeholder: "hat, robe, wand... (laisser vide si non equipable)",
      },
      { key: "icon", label: "Icone (emoji)", type: "text", placeholder: "🎩" },
    ],
  },
  worlds: {
    key: "worlds",
    label: "Mondes",
    singular: "un monde",
    fields: [
      { key: "slug", label: "Slug", type: "text", required: true, placeholder: "avalon" },
      { key: "name", label: "Nom", type: "text", required: true },
      { key: "order", label: "Ordre d'affichage", type: "number" },
    ],
  },
  zones: {
    key: "zones",
    label: "Zones",
    singular: "une zone",
    fields: [
      { key: "slug", label: "Slug", type: "text", required: true },
      { key: "name", label: "Nom", type: "text", required: true },
      { key: "worldId", label: "Monde", type: "select", refModel: "worlds" },
    ],
  },
  bosses: {
    key: "bosses",
    label: "Boss / PNJ",
    singular: "un boss",
    fields: [
      { key: "slug", label: "Slug", type: "text", required: true },
      { key: "name", label: "Nom", type: "text", required: true },
      { key: "zoneId", label: "Zone", type: "select", refModel: "zones" },
      { key: "description", label: "Description", type: "textarea" },
    ],
  },
  talents: {
    key: "talents",
    label: "Talents",
    singular: "un talent",
    fields: [
      { key: "slug", label: "Slug", type: "text", required: true },
      { key: "name", label: "Nom", type: "text", required: true },
      { key: "icon", label: "Icone (emoji)", type: "text" },
      { key: "description", label: "Description", type: "textarea" },
    ],
  },
  statDefinitions: {
    key: "statDefinitions",
    label: "Definitions de statistiques",
    singular: "une statistique",
    fields: [
      { key: "key", label: "Cle (key)", type: "text", required: true, placeholder: "fire_damage" },
      { key: "name", label: "Nom", type: "text", required: true, placeholder: "Degats Feu" },
      { key: "shortName", label: "Nom court", type: "text", placeholder: "DMG" },
      {
        key: "unit",
        label: "Unite",
        type: "select",
        staticOptions: [
          { value: "", label: "(aucune)" },
          { value: "%", label: "%" },
        ],
      },
      {
        key: "category",
        label: "Categorie",
        type: "select",
        required: true,
        staticOptions: STAT_CATEGORY_ORDER.map((c) => ({ value: c, label: STAT_CATEGORY_LABELS[c] })),
      },
      { key: "schoolId", label: "Ecole (si specifique)", type: "select", refModel: "schools" },
      { key: "icon", label: "Icone (emoji)", type: "text" },
      { key: "order", label: "Ordre d'affichage", type: "number" },
    ],
  },
};

export const REFERENCE_MODEL_KEYS = Object.keys(REFERENCE_CONFIGS) as ReferenceModelKey[];
