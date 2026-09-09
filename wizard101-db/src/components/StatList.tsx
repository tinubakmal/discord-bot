import { formatStatValue, groupStatsByCategory, type StatValue } from "@/lib/stats";

export function StatList({ stats }: { stats: StatValue[] }) {
  const groups = groupStatsByCategory(stats);

  if (groups.length === 0) {
    return <p className="text-sm text-arcane-400">Aucune statistique renseignee pour cet objet.</p>;
  }

  return (
    <div className="space-y-5">
      {groups.map((group) => (
        <div key={group.category}>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-arcane-400">
            {group.label}
          </h3>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2">
            {group.stats.map((stat) => (
              <div
                key={stat.key}
                className="flex items-center justify-between gap-3 rounded-lg border border-arcane-800/60 bg-arcane-900/40 px-3 py-1.5"
              >
                <dt className="flex items-center gap-1.5 text-sm text-arcane-300">
                  {stat.icon ? <span>{stat.icon}</span> : null}
                  {stat.name}
                </dt>
                <dd
                  className={`font-mono text-sm font-semibold ${
                    stat.value >= 0 ? "text-emerald-300" : "text-rose-300"
                  }`}
                >
                  {formatStatValue(stat.value, stat.unit)}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </div>
  );
}
