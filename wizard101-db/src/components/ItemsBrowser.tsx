"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMeta } from "@/lib/useMeta";
import type { ItemSummary, ItemsListResponse } from "@/lib/types";
import { ItemCard } from "./ItemCard";
import { FilterSidebar } from "./FilterSidebar";

export type Filters = {
  q: string;
  type: string[];
  school: string[];
  world: string[];
  zone: string[];
  boss: string[];
  rarity: string[];
  set: string[];
  levelMin: string;
  levelMax: string;
  statFilters: { key: string; min: string }[];
  sort: string;
  page: number;
};

const EMPTY_FILTERS: Filters = {
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
  sort: "name",
  page: 1,
};

function parseFilters(params: URLSearchParams): Filters {
  const list = (key: string) => (params.get(key) ? params.get(key)!.split(",") : []);
  const statParam = params.getAll("stat"); // "key:min"
  return {
    q: params.get("q") ?? "",
    type: list("type"),
    school: list("school"),
    world: list("world"),
    zone: list("zone"),
    boss: list("boss"),
    rarity: list("rarity"),
    set: list("set"),
    levelMin: params.get("levelMin") ?? "",
    levelMax: params.get("levelMax") ?? "",
    statFilters: statParam.map((raw) => {
      const [key, min] = raw.split(":");
      return { key: key ?? "", min: min ?? "" };
    }),
    sort: params.get("sort") ?? "name",
    page: Number(params.get("page") ?? "1") || 1,
  };
}

function toSearchParams(filters: Filters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.type.length) params.set("type", filters.type.join(","));
  if (filters.school.length) params.set("school", filters.school.join(","));
  if (filters.world.length) params.set("world", filters.world.join(","));
  if (filters.zone.length) params.set("zone", filters.zone.join(","));
  if (filters.boss.length) params.set("boss", filters.boss.join(","));
  if (filters.rarity.length) params.set("rarity", filters.rarity.join(","));
  if (filters.set.length) params.set("set", filters.set.join(","));
  if (filters.levelMin) params.set("levelMin", filters.levelMin);
  if (filters.levelMax) params.set("levelMax", filters.levelMax);
  for (const row of filters.statFilters) {
    if (row.key) params.append("stat", row.min ? `${row.key}:${row.min}` : row.key);
  }
  if (filters.sort !== "name") params.set("sort", filters.sort);
  if (filters.page !== 1) params.set("page", String(filters.page));
  return params;
}

export function ItemsBrowser() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { meta } = useMeta();

  const [filters, setFilters] = useState<Filters>(() => parseFilters(searchParams));
  const [result, setResult] = useState<ItemsListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ItemSummary[]>([]);

  const updateFilters = useCallback((patch: Partial<Filters>) => {
    setFilters((prev) => ({ ...prev, ...patch, page: "page" in patch ? patch.page! : 1 }));
  }, []);

  // Synchronise l'URL (partageable / bookmarkable) sans provoquer de rechargement.
  useEffect(() => {
    const params = toSearchParams(filters);
    router.replace(`/items?${params.toString()}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  // Debounce sur la recherche texte pour eviter un fetch a chaque frappe.
  useEffect(() => {
    setLoading(true);
    const params = toSearchParams(filters);
    const handle = setTimeout(
      () => {
        fetch(`/api/items?${params.toString()}`)
          .then((res) => res.json())
          .then((data: ItemsListResponse) => {
            setResult(data);
            setLoading(false);
          });
      },
      filters.q ? 300 : 0
    );
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const totalPages = useMemo(
    () => (result ? Math.max(1, Math.ceil(result.total / result.pageSize)) : 1),
    [result]
  );

  function toggleSelect(item: ItemSummary) {
    setSelected((prev) =>
      prev.some((i) => i.id === item.id)
        ? prev.filter((i) => i.id !== item.id)
        : prev.length >= 4
        ? prev
        : [...prev, item]
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
      {meta ? <FilterSidebar meta={meta} filters={filters} onChange={updateFilters} /> : <div />}

      <div>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <input
            type="search"
            value={filters.q}
            onChange={(e) => updateFilters({ q: e.target.value })}
            placeholder="Rechercher par nom ou description..."
            className="input-arcane max-w-sm"
          />
          <select
            value={filters.sort}
            onChange={(e) => updateFilters({ sort: e.target.value })}
            className="input-arcane w-auto py-2 text-sm"
          >
            <option value="name">Nom (A-Z)</option>
            <option value="level">Niveau croissant</option>
            <option value="popularity">Popularite</option>
            <option value="recent">Recemment ajoutes</option>
          </select>
          <span className="text-sm text-arcane-400">
            {loading ? "Recherche..." : `${result?.total ?? 0} resultat(s)`}
          </span>
        </div>

        {result && result.items.length === 0 && !loading ? (
          <div className="panel p-8 text-center text-arcane-400">
            Aucun item ne correspond a ces filtres.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {(result?.items ?? []).map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                selectable
                selected={selected.some((i) => i.id === item.id)}
                onToggleSelect={toggleSelect}
              />
            ))}
          </div>
        )}

        {totalPages > 1 ? (
          <div className="mt-6 flex items-center justify-center gap-2">
            <button
              disabled={filters.page <= 1}
              onClick={() => updateFilters({ page: filters.page - 1 })}
              className="btn-secondary px-3 py-1.5 text-sm disabled:opacity-40"
            >
              ← Precedent
            </button>
            <span className="text-sm text-arcane-400">
              Page {filters.page} / {totalPages}
            </span>
            <button
              disabled={filters.page >= totalPages}
              onClick={() => updateFilters({ page: filters.page + 1 })}
              className="btn-secondary px-3 py-1.5 text-sm disabled:opacity-40"
            >
              Suivant →
            </button>
          </div>
        ) : null}
      </div>

      {selected.length > 0 ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-arcane-gold/40 bg-arcane-950/95 px-4 py-3 backdrop-blur">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3">
            <span className="text-sm text-arcane-300">
              {selected.length} item(s) selectionne(s) pour comparaison (max 4)
            </span>
            <div className="flex flex-wrap gap-1.5">
              {selected.map((item) => (
                <span key={item.id} className="badge">
                  {item.name}
                  <button onClick={() => toggleSelect(item)} className="ml-1 text-arcane-400 hover:text-rose-400">
                    ✕
                  </button>
                </span>
              ))}
            </div>
            <button
              onClick={() => router.push(`/compare?ids=${selected.map((i) => i.id).join(",")}`)}
              disabled={selected.length < 2}
              className="btn-primary ml-auto disabled:cursor-not-allowed disabled:opacity-40"
            >
              Comparer ({selected.length})
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
