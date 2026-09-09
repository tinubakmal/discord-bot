"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function HomeSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    router.push(`/items?${params.toString()}`);
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto mt-8 flex max-w-xl gap-2">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        type="search"
        placeholder="Ex: Robe de Tempete niveau 170..."
        className="input-arcane"
        autoFocus
      />
      <button type="submit" className="btn-primary shrink-0">
        Rechercher
      </button>
    </form>
  );
}
