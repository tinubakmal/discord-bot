"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { slugify } from "@/lib/slugify";

type AdminMeta = {
  schools: { id: string; name: string }[];
  rarities: { id: string; name: string }[];
  itemTypes: { id: string; name: string }[];
  worlds: { id: string; name: string }[];
  zones: { id: string; name: string; worldId: string | null }[];
  bosses: { id: string; name: string; zoneId: string | null }[];
  sets: { id: string; name: string }[];
  talents: { id: string; name: string }[];
  statDefinitions: { id: string; key: string; name: string; unit: string | null }[];
};

type ItemFormValues = {
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  levelRequired: string;
  itemTypeId: string;
  rarityId: string;
  worldId: string;
  zoneId: string;
  bossId: string;
  setId: string;
  sourceText: string;
  popularity: string;
  schoolIds: string[];
  talentIds: string[];
  stats: { statDefinitionId: string; value: string }[];
};

const EMPTY_FORM: ItemFormValues = {
  name: "",
  slug: "",
  description: "",
  imageUrl: "",
  levelRequired: "1",
  itemTypeId: "",
  rarityId: "",
  worldId: "",
  zoneId: "",
  bossId: "",
  setId: "",
  sourceText: "",
  popularity: "0",
  schoolIds: [],
  talentIds: [],
  stats: [],
};

export function ItemForm({ itemId }: { itemId?: string }) {
  const router = useRouter();
  const [meta, setMeta] = useState<AdminMeta | null>(null);
  const [form, setForm] = useState<ItemFormValues>(EMPTY_FORM);
  const [slugTouched, setSlugTouched] = useState(Boolean(itemId));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(Boolean(itemId));

  useEffect(() => {
    fetch("/api/admin/meta")
      .then((res) => res.json())
      .then(setMeta);
  }, []);

  useEffect(() => {
    if (!itemId) return;
    fetch(`/api/admin/items/${itemId}`)
      .then((res) => res.json())
      .then((data) => {
        setForm({
          name: data.name,
          slug: data.slug,
          description: data.description ?? "",
          imageUrl: data.imageUrl ?? "",
          levelRequired: String(data.levelRequired),
          itemTypeId: data.itemTypeId,
          rarityId: data.rarityId ?? "",
          worldId: data.worldId ?? "",
          zoneId: data.zoneId ?? "",
          bossId: data.bossId ?? "",
          setId: data.setId ?? "",
          sourceText: data.sourceText ?? "",
          popularity: String(data.popularity),
          schoolIds: data.schoolIds,
          talentIds: data.talentIds,
          stats: data.stats.map((s: { statDefinitionId: string; value: number }) => ({
            statDefinitionId: s.statDefinitionId,
            value: String(s.value),
          })),
        });
        setLoading(false);
      });
  }, [itemId]);

  function update<K extends keyof ItemFormValues>(key: K, value: ItemFormValues[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleMulti(key: "schoolIds" | "talentIds", id: string) {
    setForm((f) => ({
      ...f,
      [key]: f[key].includes(id) ? f[key].filter((v) => v !== id) : [...f[key], id],
    }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const payload = {
      name: form.name,
      slug: form.slug || slugify(form.name),
      description: form.description || null,
      imageUrl: form.imageUrl || null,
      levelRequired: Number(form.levelRequired) || 1,
      itemTypeId: form.itemTypeId,
      rarityId: form.rarityId || null,
      worldId: form.worldId || null,
      zoneId: form.zoneId || null,
      bossId: form.bossId || null,
      setId: form.setId || null,
      sourceText: form.sourceText || null,
      popularity: Number(form.popularity) || 0,
      schoolIds: form.schoolIds,
      talentIds: form.talentIds,
      stats: form.stats
        .filter((s) => s.statDefinitionId && s.value !== "")
        .map((s) => ({ statDefinitionId: s.statDefinitionId, value: Number(s.value) })),
    };
    const res = await fetch(itemId ? `/api/admin/items/${itemId}` : "/api/admin/items", {
      method: itemId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "Erreur inconnue");
      return;
    }
    router.push("/admin/items");
    router.refresh();
  }

  if (!meta || loading) {
    return <p className="text-arcane-400">Chargement...</p>;
  }

  const zonesForWorld = form.worldId ? meta.zones.filter((z) => z.worldId === form.worldId) : meta.zones;

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="panel grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wider text-arcane-400">Nom *</label>
          <input
            required
            value={form.name}
            onChange={(e) => {
              update("name", e.target.value);
              if (!slugTouched) update("slug", slugify(e.target.value));
            }}
            className="input-arcane"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wider text-arcane-400">Slug</label>
          <input
            value={form.slug}
            onChange={(e) => {
              setSlugTouched(true);
              update("slug", e.target.value);
            }}
            placeholder="genere automatiquement si vide"
            className="input-arcane"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wider text-arcane-400">Type d&apos;objet *</label>
          <select required value={form.itemTypeId} onChange={(e) => update("itemTypeId", e.target.value)} className="input-arcane">
            <option value="">—</option>
            {meta.itemTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wider text-arcane-400">Niveau requis</label>
          <input
            type="number"
            min={1}
            value={form.levelRequired}
            onChange={(e) => update("levelRequired", e.target.value)}
            className="input-arcane"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wider text-arcane-400">Rarete</label>
          <select value={form.rarityId} onChange={(e) => update("rarityId", e.target.value)} className="input-arcane">
            <option value="">—</option>
            {meta.rarities.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wider text-arcane-400">Set</label>
          <select value={form.setId} onChange={(e) => update("setId", e.target.value)} className="input-arcane">
            <option value="">—</option>
            {meta.sets.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wider text-arcane-400">Image (URL)</label>
          <input value={form.imageUrl} onChange={(e) => update("imageUrl", e.target.value)} className="input-arcane" />
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wider text-arcane-400">Popularite</label>
          <input
            type="number"
            value={form.popularity}
            onChange={(e) => update("popularity", e.target.value)}
            className="input-arcane"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs uppercase tracking-wider text-arcane-400">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            className="input-arcane min-h-[80px]"
          />
        </div>
      </div>

      <div className="panel grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
        <h2 className="font-display text-lg font-semibold text-arcane-100 sm:col-span-2">
          Source d&apos;obtention
        </h2>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wider text-arcane-400">Monde</label>
          <select
            value={form.worldId}
            onChange={(e) => {
              update("worldId", e.target.value);
              update("zoneId", "");
            }}
            className="input-arcane"
          >
            <option value="">—</option>
            {meta.worlds.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wider text-arcane-400">Zone</label>
          <select value={form.zoneId} onChange={(e) => update("zoneId", e.target.value)} className="input-arcane">
            <option value="">—</option>
            {zonesForWorld.map((z) => (
              <option key={z.id} value={z.id}>
                {z.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wider text-arcane-400">Boss / PNJ</label>
          <select value={form.bossId} onChange={(e) => update("bossId", e.target.value)} className="input-arcane">
            <option value="">—</option>
            {meta.bosses.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wider text-arcane-400">
            Source (texte libre)
          </label>
          <input value={form.sourceText} onChange={(e) => update("sourceText", e.target.value)} className="input-arcane" />
        </div>
      </div>

      <div className="panel space-y-3 p-4">
        <h2 className="font-display text-lg font-semibold text-arcane-100">Ecoles concernees</h2>
        <div className="flex flex-wrap gap-1.5">
          {meta.schools.map((s) => (
            <button
              type="button"
              key={s.id}
              onClick={() => toggleMulti("schoolIds", s.id)}
              className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                form.schoolIds.includes(s.id)
                  ? "border-arcane-gold bg-arcane-gold/15 text-arcane-gold"
                  : "border-arcane-700 text-arcane-300 hover:border-arcane-500"
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>

      <div className="panel space-y-3 p-4">
        <h2 className="font-display text-lg font-semibold text-arcane-100">Talents</h2>
        <div className="flex flex-wrap gap-1.5">
          {meta.talents.map((t) => (
            <button
              type="button"
              key={t.id}
              onClick={() => toggleMulti("talentIds", t.id)}
              className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                form.talentIds.includes(t.id)
                  ? "border-arcane-gold bg-arcane-gold/15 text-arcane-gold"
                  : "border-arcane-700 text-arcane-300 hover:border-arcane-500"
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>

      <div className="panel space-y-3 p-4">
        <h2 className="font-display text-lg font-semibold text-arcane-100">Statistiques</h2>
        <div className="space-y-2">
          {form.stats.map((row, i) => (
            <div key={i} className="flex items-center gap-2">
              <select
                value={row.statDefinitionId}
                onChange={(e) => {
                  const next = [...form.stats];
                  next[i] = { ...row, statDefinitionId: e.target.value };
                  update("stats", next);
                }}
                className="input-arcane text-sm"
              >
                <option value="">Choisir une statistique...</option>
                {meta.statDefinitions.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.key})
                  </option>
                ))}
              </select>
              <input
                type="number"
                step="any"
                value={row.value}
                onChange={(e) => {
                  const next = [...form.stats];
                  next[i] = { ...row, value: e.target.value };
                  update("stats", next);
                }}
                placeholder="Valeur"
                className="input-arcane w-32 text-sm"
              />
              <button
                type="button"
                onClick={() => update("stats", form.stats.filter((_, j) => j !== i))}
                className="rounded-md border border-arcane-700 px-2 py-2 text-xs text-arcane-400 hover:border-rose-500 hover:text-rose-400"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => update("stats", [...form.stats, { statDefinitionId: "", value: "" }])}
            className="text-xs font-medium text-arcane-gold hover:underline"
          >
            + Ajouter une statistique
          </button>
        </div>
      </div>

      {error ? <p className="text-sm text-rose-400">{error}</p> : null}

      <div className="flex gap-3">
        <button type="submit" disabled={saving} className="btn-primary">
          {itemId ? "Enregistrer les modifications" : "Creer l'item"}
        </button>
        <button type="button" onClick={() => router.push("/admin/items")} className="btn-secondary">
          Annuler
        </button>
      </div>
    </form>
  );
}
