"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMeta } from "@/lib/useMeta";
import { BUILD_SLOTS, formatStatValue, groupStatsByCategory, type StatValue } from "@/lib/stats";
import type { ItemSummary, ItemsListResponse } from "@/lib/types";

type SlotPickerProps = {
  slot: string;
  label: string;
  typeSlug: string | undefined;
  level: string;
  selectedId: string | null;
  onSelect: (itemId: string | null) => void;
};

function SlotPicker({ slot, label, typeSlug, level, selectedId, onSelect }: SlotPickerProps) {
  const [options, setOptions] = useState<ItemSummary[]>([]);
  const [selectedItem, setSelectedItem] = useState<ItemSummary | null>(null);

  useEffect(() => {
    if (!typeSlug) return;
    const params = new URLSearchParams({ type: typeSlug, pageSize: "100" });
    if (level) params.set("levelMax", level);
    fetch(`/api/items?${params.toString()}`)
      .then((res) => res.json())
      .then((data: ItemsListResponse) => setOptions(data.items));
  }, [typeSlug, level]);

  useEffect(() => {
    setSelectedItem(options.find((o) => o.id === selectedId) ?? null);
  }, [selectedId, options]);

  if (!typeSlug) return null;

  return (
    <div className="panel flex items-center gap-3 p-3">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-arcane-700 bg-arcane-800/80 text-xl">
        {selectedItem ? selectedItem.itemType.icon ?? "✨" : "➕"}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs uppercase tracking-wider text-arcane-500">{label}</p>
        <select
          value={selectedId ?? ""}
          onChange={(e) => onSelect(e.target.value || null)}
          className="input-arcane mt-0.5 py-1.5 text-sm"
        >
          <option value="">— Aucun —</option>
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name} (niv. {o.levelRequired})
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export function BuilderView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { meta } = useMeta();

  const [school, setSchool] = useState(searchParams.get("school") ?? "");
  const [level, setLevel] = useState(searchParams.get("level") ?? "170");
  const [slotSelection, setSlotSelection] = useState<Record<string, string | null>>(() => {
    const initial: Record<string, string | null> = {};
    for (const s of BUILD_SLOTS) initial[s.slot] = searchParams.get(s.slot);
    return initial;
  });

  const [totals, setTotals] = useState<StatValue[]>([]);
  const [appliedBonuses, setAppliedBonuses] = useState<
    { setName: string; piecesEquipped: number; piecesRequired: number; description: string | null }[]
  >([]);
  const [equippedItems, setEquippedItems] = useState<ItemSummary[]>([]);

  const itemIds = useMemo(
    () => Object.values(slotSelection).filter((v): v is string => Boolean(v)),
    [slotSelection]
  );

  // Synchronise l'URL pour permettre de partager / comparer des builds.
  useEffect(() => {
    const params = new URLSearchParams();
    if (school) params.set("school", school);
    if (level) params.set("level", level);
    for (const [slot, id] of Object.entries(slotSelection)) {
      if (id) params.set(slot, id);
    }
    router.replace(`/builder?${params.toString()}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [school, level, slotSelection]);

  useEffect(() => {
    if (itemIds.length === 0) {
      setTotals([]);
      setAppliedBonuses([]);
      setEquippedItems([]);
      return;
    }
    fetch("/api/builder/compute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemIds }),
    })
      .then((res) => res.json())
      .then((data) => {
        setTotals(data.totals);
        setAppliedBonuses(data.appliedSetBonuses);
        setEquippedItems(data.items);
      });
  }, [itemIds]);

  const typeSlugBySlot = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of meta?.itemTypes ?? []) {
      if (t.slot) map.set(t.slot, t.slug);
    }
    return map;
  }, [meta]);

  const groups = groupStatsByCategory(totals);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">
      <div className="space-y-4">
        <div className="panel space-y-3 p-4">
          <div>
            <label className="mb-1 block text-xs uppercase tracking-wider text-arcane-400">
              Ecole
            </label>
            <select value={school} onChange={(e) => setSchool(e.target.value)} className="input-arcane">
              <option value="">— Choisir une ecole —</option>
              {meta?.schools.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs uppercase tracking-wider text-arcane-400">
              Niveau du personnage
            </label>
            <input
              type="number"
              min={1}
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="input-arcane"
            />
          </div>
        </div>

        <div className="space-y-2">
          {BUILD_SLOTS.map((s) => (
            <SlotPicker
              key={s.slot}
              slot={s.slot}
              label={s.label}
              typeSlug={typeSlugBySlot.get(s.slot)}
              level={level}
              selectedId={slotSelection[s.slot] ?? null}
              onSelect={(id) => setSlotSelection((prev) => ({ ...prev, [s.slot]: id }))}
            />
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <div className="panel-glow p-5">
          <h2 className="mb-4 font-display text-lg font-semibold text-arcane-100">
            Statistiques totales du build
          </h2>
          {totals.length === 0 ? (
            <p className="text-arcane-400">
              Selectionnez au moins un objet pour voir les statistiques calculees
              automatiquement.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {groups.map((group) => (
                <div key={group.category}>
                  <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-arcane-400">
                    {group.label}
                  </h3>
                  <ul className="space-y-1">
                    {group.stats.map((stat) => (
                      <li key={stat.key} className="flex items-center justify-between text-sm">
                        <span className="text-arcane-300">{stat.name}</span>
                        <span className="font-mono font-semibold text-arcane-gold">
                          {formatStatValue(stat.value, stat.unit)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>

        {appliedBonuses.length > 0 ? (
          <div className="panel p-5">
            <h2 className="mb-3 font-display text-lg font-semibold text-arcane-100">
              Bonus de set actifs
            </h2>
            <ul className="space-y-1.5 text-sm">
              {appliedBonuses.map((b, i) => (
                <li key={i} className="flex flex-wrap items-center gap-2">
                  <span className="badge border-arcane-gold/60 text-arcane-gold">
                    {b.setName} ({b.piecesEquipped}/{b.piecesRequired}+)
                  </span>
                  <span className="text-arcane-300">{b.description}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {equippedItems.length > 0 ? (
          <div>
            <h2 className="mb-3 font-display text-lg font-semibold text-arcane-100">
              Equipement selectionne
            </h2>
            <div className="flex flex-wrap gap-2">
              {equippedItems.map((item) => (
                <span key={item.id} className="badge">
                  {item.itemType.icon ?? "✨"} {item.name}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
