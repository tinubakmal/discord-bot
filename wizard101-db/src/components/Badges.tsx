import { formatStatValue, type StatValue } from "@/lib/stats";

export function RarityBadge({
  rarity,
}: {
  rarity: { name: string; color: string | null } | null;
}) {
  if (!rarity) return null;
  return (
    <span
      className="badge"
      style={rarity.color ? { borderColor: rarity.color, color: rarity.color } : undefined}
    >
      {rarity.name}
    </span>
  );
}

export function SchoolBadge({
  school,
}: {
  school: { name: string; color: string | null; icon: string | null };
}) {
  return (
    <span
      className="badge"
      style={school.color ? { borderColor: school.color, color: school.color } : undefined}
      title={school.name}
    >
      {school.icon ? <span>{school.icon}</span> : null}
      {school.name}
    </span>
  );
}

export function StatChip({ stat }: { stat: StatValue }) {
  const positive = stat.value >= 0;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium ${
        positive
          ? "border-emerald-700/50 bg-emerald-950/40 text-emerald-300"
          : "border-rose-700/50 bg-rose-950/40 text-rose-300"
      }`}
    >
      {stat.icon ? <span>{stat.icon}</span> : null}
      <span className="text-arcane-300">{stat.shortName ?? stat.name}</span>
      <span>{formatStatValue(stat.value, stat.unit)}</span>
    </span>
  );
}
