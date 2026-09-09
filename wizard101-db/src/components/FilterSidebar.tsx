"use client";

import type { MetaResponse } from "@/lib/types";
import type { Filters } from "./ItemsBrowser";

type ToggleOption = { value: string; label: string; color?: string | null; icon?: string | null };

function ToggleGroup({
  options,
  selected,
  onChange,
}: {
  options: ToggleOption[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  if (options.length === 0) return <p className="text-xs text-arcane-500">Aucune option.</p>;
  function toggle(value: string) {
    onChange(
      selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]
    );
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const active = selected.includes(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => toggle(opt.value)}
            style={
              active && opt.color
                ? { borderColor: opt.color, color: opt.color, backgroundColor: `${opt.color}22` }
                : undefined
            }
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition ${
              active
                ? opt.color
                  ? ""
                  : "border-arcane-gold bg-arcane-gold/15 text-arcane-gold"
                : "border-arcane-700 text-arcane-300 hover:border-arcane-500"
            }`}
          >
            {opt.icon ? <span>{opt.icon}</span> : null}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function FilterSection({
  label,
  count,
  children,
  defaultOpen = true,
  collapsible = false,
}: {
  label: string;
  count: number;
  children: React.ReactNode;
  defaultOpen?: boolean;
  collapsible?: boolean;
}) {
  const header = (
    <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-arcane-400">
      {label}
      {count > 0 ? (
        <span className="rounded-full bg-arcane-gold/20 px-1.5 py-0.5 text-[10px] font-bold text-arcane-gold">
          {count}
        </span>
      ) : null}
    </h3>
  );

  if (!collapsible) {
    return (
      <div className="px-4 py-4 first:pt-0">
        <div className="mb-2.5">{header}</div>
        {children}
      </div>
    );
  }

  return (
    <details className="group/details px-4 py-4" open={defaultOpen || count > 0}>
      <summary className="flex cursor-pointer list-none items-center justify-between">
        {header}
        <span className="text-arcane-500 transition group-open/details:rotate-180">⌄</span>
      </summary>
      <div className="mt-2.5">{children}</div>
    </details>
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

  const activeStatFilters = filters.statFilters.filter((r) => r.key).length;
  const locationCount =
    filters.world.length + filters.zone.length + filters.boss.length + filters.set.length;
  const totalActive =
    filters.type.length +
    filters.school.length +
    filters.rarity.length +
    locationCount +
    activeStatFilters +
    (filters.levelMin ? 1 : 0) +
    (filters.levelMax ? 1 : 0);

  return (
    <aside className="panel divide-y divide-arcane-800/60 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <h2 className="font-display text-sm font-semibold text-arcane-100">
          Filtres {totalActive > 0 ? <span className="text-arcane-gold">({totalActive})</span> : null}
        </h2>
        {totalActive > 0 ? (
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
            className="text-xs font-medium text-arcane-400 hover:text-rose-400"
          >
            Tout effacer
          </button>
        ) : null}
      </div>

      <FilterSection label="Niveau requis" count={(filters.levelMin ? 1 : 0) + (filters.levelMax ? 1 : 0)}>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            placeholder="Min"
            value={filters.levelMin}
            onChange={(e) => onChange({ levelMin: e.target.value })}
            className="input-arcane py-1.5 text-sm"
          />
          <span className="text-arcane-600">—</span>
          <input
            type="number"
            min={1}
            placeholder="Max"
            value={filters.levelMax}
            onChange={(e) => onChange({ levelMax: e.target.value })}
            className="input-arcane py-1.5 text-sm"
          />
        </div>
      </FilterSection>

      <FilterSection label="Type d'objet" count={filters.type.length}>
        <ToggleGroup
          options={meta.itemTypes.map((t) => ({ value: t.slug, label: t.name, icon: t.icon }))}
          selected={filters.type}
          onChange={(v) => onChange({ type: v })}
        />
      </FilterSection>

      <FilterSection label="Ecole" count={filters.school.length}>
        <ToggleGroup
          options={meta.schools.map((s) => ({ value: s.slug, label: s.name, color: s.color, icon: s.icon }))}
          selected={filters.school}
          onChange={(v) => onChange({ school: v })}
        />
      </FilterSection>

      <FilterSection label="Rarete" count={filters.rarity.length}>
        <ToggleGroup
          options={meta.rarities.map((r) => ({ value: r.slug, label: r.name, color: r.color }))}
          selected={filters.rarity}
          onChange={(v) => onChange({ rarity: v })}
        />
      </FilterSection>

      <FilterSection label="Monde et lieu" count={locationCount} collapsible defaultOpen={false}>
        <div className="space-y-3">
          <ToggleGroup
            options={meta.sets.map((s) => ({ value: s.slug, label: s.name }))}
            selected={filters.set}
            onChange={(v) => onChange({ set: v })}
          />
          <ToggleGroup
            options={meta.worlds.map((w) => ({ value: w.slug, label: w.name }))}
            selected={filters.world}
            onChange={(v) => onChange({ world: v })}
          />
          <ToggleGroup options={zoneOptions} selected={filters.zone} onChange={(v) => onChange({ zone: v })} />
          <ToggleGroup
            options={meta.bosses.map((b) => ({ value: b.slug, label: b.name }))}
            selected={filters.boss}
            onChange={(v) => onChange({ boss: v })}
          />
        </div>
      </FilterSection>

      <FilterSection
        label="Statistiques (valeur min.)"
        count={activeStatFilters}
        collapsible
        defaultOpen={false}
      >
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
      </FilterSection>
    </aside>
  );
}
