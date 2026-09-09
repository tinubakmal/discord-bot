import Link from "next/link";
import { SetsAdminList } from "@/components/admin/SetsAdminList";

export default function AdminSetsPage() {
  return (
    <div>
      <Link href="/admin" className="mb-4 inline-block text-sm text-arcane-400 hover:text-arcane-gold">
        ← Retour au tableau de bord admin
      </Link>
      <h1 className="mb-6 font-display text-2xl font-bold text-arcane-100">Sets</h1>
      <SetsAdminList />
    </div>
  );
}
