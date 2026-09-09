import { FavoritesView } from "@/components/FavoritesView";

export default function FavoritesPage() {
  return (
    <div>
      <h1 className="mb-2 font-display text-2xl font-bold text-arcane-100">Mes favoris</h1>
      <p className="mb-6 text-arcane-400">
        Sauvegardes localement dans ce navigateur (pas de compte requis pour l&apos;instant).
      </p>
      <FavoritesView />
    </div>
  );
}
