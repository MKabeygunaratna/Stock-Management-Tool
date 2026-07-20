import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import {
  Wallet, TrendingUp, TrendingDown, Receipt, Boxes, ArrowDownCircle, ArrowUpCircle, Scale, AlertTriangle,
} from 'lucide-react';
import { getAccountSummary, getMonthlyAccounts, getBalanceSheet } from '../../api/accounts.api';
import { formatCurrency } from '../../utils/currency';
import { OVERDUE_DAYS } from '../../utils/accounts';
import { useTheme } from '../../hooks/useTheme';
import PageHeader from '../../components/common/PageHeader';
import Spinner from '../../components/common/Spinner';
import StatCard from '../../components/common/StatCard';

const inputClass = 'rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground placeholder-muted focus:border-amber-500 focus:outline-none';

const getTooltipStyle = (theme) => ({
  contentStyle: theme === 'dark'
    ? { backgroundColor: '#111827', border: '1px solid #3f3f46', borderRadius: 8, color: '#f4f4f5' }
    : { backgroundColor: '#ffffff', border: '1px solid #e4e4e7', borderRadius: 8, color: '#18181b' },
  labelStyle: { color: theme === 'dark' ? '#f4f4f5' : '#18181b' },
});

const toDateInput = (iso) => new Date(iso).toISOString().slice(0, 10);

export default function AccountsOverview() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const tooltipStyle = getTooltipStyle(theme);
  const axisStroke = theme === 'dark' ? '#a1a1aa' : '#52525b';

  const [error, setError] = useState('');
  const [balanceSheet, setBalanceSheet] = useState(null);
  const [summaryData, setSummaryData] = useState(null);
  const [monthlyData, setMonthlyData] = useState(null);
  const [monthsRange, setMonthsRange] = useState(12);

  useEffect(() => {
    getBalanceSheet().then(setBalanceSheet).catch(() => setError('Failed to load balance sheet'));
    getAccountSummary({}).then(setSummaryData).catch(() => setError('Failed to load profit & loss summary'));
  }, []);

  useEffect(() => {
    getMonthlyAccounts({ months: monthsRange })
      .then((data) => setMonthlyData(data.items))
      .catch(() => setError('Failed to load monthly summary'));
  }, [monthsRange]);

  const handleMonthClick = (_, index) => {
    const bucket = monthlyData?.[index];
    if (!bucket) return;
    navigate(`/accounts/invoices?from=${toDateInput(bucket.rangeStart)}&to=${toDateInput(bucket.rangeEnd)}`);
  };

  const overdueCount = balanceSheet
    ? balanceSheet.receivables.filter((r) => r.daysOutstanding >= OVERDUE_DAYS).length
      + balanceSheet.payables.filter((p) => p.daysOutstanding >= OVERDUE_DAYS).length
    : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader icon={Wallet} title="Accounts Overview" subtitle="Company profit, assets, and liabilities at a glance" />

      {error && <p className="text-red-600 dark:text-red-400">{error}</p>}

      {overdueCount > 0 && (
        <div className="flex animate-slide-down flex-wrap items-center justify-between gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="shrink-0" />
            <span>
              <strong className="font-semibold">{overdueCount}</strong> balance{overdueCount === 1 ? ' is' : 's are'} {OVERDUE_DAYS}+ days overdue.
            </span>
          </div>
          <button
            onClick={() => navigate('/accounts/overdue')}
            className="font-medium underline decoration-red-400/50 underline-offset-2 hover:decoration-red-400"
          >
            View overdue payments
          </button>
        </div>
      )}

      <div>
        <h2 className="mb-2 text-sm font-semibold text-foreground">Assets &amp; Liabilities <span className="font-normal text-muted">(as of now)</span></h2>
        {!balanceSheet ? (
          <Spinner label="Loading balance sheet..." />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <StatCard icon={Boxes} label="Stock on Hand (Asset)" value={formatCurrency(balanceSheet.stockValue)} />
            <StatCard icon={ArrowDownCircle} label="Receivable (Asset)" value={formatCurrency(balanceSheet.totalReceivable)} tone="text-emerald-600 dark:text-emerald-400" />
            <StatCard icon={ArrowUpCircle} label="Payable (Liability)" value={formatCurrency(balanceSheet.totalPayable)} tone="text-red-600 dark:text-red-400" />
            <StatCard
              icon={Scale}
              label="Net Position"
              value={formatCurrency(balanceSheet.netPosition)}
              tone={balanceSheet.netPosition >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}
            />
          </div>
        )}
        <p className="mt-2 text-xs text-muted">
          Assets = stock value + money owed to you. Liabilities = money you owe suppliers. Cash/bank balances aren't tracked in this system.
        </p>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-foreground">All-Time Profit &amp; Loss</h2>
        {!summaryData ? (
          <Spinner label="Loading profit & loss..." />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <StatCard icon={Receipt} label="Invoices" value={summaryData.invoiceCount} />
            <StatCard icon={TrendingUp} label="Total Revenue" value={formatCurrency(summaryData.totalRevenue)} />
            <StatCard icon={TrendingDown} label="Total Cost" value={formatCurrency(summaryData.totalCost)} />
            <StatCard
              icon={Wallet}
              label="Total Profit"
              value={formatCurrency(summaryData.totalProfit)}
              tone={summaryData.totalProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}
            />
          </div>
        )}
      </div>

      <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Monthly Profit &amp; Loss</h2>
            <p className="text-xs text-muted">Click a month to see its invoices in detail</p>
          </div>
          <select
            value={monthsRange}
            onChange={(e) => setMonthsRange(Number(e.target.value))}
            className={inputClass}
          >
            <option value={6}>Last 6 months</option>
            <option value={12}>Last 12 months</option>
            <option value={24}>Last 24 months</option>
          </select>
        </div>
        {!monthlyData ? (
          <Spinner label="Loading monthly summary..." />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#27272a' : '#e4e4e7'} />
              <XAxis dataKey="label" fontSize={12} stroke={axisStroke} />
              <YAxis fontSize={12} stroke={axisStroke} />
              <Tooltip formatter={(value) => formatCurrency(value)} {...tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="revenue" name="Revenue" fill="#f59e0b" radius={[4, 4, 0, 0]} isAnimationActive={false} cursor="pointer" onClick={handleMonthClick} />
              <Bar dataKey="cost" name="Cost" fill="#71717a" radius={[4, 4, 0, 0]} isAnimationActive={false} cursor="pointer" onClick={handleMonthClick} />
              <Line type="monotone" dataKey="profit" name="Profit" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} isAnimationActive={false} />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
