"use client";

import type { MetaResponse } from "@/lib/types";
import type { Filters } from "./ItemsBrowser";

function ToggleGroup({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  if (options.length === 0) return null;
  function toggle(value: string) {
    onChange(
      selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]
    );
  }
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-arcane-400">
        {label}
      </h3>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const active = selected.includes(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggle(opt.value)}
              className={`rounded-full border px-2.5 py-1 text-xs font-medium transition ${
                active
                  ? "border-arcane-gold bg-arcane-gold/15 text-arcane-gold"
                  : "border-arcane-700 text-arcane-300 hover:border-arcane-500"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function FilterSidebar({
  meta,
  filters,
  onChange,
}: {
  meta: MetaResponse;
  filters: Filters;
  onChange: (next: Partial<Filters>) => void;
}) {
  const zoneOptions = meta.worlds.flatMap((w) =>
    w.zones.map((z) => ({ value: z.slug, label: `${z.name} (${w.name})` }))
  );

  return (
    <aside className="panel space-y-6 p-4">
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-arcane-400">
          Niveau requis
        </h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            placeholder="Min"
            value={filters.levelMin}
            onChange={(e) => onChange({ levelMin: e.target.value })}
            className="input-arcane py-1.5 text-sm"
          />
          <span className="text-arcane-500">-</span>
          <input
            type="number"
            min={1}
            placeholder="Max"
            value={filters.levelMax}
            onChange={(e) => onChange({ levelMax: e.target.value })}
            className="input-arcane py-1.5 text-sm"
          />
        </div>
      </div>

      <ToggleGroup
        label="Type d'objet"
        options={meta.itemTypes.map((t) => ({ value: t.slug, label: t.name }))}
        selected={filters.type}
        onChange={(v) => onChange({ type: v })}
      />

      <ToggleGroup
        label="Ecole"
        options={meta.schools.map((s) => ({ value: s.slug, label: s.name }))}
        selected={filters.school}
        onChange={(v) => onChange({ school: v })}
      />

      <ToggleGroup
        label="Rarete"
        options={meta.rarities.map((r) => ({ value: r.slug, label: r.name }))}
        selected={filters.rarity}
        onChange={(v) => onChange({ rarity: v })}
      />

      <ToggleGroup
        label="Set"
        options={meta.sets.map((s) => ({ value: s.slug, label: s.name }))}
        selected={filters.set}
        onChange={(v) => onChange({ set: v })}
      />

      <ToggleGroup
        label="Monde"
        options={meta.worlds.map((w) => ({ value: w.slug, label: w.name }))}
        selected={filters.world}
        onChange={(v) => onChange({ world: v })}
      />

      <ToggleGroup
        label="Zone"
        options={zoneOptions}
        selected={filters.zone}
        onChange={(v) => onChange({ zone: v })}
      />

      <ToggleGroup
        label="Boss / PNJ"
        options={meta.bosses.map((b) => ({ value: b.slug, label: b.name }))}
        selected={filters.boss}
        onChange={(v) => onChange({ boss: v })}
      />

      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-arcane-400">
          Statistiques (valeur minimale)
        </h3>
        <div className="space-y-2">
          {filters.statFilters.map((row, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <select
                value={row.key}
                onChange={(e) => {
                  const next = [...filters.statFilters];
                  next[i] = { ...row, key: e.target.value };
                  onChange({ statFilters: next });
                }}
                className="input-arcane py-1.5 text-xs"
              >
                <option value="">Choisir...</option>
                {meta.statDefinitions.map((d) => (
                  <option key={d.key} value={d.key}>
                    {d.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Min"
                value={row.min}
                onChange={(e) => {
                  const next = [...filters.statFilters];
                  next[i] = { ...row, min: e.target.value };
                  onChange({ statFilters: next });
                }}
                className="input-arcane w-20 py-1.5 text-xs"
              />
              <button
                type="button"
                onClick={() => onChange({ statFilters: filters.statFilters.filter((_, j) => j !== i) })}
                className="rounded-md border border-arcane-700 px-2 py-1.5 text-xs text-arcane-400 hover:border-rose-500 hover:text-rose-400"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => onChange({ statFilters: [...filters.statFilters, { key: "", min: "" }] })}
            className="text-xs font-medium text-arcane-gold hover:underline"
          >
            + Ajouter un filtre de statistique
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={() =>
          onChange({
            q: "",
            type: [],
            school: [],
            world: [],
            zone: [],
            boss: [],
            rarity: [],
            set: [],
            levelMin: "",
            levelMax: "",
            statFilters: [],
            page: 1,
          })
        }
        className="btn-secondary w-full text-sm"
      >
        Reinitialiser les filtres
      </button>
    </aside>
  );
}
