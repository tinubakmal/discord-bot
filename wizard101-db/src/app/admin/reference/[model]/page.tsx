import { notFound } from "next/navigation";
import Link from "next/link";
import { REFERENCE_CONFIGS, type ReferenceModelKey } from "@/lib/adminReference";
import { ReferenceManager } from "@/components/admin/ReferenceManager";

export default function AdminReferencePage({ params }: { params: { model: string } }) {
  const modelKey = params.model as ReferenceModelKey;
  if (!(modelKey in REFERENCE_CONFIGS)) notFound();

  return (
    <div>
      <Link href="/admin" className="mb-4 inline-block text-sm text-arcane-400 hover:text-arcane-gold">
        ← Retour au tableau de bord admin
      </Link>
      <h1 className="mb-6 font-display text-2xl font-bold text-arcane-100">
        {REFERENCE_CONFIGS[modelKey].label}
      </h1>
      <ReferenceManager modelKey={modelKey} />
    </div>
  );
}
