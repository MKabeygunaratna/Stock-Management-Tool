import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { LayoutDashboard, Package, Wallet, AlertTriangle, TrendingUp, Receipt, History, X } from 'lucide-react';
import { getDashboardSummary } from '../api/dashboard.api';
import { formatCurrency } from '../utils/currency';
import { useTheme } from '../hooks/useTheme';
import { useToast } from '../context/ToastContext';
import PageHeader from '../components/common/PageHeader';
import Spinner from '../components/common/Spinner';
import EmptyState from '../components/common/EmptyState';
import StatCard from '../components/common/StatCard';

const LOW_STOCK_ALERT_KEY = 'lowStockAlertShown';

const getTooltipStyle = (theme) => ({
  contentStyle: theme === 'dark'
    ? { backgroundColor: '#111827', border: '1px solid #3f3f46', borderRadius: 8, color: '#f4f4f5' }
    : { backgroundColor: '#ffffff', border: '1px solid #e4e4e7', borderRadius: 8, color: '#18181b' },
  labelStyle: { color: theme === 'dark' ? '#f4f4f5' : '#18181b' },
});

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [showLowStockBanner, setShowLowStockBanner] = useState(true);
  const { theme } = useTheme();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const tooltipStyle = getTooltipStyle(theme);
  const axisStroke = theme === 'dark' ? '#a1a1aa' : '#52525b';

  useEffect(() => {
    getDashboardSummary()
      .then((summary) => {
        setData(summary);
        if (summary.lowStockCount > 0 && !sessionStorage.getItem(LOW_STOCK_ALERT_KEY)) {
          sessionStorage.setItem(LOW_STOCK_ALERT_KEY, '1');
          showToast(`${summary.lowStockCount} part${summary.lowStockCount === 1 ? '' : 's'} running low on stock`, 'error');
        }
      })
      .catch(() => setError('Failed to load dashboard data'));
  }, [showToast]);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader icon={LayoutDashboard} title="Dashboard" subtitle="Overview of stock and sales" />

      {error && <p className="text-red-600 dark:text-red-400">{error}</p>}
      {!error && !data && <Spinner label="Loading dashboard..." />}

      {data && (
        <>
          {data.lowStockCount > 0 && showLowStockBanner && (
            <div className="flex animate-slide-down flex-wrap items-center justify-between gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className="shrink-0" />
                <span>
                  <strong className="font-semibold">{data.lowStockCount}</strong> part{data.lowStockCount === 1 ? ' is' : 's are'} at or below reorder level.
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate('/products?lowStock=true')}
                  className="font-medium underline decoration-red-400/50 underline-offset-2 hover:decoration-red-400"
                >
                  View parts
                </button>
                <button onClick={() => setShowLowStockBanner(false)} aria-label="Dismiss" className="text-red-500 hover:text-red-700 dark:hover:text-red-200">
                  <X size={15} />
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-5">
            <StatCard icon={Package} label="Total Parts" value={data.totalParts} />
            <StatCard icon={Wallet} label="Total Stock Value" value={formatCurrency(data.totalStockValue)} />
            <StatCard icon={AlertTriangle} label="Low Stock Items" value={data.lowStockCount} tone={data.lowStockCount > 0 ? 'text-red-500' : ''} />
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
                  <Bar dataKey="totalValue" fill="#f59e0b" radius={[4, 4, 0, 0]} isAnimationActive={false} />
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
                  <Bar dataKey="totalRevenue" fill="#10b981" radius={[4, 4, 0, 0]} isAnimationActive={false} />
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
                  <tr key={m.id} className="border-b border-border/60 transition-colors last:border-0 hover:bg-surface-muted/40">
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
