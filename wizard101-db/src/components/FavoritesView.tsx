"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getFavorites, toggleFavorite, type FavoriteEntry } from "@/lib/localStore";
import type { ItemSummary, ItemsListResponse } from "@/lib/types";
import { ItemCard } from "./ItemCard";

export function FavoritesView() {
  const [entries, setEntries] = useState<FavoriteEntry[] | null>(null);
  const [items, setItems] = useState<ItemSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setEntries(getFavorites());
  }, []);

  useEffect(() => {
    if (!entries) return;
    if (entries.length === 0) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`/api/items?ids=${entries.map((e) => e.id).join(",")}&pageSize=${entries.length}`)
      .then((res) => res.json())
      .then((data: ItemsListResponse) => {
        setItems(data.items);
        setLoading(false);
      });
  }, [entries]);

  if (entries === null) {
    return <p className="text-arcane-400">Chargement...</p>;
  }

  if (entries.length === 0) {
    return (
      <div className="panel p-8 text-center text-arcane-400">
        Aucun favori pour l&apos;instant. Cliquez sur l&apos;etoile ☆ sur un item ou depuis la{" "}
        <Link href="/items" className="text-arcane-gold hover:underline">
          recherche
        </Link>{" "}
        pour l&apos;ajouter ici.
      </div>
    );
  }

  // Certains favoris peuvent referencer un item supprime entre-temps de la
  // base : on les affiche a partir des donnees en cache plutot que de les
  // faire disparaitre silencieusement.
  const foundIds = new Set(items.map((i) => i.id));
  const missing = entries.filter((e) => !foundIds.has(e.id));

  return (
    <div className="space-y-4">
      {loading ? (
        <p className="text-arcane-400">Chargement...</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
          {missing.map((entry) => (
            <div key={entry.id} className="panel flex items-center gap-3 p-4 opacity-70">
              <span className="text-2xl">{entry.itemTypeIcon ?? "✨"}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-arcane-100">{entry.name}</p>
                <p className="text-xs text-arcane-500">Item introuvable (supprime de la base)</p>
              </div>
              <button
                onClick={() => setEntries(toggleFavorite(entry))}
                className="text-xs text-rose-400 hover:underline"
              >
                Retirer
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
