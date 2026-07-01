import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { LayoutDashboard, Package, Wallet, AlertTriangle, TrendingUp, Receipt, History } from 'lucide-react';
import { getDashboardSummary } from '../api/dashboard.api';
import { formatCurrency } from '../utils/currency';
import PageHeader from '../components/common/PageHeader';
import Spinner from '../components/common/Spinner';
import EmptyState from '../components/common/EmptyState';

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 shadow-sm">
      <div className="flex items-center gap-2 text-zinc-500">
        <Icon size={14} />
        <p className="text-sm">{label}</p>
      </div>
      <p className="mt-1 text-2xl font-semibold text-zinc-100">{value}</p>
    </div>
  );
}

const tooltipStyle = {
  contentStyle: { backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: 8, color: '#f4f4f5' },
  labelStyle: { color: '#f4f4f5' },
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getDashboardSummary()
      .then(setData)
      .catch(() => setError('Failed to load dashboard data'));
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader icon={LayoutDashboard} title="Dashboard" subtitle="Overview of stock and sales" />

      {error && <p className="text-red-400">{error}</p>}
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
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 shadow-sm">
              <h2 className="mb-1 text-sm font-semibold text-zinc-200">Stock Value by Brand</h2>
              <p className="mb-3 text-xs text-zinc-500">Cost-basis value of inventory currently on hand</p>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data.stockByBrand}>
                  <XAxis dataKey="brandName" fontSize={12} stroke="#71717a" />
                  <YAxis fontSize={12} stroke="#71717a" />
                  <Tooltip formatter={(value) => formatCurrency(value)} {...tooltipStyle} />
                  <Bar dataKey="totalValue" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 shadow-sm">
              <h2 className="mb-1 text-sm font-semibold text-zinc-200">Sales Revenue by Brand</h2>
              <p className="mb-3 text-xs text-zinc-500">Money earned from stock-outs (invoiced sales)</p>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data.salesByBrand}>
                  <XAxis dataKey="brandName" fontSize={12} stroke="#71717a" />
                  <YAxis fontSize={12} stroke="#71717a" />
                  <Tooltip formatter={(value) => formatCurrency(value)} {...tooltipStyle} />
                  <Bar dataKey="totalRevenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-lg border border-zinc-800 bg-zinc-900 shadow-sm">
            <h2 className="flex items-center gap-2 border-b border-zinc-800 px-4 py-3 text-sm font-semibold text-zinc-200">
              <History size={14} className="text-zinc-500" />
              Recent Movements
            </h2>
            <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-left text-zinc-500">
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
                  <tr key={m.id} className="border-b border-zinc-800/60 last:border-0 hover:bg-zinc-800/40">
                    <td className="px-4 py-2 text-zinc-500">{new Date(m.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-2 text-zinc-200">{m.product.name}</td>
                    <td className="px-4 py-2 text-zinc-300">{m.product.brand.name}</td>
                    <td className="px-4 py-2">
                      <span className={m.type === 'IN' ? 'text-emerald-400' : 'text-red-400'}>{m.type}</span>
                    </td>
                    <td className="px-4 py-2 text-zinc-300">{m.quantity}</td>
                    <td className="px-4 py-2 text-zinc-500">{m.user.fullName}</td>
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
