import { useCallback, useEffect, useState } from 'react';
import { Scale, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { getBalanceSheet } from '../../api/accounts.api';
import { formatCurrency } from '../../utils/currency';
import { OVERDUE_DAYS } from '../../utils/accounts';
import PageHeader from '../../components/common/PageHeader';
import Spinner from '../../components/common/Spinner';
import StatCard from '../../components/common/StatCard';
import OutstandingTable from '../../components/accounts/OutstandingTable';
import AccountLedgerModal from '../../components/accounts/AccountLedgerModal';

export default function ReceivablesPayables() {
  const [balanceSheet, setBalanceSheet] = useState(null);
  const [error, setError] = useState('');
  const [target, setTarget] = useState(null);

  const load = useCallback(() => {
    getBalanceSheet().then(setBalanceSheet).catch(() => setError('Failed to load receivables & payables'));
  }, []);

  useEffect(load, [load]);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        icon={Scale}
        title="Receivables & Payables"
        subtitle="Every outstanding balance, not just what's overdue"
      />

      {error && <p className="text-red-600 dark:text-red-400">{error}</p>}

      {!balanceSheet ? (
        <Spinner label="Loading outstanding balances..." />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard icon={ArrowDownCircle} label="Total Receivable" value={formatCurrency(balanceSheet.totalReceivable)} tone="text-emerald-600 dark:text-emerald-400" />
            <StatCard icon={ArrowUpCircle} label="Total Payable" value={formatCurrency(balanceSheet.totalPayable)} tone="text-red-600 dark:text-red-400" />
            <StatCard icon={Scale} label="Net Position" value={formatCurrency(balanceSheet.totalReceivable - balanceSheet.totalPayable)} />
          </div>

          <p className="text-xs text-muted">{OVERDUE_DAYS}+ days outstanding is flagged overdue.</p>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <OutstandingTable
              icon={ArrowDownCircle}
              title="To Receive (Customers)"
              subtitle="Credit sales your customers still owe you"
              rows={balanceSheet.receivables}
              emptyMessage="No outstanding customer balances"
              onView={(r) => setTarget({ type: 'customer', id: r.id, name: r.name })}
            />
            <OutstandingTable
              icon={ArrowUpCircle}
              title="To Pay (Suppliers)"
              subtitle="Credit stock-ins you still owe suppliers for"
              rows={balanceSheet.payables}
              emptyMessage="No outstanding supplier balances"
              onView={(r) => setTarget({ type: 'supplier', id: r.id, name: r.name })}
            />
          </div>
        </>
      )}

      <AccountLedgerModal target={target} onClose={() => setTarget(null)} onChanged={load} />
    </div>
  );
}
