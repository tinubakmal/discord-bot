import { Suspense } from "react";
import { ItemsBrowser } from "@/components/ItemsBrowser";

export default function ItemsPage() {
  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold text-arcane-100">
        Rechercher un item
      </h1>
      <Suspense fallback={<p className="text-arcane-400">Chargement...</p>}>
        <ItemsBrowser />
      </Suspense>
    </div>
  );
}
