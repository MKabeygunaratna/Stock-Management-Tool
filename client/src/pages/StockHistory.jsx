import { useEffect, useState, useCallback } from 'react';
import { History } from 'lucide-react';
import { getStockHistory } from '../api/stock.api';
import { getBrands } from '../api/brands.api';
import Pagination from '../components/common/Pagination';
import PageHeader from '../components/common/PageHeader';
import EmptyState from '../components/common/EmptyState';

const selectClass = 'rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-amber-500 focus:outline-none';

export default function StockHistory() {
  const [items, setItems] = useState([]);
  const [brands, setBrands] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [brandId, setBrandId] = useState('');
  const [type, setType] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    getBrands().then(setBrands).catch(() => {});
  }, []);

  const load = useCallback(() => {
    getStockHistory({
      page,
      brandId: brandId || undefined,
      type: type || undefined,
      from: from || undefined,
      to: to || undefined,
    })
      .then((data) => {
        setItems(data.items);
        setTotalPages(data.totalPages);
      })
      .catch(() => setError('Failed to load stock history'));
  }, [page, brandId, type, from, to]);

  useEffect(load, [load]);

  return (
    <div className="space-y-4">
      <PageHeader icon={History} title="Stock History" subtitle="Full audit trail of every stock movement" />

      <div className="flex flex-wrap gap-3">
        <select value={brandId} onChange={(e) => { setPage(1); setBrandId(e.target.value); }} className={selectClass}>
          <option value="">All Brands</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
        <select value={type} onChange={(e) => { setPage(1); setType(e.target.value); }} className={selectClass}>
          <option value="">All Types</option>
          <option value="IN">Stock In</option>
          <option value="OUT">Stock Out</option>
        </select>
        <input type="date" value={from} onChange={(e) => { setPage(1); setFrom(e.target.value); }} className={selectClass} />
        <input type="date" value={to} onChange={(e) => { setPage(1); setTo(e.target.value); }} className={selectClass} />
      </div>

      {error && <p className="text-red-400">{error}</p>}

      <div className="rounded-lg border border-zinc-800 bg-zinc-900 shadow-sm">
        <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-left text-zinc-500">
              <th className="px-4 py-2 font-medium">Date</th>
              <th className="px-4 py-2 font-medium">Part</th>
              <th className="px-4 py-2 font-medium">Brand</th>
              <th className="px-4 py-2 font-medium">Type</th>
              <th className="px-4 py-2 font-medium">Qty</th>
              <th className="px-4 py-2 font-medium">Stock After</th>
              <th className="px-4 py-2 font-medium">Reason</th>
              <th className="px-4 py-2 font-medium">By</th>
            </tr>
          </thead>
          <tbody>
            {items.map((m) => (
              <tr key={m.id} className="border-b border-zinc-800/60 last:border-0 hover:bg-zinc-800/40">
                <td className="px-4 py-2 text-zinc-500">{new Date(m.createdAt).toLocaleString()}</td>
                <td className="px-4 py-2 text-zinc-100">{m.product.name}</td>
                <td className="px-4 py-2 text-zinc-300">{m.product.brand.name}</td>
                <td className="px-4 py-2">
                  <span className={m.type === 'IN' ? 'text-emerald-400' : 'text-red-400'}>{m.type}</span>
                </td>
                <td className="px-4 py-2 text-zinc-300">{m.quantity}</td>
                <td className="px-4 py-2 text-zinc-300">{m.stockAfter}</td>
                <td className="px-4 py-2 text-zinc-500">{m.reason || '-'}</td>
                <td className="px-4 py-2 text-zinc-500">{m.user.fullName}</td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={8}>
                  <EmptyState icon={History} message="No movements found" />
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
