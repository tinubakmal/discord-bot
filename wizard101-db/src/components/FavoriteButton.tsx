"use client";

import { useEffect, useState } from "react";
import { getFavorites, toggleFavorite, type FavoriteEntry } from "@/lib/localStore";

export function FavoriteButton({
  item,
  size = "md",
}: {
  item: {
    id: string;
    slug: string;
    name: string;
    imageUrl: string | null;
    itemType: { name: string; icon: string | null };
  };
  size?: "sm" | "md";
}) {
  const [active, setActive] = useState(false);

  // Lu apres montage seulement (localStorage n'existe pas cote serveur).
  useEffect(() => {
    setActive(getFavorites().some((f) => f.id === item.id));
  }, [item.id]);

  function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const entry: Omit<FavoriteEntry, "addedAt"> = {
      id: item.id,
      slug: item.slug,
      name: item.name,
      imageUrl: item.imageUrl,
      itemTypeName: item.itemType.name,
      itemTypeIcon: item.itemType.icon,
    };
    const next = toggleFavorite(entry);
    setActive(next.some((f) => f.id === item.id));
  }

  const dims = size === "sm" ? "h-7 w-7 text-sm" : "h-9 w-9 text-lg";

  return (
    <button
      type="button"
      onClick={onClick}
      title={active ? "Retirer des favoris" : "Ajouter aux favoris"}
      aria-pressed={active}
      className={`flex ${dims} shrink-0 items-center justify-center rounded-full border transition ${
        active
          ? "border-arcane-gold bg-arcane-gold/15 text-arcane-gold"
          : "border-arcane-700 text-arcane-400 hover:border-arcane-gold hover:text-arcane-gold"
      }`}
    >
      {active ? "★" : "☆"}
    </button>
  );
}
