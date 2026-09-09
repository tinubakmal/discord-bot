"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { slugify } from "@/lib/slugify";

type SetRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  _count: { items: number; bonuses: number };
};

export function SetsAdminList() {
  const [sets, setSets] = useState<SetRow[] | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  function load() {
    fetch("/api/admin/sets")
      .then((res) => res.json())
      .then(setSets);
  }

  useEffect(load, []);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/admin/sets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, slug: slugify(name) }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Erreur");
      return;
    }
    setName("");
    load();
  }

  async function onDelete(id: string, name: string) {
    if (!confirm(`Supprimer le set "${name}" ?`)) return;
    const res = await fetch(`/api/admin/sets/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error ?? "Suppression impossible");
      return;
    }
    load();
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
      <form onSubmit={onCreate} className="panel space-y-3 p-4">
        <h2 className="font-display text-lg font-semibold text-arcane-100">Nouveau set</h2>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nom du set"
          className="input-arcane text-sm"
          required
        />
        {error ? <p className="text-sm text-rose-400">{error}</p> : null}
        <button type="submit" className="btn-primary w-full text-sm">
          Creer
        </button>
        <p className="text-xs text-arcane-500">
          Les bonus par palier se configurent ensuite depuis la fiche du set.
        </p>
      </form>

      <div className="panel overflow-x-auto p-4">
        <h2 className="mb-3 font-display text-lg font-semibold text-arcane-100">
          Sets {sets ? `(${sets.length})` : ""}
        </h2>
        {!sets ? (
          <p className="text-arcane-400">Chargement...</p>
        ) : sets.length === 0 ? (
          <p className="text-arcane-400">Aucun set pour l&apos;instant.</p>
        ) : (
          <table className="w-full min-w-[420px] text-left text-sm">
            <thead className="border-b border-arcane-700/60 text-xs uppercase tracking-wider text-arcane-400">
              <tr>
                <th className="px-3 py-2">Nom</th>
                <th className="px-3 py-2">Pieces</th>
                <th className="px-3 py-2">Paliers de bonus</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {sets.map((s) => (
                <tr key={s.id} className="border-b border-arcane-800/40 last:border-0">
                  <td className="px-3 py-2 text-arcane-100">{s.name}</td>
                  <td className="px-3 py-2 text-arcane-400">{s._count.items}</td>
                  <td className="px-3 py-2 text-arcane-400">{s._count.bonuses}</td>
                  <td className="px-3 py-2 text-right">
                    <Link href={`/admin/sets/${s.id}`} className="mr-3 text-arcane-gold hover:underline">
                      Modifier
                    </Link>
                    <button onClick={() => onDelete(s.id, s.name)} className="text-rose-400 hover:underline">
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
