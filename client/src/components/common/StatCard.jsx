import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function StatCard({ icon: Icon, label, value, tone, trend }) {
  return (
    <div className="group rounded-2xl border border-border bg-card p-4 shadow-sm shadow-black/5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 transition-transform duration-150 group-hover:scale-110">
          <Icon size={16} />
        </span>
        {trend && (
          <span
            className={`flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold ${
              trend.direction === 'down'
                ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {trend.direction === 'down' ? <ArrowDownRight size={12} /> : <ArrowUpRight size={12} />}
            {trend.value}
          </span>
        )}
      </div>
      <p className="mt-3 text-sm text-muted">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${tone || 'text-foreground'}`}>{value}</p>
    </div>
  );
}
