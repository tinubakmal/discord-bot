"use client";

import { useRef, useState } from "react";

export function ImageUploadField({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setUploading(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
    const data = await res.json();
    setUploading(false);
    if (!res.ok) {
      setError(data.error ?? "Envoi impossible");
      return;
    }
    onChange(data.url);
  }

  return (
    <div className="flex items-start gap-3">
      <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-arcane-700 bg-arcane-900/60">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="Apercu" className="h-full w-full object-contain" />
        ) : (
          <span className="text-2xl text-arcane-600">🖼️</span>
        )}
      </div>
      <div className="flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="btn-secondary py-1.5 text-xs disabled:opacity-50"
          >
            {uploading ? "Envoi..." : value ? "Changer la photo" : "Choisir une photo"}
          </button>
          {value ? (
            <button
              type="button"
              onClick={() => onChange("")}
              className="text-xs text-arcane-500 hover:text-rose-400"
            >
              Retirer
            </button>
          ) : null}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = "";
          }}
        />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="ou coller une URL d'image..."
          className="input-arcane py-1.5 text-xs"
        />
        {error ? <p className="text-xs text-rose-400">{error}</p> : null}
        <p className="text-[11px] text-arcane-500">
          PNG, JPEG, WebP ou GIF, 8 Mo max. Une capture d&apos;ecran du jeu fonctionne tres bien.
        </p>
      </div>
    </div>
  );
}
