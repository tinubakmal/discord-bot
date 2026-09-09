"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { ItemSummary, ItemsListResponse } from "@/lib/types";
import { buildCompareRows, compareDelta, formatStatValue } from "@/lib/stats";
import { RarityBadge, SchoolBadge } from "./Badges";
import Image from "next/image";

const MAX_ITEMS = 4;

function ItemPicker({ onAdd, excludeIds }: { onAdd: (item: ItemSummary) => void; excludeIds: string[] }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ItemSummary[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const handle = setTimeout(() => {
      fetch(`/api/items?q=${encodeURIComponent(query)}&pageSize=8`)
        .then((res) => res.json())
        .then((data: ItemsListResponse) => setResults(data.items));
    }, 250);
    return () => clearTimeout(handle);
  }, [query]);

  return (
    <div className="relative">
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Ajouter un item a comparer..."
        className="input-arcane"
      />
      {open && results.length > 0 ? (
        <div className="panel absolute z-20 mt-1 max-h-80 w-full overflow-auto p-2">
          {results
            .filter((r) => !excludeIds.includes(r.id))
            .map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => {
                  onAdd(r);
                  setQuery("");
                  setResults([]);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm text-arcane-200 hover:bg-arcane-800/70"
              >
                <span>{r.itemType.icon ?? "✨"}</span>
                <span className="flex-1 truncate">{r.name}</span>
                <span className="text-xs text-arcane-500">Niv. {r.levelRequired}</span>
              </button>
            ))}
        </div>
      ) : null}
    </div>
  );
}

export function CompareView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [items, setItems] = useState<ItemSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const ids = (searchParams.get("ids") ?? "").split(",").filter(Boolean);

  useEffect(() => {
    if (ids.length === 0) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`/api/items?ids=${ids.join(",")}&pageSize=${MAX_ITEMS}`)
      .then((res) => res.json())
      .then((data: ItemsListResponse) => {
        // On conserve l'ordre de selection tel qu'indique dans l'URL.
        const byId = new Map(data.items.map((i) => [i.id, i]));
        setItems(ids.map((id) => byId.get(id)).filter((i): i is ItemSummary => Boolean(i)));
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  function setIds(nextIds: string[]) {
    router.replace(`/compare?ids=${nextIds.join(",")}`);
  }

  function addItem(item: ItemSummary) {
    if (items.length >= MAX_ITEMS) return;
    setIds([...items.map((i) => i.id), item.id]);
  }

  function removeItem(id: string) {
    setIds(items.map((i) => i.id).filter((i) => i !== id));
  }

  const rows = buildCompareRows(items.map((i) => i.stats));

  return (
    <div className="space-y-6">
      <div className="max-w-md">
        <ItemPicker onAdd={addItem} excludeIds={items.map((i) => i.id)} />
        <p className="mt-1 text-xs text-arcane-500">
          Comparez jusqu&apos;a {MAX_ITEMS} items, meme de categories differentes (ex: chapeau +
          robe + bottes) pour reflechir a une combinaison d&apos;equipement.
        </p>
      </div>

      {loading ? (
        <p className="text-arcane-400">Chargement...</p>
      ) : items.length === 0 ? (
        <div className="panel p-8 text-center text-arcane-400">
          Aucun item selectionne. Utilisez la barre ci-dessus, ou le bouton &laquo; Comparer
          &raquo; depuis la recherche ou une fiche d&apos;item.
        </div>
      ) : (
        <>
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
          >
            {items.map((item) => (
              <div key={item.id} className="panel-glow flex flex-col items-center gap-2 p-4 text-center">
                <button
                  onClick={() => removeItem(item.id)}
                  className="self-end text-xs text-arcane-500 hover:text-rose-400"
                >
                  ✕ retirer
                </button>
                <div className="relative h-20 w-20 overflow-hidden rounded-lg border border-arcane-700 bg-arcane-800/80">
                  {item.imageUrl ? (
                    <Image src={item.imageUrl} alt={item.name} fill sizes="80px" className="object-contain p-1" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-3xl">
                      {item.itemType.icon ?? "✨"}
                    </div>
                  )}
                </div>
                <p className="font-display font-semibold text-arcane-100">{item.name}</p>
                <p className="text-xs text-arcane-400">
                  {item.itemType.name} - Niv. {item.levelRequired}
                </p>
                <div className="flex flex-wrap justify-center gap-1">
                  <RarityBadge rarity={item.rarity} />
                  {item.schools.map((s) => (
                    <SchoolBadge key={s.slug} school={s} />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {items.length < 2 ? (
            <p className="text-sm text-arcane-400">
              Ajoutez au moins un deuxieme item pour voir le tableau de comparaison.
            </p>
          ) : (
            <div className="panel overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="border-b border-arcane-700/60 text-xs uppercase tracking-wider text-arcane-400">
                  <tr>
                    <th className="px-4 py-3">Statistique</th>
                    {items.map((item) => (
                      <th key={item.id} className="px-4 py-3">
                        {item.name}
                      </th>
                    ))}
                    {items.length === 2 ? <th className="px-4 py-3">Difference</th> : null}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const numericValues = row.values.filter((v): v is number => v !== null);
                    const max = numericValues.length ? Math.max(...numericValues) : null;
                    return (
                      <tr key={row.key} className="border-b border-arcane-800/40 last:border-0">
                        <td className="px-4 py-2.5 text-arcane-300">{row.name}</td>
                        {row.values.map((v, i) => (
                          <td
                            key={i}
                            className={`px-4 py-2.5 font-mono ${
                              v === null
                                ? "text-arcane-600"
                                : items.length > 2 && v === max && numericValues.length > 1
                                ? "font-bold text-arcane-gold"
                                : v >= 0
                                ? "text-emerald-300"
                                : "text-rose-300"
                            }`}
                          >
                            {v === null ? "—" : formatStatValue(v, row.unit)}
                          </td>
                        ))}
                        {items.length === 2 ? (
                          <td
                            className={`px-4 py-2.5 font-mono font-semibold ${
                              (() => {
                                const d = compareDelta(row.values[0], row.values[1]);
                                if (d === null) return "text-arcane-600";
                                return d > 0 ? "text-emerald-300" : d < 0 ? "text-rose-300" : "text-arcane-400";
                              })()
                            }`}
                          >
                            {(() => {
                              const d = compareDelta(row.values[0], row.values[1]);
                              if (d === null) return "—";
                              return formatStatValue(d, row.unit);
                            })()}
                          </td>
                        ) : null}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
