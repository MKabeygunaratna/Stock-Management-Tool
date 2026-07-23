import { formatCurrency } from '../../utils/currency';
import { OVERDUE_DAYS } from '../../utils/accounts';
import EmptyState from '../common/EmptyState';

export default function OutstandingTable({ icon: Icon, title, subtitle, rows, emptyMessage, onView }) {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm">
      <div className="border-b border-border px-4 py-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Icon size={14} className="text-amber-500" />
          {title}
        </h2>
        <p className="text-xs text-muted">{subtitle}</p>
      </div>
      <div className="max-h-80 overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-card">
            <tr className="border-b border-border text-left text-muted">
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Balance</th>
              <th className="px-4 py-2 font-medium">Age</th>
              <th className="px-4 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const overdue = r.daysOutstanding >= OVERDUE_DAYS;
              return (
                <tr key={r.id} className="border-b border-border/60 transition-colors last:border-0 hover:bg-surface-muted/40">
                  <td className="px-4 py-2 text-foreground">
                    {r.name}
                    {r.company && <div className="text-xs text-muted">{r.company}</div>}
                  </td>
                  <td className="px-4 py-2 font-medium text-foreground">{formatCurrency(r.balance)}</td>
                  <td className="px-4 py-2">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      overdue
                        ? 'border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400'
                        : 'text-muted'
                    }`}>
                      {r.daysOutstanding}d{overdue ? ' overdue' : ''}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button onClick={() => onView(r)} className="text-amber-500 hover:underline">View</button>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4}>
                  <EmptyState icon={Icon} message={emptyMessage} />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
