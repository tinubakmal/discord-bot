import Link from "next/link";

export default function NotFound() {
  return (
    <div className="panel mx-auto max-w-md p-10 text-center">
      <p className="text-4xl">🔮</p>
      <h1 className="mt-3 font-display text-xl font-semibold text-arcane-100">
        Introuvable dans les archives
      </h1>
      <p className="mt-2 text-arcane-400">
        Cette page ou cet item n&apos;existe pas (ou plus) dans la base.
      </p>
      <Link href="/items" className="btn-primary mt-6 inline-flex">
        Retour a la recherche
      </Link>
    </div>
  );
}
