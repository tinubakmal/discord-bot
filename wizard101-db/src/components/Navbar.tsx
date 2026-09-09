"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const NAV_LINKS = [
  { href: "/items", label: "Items" },
  { href: "/compare", label: "Comparateur" },
  { href: "/builder", label: "Createur de build" },
  { href: "/favorites", label: "★ Favoris" },
  { href: "/admin", label: "Admin" },
];

export function Navbar() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    router.push(`/items?${params.toString()}`);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-arcane-800/60 bg-arcane-950/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="text-2xl">🔮</span>
          <span className="font-display text-lg font-semibold tracking-wide text-arcane-gold">
            Spiral Codex
          </span>
        </Link>

        <form onSubmit={onSubmit} className="order-3 w-full sm:order-2 sm:max-w-md sm:flex-1">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            type="search"
            placeholder="Rechercher un item, un set, un talent..."
            className="input-arcane text-sm"
          />
        </form>

        <nav className="order-2 ml-auto flex items-center gap-1 sm:order-3">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-arcane-300 transition hover:bg-arcane-800/60 hover:text-arcane-gold"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
