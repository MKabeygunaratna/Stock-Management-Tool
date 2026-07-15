import { useEffect, useState, useCallback } from 'react';
import { Wallet, TrendingUp, TrendingDown, Receipt } from 'lucide-react';
import { getAccountInvoices, getAccountSummary } from '../api/accounts.api';
import { formatCurrency } from '../utils/currency';
import PageHeader from '../components/common/PageHeader';
import Pagination from '../components/common/Pagination';
import EmptyState from '../components/common/EmptyState';

const inputClass = 'rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground placeholder-muted focus:border-amber-500 focus:outline-none';

function StatCard({ icon: Icon, label, value, tone }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2 text-muted">
        <Icon size={14} />
        <p className="text-sm">{label}</p>
      </div>
      <p className={`mt-1 text-2xl font-semibold ${tone || 'text-foreground'}`}>{value}</p>
    </div>
  );
}

export default function Accounts() {
  const [items, setItems] = useState([]);
  const [summaryData, setSummaryData] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(() => {
    const params = { from: from || undefined, to: to || undefined };
    getAccountInvoices({ ...params, page })
      .then((data) => {
        setItems(data.items);
        setTotalPages(data.totalPages);
      })
      .catch(() => setError('Failed to load accounts'));
    getAccountSummary(params)
      .then(setSummaryData)
      .catch(() => setError('Failed to load accounts'));
  }, [page, from, to]);

  useEffect(load, [load]);

  return (
    <div className="space-y-4">
      <PageHeader icon={Wallet} title="Accounts" subtitle="Profit and loss per stock-out invoice" />

      {summaryData && (
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

      <div className="flex flex-wrap gap-3">
        <input type="date" value={from} onChange={(e) => { setPage(1); setFrom(e.target.value); }} className={inputClass} />
        <input type="date" value={to} onChange={(e) => { setPage(1); setTo(e.target.value); }} className={inputClass} />
      </div>

      {error && <p className="text-red-600 dark:text-red-400">{error}</p>}

      <div className="rounded-lg border border-border bg-card shadow-sm">
        <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted">
              <th className="px-4 py-2 font-medium">Invoice #</th>
              <th className="px-4 py-2 font-medium">Date</th>
              <th className="px-4 py-2 font-medium">Buyer</th>
              <th className="px-4 py-2 font-medium">Items</th>
              <th className="px-4 py-2 font-medium">Revenue</th>
              <th className="px-4 py-2 font-medium">Cost</th>
              <th className="px-4 py-2 font-medium">Profit / Loss</th>
              <th className="px-4 py-2 font-medium">By</th>
            </tr>
          </thead>
          <tbody>
            {items.map((inv) => (
              <tr key={inv.id} className="border-b border-border/60 last:border-0 hover:bg-surface-muted/40">
                <td className="px-4 py-2 font-medium text-foreground">{inv.invoiceNumber}</td>
                <td className="px-4 py-2 text-muted">{new Date(inv.createdAt).toLocaleString()}</td>
                <td className="px-4 py-2 text-foreground">{inv.buyerName}</td>
                <td className="px-4 py-2 text-muted">{inv.itemCount}</td>
                <td className="px-4 py-2 text-muted">{formatCurrency(inv.totalRevenue)}</td>
                <td className="px-4 py-2 text-muted">{formatCurrency(inv.totalCost)}</td>
                <td className={`px-4 py-2 font-medium ${inv.totalProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                  {formatCurrency(inv.totalProfit)}
                </td>
                <td className="px-4 py-2 text-muted">{inv.user.fullName}</td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={8}>
                  <EmptyState icon={Wallet} message="No invoices found" />
                </td>
              </tr>
            )}
          </tbody>
        </table></div>
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </div>
    </div>
  );
}
