"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type StatDef = { id: string; key: string; name: string; unit: string | null };
type BonusStat = { statDefinitionId: string; value: number; statDefinition?: StatDef };
type Bonus = { id: string; piecesRequired: number; description: string | null; stats: BonusStat[] };
type SetDetail = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  popularity: number;
  bonuses: Bonus[];
  items: { id: string; name: string; slug: string }[];
};

function BonusForm({
  setId,
  statDefs,
  existing,
  onSaved,
  onCancelEdit,
}: {
  setId: string;
  statDefs: StatDef[];
  existing?: Bonus;
  onSaved: () => void;
  onCancelEdit?: () => void;
}) {
  const [pieces, setPieces] = useState(String(existing?.piecesRequired ?? "3"));
  const [description, setDescription] = useState(existing?.description ?? "");
  const [stats, setStats] = useState<{ statDefinitionId: string; value: string }[]>(
    existing?.stats.map((s) => ({ statDefinitionId: s.statDefinitionId, value: String(s.value) })) ?? []
  );
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const payload = {
      piecesRequired: Number(pieces),
      description: description || null,
      stats: stats
        .filter((s) => s.statDefinitionId && s.value !== "")
        .map((s) => ({ statDefinitionId: s.statDefinitionId, value: Number(s.value) })),
    };
    const url = existing
      ? `/api/admin/sets/${setId}/bonuses/${existing.id}`
      : `/api/admin/sets/${setId}/bonuses`;
    const res = await fetch(url, {
      method: existing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Erreur");
      return;
    }
    if (!existing) {
      setPieces("3");
      setDescription("");
      setStats([]);
    }
    onSaved();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2 rounded-lg border border-arcane-700/60 bg-arcane-900/40 p-3">
      <div className="flex gap-2">
        <input
          type="number"
          min={1}
          value={pieces}
          onChange={(e) => setPieces(e.target.value)}
          placeholder="Pieces"
          className="input-arcane w-24 text-sm"
        />
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description du bonus"
          className="input-arcane flex-1 text-sm"
        />
      </div>
      <div className="space-y-1.5">
        {stats.map((row, i) => (
          <div key={i} className="flex gap-1.5">
            <select
              value={row.statDefinitionId}
              onChange={(e) => {
                const next = [...stats];
                next[i] = { ...row, statDefinitionId: e.target.value };
                setStats(next);
              }}
              className="input-arcane py-1 text-xs"
            >
              <option value="">Statistique...</option>
              {statDefs.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              step="any"
              value={row.value}
              onChange={(e) => {
                const next = [...stats];
                next[i] = { ...row, value: e.target.value };
                setStats(next);
              }}
              placeholder="Valeur"
              className="input-arcane w-24 py-1 text-xs"
            />
            <button
              type="button"
              onClick={() => setStats(stats.filter((_, j) => j !== i))}
              className="text-xs text-arcane-500 hover:text-rose-400"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setStats([...stats, { statDefinitionId: "", value: "" }])}
          className="text-xs text-arcane-gold hover:underline"
        >
          + statistique
        </button>
      </div>
      {error ? <p className="text-xs text-rose-400">{error}</p> : null}
      <div className="flex gap-2">
        <button type="submit" className="btn-secondary py-1 text-xs">
          {existing ? "Enregistrer" : "Ajouter le palier"}
        </button>
        {existing ? (
          <button type="button" onClick={onCancelEdit} className="text-xs text-arcane-400 hover:underline">
            Annuler
          </button>
        ) : null}
      </div>
    </form>
  );
}

export function SetEditor({ setId }: { setId: string }) {
  const [set, setSet] = useState<SetDetail | null>(null);
  const [statDefs, setStatDefs] = useState<StatDef[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [popularity, setPopularity] = useState("0");
  const [editingBonusId, setEditingBonusId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function load() {
    fetch(`/api/admin/sets/${setId}`)
      .then((res) => res.json())
      .then((data: SetDetail) => {
        setSet(data);
        setName(data.name);
        setDescription(data.description ?? "");
        setPopularity(String(data.popularity));
      });
  }

  useEffect(load, [setId]);
  useEffect(() => {
    fetch("/api/admin/meta")
      .then((res) => res.json())
      .then((data) => setStatDefs(data.statDefinitions));
  }, []);

  async function onSaveScalar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch(`/api/admin/sets/${setId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, popularity: Number(popularity) }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Erreur");
      return;
    }
    load();
  }

  async function onDeleteBonus(id: string) {
    if (!confirm("Supprimer ce palier de bonus ?")) return;
    await fetch(`/api/admin/sets/${setId}/bonuses/${id}`, { method: "DELETE" });
    load();
  }

  if (!set) return <p className="text-arcane-400">Chargement...</p>;

  return (
    <div className="space-y-6">
      <form onSubmit={onSaveScalar} className="panel grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wider text-arcane-400">Nom</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="input-arcane" />
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wider text-arcane-400">Popularite</label>
          <input
            type="number"
            value={popularity}
            onChange={(e) => setPopularity(e.target.value)}
            className="input-arcane"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs uppercase tracking-wider text-arcane-400">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input-arcane min-h-[70px]"
          />
        </div>
        {error ? <p className="text-sm text-rose-400 sm:col-span-2">{error}</p> : null}
        <button type="submit" className="btn-primary sm:col-span-2">
          Enregistrer
        </button>
      </form>

      <div className="panel space-y-4 p-4">
        <h2 className="font-display text-lg font-semibold text-arcane-100">Paliers de bonus</h2>
        {set.bonuses.length === 0 ? (
          <p className="text-sm text-arcane-400">Aucun palier pour l&apos;instant.</p>
        ) : (
          <ul className="space-y-2">
            {set.bonuses.map((bonus) =>
              editingBonusId === bonus.id ? (
                <li key={bonus.id}>
                  <BonusForm
                    setId={setId}
                    statDefs={statDefs}
                    existing={bonus}
                    onSaved={() => {
                      setEditingBonusId(null);
                      load();
                    }}
                    onCancelEdit={() => setEditingBonusId(null)}
                  />
                </li>
              ) : (
                <li
                  key={bonus.id}
                  className="flex flex-wrap items-center gap-2 rounded-lg border border-arcane-800/60 bg-arcane-900/40 px-3 py-2 text-sm"
                >
                  <span className="badge">{bonus.piecesRequired} pieces</span>
                  <span className="text-arcane-300">{bonus.description}</span>
                  <span className="flex flex-wrap gap-1">
                    {bonus.stats.map((s) => (
                      <span key={s.statDefinitionId} className="badge text-xs">
                        {statDefs.find((d) => d.id === s.statDefinitionId)?.name ?? s.statDefinitionId}{" "}
                        {s.value > 0 ? "+" : ""}
                        {s.value}
                      </span>
                    ))}
                  </span>
                  <div className="ml-auto flex gap-3">
                    <button onClick={() => setEditingBonusId(bonus.id)} className="text-xs text-arcane-gold hover:underline">
                      Modifier
                    </button>
                    <button onClick={() => onDeleteBonus(bonus.id)} className="text-xs text-rose-400 hover:underline">
                      Supprimer
                    </button>
                  </div>
                </li>
              )
            )}
          </ul>
        )}

        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-arcane-400">
            Ajouter un palier
          </h3>
          <BonusForm setId={setId} statDefs={statDefs} onSaved={load} />
        </div>
      </div>

      <div className="panel p-4">
        <h2 className="mb-3 font-display text-lg font-semibold text-arcane-100">
          Pieces du set ({set.items.length})
        </h2>
        {set.items.length === 0 ? (
          <p className="text-sm text-arcane-400">
            Aucun item n&apos;est encore rattache a ce set (rattachez-le depuis la fiche d&apos;un item).
          </p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {set.items.map((item) => (
              <li key={item.id}>
                <Link href={`/admin/items/${item.id}`} className="badge hover:border-arcane-gold hover:text-arcane-gold">
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
