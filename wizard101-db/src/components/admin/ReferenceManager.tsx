"use client";

import { useEffect, useMemo, useState } from "react";
import { REFERENCE_CONFIGS, type ReferenceModelKey } from "@/lib/adminReference";

type Row = Record<string, unknown> & { id: string };

export function ReferenceManager({ modelKey }: { modelKey: ReferenceModelKey }) {
  const config = REFERENCE_CONFIGS[modelKey];
  const [rows, setRows] = useState<Row[] | null>(null);
  const [refOptions, setRefOptions] = useState<Record<string, Row[]>>({});
  const [editing, setEditing] = useState<Row | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const refModels = useMemo(
    () => Array.from(new Set(config.fields.filter((f) => f.refModel).map((f) => f.refModel!))),
    [config]
  );

  function load() {
    fetch(`/api/admin/reference/${modelKey}`)
      .then((res) => res.json())
      .then(setRows);
  }

  useEffect(() => {
    load();
    setEditing(null);
    setForm({});
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelKey]);

  useEffect(() => {
    for (const ref of refModels) {
      fetch(`/api/admin/reference/${ref}`)
        .then((res) => res.json())
        .then((data: Row[]) => setRefOptions((prev) => ({ ...prev, [ref]: data })));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refModels]);

  function startCreate() {
    setEditing(null);
    setForm({});
    setError(null);
  }

  function startEdit(row: Row) {
    setEditing(row);
    const next: Record<string, string> = {};
    for (const field of config.fields) {
      const v = row[field.key];
      next[field.key] = v === null || v === undefined ? "" : String(v);
    }
    setForm(next);
    setError(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const url = editing
      ? `/api/admin/reference/${modelKey}/${editing.id}`
      : `/api/admin/reference/${modelKey}`;
    const res = await fetch(url, {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "Erreur inconnue");
      return;
    }
    startCreate();
    load();
  }

  async function onDelete(row: Row) {
    if (!confirm(`Supprimer ${config.singular} "${row.name}" ?`)) return;
    const res = await fetch(`/api/admin/reference/${modelKey}/${row.id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error ?? "Suppression impossible");
      return;
    }
    if (editing?.id === row.id) startCreate();
    load();
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_1fr]">
      <form onSubmit={onSubmit} className="panel space-y-3 p-4">
        <h2 className="font-display text-lg font-semibold text-arcane-100">
          {editing ? `Modifier ${config.singular}` : `Nouveau : ${config.singular}`}
        </h2>
        {config.fields.map((field) => (
          <div key={field.key}>
            <label className="mb-1 block text-xs uppercase tracking-wider text-arcane-400">
              {field.label}
              {field.required ? " *" : ""}
            </label>
            {field.type === "textarea" ? (
              <textarea
                value={form[field.key] ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
                placeholder={field.placeholder}
                className="input-arcane min-h-[70px] text-sm"
              />
            ) : field.type === "select" ? (
              <select
                value={form[field.key] ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
                className="input-arcane text-sm"
              >
                {!field.refModel ? null : <option value="">—</option>}
                {(field.staticOptions ?? refOptions[field.refModel ?? ""]?.map((r) => ({
                  value: r.id,
                  label: String(r.name ?? r.id),
                })) ?? []
                ).map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : field.type === "color" ? (
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form[field.key] || "#5a4599"}
                  onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
                  className="h-9 w-12 rounded border border-arcane-600 bg-arcane-900"
                />
                <input
                  value={form[field.key] ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
                  placeholder="#hex (optionnel)"
                  className="input-arcane text-sm"
                />
              </div>
            ) : (
              <input
                type={field.type === "number" ? "number" : "text"}
                value={form[field.key] ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
                placeholder={field.placeholder}
                className="input-arcane text-sm"
              />
            )}
          </div>
        ))}
        {error ? <p className="text-sm text-rose-400">{error}</p> : null}
        <div className="flex gap-2 pt-1">
          <button type="submit" disabled={saving} className="btn-primary flex-1 text-sm">
            {editing ? "Enregistrer" : "Creer"}
          </button>
          {editing ? (
            <button type="button" onClick={startCreate} className="btn-secondary text-sm">
              Annuler
            </button>
          ) : null}
        </div>
      </form>

      <div className="panel overflow-x-auto p-4">
        <h2 className="mb-3 font-display text-lg font-semibold text-arcane-100">
          {config.label} {rows ? `(${rows.length})` : ""}
        </h2>
        {!rows ? (
          <p className="text-arcane-400">Chargement...</p>
        ) : rows.length === 0 ? (
          <p className="text-arcane-400">Aucune entree pour l&apos;instant.</p>
        ) : (
          <table className="w-full min-w-[420px] text-left text-sm">
            <thead className="border-b border-arcane-700/60 text-xs uppercase tracking-wider text-arcane-400">
              <tr>
                {config.fields.slice(0, 3).map((f) => (
                  <th key={f.key} className="px-3 py-2">
                    {f.label}
                  </th>
                ))}
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-arcane-800/40 last:border-0">
                  {config.fields.slice(0, 3).map((f) => (
                    <td key={f.key} className="px-3 py-2 text-arcane-200">
                      {String(row[f.key] ?? "—")}
                    </td>
                  ))}
                  <td className="px-3 py-2 text-right">
                    <button
                      onClick={() => startEdit(row)}
                      className="mr-3 text-arcane-gold hover:underline"
                    >
                      Modifier
                    </button>
                    <button onClick={() => onDelete(row)} className="text-rose-400 hover:underline">
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
