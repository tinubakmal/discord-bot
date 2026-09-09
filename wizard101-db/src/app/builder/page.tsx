import { Suspense } from "react";
import { BuilderView } from "@/components/BuilderView";

export default function BuilderPage() {
  return (
    <div>
      <h1 className="mb-2 font-display text-2xl font-bold text-arcane-100">
        Createur de build
      </h1>
      <p className="mb-6 text-arcane-400">
        Choisissez votre ecole, votre niveau et votre equipement : les statistiques totales de
        votre personnage sont calculees automatiquement, bonus de set inclus. L&apos;URL de cette
        page memorise votre build pour pouvoir la partager ou la comparer.
      </p>
      <Suspense fallback={<p className="text-arcane-400">Chargement...</p>}>
        <BuilderView />
      </Suspense>
    </div>
  );
}
