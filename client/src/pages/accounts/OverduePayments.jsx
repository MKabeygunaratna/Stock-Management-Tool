import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, ArrowDownCircle, ArrowUpCircle, ListChecks } from 'lucide-react';
import { getBalanceSheet } from '../../api/accounts.api';
import { formatCurrency } from '../../utils/currency';
import { OVERDUE_DAYS } from '../../utils/accounts';
import PageHeader from '../../components/common/PageHeader';
import Spinner from '../../components/common/Spinner';
import StatCard from '../../components/common/StatCard';
import EmptyState from '../../components/common/EmptyState';
import AccountLedgerModal from '../../components/accounts/AccountLedgerModal';

export default function OverduePayments() {
  const [balanceSheet, setBalanceSheet] = useState(null);
  const [error, setError] = useState('');
  const [target, setTarget] = useState(null);

  const load = useCallback(() => {
    getBalanceSheet().then(setBalanceSheet).catch(() => setError('Failed to load overdue payments'));
  }, []);

  useEffect(load, [load]);

  const combined = balanceSheet
    ? [
        ...balanceSheet.receivables
          .filter((r) => r.daysOutstanding >= OVERDUE_DAYS)
          .map((r) => ({ ...r, kind: 'receivable' })),
        ...balanceSheet.payables
          .filter((p) => p.daysOutstanding >= OVERDUE_DAYS)
          .map((p) => ({ ...p, kind: 'payable' })),
      ].sort((a, b) => b.daysOutstanding - a.daysOutstanding)
    : [];

  const totalOverdueReceivable = combined.filter((r) => r.kind === 'receivable').reduce((s, r) => s + r.balance, 0);
  const totalOverduePayable = combined.filter((r) => r.kind === 'payable').reduce((s, r) => s + r.balance, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        icon={AlertTriangle}
        title="Overdue Payments"
        subtitle={`Everything ${OVERDUE_DAYS}+ days overdue — to receive and to pay, in one place`}
      />

      {error && <p className="text-red-600 dark:text-red-400">{error}</p>}

      {!balanceSheet ? (
        <Spinner label="Loading overdue payments..." />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard icon={ArrowDownCircle} label="Overdue — To Receive" value={formatCurrency(totalOverdueReceivable)} tone="text-emerald-600 dark:text-emerald-400" />
            <StatCard icon={ArrowUpCircle} label="Overdue — To Pay" value={formatCurrency(totalOverduePayable)} tone="text-red-600 dark:text-red-400" />
            <StatCard icon={ListChecks} label="Overdue Balances" value={combined.length} tone={combined.length > 0 ? 'text-red-600 dark:text-red-400' : ''} />
          </div>

          <div className="rounded-lg border border-border bg-card shadow-sm">
            <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted">
                  <th className="px-4 py-2 font-medium">Type</th>
                  <th className="px-4 py-2 font-medium">Name</th>
                  <th className="px-4 py-2 font-medium">Balance</th>
                  <th className="px-4 py-2 font-medium">Days Overdue</th>
                  <th className="px-4 py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {combined.map((row) => (
                  <tr key={`${row.kind}-${row.id}`} className="border-b border-border/60 transition-colors last:border-0 hover:bg-surface-muted/40">
                    <td className="px-4 py-2">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                        row.kind === 'receivable'
                          ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400'
                      }`}>
                        {row.kind === 'receivable' ? <ArrowDownCircle size={12} /> : <ArrowUpCircle size={12} />}
                        {row.kind === 'receivable' ? 'To Receive' : 'To Pay'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-foreground">
                      {row.name}
                      {row.company && <div className="text-xs text-muted">{row.company}</div>}
                    </td>
                    <td className="px-4 py-2 font-medium text-foreground">{formatCurrency(row.balance)}</td>
                    <td className="px-4 py-2">
                      <span className="font-medium text-red-600 dark:text-red-400">{row.daysOutstanding}d overdue</span>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button
                        onClick={() => setTarget({ type: row.kind === 'receivable' ? 'customer' : 'supplier', id: row.id, name: row.name })}
                        className="text-amber-500 hover:underline"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
                {combined.length === 0 && (
                  <tr>
                    <td colSpan={5}>
                      <EmptyState icon={ListChecks} message={`Nothing ${OVERDUE_DAYS}+ days overdue — nice work!`} />
                    </td>
                  </tr>
                )}
              </tbody>
            </table></div>
          </div>
        </>
      )}

      <AccountLedgerModal target={target} onClose={() => setTarget(null)} onChanged={load} />
    </div>
  );
}
