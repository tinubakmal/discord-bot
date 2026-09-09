"use client";

// Persistance cote navigateur (favoris, builds sauvegardes) : aucun compte
// utilisateur requis pour l'instant, conformement au prototype. Les donnees
// restent locales a ce navigateur (pas de synchronisation entre appareils) ;
// c'est le point d'extension naturel vers un vrai compte utilisateur plus
// tard (meme forme de donnees, stockees cote serveur a la place).

const FAVORITES_KEY = "wizard101-codex:favorites";
const BUILDS_KEY = "wizard101-codex:builds";

export type FavoriteEntry = {
  id: string;
  slug: string;
  name: string;
  imageUrl: string | null;
  itemTypeName: string;
  itemTypeIcon: string | null;
  addedAt: string;
};

export type SavedBuild = {
  id: string;
  name: string;
  school: string;
  level: string;
  slots: Record<string, string | null>;
  savedAt: string;
};

function safeRead<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    // localStorage indisponible (navigation privee, contexte sandboxe...) :
    // on degrade silencieusement plutot que de casser la page.
    return fallback;
  }
}

function safeWrite<T>(key: string, value: T) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // idem : echec silencieux, la page reste fonctionnelle pour la session.
  }
}

export function getFavorites(): FavoriteEntry[] {
  return safeRead<FavoriteEntry[]>(FAVORITES_KEY, []);
}

export function isFavorite(itemId: string): boolean {
  return getFavorites().some((f) => f.id === itemId);
}

export function toggleFavorite(entry: Omit<FavoriteEntry, "addedAt">): FavoriteEntry[] {
  const current = getFavorites();
  const exists = current.some((f) => f.id === entry.id);
  const next = exists
    ? current.filter((f) => f.id !== entry.id)
    : [...current, { ...entry, addedAt: new Date().toISOString() }];
  safeWrite(FAVORITES_KEY, next);
  return next;
}

export function getSavedBuilds(): SavedBuild[] {
  return safeRead<SavedBuild[]>(BUILDS_KEY, []);
}

export function saveBuild(build: Omit<SavedBuild, "id" | "savedAt">): SavedBuild[] {
  const current = getSavedBuilds();
  const entry: SavedBuild = {
    ...build,
    id: `build_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    savedAt: new Date().toISOString(),
  };
  const next = [...current, entry];
  safeWrite(BUILDS_KEY, next);
  return next;
}

export function deleteSavedBuild(id: string): SavedBuild[] {
  const next = getSavedBuilds().filter((b) => b.id !== id);
  safeWrite(BUILDS_KEY, next);
  return next;
}
