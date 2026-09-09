import { Suspense } from "react";
import { CompareView } from "@/components/CompareView";

export default function ComparePage() {
  return (
    <div>
      <h1 className="mb-2 font-display text-2xl font-bold text-arcane-100">
        Comparateur d&apos;items
      </h1>
      <p className="mb-6 text-arcane-400">
        Selectionnez plusieurs items pour comparer leurs statistiques cote a cote. Les
        differences sont calculees automatiquement.
      </p>
      <Suspense fallback={<p className="text-arcane-400">Chargement...</p>}>
        <CompareView />
      </Suspense>
    </div>
  );
}
