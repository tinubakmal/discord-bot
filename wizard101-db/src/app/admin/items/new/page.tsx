import Link from "next/link";
import { ItemForm } from "@/components/admin/ItemForm";

export default function AdminNewItemPage() {
  return (
    <div>
      <Link href="/admin/items" className="mb-4 inline-block text-sm text-arcane-400 hover:text-arcane-gold">
        ← Retour aux items
      </Link>
      <h1 className="mb-6 font-display text-2xl font-bold text-arcane-100">Nouvel item</h1>
      <ItemForm />
    </div>
  );
}
