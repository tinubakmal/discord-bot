import Link from "next/link";
import { SetEditor } from "@/components/admin/SetEditor";

export default function AdminSetPage({ params }: { params: { id: string } }) {
  return (
    <div>
      <Link href="/admin/sets" className="mb-4 inline-block text-sm text-arcane-400 hover:text-arcane-gold">
        ← Retour aux sets
      </Link>
      <h1 className="mb-6 font-display text-2xl font-bold text-arcane-100">Modifier le set</h1>
      <SetEditor setId={params.id} />
    </div>
  );
}
