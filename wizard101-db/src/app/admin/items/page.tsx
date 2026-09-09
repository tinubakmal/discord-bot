import Link from "next/link";
import { ItemsAdminList } from "@/components/admin/ItemsAdminList";

export default function AdminItemsPage() {
  return (
    <div>
      <Link href="/admin" className="mb-4 inline-block text-sm text-arcane-400 hover:text-arcane-gold">
        ← Retour au tableau de bord admin
      </Link>
      <h1 className="mb-6 font-display text-2xl font-bold text-arcane-100">Items</h1>
      <ItemsAdminList />
    </div>
  );
}
