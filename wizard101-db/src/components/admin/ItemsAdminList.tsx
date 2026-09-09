"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { ItemsListResponse } from "@/lib/types";

export function ItemsAdminList() {
  const [q, setQ] = useState("");
  const [data, setData] = useState<ItemsListResponse | null>(null);
  const [page, setPage] = useState(1);

  function load() {
    const params = new URLSearchParams({ page: String(page) });
    if (q) params.set("q", q);
    fetch(`/api/admin/items?${params.toString()}`)
      .then((res) => res.json())
      .then(setData);
  }

  useEffect(() => {
    const handle = setTimeout(load, q ? 250 : 0);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, page]);

  async function onDelete(id: string, name: string) {
    if (!confirm(`Supprimer l'item "${name}" ? Cette action est irreversible.`)) return;
    const res = await fetch(`/api/admin/items/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json();
      alert(body.error ?? "Suppression impossible");
      return;
    }
    load();
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          placeholder="Rechercher un item..."
          className="input-arcane max-w-sm"
        />
        <Link href="/admin/items/new" className="btn-primary ml-auto">
          + Nouvel item
        </Link>
      </div>

      <div className="panel overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="border-b border-arcane-700/60 text-xs uppercase tracking-wider text-arcane-400">
            <tr>
              <th className="px-4 py-3">Nom</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Niveau</th>
              <th className="px-4 py-3">Rarete</th>
              <th className="px-4 py-3">Set</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {(data?.items ?? []).map((item) => (
              <tr key={item.id} className="border-b border-arcane-800/40 last:border-0">
                <td className="px-4 py-2.5 text-arcane-100">{item.name}</td>
                <td className="px-4 py-2.5 text-arcane-400">{item.itemType.name}</td>
                <td className="px-4 py-2.5 text-arcane-400">{item.levelRequired}</td>
                <td className="px-4 py-2.5 text-arcane-400">{item.rarity?.name ?? "—"}</td>
                <td className="px-4 py-2.5 text-arcane-400">{item.set?.name ?? "—"}</td>
                <td className="px-4 py-2.5 text-right">
                  <Link href={`/items/${item.slug}`} className="mr-3 text-arcane-400 hover:underline" target="_blank">
                    Voir
                  </Link>
                  <Link href={`/admin/items/${item.id}`} className="mr-3 text-arcane-gold hover:underline">
                    Modifier
                  </Link>
                  <button onClick={() => onDelete(item.id, item.name)} className="text-rose-400 hover:underline">
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data && totalPages > 1 ? (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="btn-secondary px-3 py-1.5 text-sm disabled:opacity-40"
          >
            ← Precedent
          </button>
          <span className="text-sm text-arcane-400">
            Page {page} / {totalPages} ({data.total} items)
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="btn-secondary px-3 py-1.5 text-sm disabled:opacity-40"
          >
            Suivant →
          </button>
        </div>
      ) : null}
    </div>
  );
}
