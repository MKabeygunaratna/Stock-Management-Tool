import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { LayoutDashboard, Package, Wallet, AlertTriangle, TrendingUp, Receipt, History } from 'lucide-react';
import { getDashboardSummary } from '../api/dashboard.api';
import { formatCurrency } from '../utils/currency';
import { useTheme } from '../hooks/useTheme';
import PageHeader from '../components/common/PageHeader';
import Spinner from '../components/common/Spinner';
import EmptyState from '../components/common/EmptyState';

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2 text-muted">
        <Icon size={14} />
        <p className="text-sm">{label}</p>
      </div>
      <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

const getTooltipStyle = (theme) => ({
  contentStyle: theme === 'dark'
    ? { backgroundColor: '#111827', border: '1px solid #3f3f46', borderRadius: 8, color: '#f4f4f5' }
    : { backgroundColor: '#ffffff', border: '1px solid #e4e4e7', borderRadius: 8, color: '#18181b' },
  labelStyle: { color: theme === 'dark' ? '#f4f4f5' : '#18181b' },
});

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const { theme } = useTheme();
  const tooltipStyle = getTooltipStyle(theme);
  const axisStroke = theme === 'dark' ? '#a1a1aa' : '#52525b';

  useEffect(() => {
    getDashboardSummary()
      .then(setData)
      .catch(() => setError('Failed to load dashboard data'));
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader icon={LayoutDashboard} title="Dashboard" subtitle="Overview of stock and sales" />

      {error && <p className="text-red-600 dark:text-red-400">{error}</p>}
      {!error && !data && <Spinner label="Loading dashboard..." />}

      {data && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-5">
            <StatCard icon={Package} label="Total Parts" value={data.totalParts} />
            <StatCard icon={Wallet} label="Total Stock Value" value={formatCurrency(data.totalStockValue)} />
            <StatCard icon={AlertTriangle} label="Low Stock Items" value={data.lowStockCount} />
            <StatCard icon={TrendingUp} label="Total Sales Revenue" value={formatCurrency(data.totalSalesRevenue)} />
            <StatCard icon={Receipt} label="Invoices Issued" value={data.totalInvoices} />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
              <h2 className="mb-1 text-sm font-semibold text-foreground">Stock Value by Brand</h2>
              <p className="mb-3 text-xs text-muted">Cost-basis value of inventory currently on hand</p>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data.stockByBrand}>
                  <XAxis dataKey="brandName" fontSize={12} stroke={axisStroke} />
                  <YAxis fontSize={12} stroke={axisStroke} />
                  <Tooltip formatter={(value) => formatCurrency(value)} {...tooltipStyle} />
                  <Bar dataKey="totalValue" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
              <h2 className="mb-1 text-sm font-semibold text-foreground">Sales Revenue by Brand</h2>
              <p className="mb-3 text-xs text-muted">Money earned from stock-outs (invoiced sales)</p>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data.salesByBrand}>
                  <XAxis dataKey="brandName" fontSize={12} stroke={axisStroke} />
                  <YAxis fontSize={12} stroke={axisStroke} />
                  <Tooltip formatter={(value) => formatCurrency(value)} {...tooltipStyle} />
                  <Bar dataKey="totalRevenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card shadow-sm">
            <h2 className="flex items-center gap-2 border-b border-border px-4 py-3 text-sm font-semibold text-foreground">
              <History size={14} className="text-muted" />
              Recent Movements
            </h2>
            <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted">
                  <th className="px-4 py-2 font-medium">Date</th>
                  <th className="px-4 py-2 font-medium">Part</th>
                  <th className="px-4 py-2 font-medium">Brand</th>
                  <th className="px-4 py-2 font-medium">Type</th>
                  <th className="px-4 py-2 font-medium">Qty</th>
                  <th className="px-4 py-2 font-medium">By</th>
                </tr>
              </thead>
              <tbody>
                {data.recentMovements.map((m) => (
                  <tr key={m.id} className="border-b border-border/60 last:border-0 hover:bg-surface-muted/40">
                    <td className="px-4 py-2 text-muted">{new Date(m.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-2 text-foreground">{m.product.name}</td>
                    <td className="px-4 py-2 text-muted">{m.product.brand.name}</td>
                    <td className="px-4 py-2">
                      <span className={m.type === 'IN' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>{m.type}</span>
                    </td>
                    <td className="px-4 py-2 text-muted">{m.quantity}</td>
                    <td className="px-4 py-2 text-muted">{m.user.fullName}</td>
                  </tr>
                ))}
                {data.recentMovements.length === 0 && (
                  <tr>
                    <td colSpan={6}>
                      <EmptyState icon={History} message="No stock movements yet" />
                    </td>
                  </tr>
                )}
              </tbody>
            </table></div>
          </div>
        </>
      )}
    </div>
  );
}
